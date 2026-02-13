import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import { calculateCost } from '../utils/pricing.js';
import type {
  Message,
  ModelRequest,
  ModelResponse,
  StreamChunk,
  ConversationContext,
  ModelProvider,
  ModelName,
} from '../types/language-model.js';

/**
 * Language Model Interface
 * Unified interface for OpenAI and Anthropic models
 */
export class LanguageModelInterface {
  private openai: OpenAI;
  private anthropic: Anthropic;
  private conversations: Map<string, ConversationContext> = new Map();
  private readonly MAX_CONTEXT_MESSAGES = 20;
  private readonly MAX_RETRIES = 3;

  constructor() {
    // Initialize OpenAI client
    if (config.openai.apiKey && config.openai.apiKey !== 'dummy-key-for-dev') {
      this.openai = new OpenAI({
        apiKey: config.openai.apiKey,
      });
      logger.info('OpenAI client initialized');
    } else {
      logger.warn('OpenAI API key not configured');
    }

    // Initialize Anthropic client
    if (config.anthropic.apiKey && config.anthropic.apiKey !== 'dummy-key-for-dev') {
      this.anthropic = new Anthropic({
        apiKey: config.anthropic.apiKey,
      });
      logger.info('Anthropic client initialized');
    } else {
      logger.warn('Anthropic API key not configured');
    }

    logger.info('LanguageModelInterface initialized');
  }

  /**
   * Send a chat completion request
   */
  async chat(request: ModelRequest, conversationId?: string): Promise<ModelResponse> {
    const model = request.model || 'claude-3-5-sonnet-20241022';
    const provider = this.getProvider(model);

    // Manage conversation context
    let messages = request.messages;
    if (conversationId) {
      messages = this.addToContext(conversationId, request.messages);
    }

    logger.info(`Chat request: model=${model}, provider=${provider}, messages=${messages.length}`);

    try {
      if (provider === 'openai') {
        return await this.chatOpenAI({ ...request, messages }, model);
      } else {
        return await this.chatAnthropic({ ...request, messages }, model);
      }
    } catch (error) {
      logger.error('Chat error:', error);
      throw error;
    }
  }

  /**
   * Stream chat completion
   */
  async *chatStream(
    request: ModelRequest,
    conversationId?: string
  ): AsyncGenerator<StreamChunk> {
    const model = request.model || 'claude-3-5-sonnet-20241022';
    const provider = this.getProvider(model);

    let messages = request.messages;
    if (conversationId) {
      messages = this.addToContext(conversationId, request.messages);
    }

    logger.info(`Stream request: model=${model}, provider=${provider}`);

    if (provider === 'openai') {
      yield* this.streamOpenAI({ ...request, messages }, model);
    } else {
      yield* this.streamAnthropic({ ...request, messages }, model);
    }
  }

