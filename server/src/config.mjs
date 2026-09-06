import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const serverRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export function readConfig(env = process.env) {
  const production = env.NODE_ENV === 'production';
  const publicUrl = new URL(env.CORVA_PUBLIC_URL || 'http://127.0.0.1:5181/');
  if (!['http:', 'https:'].includes(publicUrl.protocol) || publicUrl.username || publicUrl.password || publicUrl.search || publicUrl.hash) throw new Error('CORVA_PUBLIC_URL muss eine gültige HTTP(S)-URL sein.');
  if (production && publicUrl.protocol !== 'https:') throw new Error('Produktion erfordert HTTPS in CORVA_PUBLIC_URL.');
  const dataDir = resolve(env.CORVA_DATA_DIR || resolve(serverRoot, 'data'));
  let masterKey;
  if (env.CORVA_MASTER_KEY) {
    if (!/^[a-f\d]{64}$/i.test(env.CORVA_MASTER_KEY)) throw new Error('CORVA_MASTER_KEY muss genau 32 Byte als 64 Hex-Zeichen enthalten.');
    masterKey = Buffer.from(env.CORVA_MASTER_KEY, 'hex');
  } else {
    if (production) throw new Error('CORVA_MASTER_KEY fehlt.');
    mkdirSync(dataDir, { recursive: true });
    const path = resolve(dataDir, 'development-master.key');
    if (!existsSync(path)) writeFileSync(path, randomBytes(32), { flag: 'wx', mode: 0o600 });
    masterKey = readFileSync(path);
    if (masterKey.length !== 32) throw new Error('Ungültiger lokaler Entwicklungsschlüssel.');
  }
  const port = Number(env.CORVA_PORT || 3001);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Ungültiger CORVA_PORT.');
  const basePath = `${publicUrl.pathname.replace(/\/+$/, '')}/`;
  return {
    production, publicUrl: publicUrl.href, origin: publicUrl.origin, basePath,
    host: env.CORVA_HOST || '127.0.0.1', port, masterKey,
    databasePath: resolve(dataDir, 'corva.sqlite'), distDir: resolve(serverRoot, '../dist'),
    smtp: env.SMTP_HOST ? {
      host: env.SMTP_HOST, port: Number(env.SMTP_PORT || 587), secure: env.SMTP_SECURE === 'true',
      requireTLS: env.SMTP_SECURE !== 'true',
      auth: env.SMTP_USER && env.SMTP_PASSWORD ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } : undefined,
      connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
      disableFileAccess: true, disableUrlAccess: true,
    } : null,
    mailFrom: env.SMTP_FROM || '',
  };
}
