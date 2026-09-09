import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { createServer } from 'node:http';
import { createCorvaServer } from '../src/app.mjs';
import { openDatabase, createUser } from '../src/database.mjs';

/** Freien Port vorab holen: die Herkunftsprüfung braucht die echte Adresse. */
async function freePort() {
  const probe = createServer();
  await new Promise((done) => probe.listen(0, '127.0.0.1', done));
  const { port } = probe.address();
  await new Promise((done) => probe.close(done));
  return port;
}

/*
  Prüft die Fachdaten-Endpunkte, mit Schwerpunkt auf den beiden Grenzen, die
  nicht brechen dürfen: kein Blick in einen fremden Mandanten, und
  Mitarbeitende sehen nur, wofür sie zuständig sind.
*/

let handle;
let base;
let db;
const accounts = {};

async function request(path, { method = 'GET', body, as } = {}) {
  const headers = { origin: base.replace(/\/$/, '') };
  if (body !== undefined) headers['content-type'] = 'application/json';
  if (as) {
    headers.cookie = accounts[as].cookies.join('; ');
    if (accounts[as].csrf) headers['x-csrf-token'] = accounts[as].csrf;
  }
  const response = await fetch(new URL(path, base), {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null, response };
}

async function signIn(name, email, password) {
  const first = await fetch(new URL('/api/auth/session', base));
  const setCookie = first.headers.getSetCookie();
  const csrf = setCookie.map((c) => c.match(/corva-csrf=([^;]+)/)?.[1]).find(Boolean);
  const login = await fetch(new URL('/api/auth/login', base), {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: base.replace(/\/$/, ''),
      cookie: `corva-csrf=${csrf}`,
      'x-csrf-token': decodeURIComponent(csrf),
    },
    body: JSON.stringify({ email, password }),
  });
  assert.equal(login.status, 200, `Anmeldung von ${name} fehlgeschlagen`);
  const session = login.headers.getSetCookie().map((c) => c.match(/corva-session=([^;]+)/)?.[1]).find(Boolean);
  accounts[name] = { cookies: [`corva-csrf=${csrf}`, `corva-session=${session}`], csrf: decodeURIComponent(csrf) };
}

before(async () => {
  db = openDatabase(':memory:');
  const chefin = await createUser(db, { email: 'chefin@agentur.de', name: 'Sabine Krüger', password: 'passwort-lang-genug', role: 'admin', tenantName: 'Agentur Nord' });
  await createUser(db, { email: 'kollege@agentur.de', name: 'Mehmet Aydın', password: 'passwort-lang-genug', role: 'employee', tenantId: chefin.tenantId });
  await createUser(db, { email: 'fremd@andere.de', name: 'Fremde Person', password: 'passwort-lang-genug', role: 'admin', tenantName: 'Andere Agentur' });

  const port = await freePort();
  base = `http://127.0.0.1:${port}/`;
  handle = await createCorvaServer(
    { masterKey: randomBytes(32), publicUrl: base, production: false, databasePath: ':memory:' },
    { db, logger: { warn() {}, error() {} } },
  );
  await new Promise((done) => handle.server.listen(port, '127.0.0.1', done));

  await signIn('chefin', 'chefin@agentur.de', 'passwort-lang-genug');
  await signIn('kollege', 'kollege@agentur.de', 'passwort-lang-genug');
  await signIn('fremd', 'fremd@andere.de', 'passwort-lang-genug');
});

after(async () => { await handle.close(); });

beforeEach(() => {
  db.exec('DELETE FROM contact_activities; DELETE FROM tasks; DELETE FROM contacts;');
});

const musterKontakt = {
  firstName: 'Laura',
  lastName: 'Fischer',
  email: 'laura.fischer@example.de',
  branches: ['kfz'],
  stage: 'neu',
  source: 'instagram',
};

test('legt einen Kontakt an und gibt ihn vollständig zurück', async () => {
  const created = await request('/api/contacts', { method: 'POST', body: musterKontakt, as: 'chefin' });
  assert.equal(created.status, 201);
  assert.equal(created.body.contact.lastName, 'Fischer');
  assert.deepEqual(created.body.contact.branches, ['kfz']);
  assert.equal(created.body.contact.assignee, 'Sabine Krüger');

  const list = await request('/api/contacts', { as: 'chefin' });
  assert.equal(list.body.contacts.length, 1);
});

