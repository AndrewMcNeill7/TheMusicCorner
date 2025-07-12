import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import mysql from 'mysql2';
import fs from 'fs';
import util from 'util';
import { exec } from 'child_process';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
const execPromise = util.promisify(exec);
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// --- AUDIO PROCESSING ROUTE ---
app.post('/api/audio', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No audio file provided' });

    const wavPath = req.file.path + '.wav';
    await execPromise(`ffmpeg -i ${req.file.path} -acodec pcm_s16le -ar 16000 ${wavPath}`);

    const { stdout: transcriptionRaw } = await execPromise(`python transcribe.py ${wavPath}`);
    const transcription = transcriptionRaw.trim();

    // Always accept any transcription and generate playlist
    const systemPrompt = `
      You are a helpful music assistant.
      Respond with a playlist of 10 songs inspired by the user's prompt.
      Format as a numbered list:
      1. Title - Artist
      2. ...
      No commentary.
      `;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\nPrompt: ${transcription}` }] }],
    });

    const responseText = result.response.text();

    fs.unlinkSync(req.file.path);
    fs.unlinkSync(wavPath);

    // Parse playlist from response text
    const playlist = responseText
      .split('\n')
      .filter(line => /^\d+\.\s/.test(line))
      .map(line => {
        const cleaned = line.replace(/^\d+\.\s*/, '');
        const [title, artist] = cleaned.split(' - ');
        return { title: title?.trim() || 'Unknown Title', artist: artist?.trim() || 'Unknown Artist' };
      });

    res.json({ transcription, playlist });
  } catch (error) {
    console.error('Processing error:', error);
    res.status(500).json({ error: error.message });
  }
});

// --- TEXT PROMPT ROUTE ---
app.post('/api/ask-ai', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || !prompt.trim()) return res.status(400).json({ error: 'Prompt is required' });

    const systemPrompt = `
      You are a helpful music assistant.
      Respond with a playlist of 10 songs inspired by the user's prompt.
      Format as a numbered list:
      1. Title - Artist
      2. ...
      No commentary.
      `;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\nPrompt: ${prompt}` }] }],
    });

    const responseText = result.response.text();

    // Parse playlist
    const playlist = responseText
      .split('\n')
      .filter(line => /^\d+\.\s/.test(line))
      .map(line => {
        const cleaned = line.replace(/^\d+\.\s*/, '');
        const [title, artist] = cleaned.split(' - ');
        return { title: title?.trim() || 'Unknown Title', artist: artist?.trim() || 'Unknown Artist' };
      });

    res.json({ playlist });
  } catch (error) {
    console.error('ask-ai error:', error);
    res.status(500).json({ error: error.message });
  }
});

// --- SAVE USER HISTORY ---
app.post('/api/save-history', (req, res) => {
  const { userId, prompt, response, timestamp } = req.body;
  if (!userId || !prompt || !response || !timestamp) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const mysqlTimestamp = new Date(timestamp).toISOString().slice(0, 19).replace('T', ' ');
  const sql = 'INSERT INTO user_history (user_id, prompt, response, timestamp) VALUES (?, ?, ?, ?)';

  db.query(sql, [userId, prompt, response, mysqlTimestamp], (err) => {
    if (err) {
      console.error('DB insert error:', err);
      return res.status(500).json({ error: 'Failed to save history' });
    }
    res.sendStatus(200);
  });
});

// --- GET USER HISTORY ---
app.get('/api/get-history', (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  const sql = 'SELECT prompt, response, timestamp FROM user_history WHERE user_id = ? ORDER BY timestamp DESC';
  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('DB fetch error:', err);
      return res.status(500).json({ error: 'Failed to fetch history' });
    }
    res.json(results);
  });
});

// --- USER LOGGING ---
app.post('/api/log-user', (req, res) => {
  let { user_id, name, email, dob } = req.body;
  if (!user_id || user_id === 'null' || user_id.trim() === '') {
    user_id = `manual_${Date.now()}`;
  }
  if (!name || !email) return res.status(400).json({ error: 'Missing user data' });

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
    res.status(200).json({ message: 'User logged', user_id });
  });
});

// --- CHECK USER ---
app.get('/api/check-user', (req, res) => {
  const email = req.query.email?.trim();
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const sql = 'SELECT user_id, name, email FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1';
  db.query(sql, [email.toLowerCase()], (err, results) => {
    if (err) {
      console.error('DB check-user error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (results.length > 0) {
      res.json({ exists: true, ...results[0] });
    } else {
      res.json({ exists: false });
    }
  });
});

const PORT = 3001;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
