import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { readFile, realpath, stat } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
import { openDatabase, DEFAULT_SETTINGS } from './database.mjs';
import { createCsrf, validCsrf, safeEqual, digest, randomToken, hashPassword, verifyPassword, encrypt, decrypt, newTotpSecret, matchTotp } from './security.mjs';

class HttpError extends Error { constructor(status, message) { super(message); this.status = status; } }
const fail = (status, message) => { throw new HttpError(status, message); };
const publicUser = (row) => ({ id: row.id, tenantId: row.tenant_id, name: row.name, email: row.email, role: row.role });
const iso = (value) => new Date(value).toISOString();
const CATEGORIES = ['inquiries', 'assignments', 'appointments', 'summary'];
const PASSWORD_ERROR = 'Das Passwort muss zwischen 12 und 128 Zeichen lang sein.';
function object(value, keys) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some((key) => !keys.includes(key))) fail(400, 'Ungültige Angaben.');
  return value;
}
function string(value, min = 1, max = 128) {
  if (typeof value !== 'string' || value.length < min || value.length > max) fail(400, 'Ungültige Eingabe.');
  return value;
}
function password(value) { if (typeof value !== 'string' || value.length < 12 || value.length > 128) fail(400, PASSWORD_ERROR); return value; }
function email(value) {
  const normalized = string(value, 3, 254).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) fail(400, 'Bitte eine gültige E-Mail-Adresse eingeben.');
  return normalized;
}
function cookies(req) {
  const result = {};
  for (const part of (req.headers.cookie || '').split(';')) {
    const index = part.indexOf('=');
    if (index > 0) { try { result[part.slice(0, index).trim()] = decodeURIComponent(part.slice(index + 1)); } catch {} }
  }
  return result;
}
async function body(req) {
  if (!(req.headers['content-type'] || '').toLowerCase().startsWith('application/json')) fail(415, 'JSON erforderlich.');
  if (Number(req.headers['content-length'] || 0) > 16384) fail(413, 'Anfrage zu groß.');
  const chunks = []; let length = 0;
  for await (const chunk of req) {
    length += chunk.length;
    if (length > 16384) fail(413, 'Anfrage zu groß.');
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); }
  catch { fail(400, 'Ungültiges JSON.'); }
}

