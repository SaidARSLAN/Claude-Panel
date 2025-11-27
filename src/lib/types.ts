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
