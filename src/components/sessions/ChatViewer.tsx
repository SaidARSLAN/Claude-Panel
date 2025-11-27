'use client';

import { useState } from 'react';
import { SessionMessage, ContentBlock } from '@/lib/types';
import { formatDate } from '@/lib/cost-calculator';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from 'next-themes';
import {
  ChevronDown,
  ChevronRight,
  User,
  Bot,
  Terminal,
  Copy,
  Check
} from 'lucide-react';

interface ChatViewerProps {
  messages: SessionMessage[];
}

function CodeBlock({ code, language }: { code: string; language?: string }) {
  const { theme } = useTheme();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const detectedLang = language || detectLanguage(code);

  return (
    <div className="relative group my-2 w-full max-w-full overflow-hidden rounded-lg">
      <div className="absolute right-2 top-2 z-10">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
      <div className="w-full overflow-x-auto">
        <SyntaxHighlighter
          language={detectedLang}
          style={theme === 'dark' ? oneDark : oneLight}
          customStyle={{
            margin: 0,
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            minWidth: 'fit-content',
          }}
          wrapLongLines={false}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}

function detectLanguage(code: string): string {
  if (code.includes('import ') && code.includes('from ')) return 'typescript';
  if (code.includes('function ') || code.includes('const ')) return 'javascript';
  if (code.includes('def ') || code.includes('import ')) return 'python';
  if (code.includes('<?php')) return 'php';
  if (code.includes('<html') || code.includes('<div')) return 'html';
  if (code.includes('{') && code.includes('}') && code.includes(':')) return 'json';
  return 'text';
}

function ToolUseBlock({ name, input }: { name: string; input: Record<string, unknown> }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="my-2 border rounded-lg overflow-hidden w-full">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 p-3 bg-muted hover:bg-muted/80 transition-colors text-left"
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 flex-shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 flex-shrink-0" />
        )}
        <Terminal className="h-4 w-4 flex-shrink-0" />
        <span className="font-mono text-sm truncate">{name}</span>
      </button>
      {expanded && (
        <div className="p-3 bg-background overflow-hidden">
          <CodeBlock code={JSON.stringify(input, null, 2)} language="json" />
        </div>
      )}
    </div>
  );
}

function MessageContent({ content }: { content: string | ContentBlock[] }) {
  if (typeof content === 'string') {
    return <FormattedText text={content} />;
  }

  return (
    <div className="space-y-2 w-full min-w-0">
      {content.map((block, index) => {
        if (block.type === 'text') {
          return <FormattedText key={index} text={block.text} />;
        }
        if (block.type === 'tool_use') {
          return (
            <ToolUseBlock
              key={index}
              name={block.name}
              input={block.input as Record<string, unknown>}
            />
          );
        }
        if (block.type === 'thinking') {
          return (
            <div key={index} className="my-2 p-3 bg-muted/50 rounded-lg border-l-4 border-yellow-500">
              <p className="text-xs font-medium text-muted-foreground mb-1">Thinking...</p>
              <p className="text-sm italic break-words">{block.thinking}</p>
            </div>
          );
        }
        if (block.type === 'tool_result') {
          const resultContent = block.content;
          return (
            <div key={index} className="my-2 border rounded-lg overflow-hidden w-full">
              <div className="p-3 bg-muted/30">
                <p className="text-xs font-medium text-muted-foreground mb-2">Tool Result</p>
                <div className="overflow-hidden">
                  {typeof resultContent === 'string' ? (
                    <FormattedText text={resultContent} />
                  ) : Array.isArray(resultContent) ? (
                    <div className="space-y-1">
                      {resultContent.map((item, i) => (
                        item.type === 'text' && item.text ? (
                          <FormattedText key={i} text={item.text} />
                        ) : null
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}

function FormattedText({ text }: { text: string }) {
  // Simple code block detection
  const parts = text.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-2 w-full min-w-0">
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const lines = part.slice(3, -3).split('\n');
          const language = lines[0].trim();
          const code = lines.slice(1).join('\n');
          return <CodeBlock key={index} code={code} language={language} />;
        }
        return (
          <p key={index} className="whitespace-pre-wrap break-words text-sm w-full">
            {part}
          </p>
        );
      })}
    </div>
  );
}

function MessageBubble({ message }: { message: SessionMessage }) {
  const isUser = message.type === 'user';
  const Icon = isUser ? User : Bot;

  if (!message.message?.content) return null;

  return (
    <div className={`flex gap-2 sm:gap-3 w-full min-w-0 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`hidden sm:flex flex-shrink-0 w-8 h-8 rounded-full items-center justify-center ${
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
        }`}
      >
        <Icon className="h-4 w-4" />
      </div>

      <Card className={`flex-1 min-w-0 p-3 sm:p-4 overflow-hidden ${isUser ? 'bg-primary/5' : ''}`}>
        <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-2">
          <span className="font-medium text-sm">
            {isUser ? 'You' : 'Claude'}
          </span>
          {message.message.model && (
            <Badge variant="outline" className="text-xs max-w-[150px] truncate">
              {message.message.model.split('-').slice(-2).join('-')}
            </Badge>
          )}
          {message.timestamp && (
            <span className="text-xs text-muted-foreground ml-auto whitespace-nowrap">
              {formatDate(message.timestamp)}
            </span>
          )}
        </div>

        <div className="w-full min-w-0 overflow-hidden">
          <MessageContent content={message.message.content} />
        </div>

        {message.message.usage && (
          <div className="flex flex-wrap gap-2 sm:gap-4 mt-3 pt-3 border-t text-xs text-muted-foreground">
            <span>In: {message.message.usage.input_tokens?.toLocaleString()}</span>
            <span>Out: {message.message.usage.output_tokens?.toLocaleString()}</span>
            {message.message.usage.cache_read_input_tokens && (
              <span className="hidden sm:inline">Cache: {message.message.usage.cache_read_input_tokens?.toLocaleString()}</span>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

export function ChatViewer({ messages }: ChatViewerProps) {
  const [showSystem, setShowSystem] = useState(false);

  const visibleMessages = messages.filter((m) =>
    showSystem
      ? ['user', 'assistant', 'summary'].includes(m.type)
      : ['user', 'assistant'].includes(m.type)
  );

  return (
    <div className="w-full min-w-0 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={showSystem}
            onChange={(e) => setShowSystem(e.target.checked)}
            className="rounded"
          />
          Show system messages
        </label>
        <span className="text-sm text-muted-foreground">
          ({visibleMessages.length} messages)
        </span>
      </div>

      <div className="w-full min-w-0 max-h-[calc(100vh-450px)] overflow-y-auto overflow-x-hidden pr-2">
        <div className="space-y-4 w-full min-w-0">
          {visibleMessages.map((message) => (
            <MessageBubble key={message.uuid} message={message} />
          ))}
        </div>
      </div>
    </div>
  );
}
