import { leoPrompt } from '../prompts/leo.js';
import { sarahPrompt } from '../prompts/sarah.js';
import { timmyPrompt } from '../prompts/timmy.js';
import type { SystemPrompt, PromptContext, PersonaType } from '../types/prompts.js';
import { logger } from '../utils/logger.js';

/**
 * Prompt Manager
 * Manages system prompts, persona selection, and A/B testing
 */
export class PromptManager {
  private prompts: Map<PersonaType, SystemPrompt> = new Map();
  private activeExperiments: Map<string, ABTest> = new Map();

  constructor() {
    // Register all personas
    this.prompts.set('leo', leoPrompt);
    this.prompts.set('sarah', sarahPrompt);
    this.prompts.set('timmy', timmyPrompt);

    logger.info('PromptManager initialized with 3 personas');
  }

  /**
   * Get system prompt for a persona with context
   */
  getPrompt(persona: PersonaType, context: PromptContext = {}): string {
    const prompt = this.prompts.get(persona);

    if (!prompt) {
      logger.warn(`Persona '${persona}' not found, using default`);
      return this.getDefaultPrompt(context);
    }

    // Check if this persona is in an A/B test
    const experiment = this.activeExperiments.get(persona);
    if (experiment && experiment.enabled) {
      return this.getABTestPrompt(persona, context, experiment);
    }

    // Generate contextual prompt
    const contextualPrompt = prompt.contextualPrompt(context);

    logger.info(`Generated prompt for ${persona} (v${prompt.version})`);

    return contextualPrompt;
  }

  /**
   * Get base prompt without context
   */
  getBasePrompt(persona: PersonaType): string {
    const prompt = this.prompts.get(persona);
    return prompt?.basePrompt || this.getDefaultPrompt();
  }

  /**
   * Get default prompt when persona not found
   */
  private getDefaultPrompt(context: PromptContext = {}): string {
    let prompt = `You are Mavin, a helpful and friendly AI assistant.

Your personality:
- Professional yet approachable
- Clear and concise
- Helpful and supportive
- Knowledgeable across many domains

Your communication style:
- Use clear, accessible language
- Provide accurate information
- Ask clarifying questions when needed
- Be respectful and considerate`;

    // Add basic context
    if (context.userName) {
      prompt += `\n\nUser's name: ${context.userName}`;
    }

    if (context.timeOfDay) {
      prompt += `\nCurrent time: ${context.timeOfDay}`;
    }

    return prompt;
  }

  /**
   * Get all available personas
   */
  getAvailablePersonas(): PersonaInfo[] {
    return Array.from(this.prompts.entries()).map(([type, prompt]) => ({
      type,
      name: prompt.name,
      persona: prompt.persona,
      version: prompt.version,
      traits: prompt.traits,
    }));
  }

  /**
   * Get persona info
   */
  getPersonaInfo(persona: PersonaType): PersonaInfo | null {
    const prompt = this.prompts.get(persona);
    if (!prompt) return null;

    return {
      type: persona,
      name: prompt.name,
      persona: prompt.persona,
      version: prompt.version,
      traits: prompt.traits,
      toneGuidelines: prompt.toneGuidelines,
    };
  }

  /**
   * Create A/B test for a persona
   */
  createABTest(
    persona: PersonaType,
    variantPrompt: string,
    splitPercentage: number = 50
  ): void {
    const experiment: ABTest = {
      persona,
      variantPrompt,
      splitPercentage,
      enabled: true,
      metrics: {
        controlGroup: { impressions: 0, conversions: 0 },
        variantGroup: { impressions: 0, conversions: 0 },
      },
    };

    this.activeExperiments.set(persona, experiment);
    logger.info(`A/B test created for ${persona} (${splitPercentage}% split)`);
  }

  /**
   * Get A/B test prompt (randomly assigns to control or variant)
   */
  private getABTestPrompt(
    persona: PersonaType,
    context: PromptContext,
    experiment: ABTest
  ): string {
    const random = Math.random() * 100;
    const useVariant = random < experiment.splitPercentage;

    if (useVariant) {
      experiment.metrics.variantGroup.impressions++;
      logger.info(`A/B test: ${persona} - variant group`);
      return experiment.variantPrompt;
    } else {
      experiment.metrics.controlGroup.impressions++;
      logger.info(`A/B test: ${persona} - control group`);
      const prompt = this.prompts.get(persona);
      return prompt!.contextualPrompt(context);
    }
  }

