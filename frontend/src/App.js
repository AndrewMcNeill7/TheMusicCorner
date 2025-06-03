import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import Header from './Components/UI/Header';
import microphoneIcon from './Images/Microphone.png';

function App() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setResponse('');

    try {
      const res = await fetch('http://localhost:3001/api/ask-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) throw new Error('API request failed');
      const data = await res.json();
      setResponse(data.response);
    } catch (error) {
      console.error(error);
      setResponse(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsRecording(true);
      setRecordingTime(0);
      audioChunksRef.current = [];
      mediaRecorderRef.current = new MediaRecorder(stream);

      mediaRecorderRef.current.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        clearInterval(timerRef.current);
        const audioBlob = new Blob(audioChunksRef.current);
        await processAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // Auto-stop after 10 seconds (change to 30000 for 30s)
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      }, 10000);
    } catch (err) {
      console.error('Recording error:', err);
      setResponse(`Error: ${err.message}`);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const processAudioBlob = async (audioBlob) => {
    setLoading(true);
    setResponse('');

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');

      const res = await fetch('http://localhost:3001/api/audio', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Audio processing failed');
      const data = await res.json();
      setResponse(data.response);
      setPrompt(data.transcription || '');
    } catch (err) {
      console.error(err);
      setResponse(`Error: ${err.message}`);
    } finally {
      setLoading(false);
      setIsRecording(false);
    }
  };

  return (
    <div className="App">
      <Header />
      <main>
        <h1>Ask the AI</h1>
        <form onSubmit={handleSubmit} className="input-form">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Type or speak your inquiry"
            className="input-field"
            disabled={loading}
          />
          <div className="button-group">
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              className={`record-button ${isRecording ? 'recording' : ''}`}
              title={isRecording ? 'Stop Recording' : 'Record Voice'}
              disabled={loading}
            >
              <img src={microphoneIcon} alt="Record" />
              {isRecording && <span className="recording-dot"></span>}
            </button>
            <button type="submit" className="submit-button" disabled={loading || !prompt.trim()}>
              {loading ? 'Processing...' : 'Submit'}
            </button>
          </div>
        </form>

        {isRecording && (
          <p className="recording-status">
            Recording... {recordingTime}s (max 30s)
          </p>
        )}

        <div className="response-area">
          <h2>AI Response:</h2>
          {loading ? (
            <div className="loader">Loading...</div>
          ) : (
            <div className="response-content">
              {response.split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          )}
        </div>
      </main>
      <footer>
        <p>&copy; The Music Corner</p>
      </footer>
    </div>
  );
}

export default App;