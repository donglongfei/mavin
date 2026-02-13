export interface ChatRequest {
  message: string;
  conversationId?: string;
  model?: 'gpt-4' | 'claude';
}

export interface ChatResponse {
  response: string;
  conversationId: string;
  model: string;
}

export interface TranscribeRequest {
  audio: string; // base64 encoded audio
  language?: string;
}

export interface TranscribeResponse {
  text: string;
  language: string;
  confidence: number;
}

export interface ImageGenerateRequest {
  prompt: string;
  size?: '1024x1024' | '1792x1024' | '1024x1792';
  quality?: 'standard' | 'hd';
}

export interface ImageGenerateResponse {
  imageUrl: string;
  revisedPrompt?: string;
}

export interface VisionAnalyzeRequest {
  image: string; // base64 encoded image or URL
  prompt?: string;
}

export interface VisionAnalyzeResponse {
  description: string;
  objects: string[];
  text?: string;
}

export interface ContextResponse {
  mode: 'focus' | 'companion' | 'ghost';
  userActivity: string;
  timeOfDay: string;
  location?: string;
  calendar?: {
    nextEvent?: string;
    timeUntilNext?: number;
  };
}
