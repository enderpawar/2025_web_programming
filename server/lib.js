import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');

export async function ensureData() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try { await fs.access(path.join(DATA_DIR, 'users.json')); } catch { await fs.writeFile(path.join(DATA_DIR, 'users.json'), '[]'); }
  try { await fs.access(path.join(DATA_DIR, 'rooms.json')); } catch { await fs.writeFile(path.join(DATA_DIR, 'rooms.json'), '[]'); }
  await fs.mkdir(path.join(DATA_DIR, 'codes'), { recursive: true });
}

export async function readJSON(rel, fallback = null) {
  try {
    const p = path.join(DATA_DIR, rel);
    const raw = await fs.readFile(p, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return fallback ?? null;
  }
}

export async function writeJSON(rel, data) {
  const p = path.join(DATA_DIR, rel);
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, JSON.stringify(data, null, 2), 'utf8');
}

export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export async function signToken(payload) {
  const secret = process.env.JWT_SECRET || 'dev-secret-change-me';
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

export function authRequired(req, res, next) {
  const secret = process.env.JWT_SECRET || 'dev-secret-change-me';
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'missing token' });
  try {
    const decoded = jwt.verify(token, secret);
    req.user = { id: decoded.id, email: decoded.email };
    next();
  } catch {
    return res.status(401).json({ error: 'invalid token' });
  }
}
