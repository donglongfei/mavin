/**
 * Demo Page
 * 
 * Integrated demonstration of all Mavin components:
 * - Display modes (Focus/Companion/Ghost)
 * - Avatar with animations
 * - Voice input/output
 * - Text input
 * - Notifications
 */

import React, { useState } from 'react';
import { UniversalShell } from '../../../../../packages/display/UniversalShell';
import { ModeLayoutManager } from '../../../../../packages/display/ModeLayoutManager';
import { Avatar } from '../../../../../packages/avatar/Avatar';
import { AnimationController } from '../../../../../packages/avatar/AnimationController';
import { TextInputManager } from '../../../../../packages/input/TextInputManager';
import { useVoiceInput } from '../../../../../packages/input/VoiceInputManager';
import { useVoiceOutput } from '../../../../../packages/output/VoiceOutputManager';
import { NotificationManager, useNotification } from '../../../../../packages/output/NotificationManager';
import { useMavinStore, apiClient } from '../../../../../packages/shared';
import type { DisplayMode } from '../../../../../packages/shared';
import { Button } from '@/components/ui/button';

export default function Demo() {
  const displayMode = useMavinStore((state) => state.display.currentMode);
  const setDisplayMode = useMavinStore((state) => state.setDisplayMode);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Voice input
  const { isListening, transcript, toggleListening, VoiceInputManager: VoiceInput } = useVoiceInput();

  // Voice output
  const { speak, stop: stopSpeaking, isSpeaking, VoiceOutputManager: VoiceOutput } = useVoiceOutput();

  // Notifications
  const { notify } = useNotification();

  // Handle text message submission
  const handleSendMessage = async (text: string) => {
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setIsProcessing(true);

    try {
      // Call API
      const response = await apiClient.chat({
        userId: 'demo-user',
        message: text,
        context: {
          conversationId: 'demo-conv',
          displayMode,
          currentTask: 'chatting',
        },
      });

      // Add assistant response
      setMessages(prev => [...prev, { role: 'assistant', content: response.response }]);

      // Speak response (optional)
      // speak(response.response);

      // Show notification for mode suggestion
      if (response.suggestedMode) {
        notify(`Suggested mode: ${response.suggestedMode}`, {
          title: 'Mode Suggestion',
          priority: 'medium',
        });
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      notify('Failed to send message', {
        title: 'Error',
        priority: 'high',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle voice transcript
  React.useEffect(() => {
    if (transcript && !isListening) {
      handleSendMessage(transcript);
    }
  }, [transcript, isListening]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Background content */}
      <div className="container py-12">
        <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Mavin Complete Demo
        </h1>

        <div className="space-y-6">
          {/* Mode controls */}
          <div className="p-6 bg-slate-900 border border-purple-500/30 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-purple-300">Display Mode</h2>
            <div className="flex gap-4">
              <Button
                onClick={() => setDisplayMode('focus')}
                variant={displayMode === 'focus' ? 'default' : 'outline'}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Focus
              </Button>
              <Button
                onClick={() => setDisplayMode('companion')}
                variant={displayMode === 'companion' ? 'default' : 'outline'}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Companion
              </Button>
              <Button
                onClick={() => setDisplayMode('ghost')}
                variant={displayMode === 'ghost' ? 'default' : 'outline'}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Ghost
              </Button>
            </div>
          </div>

          {/* Test controls */}
          <div className="p-6 bg-slate-900 border border-purple-500/30 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-purple-300">Test Controls</h2>
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={() => notify('This is a test notification', { title: 'Test', priority: 'medium' })}
                variant="outline"
              >
                Test Notification
              </Button>
              <Button
                onClick={() => speak('Hello! I am Mavin, your AI companion.')}
                variant="outline"
                disabled={isSpeaking}
              >
                Test TTS
              </Button>
              <Button
                onClick={stopSpeaking}
                variant="outline"
                disabled={!isSpeaking}
              >
                Stop TTS
              </Button>
            </div>
          </div>

          {/* Features list */}
          <div className="p-6 bg-slate-900 border border-purple-500/30 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-purple-300">Implemented Features</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <h3 className="font-semibold text-purple-300 mb-2">Display System</h3>
                <ul className="space-y-1 text-slate-400">
                  <li>✅ Focus Mode</li>
                  <li>✅ Companion Mode</li>
                  <li>✅ Ghost Mode</li>
                  <li>✅ Smooth transitions</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-purple-300 mb-2">Avatar</h3>
                <ul className="space-y-1 text-slate-400">
                  <li>✅ State-based animations</li>
                  <li>✅ Idle/Listening/Thinking/Speaking</li>
                  <li>✅ Voice waveform</li>
                  <li>✅ Listening ripple</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-purple-300 mb-2">Input</h3>
                <ul className="space-y-1 text-slate-400">
                  <li>✅ Text input</li>
                  <li>✅ Voice input (Web Speech API)</li>
                  <li>✅ Auto-resize textarea</li>
                  <li>✅ Keyboard shortcuts</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-purple-300 mb-2">Output</h3>
                <ul className="space-y-1 text-slate-400">
                  <li>✅ Text-to-speech</li>
                  <li>✅ Notification system</li>
                  <li>✅ Priority levels</li>
                  <li>✅ Auto-dismiss</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mavin Interface */}
      <AnimationController>
        <VoiceInput />
        <VoiceOutput />
        <NotificationManager position="top-right" />

        <UniversalShell>
          <ModeLayoutManager>
            <MavinInterface
              displayMode={displayMode}
              messages={messages}
              onSendMessage={handleSendMessage}
              isProcessing={isProcessing}
              isListening={isListening}
              toggleListening={toggleListening}
            />
          </ModeLayoutManager>
        </UniversalShell>
      </AnimationController>
    </div>
  );
}

// ============================================================================
// Mavin Interface Component
// ============================================================================

interface MavinInterfaceProps {
  displayMode: DisplayMode;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  onSendMessage: (text: string) => void;
  isProcessing: boolean;
  isListening: boolean;
  toggleListening: () => void;
}

const MavinInterface: React.FC<MavinInterfaceProps> = ({
  displayMode,
  messages,
  onSendMessage,
  isProcessing,
  isListening,
  toggleListening,
}) => {
  if (displayMode === 'ghost') {
    return (
      <div className="flex items-center justify-center h-full">
        <Avatar size="small" />
      </div>
    );
  }

  if (displayMode === 'companion') {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 mb-3">
          <Avatar size="small" showStatus />
          <span className="text-sm font-semibold">Mavin</span>
        </div>
        <div className="flex-1 flex items-center justify-center text-xs text-center text-slate-400">
          {isListening ? 'Listening...' : 'Companion mode'}
        </div>
        <button
          onClick={toggleListening}
          className="w-full py-2 text-xs rounded bg-purple-600 hover:bg-purple-700 transition"
        >
          {isListening ? 'Stop' : 'Listen'}
        </button>
      </div>
    );
  }

  // Focus mode
  return (
    <div className="flex flex-col h-full">
      {/* Header with avatar */}
      <div className="flex items-center gap-3 mb-6">
        <Avatar size="medium" showStatus />
        <div>
          <h3 className="font-semibold text-lg">Mavin</h3>
          <p className="text-xs text-slate-400">Your AI Companion</p>
        </div>
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.length === 0 ? (
          <div className="text-center text-slate-400 text-sm py-8">
            Start a conversation...
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-purple-600/20 border border-purple-500/30 ml-4'
                  : 'bg-slate-800/50 border border-purple-500/20 mr-4'
              }`}
            >
              <div className="text-xs text-slate-400 mb-1">
                {msg.role === 'user' ? 'You' : 'Mavin'}
              </div>
              <div className="text-sm">{msg.content}</div>
            </div>
          ))
        )}
        {isProcessing && (
          <div className="p-3 rounded-lg bg-slate-800/50 border border-purple-500/20 mr-4">
            <div className="text-xs text-slate-400 mb-1">Mavin</div>
            <div className="text-sm text-slate-400">Thinking...</div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="space-y-2">
        <TextInputManager
          onSubmit={onSendMessage}
          disabled={isProcessing}
          placeholder="Type a message..."
        />
        <button
          onClick={toggleListening}
          className={`w-full py-2 text-sm rounded transition ${
            isListening
              ? 'bg-orange-600 hover:bg-orange-700'
              : 'bg-purple-600 hover:bg-purple-700'
          }`}
        >
          {isListening ? '🎤 Listening...' : '🎤 Voice Input'}
        </button>
      </div>
    </div>
  );
};
