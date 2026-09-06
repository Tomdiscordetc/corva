import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);
const SCRYPT = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };
export const randomToken = (bytes = 32) => randomBytes(bytes).toString('base64url');
export const digest = (value) => createHash('sha256').update(value).digest('hex');
export function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const left = Buffer.from(a), right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = await scryptAsync(password, salt, 64, SCRYPT);
  return `scrypt$32768$8$3$${salt}$${hash.toString('hex')}`;
}
export async function verifyPassword(password, encoded) {
  const parts = encoded?.split('$');
  if (parts?.length !== 6 || parts[0] !== 'scrypt' || parts[1] !== '32768' || parts[2] !== '8' || parts[3] !== '3') return false;
  const hash = await scryptAsync(password, parts[4], 64, SCRYPT);
  return safeEqual(hash.toString('hex'), parts[5]);
}
export function encrypt(value, key) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), ciphertext].map((part) => part.toString('base64url')).join('.');
}
export function decrypt(value, key) {
  const [iv, tag, encrypted] = value.split('.').map((part) => Buffer.from(part, 'base64url'));
  const cipher = createDecipheriv('aes-256-gcm', key, iv);
  cipher.setAuthTag(tag);
  return Buffer.concat([cipher.update(encrypted), cipher.final()]).toString('utf8');
}
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
export function base32(buffer) {
  let value = 0, bits = 0, output = '';
  for (const byte of buffer) {
    value = (value << 8) | byte; bits += 8;
    while (bits >= 5) { output += ALPHABET[(value >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits) output += ALPHABET[(value << (5 - bits)) & 31];
  return output;
}
function decodeBase32(secret) {
  let value = 0, bits = 0;
  const bytes = [];
  for (const char of secret.toUpperCase().replace(/=+$/, '')) {
    const digit = ALPHABET.indexOf(char);
    if (digit < 0) throw new Error('Invalid base32');
    value = (value << 5) | digit; bits += 5;
    if (bits >= 8) { bytes.push((value >>> (bits - 8)) & 255); bits -= 8; }
  }
  return Buffer.from(bytes);
}
export const newTotpSecret = () => base32(randomBytes(20));
export function totp(secret, timeMs, digits = 6) {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(timeMs / 30000)));
  const hash = createHmac('sha1', decodeBase32(secret)).update(counter).digest();
  const offset = hash[19] & 15;
  return ((hash.readUInt32BE(offset) & 0x7fffffff) % 10 ** digits).toString().padStart(digits, '0');
}
export function matchTotp(secret, code, timeMs, lastStep = -1) {
  if (!/^\d{6}$/.test(code)) return null;
  const step = Math.floor(timeMs / 30000);
  for (const candidate of [step, step - 1, step + 1]) {
    if (candidate > lastStep && candidate >= 0 && safeEqual(totp(secret, candidate * 30000), code)) return candidate;
  }
  return null;
}
export function createCsrf(key) {
  const nonce = randomToken();
  return `${nonce}.${createHmac('sha256', key).update(`csrf:${nonce}`).digest('base64url')}`;
}
export function validCsrf(value, key) {
  if (typeof value !== 'string' || !/^[\w-]{43}\.[\w-]{43}$/.test(value)) return false;
  const [nonce, signature] = value.split('.');
  return safeEqual(signature, createHmac('sha256', key).update(`csrf:${nonce}`).digest('base64url'));
}
