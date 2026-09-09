import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { hashPassword } from './security.mjs';

export const DEFAULT_SETTINGS = Object.freeze({
  theme: 'system', density: 'comfortable', contextPanelOpen: true,
  notifications: { inquiries: true, assignments: true, appointments: true, summary: false, email: false },
});
export function openDatabase(filename) {
  if (filename !== ':memory:') mkdirSync(dirname(filename), { recursive: true });
  const db = new DatabaseSync(filename, { timeout: 5000 });
  db.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');
  const version = db.prepare('PRAGMA user_version').get().user_version;
  if (version > 3) throw new Error('Database schema is newer than this server.');
  if (version === 0) db.exec(`
    BEGIN IMMEDIATE;
    CREATE TABLE tenants (id TEXT PRIMARY KEY, name TEXT NOT NULL, created_at INTEGER NOT NULL);
    CREATE TABLE users (
      id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL REFERENCES tenants(id), email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('admin','manager','employee')),
      password_hash TEXT NOT NULL, auth_version INTEGER NOT NULL DEFAULT 1,
      totp_secret TEXT, totp_pending TEXT, totp_pending_until INTEGER,
      totp_last_step INTEGER NOT NULL DEFAULT -1, created_at INTEGER NOT NULL
    );
    CREATE TABLE settings (user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, tenant_id TEXT NOT NULL REFERENCES tenants(id), value TEXT NOT NULL);
    CREATE TABLE sessions (
      id TEXT PRIMARY KEY, token_hash TEXT NOT NULL UNIQUE, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      tenant_id TEXT NOT NULL REFERENCES tenants(id), auth_version INTEGER NOT NULL,
      created_at INTEGER NOT NULL, last_seen_at INTEGER NOT NULL, expires_at INTEGER NOT NULL, user_agent TEXT NOT NULL
    );
    CREATE INDEX sessions_user ON sessions(user_id, tenant_id);
    CREATE TABLE challenges (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, auth_version INTEGER NOT NULL, remember INTEGER NOT NULL, expires_at INTEGER NOT NULL, attempts INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE recovery_codes (user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, code_hash TEXT NOT NULL, PRIMARY KEY(user_id,code_hash));
    CREATE TABLE password_resets (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, auth_version INTEGER NOT NULL, expires_at INTEGER NOT NULL);
    CREATE TABLE notifications (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, tenant_id TEXT NOT NULL REFERENCES tenants(id), category TEXT NOT NULL CHECK(category IN ('inquiries','assignments','appointments','summary')), title TEXT NOT NULL, body TEXT NOT NULL, created_at INTEGER NOT NULL, read_at INTEGER);
    CREATE INDEX notifications_user ON notifications(user_id,tenant_id,created_at);
    CREATE TABLE audit (id TEXT PRIMARY KEY, tenant_id TEXT, user_id TEXT, action TEXT NOT NULL, created_at INTEGER NOT NULL);
    PRAGMA user_version=1;
    COMMIT;
  `);
  if (db.prepare('PRAGMA user_version').get().user_version < 2) db.exec(`
    BEGIN IMMEDIATE;
    CREATE TABLE contacts (
      id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL REFERENCES tenants(id),
      first_name TEXT NOT NULL DEFAULT '', last_name TEXT NOT NULL,
      email TEXT NOT NULL DEFAULT '', phone TEXT NOT NULL DEFAULT '',
      whatsapp TEXT NOT NULL DEFAULT '', instagram TEXT NOT NULL DEFAULT '',
      city TEXT NOT NULL DEFAULT '',
      stage TEXT NOT NULL CHECK(stage IN ('neu','kontaktiert','beratung','angebot','abschluss','verloren')),
      branches TEXT NOT NULL DEFAULT '[]',
      source TEXT NOT NULL CHECK(source IN ('email','telefon','whatsapp','instagram','meta','tiktok')),
      notes TEXT NOT NULL DEFAULT '',
      assignee_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, last_contact_at INTEGER
    );
    CREATE INDEX contacts_tenant ON contacts(tenant_id, stage);
    CREATE INDEX contacts_assignee ON contacts(tenant_id, assignee_id);

    CREATE TABLE contact_activities (
      id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL REFERENCES tenants(id),
      contact_id TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
      user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      channel TEXT NOT NULL CHECK(channel IN ('email','telefon','whatsapp','instagram','meta','tiktok')),
      direction TEXT NOT NULL CHECK(direction IN ('eingehend','ausgehend')),
      description TEXT NOT NULL, created_at INTEGER NOT NULL
    );
    CREATE INDEX activities_contact ON contact_activities(tenant_id, contact_id, created_at);

    CREATE TABLE tasks (
      id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL REFERENCES tenants(id),
      title TEXT NOT NULL, notes TEXT NOT NULL DEFAULT '',
      due_date TEXT NOT NULL DEFAULT '', due_time TEXT NOT NULL DEFAULT '',
      priority TEXT NOT NULL CHECK(priority IN ('hoch','mittel','niedrig')),
      done INTEGER NOT NULL DEFAULT 0 CHECK(done IN (0,1)),
      contact_id TEXT REFERENCES contacts(id) ON DELETE SET NULL,
      assignee_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
    );
    CREATE INDEX tasks_tenant ON tasks(tenant_id, done, due_date);
    CREATE INDEX tasks_assignee ON tasks(tenant_id, assignee_id);
    PRAGMA user_version=2;
    COMMIT;
  `);
  if (db.prepare('PRAGMA user_version').get().user_version < 3) db.exec(`
    BEGIN IMMEDIATE;
    -- Gelöschtes bleibt kurz liegen, damit „Rückgängig" den Verlauf nicht
    -- mitreißt. Der Papierkorb wird nach 30 Tagen selbsttätig geleert.
    ALTER TABLE contacts ADD COLUMN deleted_at INTEGER;
    ALTER TABLE tasks ADD COLUMN deleted_at INTEGER;
    CREATE INDEX contacts_deleted ON contacts(deleted_at);
    CREATE INDEX tasks_deleted ON tasks(deleted_at);
    PRAGMA user_version=3;
    COMMIT;
  `);
  return db;
}
export async function createUser(db, { email, name, password, role = 'admin', tenantId, tenantName = 'Corva' }, now = Date.now()) {
  email = email?.trim().toLowerCase();
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Eine gültige E-Mail-Adresse ist erforderlich.');
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 120) throw new Error('Name: 1–120 Zeichen.');
  if (typeof password !== 'string' || password.length < 12 || password.length > 128) throw new Error('Passwort: 12–128 Zeichen.');
  if (!['admin','manager','employee'].includes(role)) throw new Error('Ungültige Rolle.');
  const passwordHash = await hashPassword(password);
  const userId = randomUUID();
  db.exec('BEGIN IMMEDIATE');
  try {
    if (tenantId) {
      if (!db.prepare('SELECT id FROM tenants WHERE id=?').get(tenantId)) throw new Error('Mandant nicht gefunden.');
    } else {
      tenantId = randomUUID();
      db.prepare('INSERT INTO tenants(id,name,created_at) VALUES(?,?,?)').run(tenantId, tenantName, now);
    }
    db.prepare('INSERT INTO users(id,tenant_id,email,name,role,password_hash,created_at) VALUES(?,?,?,?,?,?,?)').run(userId, tenantId, email, name.trim(), role, passwordHash, now);
    db.prepare('INSERT INTO settings(user_id,tenant_id,value) VALUES(?,?,?)').run(userId, tenantId, JSON.stringify(DEFAULT_SETTINGS));
    db.exec('COMMIT');
    return { id: userId, tenantId, email, name: name.trim(), role };
  } catch (error) { db.exec('ROLLBACK'); throw error; }
}
