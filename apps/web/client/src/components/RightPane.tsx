/**
 * Cyberpunk Lab - Right Pane (AI Copilot)
 *
 * Features: Chat interface, Voice mode, Thinking logs, Context awareness
 * Design: Purple accents for AI, scan line animation, glassmorphic
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Send,
  Sparkles,
  Loader2,
  Brain
} from "lucide-react";
import DigitalAvatar from "./DigitalAvatar";
import ServiceStatus from "./ServiceStatus";
import { useState, useEffect, useRef } from "react";
import { apiClient } from "@mavin/shared";
import { nanoid } from "nanoid";
import { VoiceConversation } from "@/services/voiceConversation";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

const mockMessages: Message[] = [
  {
    id: "1",
    role: "system",
    content: "I see you're looking at the Lecture 4 transcript. Want a summary?",
    timestamp: new Date(Date.now() - 3600000)
  },
  {
    id: "2",
    role: "user",
    content: "Yes, please summarize the key points",
    timestamp: new Date(Date.now() - 3500000)
  },
  {
    id: "3",
    role: "assistant",
    content: "Here are the key points from Lecture 4:\n\n1. Quantum mechanics fundamentals\n2. Wave-particle duality\n3. Heisenberg uncertainty principle\n\nThe professor emphasized that this will be on the test.",
    timestamp: new Date(Date.now() - 3400000)
  }
];

export default function RightPane() {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [inputValue, setInputValue] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [avatarState, setAvatarState] = useState<"idle" | "speaking" | "thinking" | "listening">("idle");
  const [conversationId] = useState(`conv_${nanoid()}`); // Single conversation ID for continuity
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const voiceConversationRef = useRef<VoiceConversation | null>(null);

  // Initialize voice conversation service
  useEffect(() => {
    voiceConversationRef.current = new VoiceConversation({
      conversationId: conversationId, // Maintain same conversation context
      onStateChange: (state) => {
        setAvatarState(state);
        if (state === 'thinking') {
          setIsThinking(true);
        } else if (state === 'idle') {
          setIsThinking(false);
          setIsVoiceMode(false);
        }
      },
      onTranscript: (text) => {
        // Add user's spoken message to chat
        const userMessage: Message = {
          id: nanoid(),
          role: "user",
          content: text,
          timestamp: new Date()
        };
        setMessages((prev) => [...prev, userMessage]);
      },
      onResponse: (text) => {
        // Add AI response to chat
        const aiMessage: Message = {
          id: nanoid(),
          role: "assistant",
          content: text,
          timestamp: new Date()
        };
        setMessages((prev) => [...prev, aiMessage]);
      },
      onError: (error) => {
        console.error('Voice conversation error:', error);
        const errorMessage: Message = {
          id: nanoid(),
          role: "system",
          content: `Voice error: ${error.message}`,
          timestamp: new Date()
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    });

    // Cleanup on unmount
    return () => {
      voiceConversationRef.current?.cleanup();
    };
  }, [conversationId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: nanoid(),
      role: "user",
      content: inputValue,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsThinking(true);
    setAvatarState("thinking");

    try {
      // Use OpenClaw via apiClient
      console.log('Calling chat API with:', {
        message: inputValue,
        conversationId: conversationId,
        model: 'claude'
      });

      const response = await apiClient.chat({
        message: inputValue,
        conversationId: conversationId, // Maintain conversation context
        model: "claude", // or "gpt-4"
        // persona: "leo", // Optional: uncomment to use a persona
      });

      console.log('Got response from API:', response);
      console.log('Response content:', response.response);

      const aiMessage: Message = {
        id: nanoid(),
        role: "assistant",
        content: response.response,
        timestamp: new Date(),
      };

      console.log('Created AI message:', aiMessage);

      setMessages((prev) => {
        console.log('Previous messages:', prev.length);
        const newMessages = [...prev, aiMessage];
        console.log('New messages:', newMessages.length);
        return newMessages;
      });
      setAvatarState("speaking");

      // Return to idle after speaking animation
      setTimeout(() => {
        setAvatarState("idle");
      }, 3000);
    } catch (error) {
      console.error("Chat failed:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        error: error
      });

      const errorMessage: Message = {
        id: nanoid(),
        role: "system",
        content: `Sorry, I encountered an error: ${error.message || 'Unknown error'}. Please check console.`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
      setAvatarState("idle");
    } finally {
      setIsThinking(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVoiceClick = async () => {
    if (!voiceConversationRef.current) return;

    if (avatarState === "listening") {
      // Stop listening and process the audio
      voiceConversationRef.current.stopListening();
      setIsVoiceMode(false);
    } else {
      // Start listening
      try {
        await voiceConversationRef.current.startListening();
        setIsVoiceMode(true);
      } catch (error) {
        console.error('Failed to start voice conversation:', error);
        const errorMessage: Message = {
          id: nanoid(),
          role: "system",
          content: `Failed to start microphone: ${error.message}. Please check permissions.`,
          timestamp: new Date()
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Digital Avatar - Smaller */}
      <div className="p-2 border-b border-border/50 flex-shrink-0">
        <div className="max-w-[200px] mx-auto">
          <DigitalAvatar state={avatarState} onVoiceClick={handleVoiceClick} />
        </div>
      </div>

      {/* Header - Compact */}
      <div className="px-4 py-2 border-b border-border/50 flex-shrink-0">
        <div className="flex items-center justify-between gap-3">
          {/* Thinking Indicator */}
          <div className="flex items-center gap-2 flex-1">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-neon-purple to-neon-cyan flex items-center justify-center">
              {isThinking ? (
                <Loader2 className="h-3 w-3 text-background animate-spin" />
              ) : (
                <Sparkles className="h-3 w-3 text-background" />
              )}
            </div>
            <div>
              <h2 className="font-semibold orbitron text-xs">MAVIN AI</h2>
              <p className="text-[10px] text-muted-foreground">
                {isThinking ? "Thinking..." : "Your Digital Companion"}
              </p>
            </div>
          </div>

          {/* Service Status - Compact */}
          <ServiceStatus compact={true} />
        </div>
      </div>

      {/* Messages - Scrollable area that takes remaining space */}
      <ScrollArea className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {console.log('Rendering messages:', messages.length, messages)}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex flex-col gap-1 ${
                message.role === "user" ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`max-w-[85%] rounded-lg p-3 ${
                  message.role === "user"
                    ? "bg-neon-purple/20 border border-neon-purple/30 text-foreground"
                    : message.role === "assistant"
                    ? "bg-neon-cyan/10 border border-neon-cyan/20 text-foreground"
                    : "bg-card/50 border border-border/50 text-muted-foreground"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="h-3 w-3 text-neon-cyan" />
                    <span className="text-xs text-neon-cyan font-semibold">AI Response</span>
                  </div>
                )}
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
              <span className="text-xs text-muted-foreground">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <Separator className="bg-border/50 flex-shrink-0" />

      {/* Input - Fixed at bottom - Compact */}
      <div className="p-3 flex-shrink-0">
        <div className="flex gap-2">
          <Input
            placeholder="Ask Mavin anything..."
            className="flex-1 bg-card/50 border-border/50 focus:border-neon-purple/50 focus:ring-neon-purple/20 text-sm"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isThinking}
          />
          <Button
            size="icon"
            className="bg-neon-purple hover:bg-neon-purple/80 text-background glow-purple h-9 w-9"
            onClick={handleSend}
            disabled={!inputValue.trim() || isThinking}
          >
            {isThinking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">
          Press Enter to send
        </p>
      </div>
    </div>
  );
}
