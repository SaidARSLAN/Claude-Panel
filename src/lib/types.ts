// History entry from history.jsonl
export interface HistoryEntry {
  display: string;
  pastedContents: Record<string, unknown>;
  timestamp: number;
  project: string;
  sessionId?: string;
}

// Token usage from assistant messages
export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
}

// Content block types
export interface TextContent {
  type: 'text';
  text: string;
}

export interface ToolUseContent {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ToolResultContent {
  type: 'tool_result';
  tool_use_id: string;
  content: string | Array<{ type: string; text?: string }>;
  is_error?: boolean;
}

export interface ThinkingContent {
  type: 'thinking';
  thinking: string;
}

export type ContentBlock = TextContent | ToolUseContent | ToolResultContent | ThinkingContent;

// Message structure in session files
export interface SessionMessage {
  uuid: string;
  parentUuid?: string;
  sessionId: string;
  timestamp?: string;
  type: 'user' | 'assistant' | 'summary' | 'system' | 'file-history-snapshot';
  message?: {
    role: string;
    content: string | ContentBlock[];
    model?: string;
    usage?: TokenUsage;
  };
  summary?: string;
  cwd?: string;
  gitBranch?: string;
  version?: string;
}

// Token statistics
export interface TokenStats {
  input: number;
  output: number;
  cacheCreation: number;
  cacheRead: number;
  total: number;
}

// Session summary for list view
export interface SessionSummary {
  id: string;
  projectDir: string;
  projectName: string;
  title: string;
  firstMessage: string;
  startTime: string;
  endTime: string;
  duration: number; // minutes
  messageCount: number;
  tokenStats: TokenStats;
  cost: number; // USD
  model: string;
  isAgent: boolean;
}

// Full session with messages
export interface SessionDetail extends SessionSummary {
  messages: SessionMessage[];
}

// Daily statistics
export interface DailyStats {
  date: string;
  sessions: number;
  tokens: TokenStats;
  cost: number;
  duration: number;
}

// Project statistics
export interface ProjectStats {
  name: string;
  sessions: number;
  tokens: number;
  cost: number;
  duration: number;
}

// Model statistics
export interface ModelStats {
  model: string;
  sessions: number;
  tokens: TokenStats;
  cost: number;
}

// Overall analytics
export interface AnalyticsData {
  totalSessions: number;
  totalTokens: number;
  totalCost: number;
  totalDuration: number;
  dailyStats: DailyStats[];
  projectStats: ProjectStats[];
  modelStats: ModelStats[];
}

// Dashboard stats
export interface DashboardStats {
  totalSessions: number;
  totalTokens: number;
  totalCost: number;
  totalDuration: number;
  recentSessions: SessionSummary[];
  projectStats: ProjectStats[];
}

// API Response types
export interface SessionsResponse {
  sessions: SessionSummary[];
  total: number;
  page: number;
  totalPages: number;
}

export interface SessionResponse {
  session: SessionSummary;
  messages: SessionMessage[];
}

// Export formats
export type ExportFormat = 'json' | 'markdown' | 'csv';

// Cost Optimization Types

// Prompt pattern analysis
export interface PromptPattern {
  pattern: string;           // First 100 characters (truncated)
  fullPrompt: string;        // Full prompt text
  count: number;             // Usage count
  totalCost: number;         // Total cost for this pattern
  totalInputTokens: number;
  totalOutputTokens: number;
  avgCostPerUse: number;
  sessions: string[];        // Related session IDs
  model: string;             // Most frequently used model
}

// Model downgrade suggestion
export interface ModelSuggestion {
  currentModel: string;
  suggestedModel: string;
  currentCost: number;
  projectedCost: number;
  savings: number;
  sessionsAffected: number;
  reason: string;
}

// Cache efficiency analysis
export interface CacheAnalysis {
  totalCacheRead: number;
  totalCacheWrite: number;
  totalInputTokens: number;
  cacheHitRate: number;      // cache_read / (cache_read + input)
  potentialSavings: number;  // If cache was better utilized
}

// Optimization suggestion
export interface OptimizationSuggestion {
  id: string;
  type: 'model' | 'prompt' | 'cache' | 'output';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  potentialSavings: number;
  implementation: string;    // How to implement
  affectedSessions: number;
}

// Model usage breakdown
export interface ModelUsage {
  model: string;
  sessions: number;
  cost: number;
  percentage: number;
}

// Full optimization analysis
export interface OptimizationAnalysis {
  // Summary
  totalCurrentCost: number;
  totalPotentialSavings: number;
  savingsPercentage: number;

  // Detailed Analysis
  topExpensivePatterns: PromptPattern[];
  modelSuggestions: ModelSuggestion[];
  cacheAnalysis: CacheAnalysis;
  suggestions: OptimizationSuggestion[];

  // Model breakdown
  modelUsage: ModelUsage[];
}