/** Testable same-origin server. All transport/clock dependencies are injected here. */
export async function createCorvaServer(config, { db = openDatabase(config.databasePath), now = Date.now, mailer = null, logger = console } = {}) {
  const key = config.masterKey;
  if (!Buffer.isBuffer(key) || key.length !== 32) throw new Error('32-byte master key required.');
  const origin = new URL(config.publicUrl).origin;
  if (config.production && !origin.startsWith('https://')) throw new Error('Production requires HTTPS.');
  const basePath = config.basePath || new URL(config.publicUrl).pathname.replace(/\/?$/, '/');
  const cookieName = config.production ? '__Host-corva-session' : 'corva-session';
  const csrfName = config.production ? '__Host-corva-csrf' : 'corva-csrf';
  const mailAvailable = Boolean(mailer && config.mailFrom);
  const dummyHash = await hashPassword(randomToken());
  const rates = new Map();
  const activePasswords = { count: 0 };
  let lastCleanup = 0;
  function cleanup() {
    if (now() - lastCleanup < 60000) return;
    lastCleanup = now();
    db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(now());
    db.prepare('DELETE FROM challenges WHERE expires_at <= ?').run(now());
    db.prepare('DELETE FROM password_resets WHERE expires_at <= ?').run(now());
    for (const [rateKey, entry] of rates) if (entry.until <= now()) rates.delete(rateKey);
  }
  function rate(id, max, windowMs = 15 * 60000) {
    let entry = rates.get(id);
    if (!entry || entry.until <= now()) { entry = { count: 0, until: now() + windowMs }; rates.set(id, entry); }
    if (++entry.count > max) fail(429, 'Zu viele Versuche. Bitte später erneut versuchen.');
    if (rates.size > 20000) fail(503, 'Der Server ist ausgelastet. Bitte später erneut versuchen.');
  }
  async function checkPassword(value, encoded) {
    if (activePasswords.count >= 4) fail(503, 'Der Server ist ausgelastet. Bitte später erneut versuchen.');
    activePasswords.count++;
    try { return await verifyPassword(value, encoded); } finally { activePasswords.count--; }
  }
  function audit(user, action) { db.prepare('INSERT INTO audit(id,tenant_id,user_id,action,created_at) VALUES(?,?,?,?,?)').run(randomUUID(), user?.tenant_id || null, user?.id || null, action, now()); }
  function addCookie(res, name, value, maxAge) {
    const cookie = `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Strict${config.production ? '; Secure' : ''}${maxAge === undefined ? '' : `; Max-Age=${maxAge}`}`;
    res.setHeader('Set-Cookie', [...(res.getHeader('Set-Cookie') || []), cookie]);
  }
  function csrf(req, res) {
    let token = cookies(req)[csrfName];
    if (!validCsrf(token, key)) { token = createCsrf(key); addCookie(res, csrfName, token); }
    return token;
  }
  function requireCsrf(req) {
    if (req.headers.origin !== origin) fail(403, 'Diese Anfrage stammt nicht von Corva.');
    const token = cookies(req)[csrfName];
    if (!validCsrf(token, key) || !safeEqual(token, req.headers['x-csrf-token'])) fail(403, 'Sicherheitsprüfung fehlgeschlagen. Bitte die Seite neu laden.');
  }
  function session(req) {
    const token = cookies(req)[cookieName];
    if (!token || !/^[\w-]{43}$/.test(token)) return null;
    const row = db.prepare(`SELECT s.id AS session_id,s.expires_at AS session_expires,u.* FROM sessions s JOIN users u ON u.id=s.user_id AND u.tenant_id=s.tenant_id WHERE s.token_hash=? AND s.expires_at>? AND s.auth_version=u.auth_version`).get(digest(token), now());
    if (row) db.prepare('UPDATE sessions SET last_seen_at=? WHERE id=?').run(now(), row.session_id);
    return row || null;
  }
  function requireUser(req) { return session(req) || fail(401, 'Bitte erneut anmelden.'); }
  function createSession(res, user, req, remember = false, expiresAt) {
    const token = randomToken();
    const expiry = expiresAt || now() + (remember ? 30 * 86400000 : 12 * 3600000);
    db.prepare('INSERT INTO sessions(id,token_hash,user_id,tenant_id,auth_version,created_at,last_seen_at,expires_at,user_agent) VALUES(?,?,?,?,?,?,?,?,?)').run(randomUUID(), digest(token), user.id, user.tenant_id, user.auth_version, now(), now(), expiry, (req.headers['user-agent'] || 'Unbekanntes Gerät').slice(0, 300));
    addCookie(res, cookieName, token, remember ? Math.floor((expiry - now()) / 1000) : undefined);
    audit(user, 'session.created');
  }
  function settings(user) {
    const row = db.prepare('SELECT value FROM settings WHERE user_id=? AND tenant_id=?').get(user.id, user.tenant_id);
    return row ? JSON.parse(row.value) : structuredClone(DEFAULT_SETTINGS);
  }
  function consumeMfa(user, code, allowRecovery = true) {
    if (!user.totp_secret) return true;
    string(code, 6, 40);
    const step = matchTotp(decrypt(user.totp_secret, key), code, now(), user.totp_last_step);
    if (step !== null) {
      const result = db.prepare('UPDATE users SET totp_last_step=? WHERE id=? AND totp_last_step<?').run(step, user.id, step);
      if (result.changes) return true;
    }
    if (allowRecovery && /^[A-F\d]{8}-[A-F\d]{8}$/i.test(code)) {
      const result = db.prepare('DELETE FROM recovery_codes WHERE user_id=? AND code_hash=?').run(user.id, digest(code.toUpperCase()));
      if (result.changes) return true;
    }
    fail(401, 'Code ungültig oder bereits verwendet. Bitte einen neuen Code eingeben.');
  }
  async function requirePassword(user, value) {
    string(value, 1, 128);
    if (!await checkPassword(value, user.password_hash)) fail(401, 'Das aktuelle Passwort ist nicht korrekt.');
    const current = db.prepare('SELECT * FROM users WHERE id=? AND tenant_id=?').get(user.id, user.tenant_id);
    if (current?.password_hash !== user.password_hash || current.auth_version !== user.auth_version) fail(401, 'Das Konto wurde geändert. Bitte erneut anmelden.');
    return current;
  }
  function revoke(user, res, req, keepCurrent = true) {
    db.prepare('UPDATE users SET auth_version=auth_version+1 WHERE id=? AND tenant_id=?').run(user.id, user.tenant_id);
    db.prepare('DELETE FROM sessions WHERE user_id=? AND tenant_id=?').run(user.id, user.tenant_id);
    db.prepare('DELETE FROM challenges WHERE user_id=?').run(user.id);
    db.prepare('DELETE FROM password_resets WHERE user_id=?').run(user.id);
    if (keepCurrent) createSession(res, db.prepare('SELECT * FROM users WHERE id=?').get(user.id), req, true, user.session_expires);
    else addCookie(res, cookieName, '', 0);
  }
  async function sendMail(to, subject, text) {
    if (!mailAvailable) fail(503, 'E-Mail ist auf dem Server noch nicht eingerichtet.');
    try { await mailer.sendMail({ from: config.mailFrom, to, subject, text, disableFileAccess: true, disableUrlAccess: true }); }
    catch { fail(502, 'Die E-Mail konnte nicht versendet werden. Bitte die Server-Konfiguration prüfen lassen.'); }
  }
  const json = (res, value, status = 200) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(value)); };

  async function api(req, res, path) {
    cleanup();
    const mutation = !['GET', 'HEAD', 'OPTIONS'].includes(req.method);
    if (mutation) requireCsrf(req);
    const input = mutation ? await body(req) : null;
    const ip = req.socket.remoteAddress || 'unknown';
    if (req.method === 'GET' && path === '/api/auth/session') return json(res, { user: session(req) ? publicUser(session(req)) : null, csrfToken: csrf(req, res) });
    if (req.method === 'POST' && path === '/api/auth/login') {
      object(input, ['email', 'password', 'rememberMe']);
      const address = email(input.email); string(input.password, 1, 128);
      if (input.rememberMe !== undefined && typeof input.rememberMe !== 'boolean') fail(400, 'Ungültige Eingabe.');
      rate(`login-ip:${ip}`, 30); rate(`login-email:${digest(address)}`, 10);
      const user = db.prepare('SELECT * FROM users WHERE email=?').get(address);
      const valid = await checkPassword(input.password, user?.password_hash || dummyHash);
      if (!user || !valid) { audit(null, 'login.failed'); fail(401, 'E-Mail oder Passwort ist nicht korrekt.'); }
      const current = db.prepare('SELECT * FROM users WHERE id=?').get(user.id);
      if (current.auth_version !== user.auth_version || current.password_hash !== user.password_hash) fail(401, 'Bitte erneut anmelden.');
      if (user.totp_secret) {
        const challenge = randomToken();
        db.prepare('INSERT INTO challenges(token_hash,user_id,auth_version,remember,expires_at) VALUES(?,?,?,?,?)').run(digest(challenge), user.id, user.auth_version, input.rememberMe ? 1 : 0, now() + 5 * 60000);
        return json(res, { requiresTwoFactor: true, challengeId: challenge });
      }
      createSession(res, user, req, input.rememberMe); return json(res, { user: publicUser(user) });
    }
    if (req.method === 'POST' && path === '/api/auth/totp') {
      object(input, ['challengeId', 'code']); string(input.challengeId, 43, 43); string(input.code, 6, 40);
      rate(`totp-ip:${ip}`, 30);
      const challenge = db.prepare('SELECT * FROM challenges WHERE token_hash=? AND expires_at>? AND attempts<5').get(digest(input.challengeId), now());
      if (!challenge) fail(401, 'Die Anmeldung ist abgelaufen. Bitte erneut beginnen.');
      db.prepare('UPDATE challenges SET attempts=attempts+1 WHERE token_hash=?').run(digest(input.challengeId));
      const user = db.prepare('SELECT * FROM users WHERE id=? AND auth_version=?').get(challenge.user_id, challenge.auth_version);
      if (!user?.totp_secret) fail(401, 'Bitte erneut anmelden.');
      consumeMfa(user, input.code);
      db.prepare('DELETE FROM challenges WHERE token_hash=?').run(digest(input.challengeId));
      createSession(res, user, req, Boolean(challenge.remember)); return json(res, { user: publicUser(user) });
    }
    if (req.method === 'POST' && path === '/api/auth/logout') {
      object(input, []); const user = session(req);
      if (user) { db.prepare('DELETE FROM sessions WHERE id=? AND user_id=?').run(user.session_id, user.id); audit(user, 'session.logout'); }
      addCookie(res, cookieName, '', 0); return json(res, { ok: true });
    }
    if (req.method === 'POST' && path === '/api/auth/recovery') {
      object(input, ['email']); const address = email(input.email);
      rate(`recovery-ip:${ip}`, 10); rate(`recovery-email:${digest(address)}`, 3, 3600000);
      if (!mailAvailable) fail(503, 'Passwort-Wiederherstellung ist noch nicht eingerichtet. Bitte den Administrator kontaktieren.');
      const user = db.prepare('SELECT * FROM users WHERE email=?').get(address);
      if (user) {
        const token = randomToken();
        db.prepare('DELETE FROM password_resets WHERE user_id=?').run(user.id);
        db.prepare('INSERT INTO password_resets(token_hash,user_id,auth_version,expires_at) VALUES(?,?,?,?)').run(digest(token), user.id, user.auth_version, now() + 30 * 60000);
        const link = new URL(`${basePath}login`, origin); link.searchParams.set('reset', token);
        try { await sendMail(user.email, 'Corva – Passwort zurücksetzen', `Für Ihr Corva-Konto wurde eine Passwortänderung angefordert.\n\n${link.href}\n\nDer Link gilt 30 Minuten und einmalig. Wenn Sie dies nicht angefordert haben, ignorieren Sie diese Nachricht. Ein eingerichteter zweiter Faktor bleibt erforderlich.`); }
        catch { db.prepare('DELETE FROM password_resets WHERE token_hash=?').run(digest(token)); logger.warn('Password reset email delivery failed.'); }
        audit(user, 'password.recovery_requested');
      }
      return json(res, { ok: true });
    }
    if (req.method === 'POST' && path === '/api/auth/reset') {
      object(input, ['token', 'password', 'code']); string(input.token, 43, 43); password(input.password);
      rate(`reset-ip:${ip}`, 15); rate(`reset-token:${digest(input.token)}`, 5);
      const reset = db.prepare('SELECT * FROM password_resets WHERE token_hash=? AND expires_at>?').get(digest(input.token), now());
      const user = reset && db.prepare('SELECT * FROM users WHERE id=? AND auth_version=?').get(reset.user_id, reset.auth_version);
      if (!user) fail(400, 'Dieser Link ist ungültig oder abgelaufen.');
      const hashed = await hashPassword(input.password);
      if (!db.prepare('SELECT 1 FROM password_resets WHERE token_hash=? AND expires_at>?').get(digest(input.token), now())) fail(400, 'Dieser Link ist ungültig oder abgelaufen.');
      const current = db.prepare('SELECT * FROM users WHERE id=? AND auth_version=?').get(user.id, reset.auth_version);
      if (!current) fail(400, 'Dieser Link ist ungültig oder abgelaufen.');
      consumeMfa(current, input.code);
      db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(hashed, user.id);
      revoke(user, res, req, false); audit(user, 'password.reset'); return json(res, { ok: true });
    }

    const user = requireUser(req);
    if (mutation) rate(`mutations:${user.id}`, 180, 60000);
    if (req.method === 'GET' && path === '/api/settings') return json(res, settings(user));
    if (req.method === 'PATCH' && path === '/api/settings') {
      object(input, ['theme', 'density', 'contextPanelOpen', 'notifications']);
      const next = settings(user);
      if ('theme' in input) { if (!['system', 'light', 'dark'].includes(input.theme)) fail(400, 'Ungültiges Farbschema.'); next.theme = input.theme; }
      if ('density' in input) { if (!['comfortable', 'compact'].includes(input.density)) fail(400, 'Ungültige Darstellungsdichte.'); next.density = input.density; }
      if ('contextPanelOpen' in input) { if (typeof input.contextPanelOpen !== 'boolean') fail(400, 'Ungültiger Seitenbereich.'); next.contextPanelOpen = input.contextPanelOpen; }
      if ('notifications' in input) {
        object(input.notifications, [...CATEGORIES, 'email']);
        for (const [name, value] of Object.entries(input.notifications)) {
          if (typeof value !== 'boolean') fail(400, 'Ungültige Benachrichtigungseinstellung.');
          if (['email', 'summary'].includes(name) && value && !mailAvailable) fail(409, 'E-Mail ist auf dem Server noch nicht eingerichtet.');
          next.notifications[name] = value;
        }
      }
      db.prepare('INSERT INTO settings(user_id,tenant_id,value) VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET value=excluded.value WHERE settings.tenant_id=excluded.tenant_id').run(user.id, user.tenant_id, JSON.stringify(next));
      audit(user, 'settings.updated'); return json(res, next);
    }
    if (req.method === 'GET' && path === '/api/account') return json(res, { user: publicUser(user), twoFactorEnabled: Boolean(user.totp_secret) });
    if (req.method === 'PATCH' && path === '/api/account') {
      object(input, ['name']); const name = string(input.name, 1, 120).trim(); if (!name || /[\x00-\x1f\x7f]/.test(name)) fail(400, 'Bitte einen gültigen Namen eingeben.');
      db.prepare('UPDATE users SET name=? WHERE id=? AND tenant_id=?').run(name, user.id, user.tenant_id); audit(user, 'account.updated'); return json(res, { user: { ...publicUser(user), name } });
    }
    if (req.method === 'POST' && path === '/api/account/password') {
      object(input, ['currentPassword', 'newPassword', 'code']); password(input.newPassword); rate(`sensitive:${user.id}`, 10);
      let current = await requirePassword(user, input.currentPassword);
      if (safeEqual(input.currentPassword, input.newPassword)) fail(400, 'Bitte ein anderes neues Passwort wählen.');
      const hashed = await hashPassword(input.newPassword);
      current = db.prepare('SELECT * FROM users WHERE id=? AND auth_version=?').get(user.id, user.auth_version) || fail(401, 'Bitte erneut anmelden.');
      consumeMfa(current, input.code);
      db.prepare('UPDATE users SET password_hash=? WHERE id=? AND tenant_id=?').run(hashed, user.id, user.tenant_id);
      revoke(user, res, req); audit(user, 'password.changed'); return json(res, { ok: true });
    }
    if (req.method === 'POST' && path === '/api/account/totp/setup') {
      object(input, ['currentPassword']); rate(`sensitive:${user.id}`, 10);
      const current = await requirePassword(user, input.currentPassword);
      if (current.totp_secret) fail(409, 'Zwei-Faktor-Anmeldung ist bereits aktiv.');
      const secret = newTotpSecret();
      db.prepare('UPDATE users SET totp_pending=?,totp_pending_until=? WHERE id=? AND tenant_id=?').run(encrypt(secret, key), now() + 10 * 60000, user.id, user.tenant_id);
      const uri = `otpauth://totp/${encodeURIComponent(`Corva:${user.email}`)}?secret=${secret}&issuer=Corva&algorithm=SHA1&digits=6&period=30`;
      return json(res, { secret, uri });
    }
    if (req.method === 'POST' && path === '/api/account/totp/enable') {
      object(input, ['code']); string(input.code, 6, 6); rate(`sensitive:${user.id}`, 10);
      if (user.totp_secret || !user.totp_pending || user.totp_pending_until <= now()) fail(409, 'Einrichtung abgelaufen. Bitte erneut beginnen.');
      const step = matchTotp(decrypt(user.totp_pending, key), input.code, now());
      if (step === null) fail(401, 'Der Code ist nicht korrekt.');
      const recoveryCodes = Array.from({ length: 10 }, () => { const code = randomToken(16); const hex = digest(code).slice(0, 16).toUpperCase(); return `${hex.slice(0, 8)}-${hex.slice(8)}`; });
      db.exec('BEGIN IMMEDIATE');
      try {
        db.prepare('UPDATE users SET totp_secret=totp_pending,totp_pending=NULL,totp_pending_until=NULL,totp_last_step=? WHERE id=? AND tenant_id=?').run(step, user.id, user.tenant_id);
        db.prepare('DELETE FROM recovery_codes WHERE user_id=?').run(user.id);
        for (const code of recoveryCodes) db.prepare('INSERT INTO recovery_codes(user_id,code_hash) VALUES(?,?)').run(user.id, digest(code));
        revoke(user, res, req); audit(user, 'totp.enabled'); db.exec('COMMIT');
      } catch (error) { db.exec('ROLLBACK'); throw error; }
      return json(res, { recoveryCodes });
    }
    if (req.method === 'POST' && path === '/api/account/totp/disable') {
      object(input, ['currentPassword', 'code']); rate(`sensitive:${user.id}`, 10);
      const current = await requirePassword(user, input.currentPassword);
      if (!current.totp_secret) fail(409, 'Zwei-Faktor-Anmeldung ist nicht aktiv.');
      consumeMfa(current, input.code);
      db.prepare('UPDATE users SET totp_secret=NULL,totp_pending=NULL,totp_pending_until=NULL,totp_last_step=-1 WHERE id=? AND tenant_id=?').run(user.id, user.tenant_id);
      db.prepare('DELETE FROM recovery_codes WHERE user_id=?').run(user.id);
      revoke(user, res, req); audit(user, 'totp.disabled'); return json(res, { ok: true });
    }
    if (req.method === 'GET' && path === '/api/account/sessions') {
      const sessions = db.prepare('SELECT * FROM sessions WHERE user_id=? AND tenant_id=? AND expires_at>? AND auth_version=? ORDER BY created_at DESC').all(user.id, user.tenant_id, now(), user.auth_version);
      return json(res, { sessions: sessions.map((row) => ({ id: row.id, createdAt: iso(row.created_at), lastSeenAt: iso(row.last_seen_at), expiresAt: iso(row.expires_at), userAgent: row.user_agent, current: row.id === user.session_id })) });
    }
    if (req.method === 'DELETE' && path === '/api/account/sessions') {
      object(input, []);
      db.prepare('DELETE FROM sessions WHERE user_id=? AND tenant_id=? AND id!=?').run(user.id, user.tenant_id, user.session_id);
      audit(user, 'sessions.others_revoked'); return json(res, { ok: true });
    }
    if (req.method === 'DELETE' && /^\/api\/account\/sessions\/[^/]+$/.test(path)) {
      object(input, []); const id = path.split('/').at(-1);
      const result = db.prepare('DELETE FROM sessions WHERE id=? AND user_id=? AND tenant_id=?').run(id, user.id, user.tenant_id);
      if (!result.changes) fail(404, 'Sitzung nicht gefunden.');
      if (id === user.session_id) addCookie(res, cookieName, '', 0);
      audit(user, 'session.revoked'); return json(res, { ok: true });
    }
    if (req.method === 'GET' && path === '/api/notifications') {
      const preferences = settings(user).notifications;
      const all = db.prepare('SELECT * FROM notifications WHERE user_id=? AND tenant_id=? ORDER BY created_at DESC,id DESC LIMIT 200').all(user.id, user.tenant_id).filter((row) => preferences[row.category]);
      return json(res, { items: all.map((row) => ({ id: row.id, category: row.category, title: row.title, body: row.body, createdAt: iso(row.created_at), readAt: row.read_at ? iso(row.read_at) : null })), unreadCount: all.filter((row) => !row.read_at).length });
    }
    if (req.method === 'PATCH' && /^\/api\/notifications\/[^/]+\/read$/.test(path)) {
      object(input, []); const id = path.split('/')[3];
      const result = db.prepare('UPDATE notifications SET read_at=COALESCE(read_at,?) WHERE id=? AND user_id=? AND tenant_id=?').run(now(), id, user.id, user.tenant_id);
      if (!result.changes) fail(404, 'Benachrichtigung nicht gefunden.'); return json(res, { ok: true });
    }
    if (req.method === 'POST' && path === '/api/notifications/read-all') {
      object(input, []);
      db.prepare('UPDATE notifications SET read_at=? WHERE user_id=? AND tenant_id=? AND read_at IS NULL').run(now(), user.id, user.tenant_id); return json(res, { ok: true });
    }
    if (req.method === 'POST' && path === '/api/notifications/test') {
      object(input, ['category']); if (!CATEGORIES.includes(input.category)) fail(400, 'Ungültige Kategorie.'); rate(`notification-test:${user.id}`, 5, 60000);
      const prefs = settings(user).notifications;
      if (!prefs[input.category]) fail(409, 'Bitte diese Benachrichtigungskategorie zuerst aktivieren.');
      const title = 'Corva-Testbenachrichtigung';
      const message = 'Dies ist eine von Ihnen ausgelöste Testbenachrichtigung. Es wurde kein Kundenvorgang erzeugt.';
      if (prefs.email) await sendMail(user.email, title, message);
      db.prepare('INSERT INTO notifications(id,user_id,tenant_id,category,title,body,created_at) VALUES(?,?,?,?,?,?,?)').run(randomUUID(), user.id, user.tenant_id, input.category, title, message, now());
      audit(user, 'notification.test'); return json(res, { ok: true });
    }
    if (req.method === 'GET' && path === '/api/connections') return json(res, { emailAvailable: mailAvailable, connections: [
      { id: 'email', status: mailAvailable ? 'configured' : 'not_configured', message: mailAvailable ? 'SMTP-Versand ist eingerichtet. Ein Test prüft die Zustellung an Ihre Kontoadresse.' : 'Der Administrator muss SMTP auf dem Server einrichten.' },
      ...['phone','whatsapp','social'].map((id) => ({ id, status: 'not_configured', message: 'Diese Anbieteranbindung ist noch nicht implementiert.' })),
    ] });
    if (req.method === 'POST' && path === '/api/connections/email/test') {
      object(input, []); rate(`email-test:${user.id}`, 3, 3600000);
      await sendMail(user.email, 'Corva – Verbindungstest', 'Dies ist der von Ihnen angeforderte E-Mail-Verbindungstest von Corva.');
      audit(user, 'email.test'); return json(res, { ok: true });
    }
    fail(404, 'Diese Funktion wurde nicht gefunden.');
  }

  async function staticFile(req, res, path) {
    if (!['GET', 'HEAD'].includes(req.method) || !config.distDir || !(path === basePath.slice(0, -1) || path.startsWith(basePath))) fail(404, 'Nicht gefunden.');
    if (path === basePath.slice(0, -1) && basePath !== '/') { res.writeHead(308, { Location: basePath }); return res.end(); }
    const root = await realpath(config.distDir).catch(() => null);
    if (!root) fail(503, 'Die Oberfläche ist noch nicht gebaut.');
    const relative = decodeURIComponent(path.slice(basePath.length));
    if (relative.includes('\0') || relative.split(/[\\/]/).some((part) => part.startsWith('.'))) fail(404, 'Nicht gefunden.');
    let file = resolve(root, relative || 'index.html');
    if (!file.startsWith(`${root}${sep}`)) fail(404, 'Nicht gefunden.');
    let exists = await stat(file).then((entry) => entry.isFile()).catch(() => false);
    if (!exists) {
      if (extname(relative)) fail(404, 'Nicht gefunden.');
      file = resolve(root, 'index.html');
    }
    const actual = await realpath(file).catch(() => null);
    if (!actual || !actual.startsWith(`${root}${sep}`)) fail(404, 'Nicht gefunden.');
    const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };
    const data = await readFile(actual);
    res.writeHead(200, { 'Content-Type': types[extname(actual)] || 'application/octet-stream', 'Cache-Control': extname(actual) === '.html' ? 'no-cache' : 'public, max-age=3600' });
    return res.end(req.method === 'HEAD' ? undefined : data);
  }
  const server = createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'");
    if (config.production) res.setHeader('Strict-Transport-Security', 'max-age=31536000');
    try {
      const url = new URL(req.url, origin);
      if (url.pathname.startsWith('/api/')) await api(req, res, url.pathname);
      else await staticFile(req, res, url.pathname);
    } catch (error) {
      if (!(error instanceof HttpError)) logger.error('Corva request failed:', error.name, error.message);
      if (!res.headersSent) json(res, { message: error instanceof HttpError ? error.message : 'Ein Serverfehler ist aufgetreten.' }, error.status || 500);
      else res.destroy();
    }
  });
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;
  server.keepAliveTimeout = 5000;
  return { server, db, close: async () => { if (server.listening) await new Promise((resolveClose) => server.close(resolveClose)); db.close(); } };
}
