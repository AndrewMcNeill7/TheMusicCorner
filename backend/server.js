import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { exec } from 'child_process';
import fs from 'fs';
import util from 'util';

dotenv.config();
const app = express();
const execPromise = util.promisify(exec);

app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY); // Use the API key from environment

app.post('/api/audio', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      console.error('No audio file provided');
      return res.status(400).json({ error: 'No audio file provided' });
    }

    console.log(`Received audio file: ${req.file.path}`);
    const wavPath = req.file.path + '.wav';
    await execPromise(`ffmpeg -i ${req.file.path} -acodec pcm_s16le -ar 16000 ${wavPath}`);
    console.log(`Converted to WAV: ${wavPath}`);

    const { stdout: transcription } = await execPromise(`python transcribe.py ${wavPath}`);
    console.log("Transcription result:", transcription);

    // Update model name here
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: `Respond to this voice message: ${transcription}` }] }]
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

app.listen(3001, () => console.log('Server running on http://localhost:3001'));