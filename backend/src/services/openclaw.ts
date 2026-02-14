import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from '../utils/logger.js';
import { config } from '../utils/config.js';

const execAsync = promisify(exec);

export interface OpenClawMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface OpenClawResponse {
  content: string;
  model: string;
  provider: string;
}

/**
 * OpenClaw Service
 * Handles AI orchestration using OpenClaw CLI
 */
export class OpenClawService {
  private conversationHistory: Map<string, OpenClawMessage[]> = new Map();

  /**
   * Send a chat message using OpenClaw
   */
  async chat(
    message: string,
    conversationId?: string,
    model: 'gpt-4' | 'claude' = 'claude'
  ): Promise<OpenClawResponse> {
    try {
      // Get or create conversation history
      const history = conversationId
        ? this.conversationHistory.get(conversationId) || []
        : [];

      // Add user message to history
      history.push({ role: 'user', content: message });

      // Build OpenClaw command using agent with --local flag
      // Use session-id for conversation continuity
      const sessionId = conversationId || `mavin_${Date.now()}`;
      const escapedMessage = this.escapeShellArg(message);

      const command = `openclaw agent --local --json --session-id "${sessionId}" -m "${escapedMessage}" 2>/dev/null`;

      logger.info(`Executing OpenClaw: session=${sessionId}, message=${message.substring(0, 50)}...`);

      const { stdout, stderr } = await execAsync(command, {
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        timeout: 60000, // 60 second timeout
      });

      // Extract JSON from output (skip config warnings and other noise)
      const jsonMatch = stdout.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON response from OpenClaw');
      }

      // Parse JSON response
      let response: string;
      let actualModel = model;
      let actualProvider = model === 'gpt-4' ? 'openai' : 'anthropic';

      try {
        // Try to parse as JSON first
        const jsonResponse = JSON.parse(jsonMatch[0]);

        // Extract the actual text response from OpenClaw's payload structure
        if (jsonResponse.payloads && jsonResponse.payloads[0]?.text) {
          response = jsonResponse.payloads[0].text;
        } else {
          response = jsonResponse.content || jsonResponse.message || stdout.trim();
        }

        // Extract model info from meta if available
        if (jsonResponse.meta?.agentMeta) {
          actualProvider = jsonResponse.meta.agentMeta.provider || actualProvider;
          actualModel = jsonResponse.meta.agentMeta.model || model;
        }
      } catch {
        // If not JSON, use raw output
        response = stdout.trim();
      }

      // Add assistant response to history
      history.push({ role: 'assistant', content: response });

      // Store conversation history
      if (conversationId) {
        this.conversationHistory.set(conversationId, history);
      }

      return {
        content: response,
        model: actualModel,
        provider: actualProvider,
      };
    } catch (error) {
      logger.error('OpenClaw error:', error);
      throw new Error(`OpenClaw execution failed: ${error}`);
    }
  }

  /**
   * Test connection to OpenAI GPT-4
   */
  async testOpenAI(): Promise<boolean> {
    try {
      logger.info('Testing OpenAI connection...');
      const response = await this.chat('Say "OpenAI connected" if you can read this.', undefined, 'gpt-4');
      logger.info('OpenAI test response:', response.content.substring(0, 100));
      return true;
    } catch (error) {
      logger.error('OpenAI test failed:', error);
      return false;
    }
  }

  /**
   * Test connection to Anthropic Claude
   */
  async testClaude(): Promise<boolean> {
    try {
      logger.info('Testing Claude connection...');
      const response = await this.chat('Say "Claude connected" if you can read this.', undefined, 'claude');
      logger.info('Claude test response:', response.content.substring(0, 100));
      return true;
    } catch (error) {
      logger.error('Claude test failed:', error);
      return false;
    }
  }

  /**
   * Test connection to Kimi (via OpenClaw)
   */
  async testKimi(): Promise<boolean> {
    try {
      logger.info('Testing Kimi connection...');

      // OpenClaw will use the default model from config (kimi-coding/k2p5)
      const response = await this.chat('Say "Kimi connected" if you can read this.');

      logger.info('Kimi test response:', response.content.substring(0, 100));
      return response.provider === 'kimi-coding' || response.content.includes('Kimi');
    } catch (error) {
      logger.error('Kimi test failed:', error);
      return false;
    }
  }

  /**
   * Clear conversation history for a given conversation ID
   */
  clearConversation(conversationId: string): void {
    this.conversationHistory.delete(conversationId);
  }

  /**
   * Get conversation history
   */
  getConversationHistory(conversationId: string): OpenClawMessage[] {
    return this.conversationHistory.get(conversationId) || [];
  }

  /**
   * Escape shell argument to prevent injection
   */
  private escapeShellArg(arg: string): string {
    return arg.replace(/"/g, '\\"').replace(/\$/g, '\\$').replace(/`/g, '\\`');
  }
}

// Singleton instance
export const openClawService = new OpenClawService();
