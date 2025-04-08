interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

// Current pricing as of March 2024
const PRICING = {
  'gpt-4': {
    prompt: 0.03,    // $0.03 per 1K prompt tokens
    completion: 0.06  // $0.06 per 1K completion tokens
  },
  'gpt-3.5-turbo-instruct': {
    prompt: 0.0015,   // $0.0015 per 1K prompt tokens
    completion: 0.002  // $0.002 per 1K completion tokens
  }
} as const;

export const calculateCost = (model: keyof typeof PRICING, usage: TokenUsage): number => {
  const modelPricing = PRICING[model];
  const promptCost = (usage.prompt_tokens / 1000) * modelPricing.prompt;
  const completionCost = (usage.completion_tokens / 1000) * modelPricing.completion;
  return promptCost + completionCost;
};

export const formatCost = (cost: number): string => {
  return `$${cost.toFixed(4)}`;
}; 