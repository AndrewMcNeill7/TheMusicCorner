import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import mysql from 'mysql2';
import fs from 'fs';
import util from 'util';
import { exec } from 'child_process';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { jwtDecode } from 'jwt-decode';

dotenv.config();
const app = express();
const execPromise = util.promisify(exec);
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// === MySQL Connection ===
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// === AUDIO PROCESSING ===
app.post('/api/audio', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No audio file provided' });

    const wavPath = req.file.path + '.wav';
    await execPromise(`ffmpeg -i ${req.file.path} -acodec pcm_s16le -ar 16000 ${wavPath}`);

    const { stdout: transcription } = await execPromise(`python transcribe.py ${wavPath}`);

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: `Respond to this voice message: ${transcription}` }] }],
    });

    const response = await result.response;
    const text = response.text();

    fs.unlinkSync(req.file.path);
    fs.unlinkSync(wavPath);

    res.json({ transcription: transcription.trim(), response: text });
  } catch (error) {
    console.error('Processing error:', error);
    res.status(500).json({ error: error.message });
  }
});

// === TEXT PROMPT + RESPONSE ===
app.post('/api/ask-ai', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || !prompt.trim()) return res.status(400).json({ error: 'Prompt is required' });

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const response = await result.response;
    const text = response.text();

    res.json({ response: text });
  } catch (error) {
    console.error('ask-ai error:', error);
    res.status(500).json({ error: error.message });
  }
});

// === SAVE USER HISTORY TO DB ===
app.post('/api/save-history', (req, res) => {
  let { userId, prompt, response, timestamp } = req.body;

  if (!userId || !prompt || !response || !timestamp) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Convert timestamp to MySQL-friendly format
  const mysqlTimestamp = new Date(timestamp).toISOString().slice(0, 19).replace('T', ' ');

  const sql = `INSERT INTO user_history (user_id, prompt, response, timestamp) VALUES (?, ?, ?, ?)`;
  db.query(sql, [userId, prompt, response, mysqlTimestamp], (err) => {
    if (err) {
      console.error('DB insert error:', err);
      return res.status(500).json({ error: 'Failed to save history' });
    }
    res.sendStatus(200);
  });
});

// === GET USER HISTORY FROM DB ===
app.get('/api/get-history', (req, res) => {
  const { userId } = req.query;
  console.log('GET history for userId:', userId);
  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  const sql = `SELECT prompt, response, timestamp FROM user_history WHERE user_id = ? ORDER BY timestamp DESC`;
  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('DB fetch error:', err);
      return res.status(500).json({ error: 'Failed to fetch history' });
    }
    res.json(results);
  });
});

// === LOG USER SIGN IN FROM GOOGLE OAUTH OR MANUAL SIGNUP ===
app.post('/api/log-user', (req, res) => {
  console.log('Received /api/log-user POST request');
  console.log('Request body:', req.body);

  let { user_id, name, email, dob } = req.body;

  // Auto-generate user_id if missing (manual sign-up case)
  if (!user_id || user_id === 'null' || user_id.trim() === '') {
    user_id = `manual_${Date.now()}`;
    console.log(`Generated user_id: ${user_id}`);
  }

  if (!name || !email) {
    console.log('Missing required user data: name or email');
    return res.status(400).json({ error: 'Missing user data' });
  }

  const sql = `
    INSERT INTO users (user_id, name, email, dob)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      email = VALUES(email),
      dob = VALUES(dob)
  `;

  db.query(sql, [user_id, name, email, dob || null], (err) => {
    if (err) {
      console.error('User insert error:', err);
      return res.status(500).json({ error: 'Failed to log user' });
    }
    console.log('User logged successfully');
    res.status(200).json({ message: 'User logged', user_id });
  });
});

// === CHECK IF USER EXISTS BY EMAIL ===
app.get('/api/check-user', (req, res) => {
  const email = req.query.email?.trim();
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const sql = `SELECT user_id, name, email FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1`;
  db.query(sql, [email.toLowerCase()], (err, results) => {
    if (err) {
      console.error('DB check-user error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (results.length > 0) {
      res.json({
        exists: true,
        user_id: results[0].user_id,
        name: results[0].name,
        email: results[0].email
      });
    } else {
      res.json({ exists: false });
    }
  });
});


// === Start Server ===
const PORT = 3001;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
