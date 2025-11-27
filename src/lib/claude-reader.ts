import fs from 'fs/promises';
import path from 'path';
import {
  SessionMessage,
  SessionSummary,
  SessionDetail,
  TokenStats,
  DailyStats,
  ProjectStats,
  ModelStats,
  AnalyticsData,
  DashboardStats,
  ContentBlock,
  OptimizationAnalysis,
  PromptPattern,
  ModelSuggestion,
  CacheAnalysis,
  OptimizationSuggestion,
  ModelUsage
} from './types';
import { calculateCost } from './cost-calculator';

const CLAUDE_DIR = process.env.CLAUDE_DIR || path.join(process.env.HOME || '', '.claude');

// Read JSONL file line by line
async function readJSONL<T>(filePath: string): Promise<T[]> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return content
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        try {
          return JSON.parse(line) as T;
        } catch {
          return null;
        }
      })
      .filter((item): item is T => item !== null);
  } catch {
    return [];
  }
}

// Parse project directory name to readable name
function parseProjectName(dirName: string): string {
  // -Users-saidarslan-Documents-bildux-com -> bildux.com
  const parts = dirName.replace(/^-/, '').split('-');
  // Get last meaningful part
  const lastParts = parts.slice(-2);
  if (lastParts.length === 2 && lastParts[1] === 'com') {
    return `${lastParts[0]}.com`;
  }
  return parts[parts.length - 1] || dirName;
}

// Check if session is an agent session
function isAgentSession(fileName: string): boolean {
  return fileName.startsWith('agent-');
}

// Get text content from message
export function getMessageText(content: string | ContentBlock[]): string {
  if (typeof content === 'string') return content;
  return content
    .filter((block): block is { type: 'text'; text: string } => block.type === 'text')
    .map(block => block.text)
    .join('\n');
}

// Calculate token stats from messages
function calculateTokenStats(messages: SessionMessage[]): { stats: TokenStats; model: string } {
  const stats: TokenStats = {
    input: 0,
    output: 0,
    cacheCreation: 0,
    cacheRead: 0,
    total: 0
  };
  let model = 'unknown';

  for (const msg of messages) {
    if (msg.type === 'assistant' && msg.message?.usage) {
      const usage = msg.message.usage;
      stats.input += usage.input_tokens || 0;
      stats.output += usage.output_tokens || 0;
      stats.cacheCreation += usage.cache_creation_input_tokens || 0;
      stats.cacheRead += usage.cache_read_input_tokens || 0;
      if (msg.message.model) {
        model = msg.message.model;
      }
    }
  }

  stats.total = stats.input + stats.output + stats.cacheCreation + stats.cacheRead;
  return { stats, model };
}

