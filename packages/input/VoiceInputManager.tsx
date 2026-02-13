/**
 * VoiceInputManager
 * 
 * Manages voice input using Web Speech API.
 * Provides start/stop controls and transcription callbacks.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useMavinStore } from '@mavin/shared';
import { apiClient } from '@mavin/shared';
import type { VoiceInputConfig } from '@mavin/shared';

interface VoiceInputManagerProps {
  config?: Partial<VoiceInputConfig>;
  onTranscript?: (text: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

export const VoiceInputManager: React.FC<VoiceInputManagerProps> = ({
  config = {},
  onTranscript,
  onError,
}) => {
  const setListening = useMavinStore((state) => state.setListening);
  const isListening = useMavinStore((state) => state.input.isListening);
  
  const recognitionRef = useRef<any>(null);
  const [isSupported, setIsSupported] = useState(false);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();
      
      // Configure recognition
      recognition.continuous = config.continuous ?? true;
      recognition.interimResults = config.interimResults ?? true;
      recognition.lang = config.language || 'en-US';
      recognition.maxAlternatives = 1;

      // Event handlers
      recognition.onresult = (event: any) => {
        const results = event.results;
        const lastResult = results[results.length - 1];
        const transcript = lastResult[0].transcript;
        const isFinal = lastResult.isFinal;

        if (onTranscript) {
          onTranscript(transcript, isFinal);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setListening(false);
        if (onError) {
          onError(event.error);
        }
      };

      recognition.onend = () => {
        setListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setIsSupported(false);
      console.warn('Speech Recognition API not supported');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [config, onTranscript, onError, setListening]);

  // Start/stop recognition based on isListening state
  useEffect(() => {
    if (!recognitionRef.current) return;

    if (isListening) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Failed to start recognition:', error);
        setListening(false);
      }
    } else {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        // Ignore errors when stopping
      }
    }
  }, [isListening, setListening]);

  // This component doesn't render anything
  return null;
};

// ============================================================================
// Voice Input Hook
// ============================================================================

export function useVoiceInput(config?: Partial<VoiceInputConfig>) {
  const setListening = useMavinStore((state) => state.setListening);
  const isListening = useMavinStore((state) => state.input.isListening);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const startListening = useCallback(() => {
    setListening(true);
    setError(null);
  }, [setListening]);

  const stopListening = useCallback(() => {
    setListening(false);
  }, [setListening]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const handleTranscript = useCallback((text: string, isFinal: boolean) => {
    setTranscript(text);
    if (isFinal) {
      // Send to backend for processing
      // This will be handled by the parent component
    }
  }, []);

  const handleError = useCallback((err: string) => {
    setError(err);
  }, []);

  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    toggleListening,
    VoiceInputManager: () => (
      <VoiceInputManager
        config={config}
        onTranscript={handleTranscript}
        onError={handleError}
      />
    ),
  };
}
