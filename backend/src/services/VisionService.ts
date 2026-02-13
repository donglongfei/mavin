import OpenAI from 'openai';
import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import fs from 'fs';

/**
 * Vision Service
 * Handles image analysis using GPT-4 Vision API and OCR
 */
export class VisionService {
  private openai: OpenAI;
  private analysisCache: Map<string, CachedAnalysis> = new Map();
  private readonly CACHE_TTL = 3600000; // 1 hour
  private readonly MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20MB
  private readonly SUPPORTED_FORMATS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

  constructor() {
    if (config.openai.apiKey && config.openai.apiKey !== 'dummy-key-for-dev') {
      this.openai = new OpenAI({
        apiKey: config.openai.apiKey,
      });
      logger.info('VisionService initialized');
    } else {
      logger.warn('OpenAI API key not configured for vision service');
    }
  }

  /**
   * Analyze image with GPT-4 Vision
   */
  async analyze(
    image: string | Buffer,
    options: VisionAnalysisOptions = {}
  ): Promise<VisionAnalysisResult> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized. Please configure OPENAI_API_KEY.');
    }

    const startTime = Date.now();

    try {
      // Generate cache key
      const cacheKey = this.generateCacheKey(image, options);

      // Check cache
      if (options.useCache !== false) {
        const cached = this.getFromCache(cacheKey);
        if (cached) {
          logger.info('Vision analysis cache hit');
          return cached;
        }
      }

      // Validate image
      await this.validateImage(image);

      // Prepare image for API
      const imageUrl = await this.prepareImage(image);

      // Build prompt based on analysis type
      const prompt = this.buildPrompt(options);

      // Call GPT-4 Vision API
      const response = await this.openai.chat.completions.create({
        model: options.model || 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                  detail: options.detail || 'auto',
                },
              },
            ],
          },
        ],
        max_tokens: options.maxTokens || 500,
        temperature: options.temperature || 0.7,
      });

      const processingTime = Date.now() - startTime;
      const content = response.choices[0].message.content || '';

      // Parse response based on analysis type
      const result = this.parseResponse(content, options);

      // Calculate cost
      const cost = this.calculateCost(
        response.usage?.prompt_tokens || 0,
        response.usage?.completion_tokens || 0
      );

      const analysisResult: VisionAnalysisResult = {
        ...result,
        model: response.model,
        processingTime,
        cost,
        cached: false,
      };

      // Cache result
      if (options.useCache !== false) {
        this.addToCache(cacheKey, analysisResult);
      }

      logger.info(
        `Vision analysis complete: ${options.analysisType || 'general'}, ${processingTime}ms, $${cost}`
      );

      return analysisResult;
    } catch (error: any) {
      logger.error('Vision analysis error:', error);
      throw new Error(`Vision analysis failed: ${error.message}`);
    }
  }

  /**
   * Analyze image for general description
   */
  async describe(image: string | Buffer, detail?: 'low' | 'high' | 'auto'): Promise<string> {
    const result = await this.analyze(image, {
      analysisType: 'description',
      detail,
    });
    return result.description || '';
  }

  /**
   * Detect objects in image
   */
  async detectObjects(image: string | Buffer): Promise<string[]> {
    const result = await this.analyze(image, {
      analysisType: 'objects',
    });
    return result.objects || [];
  }

  /**
   * Extract text from image (OCR)
   */
  async extractText(image: string | Buffer): Promise<string> {
    const result = await this.analyze(image, {
      analysisType: 'ocr',
    });
    return result.text || '';
  }

  /**
   * Detect faces in image
   */
  async detectFaces(image: string | Buffer): Promise<FaceDetection[]> {
    const result = await this.analyze(image, {
      analysisType: 'faces',
    });
    return result.faces || [];
  }

  /**
   * Analyze scene and context
   */
  async analyzeScene(image: string | Buffer): Promise<SceneAnalysis> {
    const result = await this.analyze(image, {
      analysisType: 'scene',
    });
    return {
      description: result.description || '',
      setting: result.setting || '',
      mood: result.mood || '',
      colors: result.colors || [],
      lighting: result.lighting || '',
    };
  }

  /**
   * Build prompt based on analysis type
   */
  private buildPrompt(options: VisionAnalysisOptions): string {
    const type = options.analysisType || 'general';

    const prompts: Record<string, string> = {
      general: options.prompt || 'Describe this image in detail.',
      description:
        'Provide a detailed description of this image. Include what you see, the setting, colors, mood, and any notable details.',
      objects:
        'List all objects visible in this image. Return as a comma-separated list. Example: "car, tree, person, building"',
      ocr: 'Extract all text visible in this image. Return only the text, preserving formatting where possible.',
      faces:
        'Detect and describe any faces in this image. For each face, provide: approximate age, gender, expression, and position. Format as JSON array.',
      scene:
        'Analyze this scene. Provide: 1) Description, 2) Setting (indoor/outdoor, location type), 3) Mood/atmosphere, 4) Dominant colors, 5) Lighting conditions. Format as JSON.',
    };

    return prompts[type] || options.prompt || prompts.general;
  }

  /**
   * Parse response based on analysis type
   */
  private parseResponse(
    content: string,
    options: VisionAnalysisOptions
  ): Partial<VisionAnalysisResult> {
    const type = options.analysisType || 'general';

    try {
      switch (type) {
        case 'objects':
          return {
            objects: content
              .split(',')
              .map((s) => s.trim())
              .filter((s) => s.length > 0),
            description: content,
          };

        case 'ocr':
          return {
            text: content,
            description: `Extracted text: ${content.substring(0, 100)}...`,
          };

        case 'faces':
          try {
            const faces = JSON.parse(content);
            return { faces, description: `Detected ${faces.length} face(s)` };
          } catch {
            return { faces: [], description: content };
          }

        case 'scene':
          try {
            const scene = JSON.parse(content);
            return {
              description: scene.description || content,
              setting: scene.setting,
              mood: scene.mood,
              colors: scene.colors || [],
              lighting: scene.lighting,
            };
          } catch {
            return { description: content };
          }

        default:
          return { description: content };
      }
    } catch (error) {
      logger.error('Response parsing error:', error);
      return { description: content };
    }
  }

  /**
   * Validate image
   */
  private async validateImage(image: string | Buffer): Promise<void> {
    // Check size
    const size = Buffer.isBuffer(image)
      ? image.length
      : image.startsWith('http')
        ? 0 // URL, can't check size
        : (await fs.promises.stat(image)).size;

    if (size > this.MAX_IMAGE_SIZE) {
      throw new Error(
        `Image too large: ${(size / 1024 / 1024).toFixed(2)}MB (max 20MB)`
      );
    }

    if (size === 0 && !image.toString().startsWith('http')) {
      throw new Error('Image is empty');
    }
  }

  /**
   * Prepare image for API (convert to base64 or URL)
   */
  private async prepareImage(image: string | Buffer): Promise<string> {
    if (typeof image === 'string') {
      // If it's a URL, return as-is
      if (image.startsWith('http://') || image.startsWith('https://')) {
        return image;
      }

      // If it's a file path, read and convert to base64
      const buffer = await fs.promises.readFile(image);
      return `data:image/jpeg;base64,${buffer.toString('base64')}`;
    } else {
      // Buffer - convert to base64
      return `data:image/jpeg;base64,${image.toString('base64')}`;
    }
  }

  /**
   * Calculate cost
   */
  private calculateCost(promptTokens: number, completionTokens: number): number {
    // GPT-4 Vision pricing (approximate)
    const promptCost = (promptTokens / 1000) * 0.01;
    const completionCost = (completionTokens / 1000) * 0.03;
    return parseFloat((promptCost + completionCost).toFixed(4));
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(
    image: string | Buffer,
    options: VisionAnalysisOptions
  ): string {
    const imageHash = Buffer.isBuffer(image)
      ? image.slice(0, 1024).toString('base64')
      : image.substring(0, 100);

    return `${imageHash}_${options.analysisType || 'general'}_${options.detail || 'auto'}`;
  }

  /**
   * Get from cache
   */
  private getFromCache(key: string): VisionAnalysisResult | null {
    const cached = this.analysisCache.get(key);

    if (!cached) return null;

    // Check if expired
    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.analysisCache.delete(key);
      return null;
    }

    return { ...cached.result, cached: true };
  }

  /**
   * Add to cache
   */
  private addToCache(key: string, result: VisionAnalysisResult): void {
    this.analysisCache.set(key, {
      result,
      timestamp: Date.now(),
    });

    // Cleanup old cache entries
    if (this.analysisCache.size > 100) {
      const oldestKey = this.analysisCache.keys().next().value;
      this.analysisCache.delete(oldestKey);
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.analysisCache.clear();
    logger.info('Vision analysis cache cleared');
  }

  /**
   * Get cache stats
   */
  getCacheStats(): CacheStats {
    let validEntries = 0;
    let expiredEntries = 0;

    for (const [key, cached] of this.analysisCache.entries()) {
      if (Date.now() - cached.timestamp > this.CACHE_TTL) {
        expiredEntries++;
      } else {
        validEntries++;
      }
    }

    return {
      totalEntries: this.analysisCache.size,
      validEntries,
      expiredEntries,
      cacheTTL: this.CACHE_TTL,
    };
  }

  /**
   * Get supported formats
   */
  getSupportedFormats(): string[] {
    return [...this.SUPPORTED_FORMATS];
  }

  /**
   * Get max image size
   */
  getMaxImageSize(): number {
    return this.MAX_IMAGE_SIZE;
  }
}

// Types
export interface VisionAnalysisOptions {
  analysisType?: 'general' | 'description' | 'objects' | 'ocr' | 'faces' | 'scene';
  prompt?: string;
  detail?: 'low' | 'high' | 'auto';
  model?: 'gpt-4-vision-preview';
  maxTokens?: number;
  temperature?: number;
  useCache?: boolean;
}

export interface VisionAnalysisResult {
  description?: string;
  objects?: string[];
  text?: string;
  faces?: FaceDetection[];
  setting?: string;
  mood?: string;
  colors?: string[];
  lighting?: string;
  model: string;
  processingTime: number;
  cost: number;
  cached: boolean;
}

export interface FaceDetection {
  age?: string;
  gender?: string;
  expression?: string;
  position?: string;
}

export interface SceneAnalysis {
  description: string;
  setting: string;
  mood: string;
  colors: string[];
  lighting: string;
}

interface CachedAnalysis {
  result: VisionAnalysisResult;
  timestamp: number;
}

interface CacheStats {
  totalEntries: number;
  validEntries: number;
  expiredEntries: number;
  cacheTTL: number;
}

// Singleton instance
export const visionService = new VisionService();
