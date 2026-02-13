/**
 * Model Pricing Configuration
 * Pricing per 1M tokens (as of 2024)
 */

export interface ModelPricing {
  promptCostPer1M: number;
  completionCostPer1M: number;
}

export const MODEL_PRICING: Record<string, ModelPricing> = {
  // OpenAI GPT-4
  'gpt-4': {
    promptCostPer1M: 30.0,
    completionCostPer1M: 60.0,
  },
  'gpt-4-turbo': {
    promptCostPer1M: 10.0,
    completionCostPer1M: 30.0,
  },
  'gpt-3.5-turbo': {
    promptCostPer1M: 0.5,
    completionCostPer1M: 1.5,
  },

  // Anthropic Claude
  'claude-3-5-sonnet-20241022': {
    promptCostPer1M: 3.0,
    completionCostPer1M: 15.0,
  },
  'claude-3-opus-20240229': {
    promptCostPer1M: 15.0,
    completionCostPer1M: 75.0,
  },
  'claude-3-sonnet-20240229': {
    promptCostPer1M: 3.0,
    completionCostPer1M: 15.0,
  },
};

/**
 * Calculate cost for token usage
 */
export function calculateCost(
  model: string,
  promptTokens: number,
  completionTokens: number
): { prompt_cost: number; completion_cost: number; total_cost: number } {
  const pricing = MODEL_PRICING[model];

  if (!pricing) {
    return { prompt_cost: 0, completion_cost: 0, total_cost: 0 };
  }

  const prompt_cost = (promptTokens / 1_000_000) * pricing.promptCostPer1M;
  const completion_cost = (completionTokens / 1_000_000) * pricing.completionCostPer1M;
  const total_cost = prompt_cost + completion_cost;

  return {
    prompt_cost: parseFloat(prompt_cost.toFixed(6)),
    completion_cost: parseFloat(completion_cost.toFixed(6)),
    total_cost: parseFloat(total_cost.toFixed(6)),
  };
}