test('weist einen Kontakt ohne Erreichbarkeit ab', async () => {
  const result = await request('/api/contacts', {
    method: 'POST',
    body: { lastName: 'Ohne', branches: ['kfz'], stage: 'neu', source: 'email' },
    as: 'chefin',
  });
  assert.equal(result.status, 400);
  assert.match(result.body.message, /Kontaktweg/);
});

test('weist einen Kontakt ohne Sparte ab', async () => {
  const result = await request('/api/contacts', {
    method: 'POST',
    body: { ...musterKontakt, branches: [] },
    as: 'chefin',
  });
  assert.equal(result.status, 400);
  assert.match(result.body.message, /Sparte/);
});

test('zeigt einem anderen Mandanten nichts an', async () => {
  await request('/api/contacts', { method: 'POST', body: musterKontakt, as: 'chefin' });

  const fremd = await request('/api/contacts', { as: 'fremd' });
  assert.equal(fremd.body.contacts.length, 0);
});

test('verweigert den Zugriff auf einen Kontakt aus einem fremden Mandanten', async () => {
  const created = await request('/api/contacts', { method: 'POST', body: musterKontakt, as: 'chefin' });
  const id = created.body.contact.id;

  assert.equal((await request(`/api/contacts/${id}`, { method: 'PATCH', body: { city: 'Hannover' }, as: 'fremd' })).status, 404);
  assert.equal((await request(`/api/contacts/${id}`, { method: 'DELETE', body: {}, as: 'fremd' })).status, 404);
  assert.equal((await request(`/api/contacts/${id}/activities`, { as: 'fremd' })).status, 404);
});

test('zeigt Mitarbeitenden nur die eigenen Kontakte', async () => {
  await request('/api/contacts', { method: 'POST', body: musterKontakt, as: 'chefin' });
  const meiner = await request('/api/contacts', {
    method: 'POST',
    body: { ...musterKontakt, lastName: 'Aydın-Kunde', assignee: 'Mehmet Aydın' },
    as: 'chefin',
  });

  const sicht = await request('/api/contacts', { as: 'kollege' });
  assert.equal(sicht.body.contacts.length, 1);
  assert.equal(sicht.body.contacts[0].id, meiner.body.contact.id);
});

test('lässt Mitarbeitende fremde Kontakte nicht ändern', async () => {
  const fremder = await request('/api/contacts', { method: 'POST', body: musterKontakt, as: 'chefin' });
  const result = await request(`/api/contacts/${fremder.body.contact.id}`, {
    method: 'PATCH',
    body: { stage: 'abschluss' },
    as: 'kollege',
  });
  assert.equal(result.status, 403);
});

test('lässt Mitarbeitende die Zuständigkeit nicht abgeben', async () => {
  const eigener = await request('/api/contacts', {
    method: 'POST',
    body: { ...musterKontakt, assignee: 'Mehmet Aydın' },
    as: 'chefin',
  });
  const result = await request(`/api/contacts/${eigener.body.contact.id}`, {
    method: 'PATCH',
    body: { assignee: 'Sabine Krüger' },
    as: 'kollege',
  });
  assert.equal(result.status, 403);
});

test('setzt mit einem Verlaufseintrag den letzten Kontakt', async () => {
  const created = await request('/api/contacts', { method: 'POST', body: musterKontakt, as: 'chefin' });
  assert.equal(created.body.contact.lastContactAt, '');

  const logged = await request(`/api/contacts/${created.body.contact.id}/activities`, {
    method: 'POST',
    body: { channel: 'telefon', direction: 'ausgehend', description: 'Rückruf vereinbart' },
    as: 'chefin',
  });
  assert.equal(logged.status, 201);
  assert.equal(logged.body.activity.author, 'Sabine Krüger');
  assert.notEqual(logged.body.contact.lastContactAt, '');

  const list = await request(`/api/contacts/${created.body.contact.id}/activities`, { as: 'chefin' });
  assert.equal(list.body.activities.length, 1);
});

