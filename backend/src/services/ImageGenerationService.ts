import OpenAI from 'openai';
import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import { languageModel } from './LanguageModelInterface.js';
import fs from 'fs';
import path from 'path';
import https from 'https';

/**
 * Image Generation Service
 * Handles image generation using OpenAI DALL-E 3
 */
export class ImageGenerationService {
  private openai: OpenAI;
  private readonly STORAGE_DIR = path.join(process.cwd(), 'storage', 'images');
  private readonly SUPPORTED_SIZES = ['1024x1024', '1792x1024', '1024x1792'] as const;
  private readonly SUPPORTED_QUALITY = ['standard', 'hd'] as const;
  private readonly SUPPORTED_STYLES = ['vivid', 'natural'] as const;

  constructor() {
    if (config.openai.apiKey && config.openai.apiKey !== 'dummy-key-for-dev') {
      this.openai = new OpenAI({
        apiKey: config.openai.apiKey,
      });
      logger.info('ImageGenerationService initialized');
    } else {
      logger.warn('OpenAI API key not configured for image generation');
    }

    // Ensure storage directory exists
    this.ensureStorageDir();
  }

  /**
   * Generate image from text prompt
   */
  async generate(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized. Please configure OPENAI_API_KEY.');
    }

    const startTime = Date.now();

