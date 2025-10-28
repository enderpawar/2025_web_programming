// Simple Express server with JWT auth, rooms CRUD, code storage, and Socket.IO for collaboration
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureData, readJSON, writeJSON, hashPassword, verifyPassword, signToken, authRequired } from './lib.js';
import { createServer } from 'node:http';
import { Server as SocketIOServer } from 'socket.io';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
await ensureData(__dirname);

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Health
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Auth
app.post('/api/auth/signup', async (req, res) => {
  const { email, password, name } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  const users = await readJSON('users.json');
  if (users.find((u) => u.email === email)) return res.status(409).json({ error: 'email already exists' });
  const id = crypto.randomUUID();
  const passwordHash = await hashPassword(password);
  const user = { id, email, name: name || email.split('@')[0], passwordHash, createdAt: Date.now() };
  users.push(user);
  await writeJSON('users.json', users);
  const token = await signToken({ id: user.id, email: user.email });
  res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  const users = await readJSON('users.json');
  const user = users.find((u) => u.email === email);
  if (!user) return res.status(401).json({ error: 'invalid credentials' });
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'invalid credentials' });
  const token = await signToken({ id: user.id, email: user.email });
  res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

app.get('/api/me', authRequired, async (req, res) => {
  const users = await readJSON('users.json');
  const me = users.find((u) => u.id === req.user.id);
  if (!me) return res.status(401).json({ error: 'invalid token' });
  res.json({ id: me.id, email: me.email, name: me.name });
});

// Rooms
app.get('/api/rooms', authRequired, async (req, res) => {
  const rooms = await readJSON('rooms.json');
  const list = rooms.filter((r) => r.public || r.ownerId === req.user.id);
  res.json(list);
});

app.post('/api/rooms', authRequired, async (req, res) => {
  const { name, groupName, authorName, logoUrl, makePublic } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name required' });
  const rooms = await readJSON('rooms.json');
  const room = {
    id: crypto.randomUUID(),
    name,
    groupName: groupName || '',
    authorName: authorName || '',
    logoUrl: logoUrl || '',
    ownerId: req.user.id,
    public: !!makePublic,
    createdAt: Date.now(),
  };
  rooms.unshift(room);
  await writeJSON('rooms.json', rooms);
  res.status(201).json(room);
});

app.get('/api/rooms/:id', authRequired, async (req, res) => {
  const rooms = await readJSON('rooms.json');
  const room = rooms.find((r) => r.id === req.params.id);
  if (!room) return res.status(404).json({ error: 'not found' });
  if (!room.public && room.ownerId !== req.user.id) return res.status(403).json({ error: 'forbidden' });
  res.json(room);
});

app.put('/api/rooms/:id', authRequired, async (req, res) => {
  const rooms = await readJSON('rooms.json');
  const idx = rooms.findIndex((r) => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  const room = rooms[idx];
  if (room.ownerId !== req.user.id) return res.status(403).json({ error: 'forbidden' });
  const { name, groupName, authorName, logoUrl, public: isPublic } = req.body || {};
  Object.assign(room, { name, groupName, authorName, logoUrl });
  if (typeof isPublic === 'boolean') room.public = isPublic;
  rooms[idx] = room;
  await writeJSON('rooms.json', rooms);
  res.json(room);
});

app.delete('/api/rooms/:id', authRequired, async (req, res) => {
  const rooms = await readJSON('rooms.json');
  const idx = rooms.findIndex((r) => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  const room = rooms[idx];
  if (room.ownerId !== req.user.id) return res.status(403).json({ error: 'forbidden' });
  rooms.splice(idx, 1);
  await writeJSON('rooms.json', rooms);
  await writeJSON(path.join('codes', `${req.params.id}.json`), { code: '' });
  res.json({ ok: true });
});

// Code
app.get('/api/rooms/:id/code', authRequired, async (req, res) => {
  const rooms = await readJSON('rooms.json');
  const room = rooms.find((r) => r.id === req.params.id);
  if (!room) return res.status(404).json({ error: 'not found' });
  if (!room.public && room.ownerId !== req.user.id) return res.status(403).json({ error: 'forbidden' });
  const codeObj = await readJSON(path.join('codes', `${req.params.id}.json`), { code: '' });
  res.json(codeObj);
});

app.put('/api/rooms/:id/code', authRequired, async (req, res) => {
  const { code } = req.body || {};
  const rooms = await readJSON('rooms.json');
  const room = rooms.find((r) => r.id === req.params.id);
  if (!room) return res.status(404).json({ error: 'not found' });
  if (room.ownerId !== req.user.id) return res.status(403).json({ error: 'forbidden' });
  await writeJSON(path.join('codes', `${req.params.id}.json`), { code: code || '' });
  res.json({ ok: true });
});

// Share
app.post('/api/rooms/:id/share', authRequired, async (req, res) => {
  const rooms = await readJSON('rooms.json');
  const idx = rooms.findIndex((r) => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  const room = rooms[idx];
  if (room.ownerId !== req.user.id) return res.status(403).json({ error: 'forbidden' });
  room.public = true;
  rooms[idx] = room;
  await writeJSON('rooms.json', rooms);
  res.json({ ok: true, url: `/rooms/${room.id}` });
});

// Start HTTP + Socket.IO
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, { cors: { origin: '*' } });

io.on('connection', (socket) => {
  socket.on('join', ({ roomId }) => {
    if (!roomId) return;
    socket.join(roomId);
  });
  socket.on('code:change', ({ roomId, code, clientId }) => {
    if (!roomId) return;
    socket.to(roomId).emit('code:remote', { code, clientId });
  });
});

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});
