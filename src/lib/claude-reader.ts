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
  ContentBlock
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
