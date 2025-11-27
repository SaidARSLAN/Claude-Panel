import { TokenUsage, TokenStats } from './types';

// Official Claude API Pricing per 1M tokens (USD)
// Source: https://platform.claude.com/docs/en/about-claude/pricing
// Last updated: November 2025

export const MODEL_PRICING: Record<string, {
  input: number;
  output: number;
  cacheWrite: number;  // 5-minute cache (default)
  cacheRead: number;
}> = {
  // Current Models
  'claude-opus-4-5-20251101': {
    input: 5.00,
    output: 25.00,
    cacheWrite: 6.25,
    cacheRead: 0.50,
  },
  'claude-opus-4-20250514': {
    input: 15.00,
    output: 75.00,
    cacheWrite: 18.75,
    cacheRead: 1.50,
  },
  'claude-sonnet-4-5-20250929': {
    input: 3.00,
    output: 15.00,
    cacheWrite: 3.75,
    cacheRead: 0.30,
  },
  'claude-sonnet-4-20250514': {
    input: 3.00,
    output: 15.00,
    cacheWrite: 3.75,
    cacheRead: 0.30,
  },
  'claude-haiku-4-5-20250514': {
    input: 1.00,
    output: 5.00,
    cacheWrite: 1.25,
    cacheRead: 0.10,
  },

  // Legacy/Deprecated Models
  'claude-3-5-sonnet-20241022': {
    input: 3.00,
    output: 15.00,
    cacheWrite: 3.75,
    cacheRead: 0.30,
  },
  'claude-3-5-sonnet-20240620': {
    input: 3.00,
    output: 15.00,
    cacheWrite: 3.75,
    cacheRead: 0.30,
  },
  'claude-3-5-haiku-20241022': {
    input: 0.80,
    output: 4.00,
    cacheWrite: 1.00,
    cacheRead: 0.08,
  },
  'claude-3-opus-20240229': {
    input: 15.00,
    output: 75.00,
    cacheWrite: 18.75,
    cacheRead: 1.50,
  },
  'claude-3-sonnet-20240229': {
    input: 3.00,
    output: 15.00,
    cacheWrite: 3.75,
    cacheRead: 0.30,
  },
  'claude-3-haiku-20240307': {
    input: 0.25,
    output: 1.25,
    cacheWrite: 0.30,
    cacheRead: 0.03,
  },

  // Default fallback (Sonnet pricing)
  'default': {
    input: 3.00,
    output: 15.00,
    cacheWrite: 3.75,
    cacheRead: 0.30,
  }
};

export function calculateCost(usage: TokenUsage, model: string): number {
  const pricing = MODEL_PRICING[model] || MODEL_PRICING['default'];

  const inputCost = (usage.input_tokens || 0) / 1_000_000 * pricing.input;
  const outputCost = (usage.output_tokens || 0) / 1_000_000 * pricing.output;
  const cacheWriteCost = (usage.cache_creation_input_tokens || 0) / 1_000_000 * pricing.cacheWrite;
  const cacheReadCost = (usage.cache_read_input_tokens || 0) / 1_000_000 * pricing.cacheRead;

  return inputCost + outputCost + cacheWriteCost + cacheReadCost;
}

export function calculateCostFromStats(stats: TokenStats, model: string): number {
  const pricing = MODEL_PRICING[model] || MODEL_PRICING['default'];

  const inputCost = stats.input / 1_000_000 * pricing.input;
  const outputCost = stats.output / 1_000_000 * pricing.output;
  const cacheWriteCost = stats.cacheCreation / 1_000_000 * pricing.cacheWrite;
  const cacheReadCost = stats.cacheRead / 1_000_000 * pricing.cacheRead;

  return inputCost + outputCost + cacheWriteCost + cacheReadCost;
}

export function formatCost(cost: number): string {
  if (cost === 0) return '$0.00';
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  if (cost < 1) return `$${cost.toFixed(3)}`;
  return `$${cost.toFixed(2)}`;
}

export function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}K`;
  return tokens.toString();
}

export function formatDuration(minutes: number): string {
  if (minutes < 1) return '<1 min';
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatShortDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
}
