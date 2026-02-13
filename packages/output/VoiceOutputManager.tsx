/**
 * VoiceOutputManager
 * 
 * Manages text-to-speech output using Web Speech API.
 * Automatically updates speaking state in the store.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useMavinStore } from '@mavin/shared';
import type { VoiceOutputConfig } from '@mavin/shared';

interface VoiceOutputManagerProps {
  config?: Partial<VoiceOutputConfig>;
}

export const VoiceOutputManager: React.FC<VoiceOutputManagerProps> = ({ config = {} }) => {
  const setSpeaking = useMavinStore((state) => state.setSpeaking);
  const currentMessage = useMavinStore((state) => state.output.currentMessage);
  
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    } else {
      console.warn('Speech Synthesis API not supported');
    }

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // Speak when currentMessage changes
  useEffect(() => {
    if (!synthRef.current || !currentMessage) return;

    // Cancel any ongoing speech
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(currentMessage);
    
    // Configure voice
    utterance.rate = config.rate || 1.0;
    utterance.pitch = config.pitch || 1.0;
    utterance.volume = config.volume || 1.0;
    utterance.lang = config.language || 'en-US';

    // Set voice if specified
    if (config.voice) {
      const voices = synthRef.current.getVoices();
      const selectedVoice = voices.find(v => v.name === config.voice);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    }

    // Event handlers
    utterance.onstart = () => {
      setSpeaking(true);
    };

    utterance.onend = () => {
      setSpeaking(false);
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setSpeaking(false);
    };

    utteranceRef.current = utterance;
    synthRef.current.speak(utterance);

  }, [currentMessage, config, setSpeaking]);

  return null;
};

// ============================================================================
// Voice Output Hook
// ============================================================================

export function useVoiceOutput(config?: Partial<VoiceOutputConfig>) {
  const setSpeaking = useMavinStore((state) => state.setSpeaking);
  const setCurrentMessage = useMavinStore((state) => state.setCurrentMessage);
  const isSpeaking = useMavinStore((state) => state.output.isSpeaking);

  const speak = useCallback((text: string) => {
    setCurrentMessage(text);
  }, [setCurrentMessage]);

  const stop = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
    setCurrentMessage(null);
  }, [setSpeaking, setCurrentMessage]);

  const pause = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.pause();
    }
  }, []);

  const resume = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.resume();
    }
  }, []);

  return {
    speak,
    stop,
    pause,
    resume,
    isSpeaking,
    VoiceOutputManager: () => <VoiceOutputManager config={config} />,
  };
}
