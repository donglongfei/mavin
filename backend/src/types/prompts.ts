/**
 * System Prompt Templates
 * Persona-based prompts for different user types
 */

export interface PromptContext {
  userName?: string;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  userActivity?: string;
  location?: string;
  mood?: string;
  recentTopics?: string[];
  conversationLength?: number;
}

export interface SystemPrompt {
  id: string;
  name: string;
  version: string;
  persona: string;
  basePrompt: string;
  contextualPrompt: (context: PromptContext) => string;
  traits: string[];
  toneGuidelines: string[];
}

export type PersonaType = 'leo' | 'sarah' | 'timmy' | 'default';
