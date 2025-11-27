import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { ChatViewer } from '@/components/sessions/ChatViewer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getSessionDetail } from '@/lib/claude-reader';
import { formatCost, formatTokens, formatDate, formatDuration } from '@/lib/cost-calculator';
import { ArrowLeft, Download, Clock, MessageSquare, Zap, Coins } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SessionDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await getSessionDetail(id);

  if (!session) {
    notFound();
  }

  return (
    <div className="flex flex-col w-full min-w-0">
      <Header
        title={session.title}
        description={`${session.projectName} - ${formatDate(session.startTime)}`}
      />

      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 w-full min-w-0 overflow-hidden">
        {/* Back button and actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Link href="/sessions">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sessions
            </Button>
          </Link>

          <div className="flex flex-wrap gap-2">
            <a href={`/api/session/${id}/export?format=json`} download>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">JSON</span>
                <span className="sm:hidden">J</span>
              </Button>
            </a>
            <a href={`/api/session/${id}/export?format=markdown`} download>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Markdown</span>
                <span className="sm:hidden">MD</span>
              </Button>
            </a>
            <a href={`/api/session/${id}/export?format=csv`} download>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">CSV</span>
                <span className="sm:hidden">C</span>
              </Button>
            </a>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Duration</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground hidden sm:block" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold">{formatDuration(session.duration)}</div>
              <p className="text-xs text-muted-foreground hidden sm:block">
                {formatDate(session.startTime)} - {formatDate(session.endTime)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Messages</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground hidden sm:block" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold">{session.messageCount}</div>
              <p className="text-xs text-muted-foreground hidden sm:block">
                User & Assistant
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Tokens</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground hidden sm:block" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold">{formatTokens(session.tokenStats.total)}</div>
              <p className="text-xs text-muted-foreground hidden sm:block">
                In: {formatTokens(session.tokenStats.input)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Cost</CardTitle>
              <Coins className="h-4 w-4 text-muted-foreground hidden sm:block" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold text-green-600">{formatCost(session.cost)}</div>
              <p className="text-xs text-muted-foreground hidden sm:block truncate">
                {session.model.split('-').slice(-2).join('-')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Token Breakdown - Hidden on mobile */}
        <Card className="hidden sm:block">
          <CardHeader>
            <CardTitle className="text-lg">Token Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
              <div>
                <div className="text-sm text-muted-foreground">Input Tokens</div>
                <div className="text-xl font-semibold">{session.tokenStats.input.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Output Tokens</div>
                <div className="text-xl font-semibold">{session.tokenStats.output.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Cache Creation</div>
                <div className="text-xl font-semibold">{session.tokenStats.cacheCreation.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Cache Read</div>
                <div className="text-xl font-semibold">{session.tokenStats.cacheRead.toLocaleString()}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chat Viewer */}
        <Card className="w-full min-w-0 overflow-hidden">
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Conversation</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0 w-full min-w-0 overflow-hidden">
            <ChatViewer messages={session.messages} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