test('legt Aufgaben an, verknüpft den Kontakt über den Namen und hakt sie ab', async () => {
  const contact = await request('/api/contacts', { method: 'POST', body: musterKontakt, as: 'chefin' });

  const created = await request('/api/tasks', {
    method: 'POST',
    body: { title: 'Rückruf', priority: 'hoch', dueDate: '2026-09-10', dueTime: '09:30', contactName: 'Laura Fischer' },
    as: 'chefin',
  });
  assert.equal(created.status, 201);
  assert.equal(created.body.task.contactId, contact.body.contact.id);
  assert.equal(created.body.task.contactName, 'Laura Fischer');
  assert.equal(created.body.task.done, false);

  const done = await request(`/api/tasks/${created.body.task.id}`, { method: 'PATCH', body: { done: true }, as: 'chefin' });
  assert.equal(done.body.task.done, true);
  // Der Titel darf beim Abhaken nicht verlorengehen.
  assert.equal(done.body.task.title, 'Rückruf');
});

test('weist eine Uhrzeit ohne Datum ab', async () => {
  const result = await request('/api/tasks', {
    method: 'POST',
    body: { title: 'Ohne Datum', priority: 'mittel', dueTime: '09:30' },
    as: 'chefin',
  });
  assert.equal(result.status, 400);
  assert.match(result.body.message, /Datum/);
});

test('trennt Aufgaben zwischen Mandanten', async () => {
  const created = await request('/api/tasks', { method: 'POST', body: { title: 'Intern', priority: 'mittel' }, as: 'chefin' });

  assert.equal((await request('/api/tasks', { as: 'fremd' })).body.tasks.length, 0);
  assert.equal((await request(`/api/tasks/${created.body.task.id}`, { method: 'DELETE', body: {}, as: 'fremd' })).status, 404);
});

test('holt einen gelöschten Kontakt samt Verlauf zurück', async () => {
  const created = await request('/api/contacts', { method: 'POST', body: musterKontakt, as: 'chefin' });
  const id = created.body.contact.id;
  await request(`/api/contacts/${id}/activities`, {
    method: 'POST',
    body: { channel: 'telefon', direction: 'ausgehend', description: 'Erstgespräch' },
    as: 'chefin',
  });

  await request(`/api/contacts/${id}`, { method: 'DELETE', body: {}, as: 'chefin' });
  assert.equal((await request('/api/contacts', { as: 'chefin' })).body.contacts.length, 0);

  const restored = await request(`/api/contacts/${id}/restore`, { method: 'POST', body: {}, as: 'chefin' });
  assert.equal(restored.status, 200);
  assert.equal(restored.body.contact.id, id);
  // Entscheidend: Der Verlauf darf beim Löschen nicht mitgerissen werden.
  const history = await request(`/api/contacts/${id}/activities`, { as: 'chefin' });
  assert.equal(history.body.activities.length, 1);
  assert.equal(history.body.activities[0].description, 'Erstgespräch');
});

test('holt eine gelöschte Aufgabe zurück', async () => {
  const created = await request('/api/tasks', { method: 'POST', body: { title: 'Wiedervorlage', priority: 'hoch' }, as: 'chefin' });
  const id = created.body.task.id;

  await request(`/api/tasks/${id}`, { method: 'DELETE', body: {}, as: 'chefin' });
  assert.equal((await request('/api/tasks', { as: 'chefin' })).body.tasks.length, 0);

  const restored = await request(`/api/tasks/${id}/restore`, { method: 'POST', body: {}, as: 'chefin' });
  assert.equal(restored.body.task.title, 'Wiedervorlage');
  assert.equal((await request('/api/tasks', { as: 'chefin' })).body.tasks.length, 1);
});

test('schreibt jede Änderung ins Protokoll', async () => {
  const before = db.prepare("SELECT COUNT(*) AS n FROM audit WHERE action LIKE 'contact.%'").get().n;
  const created = await request('/api/contacts', { method: 'POST', body: musterKontakt, as: 'chefin' });
  await request(`/api/contacts/${created.body.contact.id}`, { method: 'PATCH', body: { city: 'Hannover' }, as: 'chefin' });
  await request(`/api/contacts/${created.body.contact.id}`, { method: 'DELETE', body: {}, as: 'chefin' });

  const after = db.prepare("SELECT action FROM audit WHERE action LIKE 'contact.%' ORDER BY created_at").all();
  assert.equal(after.length, before + 3);
  assert.deepEqual(after.slice(-3).map((row) => row.action), ['contact.created', 'contact.updated', 'contact.deleted']);
});
