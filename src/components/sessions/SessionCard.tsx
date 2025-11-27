'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SessionSummary } from '@/lib/types';
import { formatCost, formatTokens, formatDate, formatDuration } from '@/lib/cost-calculator';
import { MoreHorizontal, Eye, Download, Trash2, FileJson, FileText, Table } from 'lucide-react';
import { toast } from 'sonner';

interface SessionCardProps {
  session: SessionSummary;
  onDelete?: (id: string) => void;
}

export function SessionCard({ session, onDelete }: SessionCardProps) {
  const handleExport = async (format: 'json' | 'markdown' | 'csv') => {
    try {
      const response = await fetch(`/api/session/${session.id}/export?format=${format}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `session-${session.id.slice(0, 8)}.${format === 'markdown' ? 'md' : format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch {
      toast.error('Export failed');
    }
  };

  const handleDelete = async () => {
    if (!confirm('This session will be deleted. Are you sure?')) return;

    try {
      const response = await fetch(`/api/session/${session.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Session deleted');
        onDelete?.(session.id);
      } else {
        toast.error('Delete failed');
      }
    } catch {
      toast.error('Delete failed');
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow w-full">
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-0 sm:justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-start sm:items-center gap-2 mb-1 flex-wrap">
              <Link
                href={`/sessions/${session.id}`}
                className="font-semibold hover:text-primary line-clamp-1 break-all"
              >
                {session.title}
              </Link>
              <Badge variant="outline" className="flex-shrink-0 text-xs">
                {session.projectName}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {session.firstMessage || 'No message'}
            </p>
            <div className="flex flex-wrap gap-2 sm:gap-4 text-xs text-muted-foreground">
              <span>{formatDate(session.startTime)}</span>
              <span className="hidden sm:inline">{formatDuration(session.duration)}</span>
              <span>{session.messageCount} msgs</span>
            </div>
          </div>

          <div className="flex items-center sm:items-start justify-between sm:justify-end gap-2 sm:gap-4 sm:ml-4">
            <div className="text-left sm:text-right">
              <div className="text-base sm:text-lg font-semibold text-green-600">
                {formatCost(session.cost)}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatTokens(session.tokenStats.total)}
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/sessions/${session.id}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleExport('json')}>
                  <FileJson className="mr-2 h-4 w-4" />
                  Export JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('markdown')}>
                  <FileText className="mr-2 h-4 w-4" />
                  Export Markdown
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('csv')}>
                  <Table className="mr-2 h-4 w-4" />
                  Export CSV
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
