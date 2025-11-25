// Vercel serverless function wrapper
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureData, readJSON, writeJSON, hashPassword, verifyPassword, signToken, authRequired } from '../server/lib.js';
import vm from 'node:vm';
import fs from 'node:fs/promises';
import { GoogleGenerativeAI } from '@google/generative-ai';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import crypto from 'node:crypto';
import { JSDOM } from 'jsdom';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverDir = path.join(__dirname, '..');

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Ensure data directory exists
await ensureData(path.join(serverDir, 'server'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    const users = await readJSON(path.join(serverDir, 'server/data/users.json'));
    if (users.find((u) => u.username === username)) {
      return res.status(400).json({ error: 'User already exists' });
    }
    const hashed = await hashPassword(password);
    const user = { id: crypto.randomUUID(), username, password: hashed };
    users.push(user);
    await writeJSON(path.join(serverDir, 'server/data/users.json'), users);
    const token = signToken({ id: user.id, username: user.username });
    res.json({ token, user: { id: user.id, username: user.username } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    const users = await readJSON(path.join(serverDir, 'server/data/users.json'));
    const user = users.find((u) => u.username === username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = signToken({ id: user.id, username: user.username });
    res.json({ token, user: { id: user.id, username: user.username } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rooms routes
app.get('/api/rooms', authRequired, async (req, res) => {
  try {
    const rooms = await readJSON(path.join(serverDir, 'server/data/rooms.json'));
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/rooms', authRequired, async (req, res) => {
  try {
    const { title, description } = req.body;
    const rooms = await readJSON(path.join(serverDir, 'server/data/rooms.json'));
    const room = {
      id: crypto.randomUUID(),
      title,
      description,
      createdBy: req.user.id,
      createdAt: new Date().toISOString(),
      problems: [],
    };
    rooms.push(room);
    await writeJSON(path.join(serverDir, 'server/data/rooms.json'), rooms);
    res.json(room);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/rooms/:id', authRequired, async (req, res) => {
  try {
    const rooms = await readJSON(path.join(serverDir, 'server/data/rooms.json'));
    const idx = rooms.findIndex((r) => r.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Room not found' });
    if (rooms[idx].createdBy !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    rooms.splice(idx, 1);
    await writeJSON(path.join(serverDir, 'server/data/rooms.json'), rooms);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Problems routes
app.post('/api/rooms/:roomId/problems', authRequired, upload.single('pdf'), async (req, res) => {
  try {
    const rooms = await readJSON(path.join(serverDir, 'server/data/rooms.json'));
    const room = rooms.find((r) => r.id === req.params.roomId);
    if (!room) return res.status(404).json({ error: 'Room not found' });

    let problemData = {};
    if (req.file) {
      const pdfBuffer = req.file.buffer;
      const data = await pdfParse(pdfBuffer);
      const text = data.text;

      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `다음 텍스트는 코딩 문제입니다. 이를 분석하여 JSON 형식으로 반환해주세요:
{
  "title": "문제 제목",
  "description": "문제 설명 (HTML 형식)",
  "difficulty": "Easy|Normal|Hard",
  "functionName": "함수명",
  "starterCode": "초기 코드",
  "testCases": [{"input": [...], "output": ...}, ...]
}

텍스트:
${text}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const aiText = response.text();
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        problemData = JSON.parse(jsonMatch[0]);
      }
    } else {
      const { title, description, difficulty, functionName, starterCode, testCases } = req.body;
      problemData = {
        title,
        description,
        difficulty,
        functionName,
        starterCode,
        testCases: JSON.parse(testCases || '[]'),
      };
    }

    const problem = {
      id: crypto.randomUUID(),
      ...problemData,
      createdAt: new Date().toISOString(),
    };

    room.problems.push(problem);
    await writeJSON(path.join(serverDir, 'server/data/rooms.json'), rooms);
    res.json(problem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/rooms/:roomId/problems/:problemId', authRequired, async (req, res) => {
  try {
    const rooms = await readJSON(path.join(serverDir, 'server/data/rooms.json'));
    const room = rooms.find((r) => r.id === req.params.roomId);
    if (!room) return res.status(404).json({ error: 'Room not found' });

    const idx = room.problems.findIndex((p) => p.id === req.params.problemId);
    if (idx === -1) return res.status(404).json({ error: 'Problem not found' });

    room.problems.splice(idx, 1);
    await writeJSON(path.join(serverDir, 'server/data/rooms.json'), rooms);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Code execution
app.post('/api/execute', async (req, res) => {
  try {
    const { code, testCases } = req.body;
    const results = [];

    for (const tc of testCases) {
      try {
        const dom = new JSDOM('', { runScripts: 'outside-only' });
        const context = dom.getInternalVMContext();
        context.console = {
          log: (...args) => {},
          error: (...args) => {},
        };

        vm.runInContext(code, context);

        const funcMatch = code.match(/function\s+(\w+)/);
        const funcName = funcMatch ? funcMatch[1] : null;

        if (!funcName || typeof context[funcName] !== 'function') {
          results.push({ passed: false, error: 'Function not found' });
          continue;
        }

        const result = context[funcName](...tc.input);
        const passed = JSON.stringify(result) === JSON.stringify(tc.output);
        results.push({ passed, input: tc.input, expected: tc.output, actual: result });
      } catch (err) {
        results.push({ passed: false, error: err.message, input: tc.input });
      }
    }

    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Code storage
app.post('/api/code/save', authRequired, async (req, res) => {
  try {
    const { roomId, problemId, code } = req.body;
    const codeId = `${req.user.id}-${roomId}-${problemId}`;
    const codeData = { userId: req.user.id, roomId, problemId, code, updatedAt: new Date().toISOString() };
    await writeJSON(path.join(serverDir, `server/data/codes/${codeId}.json`), codeData);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/code/:roomId/:problemId', authRequired, async (req, res) => {
  try {
    const codeId = `${req.user.id}-${req.params.roomId}-${req.params.problemId}`;
    const codePath = path.join(serverDir, `server/data/codes/${codeId}.json`);
    try {
      const codeData = await readJSON(codePath);
      res.json(codeData);
    } catch {
      res.json({ code: '' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI hint
app.post('/api/ai/hint', authRequired, async (req, res) => {
  try {
    const { problem, code } = req.body;
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `다음 문제를 해결하는 중입니다:
문제: ${problem.title}
설명: ${problem.description}
현재 코드:
${code}

힌트를 한국어로 간단히 제공해주세요 (2-3문장).`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const hint = response.text();
    res.json({ hint });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default app;
