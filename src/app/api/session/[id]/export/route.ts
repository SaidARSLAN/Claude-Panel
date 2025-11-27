import { NextRequest, NextResponse } from 'next/server';
import { getSessionDetail, getMessageText } from '@/lib/claude-reader';
import { formatCost, formatTokens, formatDate } from '@/lib/cost-calculator';
import { SessionMessage, ContentBlock } from '@/lib/types';

export const dynamic = 'force-dynamic';

function toJSON(session: Awaited<ReturnType<typeof getSessionDetail>>) {
  return JSON.stringify(session, null, 2);
}

function toCSV(session: Awaited<ReturnType<typeof getSessionDetail>>) {
  if (!session) return '';

  const headers = ['Timestamp', 'Role', 'Content', 'Tokens', 'Model'];
  const rows = session.messages
    .filter(m => m.type === 'user' || m.type === 'assistant')
    .map(m => {
      const content = m.message?.content
        ? getMessageText(m.message.content).replace(/"/g, '""').replace(/\n/g, ' ')
        : '';
      const tokens = m.message?.usage
        ? (m.message.usage.input_tokens || 0) + (m.message.usage.output_tokens || 0)
        : 0;
      return [
        m.timestamp || '',
        m.type,
        `"${content.slice(0, 500)}"`,
        tokens,
        m.message?.model || ''
      ].join(',');
    });

  return [headers.join(','), ...rows].join('\n');
}

function toMarkdown(session: Awaited<ReturnType<typeof getSessionDetail>>) {
  if (!session) return '';

  const lines = [
    `# ${session.title}`,
    '',
    `**Project:** ${session.projectName}`,
    `**Session ID:** ${session.id}`,
    `**Date:** ${formatDate(session.startTime)} - ${formatDate(session.endTime)}`,
    `**Duration:** ${session.duration} minutes`,
    `**Messages:** ${session.messageCount}`,
    '',
    '## Statistics',
    '',
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Input Tokens | ${formatTokens(session.tokenStats.input)} |`,
    `| Output Tokens | ${formatTokens(session.tokenStats.output)} |`,
    `| Cache Creation | ${formatTokens(session.tokenStats.cacheCreation)} |`,
    `| Cache Read | ${formatTokens(session.tokenStats.cacheRead)} |`,
    `| Total Tokens | ${formatTokens(session.tokenStats.total)} |`,
    `| Cost | ${formatCost(session.cost)} |`,
    `| Model | ${session.model} |`,
    '',
    '---',
    '',
    '## Conversation',
    ''
  ];

  for (const msg of session.messages) {
    if (msg.type === 'user' || msg.type === 'assistant') {
      const role = msg.type === 'user' ? '### User' : '### Assistant';
      const time = msg.timestamp ? `*${formatDate(msg.timestamp)}*` : '';

      lines.push(role);
      if (time) lines.push(time);
      lines.push('');

      if (msg.message?.content) {
        const content = msg.message.content;
        if (typeof content === 'string') {
          lines.push(content);
        } else {
          for (const block of content) {
            if (block.type === 'text') {
              lines.push(block.text);
            } else if (block.type === 'tool_use') {
              lines.push(`\`\`\`tool: ${block.name}`);
              lines.push(JSON.stringify(block.input, null, 2));
              lines.push('```');
            }
          }
        }
      }

      lines.push('');
      lines.push('---');
      lines.push('');
    }
  }

  lines.push('');
  lines.push('---');
  lines.push(`*Exported from Claude Panel on ${new Date().toISOString()}*`);

  return lines.join('\n');
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const searchParams = request.nextUrl.searchParams;
  const format = searchParams.get('format') || 'json';

  try {
    const session = await getSessionDetail(id);

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    let content: string;
    let contentType: string;
    let extension: string;

    switch (format) {
      case 'markdown':
      case 'md':
        content = toMarkdown(session);
        contentType = 'text/markdown';
        extension = 'md';
        break;
      case 'csv':
        content = toCSV(session);
        contentType = 'text/csv';
        extension = 'csv';
        break;
      case 'json':
      default:
        content = toJSON(session);
        contentType = 'application/json';
        extension = 'json';
        break;
    }

    const filename = `claude-session-${id.slice(0, 8)}.${extension}`;

    return new NextResponse(content, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting session:', error);
    return NextResponse.json(
      { error: 'Failed to export session' },
      { status: 500 }
    );
  }
}
