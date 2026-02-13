import { languageModel } from './LanguageModelInterface.js';
import { promptManager } from './PromptManager.js';
import { speechRecognition } from './SpeechRecognitionService.js';
import { imageGeneration } from './ImageGenerationService.js';
import { visionService } from './VisionService.js';
import { logger } from '../utils/logger.js';
import type { Message } from '../types/language-model.js';

/**
 * AI Service Coordinator
 * Orchestrates multiple AI services for complex workflows
 */
export class AIServiceCoordinator {
  private workflows: Map<string, WorkflowState> = new Map();
  private readonly WORKFLOW_TTL = 3600000; // 1 hour

  constructor() {
    logger.info('AIServiceCoordinator initialized');
  }

  /**
   * Process multi-modal request (text, image, audio)
   */
  async processMultiModal(request: MultiModalRequest): Promise<MultiModalResponse> {
    const startTime = Date.now();
    let totalCost = 0;
    const results: any = {};

    try {
      // Process audio if present
      if (request.audio) {
        logger.info('Processing audio input');
        const transcription = await speechRecognition.transcribe(request.audio, {
          language: request.audioLanguage,
        });
        results.transcription = transcription.text;
        totalCost += transcription.cost;

        // Use transcription as text input if no text provided
        if (!request.text) {
          request.text = transcription.text;
        }
      }

      // Process image if present
      if (request.image) {
        logger.info('Processing image input');
        const analysis = await visionService.analyze(request.image, {
          analysisType: request.imageAnalysisType || 'general',
          prompt: request.imagePrompt,
          detail: request.imageDetail,
        });
        results.imageAnalysis = {
          description: analysis.description,
          objects: analysis.objects,
          text: analysis.text,
        };
        totalCost += analysis.cost;

        // Add image context to conversation
        if (request.text) {
          request.text = `[Image context: ${analysis.description}]\n\n${request.text}`;
        }
      }

      // Process text with language model
      if (request.text) {
        logger.info('Processing text input');

        // Get appropriate prompt based on persona
        let systemPrompt: string | undefined;
        if (request.persona) {
          const prompt = promptManager.getPrompt(request.persona);
          if (prompt) {
            const context = promptManager.generateContext({
              timeOfDay: new Date().getHours() < 12 ? 'morning' : 'afternoon',
              userMood: request.userMood,
              recentTopics: request.recentTopics || [],
            });
            systemPrompt = prompt.contextualPrompt(context);
          }
        }

        // Build messages
        const messages: Message[] = [];
        if (systemPrompt) {
          messages.push({ role: 'system', content: systemPrompt });
        }
        messages.push({ role: 'user', content: request.text });

        // Get response
        const response = await languageModel.chat(
          {
            messages,
            model: request.model || 'gpt-4-turbo',
            temperature: request.temperature,
            maxTokens: request.maxTokens,
          },
          request.conversationId
        );

        results.response = response.content;
        results.model = response.model;
        totalCost += response.cost;
      }

      const processingTime = Date.now() - startTime;

      return {
        ...results,
        processingTime,
        totalCost,
        success: true,
      };
    } catch (error: any) {
      logger.error('Multi-modal processing error:', error);
      throw new Error(`Multi-modal processing failed: ${error.message}`);
    }
  }

  /**
   * Chat with context from image
   */
  async chatWithImage(
    image: Buffer | string,
    message: string,
    options: ChatWithImageOptions = {}
  ): Promise<ChatWithImageResponse> {
    const startTime = Date.now();

    try {
      // Analyze image
      logger.info('Analyzing image for chat context');
      const analysis = await visionService.analyze(image, {
        analysisType: 'description',
        detail: options.imageDetail || 'auto',
      });

      // Build context-aware message
      const contextMessage = `[Image context: ${analysis.description}]\n\nUser question: ${message}`;

      // Get chat response
      const response = await languageModel.chat(
        {
          messages: [{ role: 'user', content: contextMessage }],
          model: options.model || 'gpt-4-turbo',
          temperature: options.temperature,
        },
        options.conversationId
      );

      return {
        response: response.content,
        imageDescription: analysis.description || '',
        model: response.model,
        processingTime: Date.now() - startTime,
        cost: analysis.cost + response.cost,
      };
    } catch (error: any) {
      logger.error('Chat with image error:', error);
      throw new Error(`Chat with image failed: ${error.message}`);
    }
  }

