import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';

export interface KimiMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface KimiResponse {
  content: string;
  model: string;
  provider: string;
}

/**
 * Kimi (Moonshot AI) Service
 * Direct API integration with Moonshot AI (Kimi)
 * API is OpenAI-compatible
 */
export class KimiService {
  private conversationHistory: Map<string, KimiMessage[]> = new Map();
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor() {
    this.apiKey = config.kimi.apiKey;
    this.baseUrl = config.kimi.baseUrl;
    this.model = config.kimi.model;
  }

  /**
   * Send a chat message using Kimi API
   */
  async chat(
    message: string,
    conversationId?: string
  ): Promise<KimiResponse> {
    if (!this.apiKey || this.apiKey === '') {
      throw new Error('Kimi API key not configured. Please set KIMI_API_KEY in .env.local');
    }

    try {
      // Get or create conversation history
      const history = conversationId
        ? this.conversationHistory.get(conversationId) || []
        : [];

      // Add user message to history
      history.push({ role: 'user', content: message });

      logger.info(`Calling Kimi API: message=${message.substring(0, 50)}...`);

      // Call Kimi API (OpenAI-compatible)
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: history,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Kimi API error: ${response.status} ${errorText}`);
      }

      const data = await response.json();

      // Extract response content
      const assistantMessage = data.choices?.[0]?.message?.content;
      if (!assistantMessage) {
        throw new Error('No response from Kimi API');
      }

      // Add assistant response to history
      history.push({ role: 'assistant', content: assistantMessage });

      // Store conversation history
      if (conversationId) {
        this.conversationHistory.set(conversationId, history);
      }

      logger.info('Kimi API response received');

      return {
        content: assistantMessage,
        model: data.model || this.model,
        provider: 'moonshot',
      };
    } catch (error: any) {
      logger.error('Kimi API error:', error);
      throw error;
    }
  }

  /**
   * Test if Kimi API is configured and working
   */
  async test(): Promise<boolean> {
    try {
      if (!this.apiKey || this.apiKey === '') {
        logger.warn('Kimi API key not configured');
        return false;
      }

      const response = await this.chat('Say "Kimi connected" if you can read this.');
      logger.info(`Kimi test response: ${response.content}`);
      return true;
    } catch (error: any) {
      logger.error('Kimi test failed:', error.message);
      return false;
    }
  }

  /**
   * Clear conversation history
   */
  clearConversation(conversationId: string): void {
    this.conversationHistory.delete(conversationId);
  }

  /**
   * Get conversation history
   */
  getConversationHistory(conversationId: string): KimiMessage[] {
    return this.conversationHistory.get(conversationId) || [];
  }

  /**
   * Check if service is configured
   */
  isConfigured(): boolean {
    return !!(this.apiKey && this.apiKey !== '');
  }
}

// Singleton instance
export const kimiService = new KimiService();
