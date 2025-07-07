import React, { useState, useRef, useEffect } from 'react';
import Header from '../Components/UI/Header';
import Footer from '../Components/UI/Footer';
import '../Components/CSS/Home.css';
import microphoneIcon from '../Images/Microphone.png';

function Home() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [playlist, setPlaylist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  // Simulate logged-in user info
  const user = JSON.parse(localStorage.getItem('user'));
  const userId = user?.payload?.sub;

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
    };
  }, []);

  const savePromptHistory = async (prompt, responseText) => {
    if (!userId) return;
    try {
      await fetch('http://localhost:3001/api/save-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          prompt,
          response: responseText,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (err) {
      console.error('Failed to save history:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setResponse('');
    setPlaylist([]);

    try {
      const res = await fetch('http://localhost:3001/api/ask-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) throw new Error('API request failed');

      const { playlist } = await res.json();

      const responseText = playlist.map(song => `${song.title} - ${song.artist}`).join('\n');

      setResponse(responseText);
      setPlaylist(playlist);
      await savePromptHistory(prompt, responseText);
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
        setRecordingTime(t => t + 1);
      }, 1000);

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
    setPlaylist([]);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');

      const res = await fetch('http://localhost:3001/api/audio', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Audio processing failed');
      const data = await res.json();

      const playlistData = data.playlist || [];
      const responseText = playlistData.length
        ? playlistData.map(song => `${song.title} - ${song.artist}`).join('\n')
        : data.response;

      setPrompt(data.transcription || '');
      setResponse(responseText);
      setPlaylist(playlistData);
      await savePromptHistory(data.transcription, responseText);
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
            placeholder="Enter Any Prompt To Have A Playlist Created For That Prompt"
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
            <button
              type="submit"
              className="submit-button"
              disabled={loading || !prompt.trim()}
            >
              {loading ? 'Processing...' : 'Submit'}
            </button>
          </div>
        </form>

        {isRecording && (
          <p className="recording-status">Recording... {recordingTime}s (max 10s)</p>
        )}

        <div className="response-area">
          <h2>AI Playlist:</h2>
          {loading ? (
            <div className="loader">Loading...</div>
          ) : (
            <>
              {playlist.length > 0 ? (
                <ul className="playlist-list">
                  {playlist.map((song, i) => (
                    <li key={i}>
                      <strong>{song.title}</strong> — {song.artist}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="response-content">
                  {response.split('\n').map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default Home;