    try {
      // Enhance prompt if requested
      let finalPrompt = options.prompt;
      if (options.enhancePrompt) {
        finalPrompt = await this.enhancePrompt(options.prompt);
        logger.info(`Enhanced prompt: ${finalPrompt.substring(0, 100)}...`);
      }

      // Validate options
      this.validateOptions(options);

      // Generate image
      const response = await this.openai.images.generate({
        model: options.model || 'dall-e-3',
        prompt: finalPrompt,
        n: 1, // DALL-E 3 only supports n=1
        size: options.size || '1024x1024',
        quality: options.quality || 'standard',
        style: options.style || 'vivid',
        response_format: 'url',
      });

      const processingTime = Date.now() - startTime;
      const imageData = response.data[0];

      // Download and store image if requested
      let localPath: string | undefined;
      if (options.saveLocally) {
        localPath = await this.downloadImage(imageData.url!, options.prompt);
      }

      // Calculate cost
      const cost = this.calculateCost(options.size, options.quality);

      const result: ImageGenerationResult = {
        imageUrl: imageData.url!,
        revisedPrompt: imageData.revised_prompt,
        originalPrompt: options.prompt,
        enhancedPrompt: options.enhancePrompt ? finalPrompt : undefined,
        size: options.size || '1024x1024',
        quality: options.quality || 'standard',
        style: options.style || 'vivid',
        model: 'dall-e-3',
        processingTime,
        cost,
        localPath,
      };

      logger.info(
        `Image generated: ${options.size || '1024x1024'}, ${options.quality || 'standard'}, ${processingTime}ms, $${cost}`
      );

      return result;
    } catch (error: any) {
      logger.error('Image generation error:', error);
      throw new Error(`Image generation failed: ${error.message}`);
    }
  }

  /**
   * Generate image with automatic prompt enhancement
   */
  async generateEnhanced(
    prompt: string,
    options: Omit<ImageGenerationOptions, 'prompt' | 'enhancePrompt'> = {}
  ): Promise<ImageGenerationResult> {
    return this.generate({
      ...options,
      prompt,
      enhancePrompt: true,
    });
  }

  /**
   * Generate multiple variations with different styles
   */
  async generateVariations(
    prompt: string,
    options: Omit<ImageGenerationOptions, 'prompt' | 'style'> = {}
  ): Promise<ImageGenerationResult[]> {
    const styles: Array<'vivid' | 'natural'> = ['vivid', 'natural'];
    const results: ImageGenerationResult[] = [];

    for (const style of styles) {
      try {
        const result = await this.generate({
          ...options,
          prompt,
          style,
        });
        results.push(result);
      } catch (error) {
        logger.error(`Failed to generate ${style} variation:`, error);
      }
    }

    return results;
  }

  /**
   * Enhance prompt using LLM
   */
  private async enhancePrompt(prompt: string): Promise<string> {
    try {
      const response = await languageModel.chat({
        messages: [
          {
            role: 'system',
            content: `You are an expert at writing DALL-E 3 prompts. Enhance the user's prompt to be more detailed, specific, and visually descriptive. Keep it under 400 characters. Focus on:
- Visual details (colors, lighting, composition)
- Artistic style and medium
- Mood and atmosphere
- Specific elements and their arrangement

Return ONLY the enhanced prompt, nothing else.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        model: 'gpt-4-turbo',
        temperature: 0.7,
        max_tokens: 150,
      });

      return response.content.trim();
    } catch (error) {
      logger.error('Prompt enhancement error:', error);
      return prompt; // Fallback to original prompt
    }
  }

  /**
   * Validate generation options
   */
  private validateOptions(options: ImageGenerationOptions): void {
    if (!options.prompt || options.prompt.trim().length === 0) {
      throw new Error('Prompt cannot be empty');
    }

    if (options.prompt.length > 4000) {
      throw new Error('Prompt too long (max 4000 characters)');
    }

    if (options.size && !this.SUPPORTED_SIZES.includes(options.size)) {
      throw new Error(
        `Unsupported size: ${options.size}. Supported: ${this.SUPPORTED_SIZES.join(', ')}`
      );
    }

    if (options.quality && !this.SUPPORTED_QUALITY.includes(options.quality)) {
      throw new Error(
        `Unsupported quality: ${options.quality}. Supported: ${this.SUPPORTED_QUALITY.join(', ')}`
      );
    }

    if (options.style && !this.SUPPORTED_STYLES.includes(options.style)) {
      throw new Error(
        `Unsupported style: ${options.style}. Supported: ${this.SUPPORTED_STYLES.join(', ')}`
      );
    }
  }

  /**
   * Download image from URL and save locally
   */
  private async downloadImage(url: string, prompt: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const timestamp = Date.now();
      const sanitizedPrompt = prompt
        .substring(0, 50)
        .replace(/[^a-z0-9]/gi, '_')
        .toLowerCase();
      const filename = `${timestamp}_${sanitizedPrompt}.png`;
      const filepath = path.join(this.STORAGE_DIR, filename);

      const file = fs.createWriteStream(filepath);

      https
        .get(url, (response) => {
          response.pipe(file);

          file.on('finish', () => {
            file.close();
            logger.info(`Image saved: ${filename}`);
            resolve(filepath);
          });
        })
        .on('error', (error) => {
          fs.unlink(filepath, () => {}); // Delete partial file
          reject(error);
        });
    });
  }

  /**
   * Calculate generation cost
   */
  private calculateCost(
    size?: '1024x1024' | '1792x1024' | '1024x1792',
    quality?: 'standard' | 'hd'
  ): number {
    const actualSize = size || '1024x1024';
    const actualQuality = quality || 'standard';

    // DALL-E 3 pricing (as of 2024)
    const pricing: Record<string, Record<string, number>> = {
      '1024x1024': {
        standard: 0.04,
        hd: 0.08,
      },
      '1792x1024': {
        standard: 0.08,
        hd: 0.12,
      },
      '1024x1792': {
        standard: 0.08,
        hd: 0.12,
      },
    };

    return pricing[actualSize][actualQuality];
  }

  /**
   * Ensure storage directory exists
   */
  private ensureStorageDir(): void {
    if (!fs.existsSync(this.STORAGE_DIR)) {
      fs.mkdirSync(this.STORAGE_DIR, { recursive: true });
      logger.info(`Created storage directory: ${this.STORAGE_DIR}`);
    }
  }

  /**
   * Get storage directory path
   */
  getStorageDir(): string {
    return this.STORAGE_DIR;
  }

  /**
   * List locally stored images
   */
  async listStoredImages(): Promise<StoredImage[]> {
    try {
      const files = await fs.promises.readdir(this.STORAGE_DIR);
      const images: StoredImage[] = [];

      for (const file of files) {
        if (file.endsWith('.png')) {
          const filepath = path.join(this.STORAGE_DIR, file);
          const stats = await fs.promises.stat(filepath);

          images.push({
            filename: file,
            path: filepath,
            size: stats.size,
            createdAt: stats.birthtime,
          });
        }
      }

      return images.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      logger.error('List stored images error:', error);
      return [];
    }
  }

  /**
   * Delete stored image
   */
  async deleteStoredImage(filename: string): Promise<boolean> {
    try {
      const filepath = path.join(this.STORAGE_DIR, filename);
      await fs.promises.unlink(filepath);
      logger.info(`Deleted image: ${filename}`);
      return true;
    } catch (error) {
      logger.error('Delete image error:', error);
      return false;
    }
  }

  /**
   * Get supported options
   */
  getSupportedOptions(): SupportedOptions {
    return {
      sizes: [...this.SUPPORTED_SIZES],
      qualities: [...this.SUPPORTED_QUALITY],
      styles: [...this.SUPPORTED_STYLES],
      models: ['dall-e-3'],
    };
  }
}

// Types
export interface ImageGenerationOptions {
  prompt: string;
  size?: '1024x1024' | '1792x1024' | '1024x1792';
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural';
  model?: 'dall-e-3';
  enhancePrompt?: boolean;
  saveLocally?: boolean;
}

export interface ImageGenerationResult {
  imageUrl: string;
  revisedPrompt?: string;
  originalPrompt: string;
  enhancedPrompt?: string;
  size: string;
  quality: string;
  style: string;
  model: string;
  processingTime: number;
  cost: number;
  localPath?: string;
}

interface StoredImage {
  filename: string;
  path: string;
  size: number;
  createdAt: Date;
}

interface SupportedOptions {
  sizes: string[];
  qualities: string[];
  styles: string[];
  models: string[];
}

// Singleton instance
export const imageGeneration = new ImageGenerationService();
