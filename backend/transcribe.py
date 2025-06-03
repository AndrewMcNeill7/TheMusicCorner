import sys
import speech_recognition as sr
from pydub import AudioSegment
import os

def transcribe_audio(file_path):
    """Transcribe audio file using Whisper or Google Speech Recognition"""
    try:
        # Convert to WAV if needed
        if not file_path.lower().endswith('.wav'):
            audio = AudioSegment.from_file(file_path)
            wav_path = os.path.splitext(file_path)[0] + '.wav'
            audio.export(wav_path, format='wav')
            file_path = wav_path
        
        # Transcribe
        recognizer = sr.Recognizer()
        with sr.AudioFile(file_path) as source:
            audio = recognizer.record(source)
            text = recognizer.recognize_google(audio)
            return text
            
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Error: No audio file provided", file=sys.stderr)
        sys.exit(1)
    
    audio_file = sys.argv[1]
    transcription = transcribe_audio(audio_file)
    print(transcription)