// Parse a single session file
async function parseSession(
  filePath: string,
  sessionId: string,
  projectDir: string
): Promise<SessionSummary | null> {
  const messages = await readJSONL<SessionMessage>(filePath);
  if (messages.length === 0) return null;

  // Check if this is an agent session
  const fileName = path.basename(filePath, '.jsonl');
  const isAgent = isAgentSession(fileName);

  // Find summary
  const summaryLine = messages.find(m => m.type === 'summary');
  let title = summaryLine?.summary?.replace(/"/g, '') || '';

  // Find first user message
  const firstUserMsg = messages.find(m => m.type === 'user');
  const firstMessage = firstUserMsg?.message?.content
    ? getMessageText(firstUserMsg.message.content).slice(0, 200)
    : '';

  // Improve title if it's empty or "Untitled"
  if (!title || title === 'Untitled') {
    if (firstMessage) {
      // Use first 50 characters of first message
      title = firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : '');
    } else {
      // Use "Session - [date]" format
      const timestamps = messages
        .filter(m => m.timestamp)
        .map(m => new Date(m.timestamp!).getTime())
        .sort((a, b) => a - b);
      const startDate = timestamps[0] ? new Date(timestamps[0]) : new Date();
      title = `Session - ${startDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    }
  }

  // Get timestamps
  const timestamps = messages
    .filter(m => m.timestamp)
    .map(m => new Date(m.timestamp!).getTime())
    .sort((a, b) => a - b);

  const startTime = timestamps[0] ? new Date(timestamps[0]).toISOString() : new Date().toISOString();
  const endTime = timestamps[timestamps.length - 1]
    ? new Date(timestamps[timestamps.length - 1]).toISOString()
    : startTime;

  const duration = timestamps.length >= 2
    ? (timestamps[timestamps.length - 1] - timestamps[0]) / 1000 / 60
    : 0;

  // Count messages
  const messageCount = messages.filter(m => m.type === 'user' || m.type === 'assistant').length;

  // Calculate tokens and cost
  const { stats, model } = calculateTokenStats(messages);
  const cost = calculateCost({
    input_tokens: stats.input,
    output_tokens: stats.output,
    cache_creation_input_tokens: stats.cacheCreation,
    cache_read_input_tokens: stats.cacheRead
  }, model);

  return {
    id: sessionId,
    projectDir,
    projectName: parseProjectName(projectDir),
    title,
    firstMessage,
    startTime,
    endTime,
    duration: Math.round(duration),
    messageCount,
    tokenStats: stats,
    cost,
    model,
    isAgent
  };
}

// Get all sessions
export async function getSessions(options?: {
  project?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ sessions: SessionSummary[]; total: number }> {
  const projectsDir = path.join(CLAUDE_DIR, 'projects');

  let projects: string[];
  try {
    projects = await fs.readdir(projectsDir);
  } catch {
    return { sessions: [], total: 0 };
  }

  const allSessions: SessionSummary[] = [];

  for (const project of projects) {
    const projectPath = path.join(projectsDir, project);

    try {
      const stat = await fs.stat(projectPath);
      if (!stat.isDirectory()) continue;

      const files = await fs.readdir(projectPath);
      const jsonlFiles = files.filter(f => f.endsWith('.jsonl'));

      for (const file of jsonlFiles) {
        const sessionId = file.replace('.jsonl', '');

        // Filter out agent sessions completely
        if (isAgentSession(sessionId)) {
          continue;
        }

        const filePath = path.join(projectPath, file);
        const session = await parseSession(filePath, sessionId, project);
        if (session) {
          allSessions.push(session);
        }
      }
    } catch {
      continue;
    }
  }

  // Sort by start time descending
  allSessions.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  // Apply filters
  let filtered = allSessions;

  if (options?.project) {
    filtered = filtered.filter(s => s.projectName === options.project || s.projectDir === options.project);
  }

  if (options?.startDate) {
    const start = new Date(options.startDate).getTime();
    filtered = filtered.filter(s => new Date(s.startTime).getTime() >= start);
  }

  if (options?.endDate) {
    const end = new Date(options.endDate).getTime();
    filtered = filtered.filter(s => new Date(s.startTime).getTime() <= end);
  }

  if (options?.search) {
    const searchLower = options.search.toLowerCase();
    filtered = filtered.filter(s =>
      s.title.toLowerCase().includes(searchLower) ||
      s.firstMessage.toLowerCase().includes(searchLower) ||
      s.projectName.toLowerCase().includes(searchLower)
    );
  }

  const total = filtered.length;

  // Pagination
  if (options?.page !== undefined && options?.limit) {
    const start = (options.page - 1) * options.limit;
    filtered = filtered.slice(start, start + options.limit);
  }

  return { sessions: filtered, total };
}

// Get session detail with messages
export async function getSessionDetail(sessionId: string): Promise<SessionDetail | null> {
  const projectsDir = path.join(CLAUDE_DIR, 'projects');

  let projects: string[];
  try {
    projects = await fs.readdir(projectsDir);
  } catch {
    return null;
  }

  for (const project of projects) {
    const filePath = path.join(projectsDir, project, `${sessionId}.jsonl`);

    try {
      await fs.access(filePath);
      const messages = await readJSONL<SessionMessage>(filePath);
      const summary = await parseSession(filePath, sessionId, project);

      if (summary) {
        return {
          ...summary,
          messages
        };
      }
    } catch {
      continue;
    }
  }

  return null;
}

// Delete a session
export async function deleteSession(sessionId: string): Promise<boolean> {
  const projectsDir = path.join(CLAUDE_DIR, 'projects');

  let projects: string[];
  try {
    projects = await fs.readdir(projectsDir);
  } catch {
    return false;
  }

  for (const project of projects) {
    const filePath = path.join(projectsDir, project, `${sessionId}.jsonl`);

    try {
      await fs.access(filePath);
      await fs.unlink(filePath);
      return true;
    } catch {
      continue;
    }
  }

  return false;
}

// Get dashboard stats
export async function getDashboardStats(): Promise<DashboardStats> {
  const { sessions } = await getSessions();

  // Filter out empty sessions - require at least 2 messages (user + assistant) and some tokens
  const activeSessions = sessions.filter(s => s.messageCount >= 2 && s.tokenStats.total > 0);

  const totalTokens = sessions.reduce((sum, s) => sum + s.tokenStats.total, 0);
  const totalCost = sessions.reduce((sum, s) => sum + s.cost, 0);
  const totalDuration = sessions.reduce((sum, s) => sum + s.duration, 0);

  // Project stats
  const projectMap = new Map<string, ProjectStats>();
  for (const session of sessions) {
    const existing = projectMap.get(session.projectName);
    if (existing) {
      existing.sessions++;
      existing.tokens += session.tokenStats.total;
      existing.cost += session.cost;
      existing.duration += session.duration;
    } else {
      projectMap.set(session.projectName, {
        name: session.projectName,
        sessions: 1,
        tokens: session.tokenStats.total,
        cost: session.cost,
        duration: session.duration
      });
    }
  }

  const projectStats = Array.from(projectMap.values())
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 10);

  return {
    totalSessions: sessions.length,
    totalTokens,
    totalCost,
    totalDuration,
    recentSessions: activeSessions.slice(0, 5),
    projectStats
  };
}

// Get analytics data
export async function getAnalytics(options?: {
  startDate?: string;
  endDate?: string;
}): Promise<AnalyticsData> {
  const { sessions } = await getSessions(options);

  const totalTokens = sessions.reduce((sum, s) => sum + s.tokenStats.total, 0);
  const totalCost = sessions.reduce((sum, s) => sum + s.cost, 0);
  const totalDuration = sessions.reduce((sum, s) => sum + s.duration, 0);

  // Daily stats
  const dailyMap = new Map<string, DailyStats>();
  for (const session of sessions) {
    const date = new Date(session.startTime).toISOString().split('T')[0];
    const existing = dailyMap.get(date);
    if (existing) {
      existing.sessions++;
      existing.tokens.input += session.tokenStats.input;
      existing.tokens.output += session.tokenStats.output;
      existing.tokens.cacheCreation += session.tokenStats.cacheCreation;
      existing.tokens.cacheRead += session.tokenStats.cacheRead;
      existing.tokens.total += session.tokenStats.total;
      existing.cost += session.cost;
      existing.duration += session.duration;
    } else {
      dailyMap.set(date, {
        date,
        sessions: 1,
        tokens: { ...session.tokenStats },
        cost: session.cost,
        duration: session.duration
      });
    }
  }

  const dailyStats = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  // Project stats
  const projectMap = new Map<string, ProjectStats>();
  for (const session of sessions) {
    const existing = projectMap.get(session.projectName);
    if (existing) {
      existing.sessions++;
      existing.tokens += session.tokenStats.total;
      existing.cost += session.cost;
      existing.duration += session.duration;
    } else {
      projectMap.set(session.projectName, {
        name: session.projectName,
        sessions: 1,
        tokens: session.tokenStats.total,
        cost: session.cost,
        duration: session.duration
      });
    }
  }

  const projectStats = Array.from(projectMap.values()).sort((a, b) => b.cost - a.cost);

  // Model stats
  const modelMap = new Map<string, ModelStats>();
  for (const session of sessions) {
    const existing = modelMap.get(session.model);
    if (existing) {
      existing.sessions++;
      existing.tokens.input += session.tokenStats.input;
      existing.tokens.output += session.tokenStats.output;
      existing.tokens.cacheCreation += session.tokenStats.cacheCreation;
      existing.tokens.cacheRead += session.tokenStats.cacheRead;
      existing.tokens.total += session.tokenStats.total;
      existing.cost += session.cost;
    } else {
      modelMap.set(session.model, {
        model: session.model,
        sessions: 1,
        tokens: { ...session.tokenStats },
        cost: session.cost
      });
    }
  }

  const modelStats = Array.from(modelMap.values()).sort((a, b) => b.cost - a.cost);

  return {
    totalSessions: sessions.length,
    totalTokens,
    totalCost,
    totalDuration,
    dailyStats,
    projectStats,
    modelStats
  };
}

// Get unique project names
export async function getProjects(): Promise<string[]> {
  const { sessions } = await getSessions();
  const projects = new Set(sessions.map(s => s.projectName));
  return Array.from(projects).sort();
}

// Get optimization analysis
export async function getOptimizationAnalysis(): Promise<OptimizationAnalysis> {
  const { sessions } = await getSessions();
  const projectsDir = path.join(CLAUDE_DIR, 'projects');

  // Collect all user prompts with their costs
  interface PromptData {
    prompt: string;
    sessionId: string;
    inputTokens: number;
    outputTokens: number;
    cost: number;
    model: string;
  }

  const allPrompts: PromptData[] = [];
  let totalCacheRead = 0;
  let totalCacheWrite = 0;
  let totalInputTokens = 0;

  // Process each session to extract prompts
  for (const session of sessions) {
    const filePath = path.join(projectsDir, session.projectDir, `${session.id}.jsonl`);
    try {
      const messages = await readJSONL<SessionMessage>(filePath);

      for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];

        // Collect cache stats from assistant messages
        if (msg.type === 'assistant' && msg.message?.usage) {
          totalCacheRead += msg.message.usage.cache_read_input_tokens || 0;
          totalCacheWrite += msg.message.usage.cache_creation_input_tokens || 0;
          totalInputTokens += msg.message.usage.input_tokens || 0;
        }

        // Extract user prompts
        if (msg.type === 'user' && msg.message?.content) {
          const promptText = getMessageText(msg.message.content);
          if (promptText.length < 10) continue; // Skip very short prompts

          // Find the next assistant message for cost calculation
          const nextAssistant = messages.slice(i + 1).find(m => m.type === 'assistant' && m.message?.usage);
          if (nextAssistant?.message?.usage) {
            const usage = nextAssistant.message.usage;
            const model = nextAssistant.message.model || 'unknown';
            const cost = calculateCost(usage, model);

            allPrompts.push({
              prompt: promptText,
              sessionId: session.id,
              inputTokens: usage.input_tokens || 0,
              outputTokens: usage.output_tokens || 0,
              cost,
              model
            });
          }
        }
      }
    } catch {
      continue;
    }
  }

  // Group prompts by pattern (first 100 chars)
  const patternMap = new Map<string, {
    prompts: PromptData[];
    fullPrompt: string;
  }>();

  for (const p of allPrompts) {
    const pattern = p.prompt.slice(0, 100).trim();
    const existing = patternMap.get(pattern);
    if (existing) {
      existing.prompts.push(p);
    } else {
      patternMap.set(pattern, { prompts: [p], fullPrompt: p.prompt });
    }
  }

  // Create prompt patterns sorted by total cost
  const topExpensivePatterns: PromptPattern[] = Array.from(patternMap.entries())
    .map(([pattern, data]) => {
      const totalCost = data.prompts.reduce((sum, p) => sum + p.cost, 0);
      const totalInput = data.prompts.reduce((sum, p) => sum + p.inputTokens, 0);
      const totalOutput = data.prompts.reduce((sum, p) => sum + p.outputTokens, 0);
      const sessions = [...new Set(data.prompts.map(p => p.sessionId))];

      // Find most common model
      const modelCounts = new Map<string, number>();
      data.prompts.forEach(p => {
        modelCounts.set(p.model, (modelCounts.get(p.model) || 0) + 1);
      });
      const mostCommonModel = [...modelCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';

      return {
        pattern,
        fullPrompt: data.fullPrompt,
        count: data.prompts.length,
        totalCost,
        totalInputTokens: totalInput,
        totalOutputTokens: totalOutput,
        avgCostPerUse: totalCost / data.prompts.length,
        sessions,
        model: mostCommonModel
      };
    })
    .sort((a, b) => b.totalCost - a.totalCost)
    .slice(0, 10);

  // Model usage breakdown
  const modelMap = new Map<string, { sessions: Set<string>; cost: number }>();
  for (const session of sessions) {
    const existing = modelMap.get(session.model);
    if (existing) {
      existing.sessions.add(session.id);
      existing.cost += session.cost;
    } else {
      modelMap.set(session.model, { sessions: new Set([session.id]), cost: session.cost });
    }
  }

  const totalCost = sessions.reduce((sum, s) => sum + s.cost, 0);
  const modelUsage: ModelUsage[] = Array.from(modelMap.entries())
    .map(([model, data]) => ({
      model,
      sessions: data.sessions.size,
      cost: data.cost,
      percentage: totalCost > 0 ? (data.cost / totalCost) * 100 : 0
    }))
    .sort((a, b) => b.cost - a.cost);

  // Generate model suggestions
  const modelSuggestions: ModelSuggestion[] = [];

  // Opus to Sonnet suggestion
  const opusUsage = modelUsage.find(m => m.model.includes('opus'));
  if (opusUsage && opusUsage.cost > 10) {
    const savings = opusUsage.cost * 0.8; // Sonnet is ~80% cheaper than Opus
    modelSuggestions.push({
      currentModel: opusUsage.model,
      suggestedModel: 'claude-sonnet-4-5-20250929',
      currentCost: opusUsage.cost,
      projectedCost: opusUsage.cost * 0.2,
      savings,
      sessionsAffected: opusUsage.sessions,
      reason: 'Opus is best for complex reasoning. For simpler tasks, Sonnet provides similar quality at 80% lower cost.'
    });
  }

  // Sonnet to Haiku suggestion
  const sonnetUsage = modelUsage.find(m => m.model.includes('sonnet'));
  if (sonnetUsage && sonnetUsage.cost > 5) {
    const savings = sonnetUsage.cost * 0.67; // Haiku is ~67% cheaper than Sonnet
    modelSuggestions.push({
      currentModel: sonnetUsage.model,
      suggestedModel: 'claude-haiku-4-5-20250514',
      currentCost: sonnetUsage.cost,
      projectedCost: sonnetUsage.cost * 0.33,
      savings,
      sessionsAffected: sonnetUsage.sessions,
      reason: 'For quick tasks like code review, formatting, or simple questions, Haiku offers fast responses at 67% lower cost.'
    });
  }

  // Cache analysis
  const cacheHitRate = totalInputTokens > 0
    ? totalCacheRead / (totalCacheRead + totalInputTokens)
    : 0;

  // Potential savings if cache hit rate was 50%
  const targetCacheRate = 0.5;
  const currentCacheSavings = totalCacheRead * 0.9; // Cache read is 90% cheaper
  const potentialCacheSavings = cacheHitRate < targetCacheRate
    ? ((targetCacheRate - cacheHitRate) * totalInputTokens * 0.9 * 3) / 1000000 // rough estimate
    : 0;

  const cacheAnalysis: CacheAnalysis = {
    totalCacheRead,
    totalCacheWrite,
    totalInputTokens,
    cacheHitRate,
    potentialSavings: potentialCacheSavings
  };

  // Generate optimization suggestions
  const suggestions: OptimizationSuggestion[] = [];

  // Model downgrade suggestions
  if (modelSuggestions.length > 0) {
    const topModelSuggestion = modelSuggestions[0];
    suggestions.push({
      id: 'model-downgrade-1',
      type: 'model',
      priority: topModelSuggestion.savings > 50 ? 'high' : 'medium',
      title: `Switch from ${topModelSuggestion.currentModel.split('-').slice(1, 3).join(' ')} to ${topModelSuggestion.suggestedModel.split('-').slice(1, 3).join(' ')}`,
      description: topModelSuggestion.reason,
      potentialSavings: topModelSuggestion.savings,
      implementation: 'Use the model selector in Claude Code settings or specify model in prompts for simpler tasks.',
      affectedSessions: topModelSuggestion.sessionsAffected
    });
  }

  // Cache optimization suggestion
  if (cacheHitRate < 0.3 && totalInputTokens > 100000) {
    suggestions.push({
      id: 'cache-optimization',
      type: 'cache',
      priority: potentialCacheSavings > 20 ? 'high' : 'medium',
      title: 'Improve cache utilization',
      description: `Your cache hit rate is ${(cacheHitRate * 100).toFixed(1)}%. Reusing system prompts and context can significantly reduce costs.`,
      potentialSavings: potentialCacheSavings,
      implementation: 'Keep consistent system prompts across sessions. Claude automatically caches repeated content.',
      affectedSessions: sessions.length
    });
  }

  // Prompt pattern suggestions
  if (topExpensivePatterns.length > 0 && topExpensivePatterns[0].count > 3) {
    const topPattern = topExpensivePatterns[0];
    suggestions.push({
      id: 'prompt-consolidation',
      type: 'prompt',
      priority: topPattern.totalCost > 30 ? 'high' : 'low',
      title: 'Consolidate repeated prompts',
      description: `"${topPattern.pattern.slice(0, 50)}..." was used ${topPattern.count} times costing $${topPattern.totalCost.toFixed(2)} total.`,
      potentialSavings: topPattern.totalCost * 0.3, // Assuming 30% savings from consolidation
      implementation: 'Consider batching similar requests or creating reusable prompt templates.',
      affectedSessions: topPattern.sessions.length
    });
  }

  // Output optimization suggestion
  const avgOutputRatio = allPrompts.length > 0
    ? allPrompts.reduce((sum, p) => sum + (p.outputTokens / Math.max(p.inputTokens, 1)), 0) / allPrompts.length
    : 0;

  if (avgOutputRatio > 3) {
    suggestions.push({
      id: 'output-optimization',
      type: 'output',
      priority: 'low',
      title: 'Request shorter responses',
      description: `Average output is ${avgOutputRatio.toFixed(1)}x the input. Adding "be concise" or specifying output format can reduce costs.`,
      potentialSavings: totalCost * 0.15,
      implementation: 'Add instructions like "be concise", "respond in bullet points", or specify maximum response length.',
      affectedSessions: sessions.length
    });
  }

  // Sort suggestions by savings
  suggestions.sort((a, b) => b.potentialSavings - a.potentialSavings);

  const totalPotentialSavings = suggestions.reduce((sum, s) => sum + s.potentialSavings, 0);

  return {
    totalCurrentCost: totalCost,
    totalPotentialSavings,
    savingsPercentage: totalCost > 0 ? (totalPotentialSavings / totalCost) * 100 : 0,
    topExpensivePatterns,
    modelSuggestions,
    cacheAnalysis,
    suggestions,
    modelUsage
  };
}