  /**
   * Generate image from conversation
   */
  async generateFromConversation(
    conversationId: string,
    additionalPrompt?: string
  ): Promise<GenerateFromConversationResponse> {
    const startTime = Date.now();

    try {
      // Get conversation context
      const context = languageModel.getConversationContext(conversationId);
      if (!context || context.messages.length === 0) {
        throw new Error('No conversation context found');
      }

      // Extract key themes from conversation
      const conversationSummary = context.messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => m.content)
        .join(' ')
        .substring(0, 500);

      // Build image prompt
      let imagePrompt = `Based on this conversation: ${conversationSummary}`;
      if (additionalPrompt) {
        imagePrompt += `\n\nSpecific request: ${additionalPrompt}`;
      }

      // Generate image with enhancement
      logger.info('Generating image from conversation context');
      const result = await imageGeneration.generateEnhanced(imagePrompt, {
        size: '1024x1024',
        quality: 'standard',
        saveLocally: true,
      });

      return {
        imageUrl: result.imageUrl,
        originalPrompt: imagePrompt,
        enhancedPrompt: result.enhancedPrompt || '',
        revisedPrompt: result.revisedPrompt,
        processingTime: Date.now() - startTime,
        cost: result.cost,
      };
    } catch (error: any) {
      logger.error('Generate from conversation error:', error);
      throw new Error(`Generate from conversation failed: ${error.message}`);
    }
  }

  /**
   * Voice to image workflow
   */
  async voiceToImage(
    audio: Buffer | string,
    options: VoiceToImageOptions = {}
  ): Promise<VoiceToImageResponse> {
    const startTime = Date.now();
    let totalCost = 0;

    try {
      // Transcribe audio
      logger.info('Transcribing audio for image generation');
      const transcription = await speechRecognition.transcribe(audio, {
        language: options.language,
      });
      totalCost += transcription.cost;

      // Generate image from transcription
      logger.info(`Generating image from: "${transcription.text}"`);
      const result = await imageGeneration.generateEnhanced(transcription.text, {
        size: options.size || '1024x1024',
        quality: options.quality || 'standard',
        style: options.style,
        saveLocally: true,
      });
      totalCost += result.cost;

      return {
        transcription: transcription.text,
        imageUrl: result.imageUrl,
        enhancedPrompt: result.enhancedPrompt || '',
        revisedPrompt: result.revisedPrompt,
        processingTime: Date.now() - startTime,
        cost: totalCost,
      };
    } catch (error: any) {
      logger.error('Voice to image error:', error);
      throw new Error(`Voice to image failed: ${error.message}`);
    }
  }

  /**
   * Image to image workflow (analyze + regenerate)
   */
  async imageToImage(
    sourceImage: Buffer | string,
    instruction: string,
    options: ImageToImageOptions = {}
  ): Promise<ImageToImageResponse> {
    const startTime = Date.now();
    let totalCost = 0;

    try {
      // Analyze source image
      logger.info('Analyzing source image');
      const analysis = await visionService.analyze(sourceImage, {
        analysisType: 'description',
        detail: 'high',
      });
      totalCost += analysis.cost;

      // Build new prompt based on analysis and instruction
      const newPrompt = `${analysis.description}\n\nModification: ${instruction}`;

      // Generate new image
      logger.info('Generating modified image');
      const result = await imageGeneration.generateEnhanced(newPrompt, {
        size: options.size || '1024x1024',
        quality: options.quality || 'standard',
        style: options.style,
        saveLocally: true,
      });
      totalCost += result.cost;

      return {
        sourceDescription: analysis.description || '',
        newImageUrl: result.imageUrl,
        enhancedPrompt: result.enhancedPrompt || '',
        revisedPrompt: result.revisedPrompt,
        processingTime: Date.now() - startTime,
        cost: totalCost,
      };
    } catch (error: any) {
      logger.error('Image to image error:', error);
      throw new Error(`Image to image failed: ${error.message}`);
    }
  }

  /**
   * Create a workflow session
   */
  createWorkflow(workflowId: string, type: WorkflowType): void {
    this.workflows.set(workflowId, {
      id: workflowId,
      type,
      steps: [],
      context: {},
      createdAt: Date.now(),
      totalCost: 0,
    });
    logger.info(`Created workflow: ${workflowId} (${type})`);
  }

  /**
   * Add step to workflow
   */
  addWorkflowStep(workflowId: string, step: WorkflowStep): void {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    workflow.steps.push(step);
    workflow.totalCost += step.cost || 0;
    workflow.context = { ...workflow.context, ...step.context };

    logger.info(`Added step to workflow ${workflowId}: ${step.service}`);
  }

  /**
   * Get workflow state
   */
  getWorkflow(workflowId: string): WorkflowState | null {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return null;

    // Check if expired
    if (Date.now() - workflow.createdAt > this.WORKFLOW_TTL) {
      this.workflows.delete(workflowId);
      return null;
    }

    return workflow;
  }

  /**
   * Complete workflow
   */
  completeWorkflow(workflowId: string): WorkflowSummary {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const summary: WorkflowSummary = {
      workflowId,
      type: workflow.type,
      totalSteps: workflow.steps.length,
      totalCost: workflow.totalCost,
      duration: Date.now() - workflow.createdAt,
      services: [...new Set(workflow.steps.map((s) => s.service))],
    };

    this.workflows.delete(workflowId);
    logger.info(`Completed workflow: ${workflowId}`);

    return summary;
  }

  /**
   * Get service status
   */
  getServiceStatus(): ServiceStatus {
    return {
      languageModel: {
        available: true,
        models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo', 'claude-3-5-sonnet-20241022'],
      },
      promptManager: {
        available: true,
        personas: ['leo', 'sarah', 'timmy'],
      },
      speechRecognition: {
        available: true,
        formats: speechRecognition.getSupportedFormats(),
        maxFileSize: speechRecognition.getMaxFileSize(),
      },
      imageGeneration: {
        available: true,
        ...imageGeneration.getSupportedOptions(),
      },
      vision: {
        available: true,
        formats: visionService.getSupportedFormats(),
        maxImageSize: visionService.getMaxImageSize(),
      },
      activeWorkflows: this.workflows.size,
    };
  }

  /**
   * Get coordinator stats
   */
  getStats(): CoordinatorStats {
    let totalCost = 0;
    let totalSteps = 0;

    for (const workflow of this.workflows.values()) {
      totalCost += workflow.totalCost;
      totalSteps += workflow.steps.length;
    }

    return {
      activeWorkflows: this.workflows.size,
      totalCost,
      totalSteps,
      workflowTTL: this.WORKFLOW_TTL,
    };
  }

  /**
   * Clear expired workflows
   */
  clearExpiredWorkflows(): number {
    const now = Date.now();
    let cleared = 0;

    for (const [id, workflow] of this.workflows.entries()) {
      if (now - workflow.createdAt > this.WORKFLOW_TTL) {
        this.workflows.delete(id);
        cleared++;
      }
    }

    if (cleared > 0) {
      logger.info(`Cleared ${cleared} expired workflows`);
    }

    return cleared;
  }
}