  /**
   * OpenAI chat completion
   */
  private async chatOpenAI(request: ModelRequest, model: string): Promise<ModelResponse> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized. Please configure OPENAI_API_KEY.');
    }

    const startTime = Date.now();

    const response = await this.openai.chat.completions.create({
      model: model,
      messages: request.messages as any,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.max_tokens ?? 2000,
      functions: request.functions as any,
      function_call: request.function_call as any,
    });

    const choice = response.choices[0];
    const usage = response.usage!;

    const cost = calculateCost(model, usage.prompt_tokens, usage.completion_tokens);

    logger.info(
      `OpenAI response: ${Date.now() - startTime}ms, tokens=${usage.total_tokens}, cost=$${cost.total_cost}`
    );

    return {
      content: choice.message.content || '',
      model: response.model,
      provider: 'openai',
      usage: {
        prompt_tokens: usage.prompt_tokens,
        completion_tokens: usage.completion_tokens,
        total_tokens: usage.total_tokens,
      },
      cost: {
        prompt_cost: cost.prompt_cost,
        completion_cost: cost.completion_cost,
        total_cost: cost.total_cost,
      },
      function_call: choice.message.function_call
        ? {
            name: choice.message.function_call.name,
            arguments: choice.message.function_call.arguments,
          }
        : undefined,
      finish_reason: choice.finish_reason as any,
    };
  }

  /**
   * Anthropic chat completion
   */
  private async chatAnthropic(request: ModelRequest, model: string): Promise<ModelResponse> {
    if (!this.anthropic) {
      throw new Error('Anthropic client not initialized. Please configure ANTHROPIC_API_KEY.');
    }

    const startTime = Date.now();

    // Convert messages format for Anthropic
    const systemMessage = request.messages.find((m) => m.role === 'system');
    const conversationMessages = request.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    const response = await this.anthropic.messages.create({
      model: model,
      system: systemMessage?.content,
      messages: conversationMessages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.max_tokens ?? 2000,
    });

    const content = response.content[0];
    const textContent = content.type === 'text' ? content.text : '';

    const cost = calculateCost(
      model,
      response.usage.input_tokens,
      response.usage.output_tokens
    );

    logger.info(
      `Anthropic response: ${Date.now() - startTime}ms, tokens=${response.usage.input_tokens + response.usage.output_tokens}, cost=$${cost.total_cost}`
    );

    return {
      content: textContent,
      model: response.model,
      provider: 'anthropic',
      usage: {
        prompt_tokens: response.usage.input_tokens,
        completion_tokens: response.usage.output_tokens,
        total_tokens: response.usage.input_tokens + response.usage.output_tokens,
      },
      cost: {
        prompt_cost: cost.prompt_cost,
        completion_cost: cost.completion_cost,
        total_cost: cost.total_cost,
      },
      finish_reason: response.stop_reason as any,
    };
  }

  /**
   * OpenAI streaming
   */
  private async *streamOpenAI(
    request: ModelRequest,
    model: string
  ): AsyncGenerator<StreamChunk> {
    const stream = await this.openai.chat.completions.create({
      model: model,
      messages: request.messages as any,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.max_tokens ?? 2000,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (delta?.content) {
        yield {
          content: delta.content,
          done: false,
        };
      }
    }

    yield { content: '', done: true };
  }

  /**
   * Anthropic streaming
   */
  private async *streamAnthropic(
    request: ModelRequest,
    model: string
  ): AsyncGenerator<StreamChunk> {
    const systemMessage = request.messages.find((m) => m.role === 'system');
    const conversationMessages = request.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    const stream = await this.anthropic.messages.create({
      model: model,
      system: systemMessage?.content,
      messages: conversationMessages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.max_tokens ?? 2000,
      stream: true,
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield {
          content: event.delta.text,
          done: false,
        };
      }
    }

    yield { content: '', done: true };
  }

  /**
   * Get provider from model name
   */
  private getProvider(model: string): ModelProvider {
    if (model.startsWith('gpt-')) {
      return 'openai';
    } else if (model.startsWith('claude-')) {
      return 'anthropic';
    }
    return 'anthropic'; // default
  }

  /**
   * Add messages to conversation context
   */
  private addToContext(conversationId: string, newMessages: Message[]): Message[] {
    let context = this.conversations.get(conversationId);

    if (!context) {
      context = {
        conversationId,
        messages: [],
        maxMessages: this.MAX_CONTEXT_MESSAGES,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.conversations.set(conversationId, context);
    }

    // Add new messages
    context.messages.push(...newMessages);

    // Keep only last N messages (preserve system message)
    const systemMessages = context.messages.filter((m) => m.role === 'system');
    const otherMessages = context.messages.filter((m) => m.role !== 'system');

    if (otherMessages.length > this.MAX_CONTEXT_MESSAGES) {
      const keep = otherMessages.slice(-this.MAX_CONTEXT_MESSAGES);
      context.messages = [...systemMessages, ...keep];
    }

    context.updatedAt = new Date();

    return context.messages;
  }

  /**
   * Get conversation context
   */
  getContext(conversationId: string): ConversationContext | undefined {
    return this.conversations.get(conversationId);
  }

  /**
   * Clear conversation context
   */
  clearContext(conversationId: string): void {
    this.conversations.delete(conversationId);
    logger.info(`Cleared context for conversation: ${conversationId}`);
  }

  /**
   * Get all conversation IDs
   */
  getConversationIds(): string[] {
    return Array.from(this.conversations.keys());
  }
}

// Singleton instance
export const languageModel = new LanguageModelInterface();
