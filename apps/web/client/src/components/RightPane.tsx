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
import { useState } from "react";
import { mavinAPI } from "@/lib/mavin-api";
import { nanoid } from "nanoid";

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
      // Real API call to backend
      const response = await mavinAPI.executeAgent(inputValue, {
        messages: messages.slice(-5), // Last 5 messages for context
      });

      const aiMessage: Message = {
        id: nanoid(),
        role: "assistant",
        content: response.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      setAvatarState("speaking");

      // Return to idle after speaking animation
      setTimeout(() => {
        setAvatarState("idle");
      }, 3000);
    } catch (error) {
      console.error("Agent execution failed:", error);

      const errorMessage: Message = {
        id: nanoid(),
        role: "system",
        content: "Sorry, I encountered an error. Please try again.",
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

  const handleVoiceClick = () => {
    if (avatarState === "listening") {
      setAvatarState("idle");
      setIsVoiceMode(false);
    } else {
      setAvatarState("listening");
      setIsVoiceMode(true);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Digital Avatar */}
      <div className="p-4 border-b border-border/50">
        <DigitalAvatar state={avatarState} onVoiceClick={handleVoiceClick} />
      </div>

      {/* Header */}
      <div className="px-4 py-3 border-b border-border/50">
        {/* Thinking Indicator */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-purple to-neon-cyan flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-background" />
          </div>
          <div>
            <h2 className="font-semibold orbitron text-sm">MAVIN AI</h2>
            <p className="text-xs text-muted-foreground">Your Digital Companion</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
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
        </div>
      </ScrollArea>

      <Separator className="bg-border/50" />

      {/* Input */}
      <div className="p-4">
        <div className="flex gap-2">
          <Input
            placeholder="Ask Mavin anything..."
            className="flex-1 bg-card/50 border-border/50 focus:border-neon-purple/50 focus:ring-neon-purple/20"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <Button
            size="icon"
            className="bg-neon-purple hover:bg-neon-purple/80 text-background glow-purple"
            onClick={handleSend}
            disabled={!inputValue.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
