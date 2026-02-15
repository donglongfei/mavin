/**
 * Voice Conversation Service
 *
 * Handles the full voice interaction flow:
 * 1. Record user audio
 * 2. Transcribe with ASR (MooER)
 * 3. Send to chat service
 * 4. Convert response to speech with TTS (MT LiteTTS)
 * 5. Play audio response
 */

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:8002';

export interface VoiceConversationOptions {
  conversationId?: string;
  onStateChange?: (state: 'idle' | 'listening' | 'thinking' | 'speaking') => void;
  onTranscript?: (text: string) => void;
  onResponse?: (text: string) => void;
  onError?: (error: Error) => void;
}

export class VoiceConversation {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private audioContext: AudioContext | null = null;
  private audioSource: AudioBufferSourceNode | null = null;
  private isRecording = false;
  private isPlaying = false;
  private options: VoiceConversationOptions;

  constructor(options: VoiceConversationOptions = {}) {
    this.options = options;
  }

  /**
   * Start recording user's voice
   */
  async startListening(): Promise<void> {
    try {
      this.options.onStateChange?.('listening');

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Create MediaRecorder
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        await this.processAudio(audioBlob);

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      this.mediaRecorder.start();
      this.isRecording = true;

    } catch (error) {
      console.error('Failed to start recording:', error);
      this.options.onError?.(error as Error);
      this.options.onStateChange?.('idle');
      throw error;
    }
  }

  /**
   * Stop recording
   */
  stopListening(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
    }
  }

  /**
   * Process recorded audio: ASR -> Chat -> TTS -> Play
   */
  private async processAudio(audioBlob: Blob): Promise<void> {
    try {
      this.options.onStateChange?.('thinking');

      // Step 1: Transcribe audio (ASR)
      console.log('Transcribing audio...');
      const transcript = await this.transcribeAudio(audioBlob);
      console.log('Transcript:', transcript);
      this.options.onTranscript?.(transcript);

      if (!transcript || transcript.trim().length === 0) {
        throw new Error('No speech detected');
      }

      // Step 2: Get chat response
      console.log('Getting chat response...');
      const response = await this.getChatResponse(transcript);
      console.log('Chat response:', response);
      this.options.onResponse?.(response);

      // Step 3: Convert response to speech (TTS)
      console.log('Converting to speech...');
      const audioUrl = await this.textToSpeech(response);
      console.log('Audio URL:', audioUrl);

      // Step 4: Play audio
      this.options.onStateChange?.('speaking');
      await this.playAudio(audioUrl);

      // Return to idle
      this.options.onStateChange?.('idle');

    } catch (error) {
      console.error('Voice conversation failed:', error);
      this.options.onError?.(error as Error);
      this.options.onStateChange?.('idle');
    }
  }

  /**
   * Transcribe audio using ASR service
   */
  private async transcribeAudio(audioBlob: Blob): Promise<string> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');

    const response = await fetch(`${BACKEND_URL}/api/voice/asr`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'ASR failed');
    }

    const result = await response.json();
    return result.text;
  }

  /**
   * Get chat response from AI
   */
  private async getChatResponse(message: string): Promise<string> {
    const requestBody: any = {
      message,
      model: 'claude', // or 'gpt-4'
    };

    // Include conversationId if provided for context continuity
    if (this.options.conversationId) {
      requestBody.conversationId = this.options.conversationId;
    }

    const response = await fetch(`${BACKEND_URL}/api/chat/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Chat failed');
    }

    const result = await response.json();
    return result.response;
  }

  /**
   * Convert text to speech using TTS service
   */
  private async textToSpeech(text: string): Promise<string> {
    const response = await fetch(`${BACKEND_URL}/api/voice/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        backend: 'mt', // Use MT LiteTTS
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'TTS failed');
    }

    const result = await response.json();
    // Return full URL for audio file
    return `${BACKEND_URL}${result.audioUrl}`;
  }

  /**
   * Play audio response
   */
  private async playAudio(audioUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.audioContext) {
        this.audioContext = new AudioContext();
      }

      fetch(audioUrl)
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => this.audioContext!.decodeAudioData(arrayBuffer))
        .then(audioBuffer => {
          this.audioSource = this.audioContext!.createBufferSource();
          this.audioSource.buffer = audioBuffer;
          this.audioSource.connect(this.audioContext!.destination);

          this.audioSource.onended = () => {
            this.isPlaying = false;
            resolve();
          };

          this.audioSource.start(0);
          this.isPlaying = true;
        })
        .catch(error => {
          console.error('Failed to play audio:', error);
          reject(error);
        });
    });
  }

  /**
   * Stop playing audio
   */
  stopPlaying(): void {
    if (this.audioSource && this.isPlaying) {
      this.audioSource.stop();
      this.audioSource = null;
      this.isPlaying = false;
    }
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stopListening();
    this.stopPlaying();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  /**
   * Check if currently recording
   */
  get recording(): boolean {
    return this.isRecording;
  }

  /**
   * Check if currently playing
   */
  get playing(): boolean {
    return this.isPlaying;
  }
}