  /**
   * Record A/B test conversion (e.g., positive user feedback)
   */
  recordConversion(persona: PersonaType, isVariant: boolean): void {
    const experiment = this.activeExperiments.get(persona);
    if (!experiment) return;

    if (isVariant) {
      experiment.metrics.variantGroup.conversions++;
    } else {
      experiment.metrics.controlGroup.conversions++;
    }

    logger.info(`A/B test conversion recorded for ${persona}`);
  }

  /**
   * Get A/B test results
   */
  getABTestResults(persona: PersonaType): ABTestResults | null {
    const experiment = this.activeExperiments.get(persona);
    if (!experiment) return null;

    const controlRate =
      experiment.metrics.controlGroup.impressions > 0
        ? (experiment.metrics.controlGroup.conversions /
            experiment.metrics.controlGroup.impressions) *
          100
        : 0;

    const variantRate =
      experiment.metrics.variantGroup.impressions > 0
        ? (experiment.metrics.variantGroup.conversions /
            experiment.metrics.variantGroup.impressions) *
          100
        : 0;

    return {
      persona,
      splitPercentage: experiment.splitPercentage,
      controlGroup: {
        ...experiment.metrics.controlGroup,
        conversionRate: parseFloat(controlRate.toFixed(2)),
      },
      variantGroup: {
        ...experiment.metrics.variantGroup,
        conversionRate: parseFloat(variantRate.toFixed(2)),
      },
      winner: variantRate > controlRate ? 'variant' : 'control',
      improvement: parseFloat((variantRate - controlRate).toFixed(2)),
    };
  }

  /**
   * Stop A/B test
   */
  stopABTest(persona: PersonaType): void {
    const experiment = this.activeExperiments.get(persona);
    if (experiment) {
      experiment.enabled = false;
      logger.info(`A/B test stopped for ${persona}`);
    }
  }

  /**
   * Generate context from user data
   */
  generateContext(data: {
    userName?: string;
    currentTime?: Date;
    activity?: string;
    location?: string;
    mood?: string;
    conversationHistory?: any[];
  }): PromptContext {
    const context: PromptContext = {};

    if (data.userName) {
      context.userName = data.userName;
    }

    if (data.currentTime) {
      const hour = data.currentTime.getHours();
      if (hour >= 5 && hour < 12) context.timeOfDay = 'morning';
      else if (hour >= 12 && hour < 17) context.timeOfDay = 'afternoon';
      else if (hour >= 17 && hour < 21) context.timeOfDay = 'evening';
      else context.timeOfDay = 'night';
    }

    if (data.activity) {
      context.userActivity = data.activity;
    }

    if (data.location) {
      context.location = data.location;
    }

    if (data.mood) {
      context.mood = data.mood;
    }

    if (data.conversationHistory) {
      context.conversationLength = data.conversationHistory.length;
      // Extract recent topics (simplified - could use NLP)
      context.recentTopics = this.extractTopics(data.conversationHistory);
    }

    return context;
  }

  /**
   * Extract topics from conversation history (simplified)
   */
  private extractTopics(history: any[]): string[] {
    // Simplified topic extraction - in production, use NLP
    const topics: string[] = [];
    const recentMessages = history.slice(-5);

    for (const msg of recentMessages) {
      if (msg.role === 'user' && msg.content) {
        // Extract keywords (very basic)
        const words = msg.content.toLowerCase().split(' ');
        const keywords = words.filter((w: string) => w.length > 5);
        topics.push(...keywords.slice(0, 2));
      }
    }

    return [...new Set(topics)].slice(0, 5);
  }
}

// Types for A/B testing
interface ABTest {
  persona: PersonaType;
  variantPrompt: string;
  splitPercentage: number;
  enabled: boolean;
  metrics: {
    controlGroup: { impressions: number; conversions: number };
    variantGroup: { impressions: number; conversions: number };
  };
}

interface ABTestResults {
  persona: PersonaType;
  splitPercentage: number;
  controlGroup: {
    impressions: number;
    conversions: number;
    conversionRate: number;
  };
  variantGroup: {
    impressions: number;
    conversions: number;
    conversionRate: number;
  };
  winner: 'control' | 'variant';
  improvement: number;
}

interface PersonaInfo {
  type: PersonaType;
  name: string;
  persona: string;
  version: string;
  traits: string[];
  toneGuidelines?: string[];
}

// Singleton instance
export const promptManager = new PromptManager();
