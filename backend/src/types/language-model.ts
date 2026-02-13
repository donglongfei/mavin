/**
 * Language Model Interface Types
 * Unified types for AI model interactions
 */

export type ModelProvider = 'openai' | 'anthropic';

export type ModelName =
  | 'gpt-4'
  | 'gpt-4-turbo'
  | 'gpt-3.5-turbo'
  | 'claude-3-5-sonnet-20241022'
  | 'claude-3-opus-20240229'
  | 'claude-3-sonnet-20240229';

export interface Message {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string;
  name?: string; // For function messages
  function_call?: FunctionCall;
}

export interface FunctionCall {
  name: string;
  arguments: string; // JSON string
}

export interface FunctionDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface ModelRequest {
  messages: Message[];
  model?: ModelName;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  functions?: FunctionDefinition[];
  function_call?: 'auto' | 'none' | { name: string };
}

export interface ModelResponse {
  content: string;
  model: string;
  provider: ModelProvider;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  cost: {
    prompt_cost: number;
    completion_cost: number;
    total_cost: number;
  };
  function_call?: FunctionCall;
  finish_reason: 'stop' | 'length' | 'function_call' | 'content_filter';
}

export interface StreamChunk {
  content: string;
  done: boolean;
  function_call?: Partial<FunctionCall>;
}

export interface ConversationContext {
  conversationId: string;
  messages: Message[];
  maxMessages: number;
  createdAt: Date;
  updatedAt: Date;
}
