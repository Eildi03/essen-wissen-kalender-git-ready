import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { config } from './config.js';
const scrypt = promisify(crypto.scrypt); const KEY_LENGTH = 64;
const ALG = 'HS256';
const TYP = 'JWT';

function base64urlEncode(buf) {
  return Buffer.from(buf)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = 4 - (str.length % 4);
  if (pad !== 4) {
    str += '='.repeat(pad);
  }
  return Buffer.from(str, 'base64');
}

function timingSafeCompare(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);

  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

function parseTtl(ttl) {
  // erwartet z.B. "15m", "1h"
  const match = /^(\d+)([smhd])$/.exec(ttl);
  if (!match) return 15 * 60; // default 15 Minuten

  const value = Number(match[1]);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 60 * 60;
    case 'd':
      return value * 60 * 60 * 24;
    default:
      return 15 * 60;
  }
}

export function createToken(payload) {
  const header = {
    alg: ALG,
    typ: TYP
  };

  const nowSeconds = Math.floor(Date.now() / 1000);
  const ttlSeconds = parseTtl(config.jwtTtl || '15m');

  const fullPayload = {
    ...payload,
    iat: nowSeconds,
    exp: nowSeconds + ttlSeconds
  };

  const headerJson = JSON.stringify(header);
  const payloadJson = JSON.stringify(fullPayload);

  const headerB64 = base64urlEncode(headerJson);
  const payloadB64 = base64urlEncode(payloadJson);

  const signingInput = `${headerB64}.${payloadB64}`;
  const signature = crypto
    .createHmac('sha256', config.jwtSecret)
    .update(signingInput)
    .digest();

  const signatureB64 = base64urlEncode(signature);

  return `${headerB64}.${payloadB64}.${signatureB64}`;
}
export function verifyToken(token) {
  if (typeof token !== 'string') {
    throw new Error('Tokenformat ungueltig.');
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Tokenformat ungueltig.');
  }

  const [headerB64, payloadB64, signatureB64] = parts;

  // Signatur prüfen
  const signingInput = `${headerB64}.${payloadB64}`;
  const expectedSignature = crypto
    .createHmac('sha256', config.jwtSecret)
    .update(signingInput)
    .digest();
  const expectedSignatureB64 = base64urlEncode(expectedSignature);

  if (!timingSafeCompare(signatureB64, expectedSignatureB64)) {
    throw new Error('Token-Signatur ungueltig.');
  }

  // Header & Payload dekodieren
  let header, payload;
  try {
    header = JSON.parse(base64urlDecode(headerB64).toString('utf8'));
    payload = JSON.parse(base64urlDecode(payloadB64).toString('utf8'));
  } catch {
    throw new Error('Tokenformat ungueltig.');
  }

  // Header prüfen
  if (header.alg !== ALG || header.typ !== TYP) {
    throw new Error('Token-Header ungueltig.');
  }

  // Ablauf prüfen
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== 'number' || payload.exp <= nowSeconds) {
    throw new Error('Token abgelaufen.');
  }

  // Minimale Claims prüfen
  if (!payload.sub) {
    throw new Error('Token ohne Subjekt.');
  }

  return payload;
}

export async function hashPassword(password) { const salt = crypto.randomBytes(16).toString('hex'); const key = await scrypt(password, salt, KEY_LENGTH, { N: 16384, r: 8, p: 1 }); return `scrypt$${salt}$${key.toString('hex')}`; }
export async function verifyPassword(password, stored) { try { const [algorithm, salt, hex] = String(stored || '').split('$'); if (algorithm !== 'scrypt' || !salt || !hex) return false; const key = await scrypt(password, salt, KEY_LENGTH, { N: 16384, r: 8, p: 1 }); const expected = Buffer.from(hex, 'hex'); return expected.length === key.length && crypto.timingSafeEqual(expected, key); } catch { return false; } }
function ttlSeconds(value) { const match = String(value).match(/^(\d+)(s|m|h|d)?$/i); if (!match) return 28800; return Number(match[1]) * ({ s: 1, m: 60, h: 3600, d: 86400 }[String(match[2] || 's').toLowerCase()] || 1); }
function encode(value) { return Buffer.from(JSON.stringify(value)).toString('base64url'); }
export function signToken(claims) { const header = encode({ alg: 'HS256', typ: 'JWT' }); const now = Math.floor(Date.now() / 1000); const body = encode({ ...claims, iat: now, exp: now + ttlSeconds(config.jwtTtl) }); const unsigned = `${header}.${body}`; const signature = crypto.createHmac('sha256', config.jwtSecret).update(unsigned).digest('base64url'); return `${unsigned}.${signature}`; }
//export function verifyToken(token) { const parts = String(token || '').split('.'); if (parts.length !== 3) throw new Error('Tokenformat ungueltig.'); const [header, body, signature] = parts; const unsigned = `${header}.${body}`; const expected = crypto.createHmac('sha256', config.jwtSecret).update(unsigned).digest(); const received = Buffer.from(signature, 'base64url'); if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) throw new Error('Token-Signatur ungueltig.'); const claims = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')); if (!claims.exp || claims.exp <= Math.floor(Date.now() / 1000)) throw new Error('Token abgelaufen.'); return claims; }
export function authMiddleware(req, res, next) { const header = req.headers.authorization || ''; if (!header.startsWith('Bearer ')) return res.status(401).json({ error: 'AUTH_REQUIRED', message: 'Anmeldung erforderlich.' }); try { req.user = verifyToken(header.slice(7)); return next(); } catch { return res.status(401).json({ error: 'INVALID_TOKEN', message: 'Anmeldung ist ungueltig oder abgelaufen.' }); } }
export function requirePermission(permission) { return (req, res, next) => { if (!req.user?.permissions?.includes(permission)) return res.status(403).json({ error: 'FORBIDDEN', message: 'Fuer diese Aktion fehlt die Berechtigung.' }); return next(); }; }
export function requireAnyPermission(...permissions) { return (req, res, next) => { if (!permissions.some(permission => req.user?.permissions?.includes(permission))) return res.status(403).json({ error: 'FORBIDDEN', message: 'Fuer diese Aktion fehlt die Berechtigung.' }); return next(); }; }