// Types
export interface MultiModalRequest {
  text?: string;
  audio?: Buffer | string;
  image?: Buffer | string;
  audioLanguage?: string;
  imageAnalysisType?: 'general' | 'description' | 'objects' | 'ocr' | 'faces' | 'scene';
  imagePrompt?: string;
  imageDetail?: 'low' | 'high' | 'auto';
  persona?: string;
  userMood?: string;
  recentTopics?: string[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  conversationId?: string;
}

export interface MultiModalResponse {
  transcription?: string;
  imageAnalysis?: {
    description?: string;
    objects?: string[];
    text?: string;
  };
  response?: string;
  model?: string;
  processingTime: number;
  totalCost: number;
  success: boolean;
}

export interface ChatWithImageOptions {
  imageDetail?: 'low' | 'high' | 'auto';
  model?: string;
  temperature?: number;
  conversationId?: string;
}

export interface ChatWithImageResponse {
  response: string;
  imageDescription: string;
  model: string;
  processingTime: number;
  cost: number;
}

export interface GenerateFromConversationResponse {
  imageUrl: string;
  originalPrompt: string;
  enhancedPrompt: string;
  revisedPrompt: string;
  processingTime: number;
  cost: number;
}

export interface VoiceToImageOptions {
  language?: string;
  size?: '1024x1024' | '1792x1024' | '1024x1792';
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural';
}

export interface VoiceToImageResponse {
  transcription: string;
  imageUrl: string;
  enhancedPrompt: string;
  revisedPrompt: string;
  processingTime: number;
  cost: number;
}

export interface ImageToImageOptions {
  size?: '1024x1024' | '1792x1024' | '1024x1792';
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural';
}

export interface ImageToImageResponse {
  sourceDescription: string;
  newImageUrl: string;
  enhancedPrompt: string;
  revisedPrompt: string;
  processingTime: number;
  cost: number;
}

export type WorkflowType =
  | 'multi-modal'
  | 'chat-with-image'
  | 'voice-to-image'
  | 'image-to-image'
  | 'conversation-to-image'
  | 'custom';

export interface WorkflowState {
  id: string;
  type: WorkflowType;
  steps: WorkflowStep[];
  context: Record<string, any>;
  createdAt: number;
  totalCost: number;
}

export interface WorkflowStep {
  service: 'language-model' | 'speech' | 'image-gen' | 'vision' | 'prompts';
  action: string;
  input: any;
  output: any;
  cost?: number;
  processingTime?: number;
  context?: Record<string, any>;
}

export interface WorkflowSummary {
  workflowId: string;
  type: WorkflowType;
  totalSteps: number;
  totalCost: number;
  duration: number;
  services: string[];
}

export interface ServiceStatus {
  languageModel: {
    available: boolean;
    models: string[];
  };
  promptManager: {
    available: boolean;
    personas: string[];
  };
  speechRecognition: {
    available: boolean;
    formats: string[];
    maxFileSize: number;
  };
  imageGeneration: {
    available: boolean;
    sizes: string[];
    qualities: string[];
    styles: string[];
    models: string[];
  };
  vision: {
    available: boolean;
    formats: string[];
    maxImageSize: number;
  };
  activeWorkflows: number;
}

export interface CoordinatorStats {
  activeWorkflows: number;
  totalCost: number;
  totalSteps: number;
  workflowTTL: number;
}

// Singleton instance
export const aiCoordinator = new AIServiceCoordinator();
