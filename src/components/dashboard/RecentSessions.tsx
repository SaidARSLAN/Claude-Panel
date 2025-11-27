'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SessionSummary } from '@/lib/types';
import { formatCost, formatTokens, formatDate } from '@/lib/cost-calculator';

interface RecentSessionsProps {
  sessions: SessionSummary[];
}

export function RecentSessions({ sessions }: RecentSessionsProps) {
  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Recent Sessions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sessions.map((session) => (
            <Link
              key={session.id}
              href={`/sessions/${session.id}`}
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium truncate">{session.title}</h4>
                  <Badge variant="outline" className="text-xs">
                    {session.projectName}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {session.firstMessage || 'No message'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDate(session.startTime)}
                </p>
              </div>
              <div className="text-right ml-4 flex-shrink-0">
                <div className="text-sm font-medium text-green-600">
                  {formatCost(session.cost)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatTokens(session.tokenStats.total)} tokens
                </div>
                <div className="text-xs text-muted-foreground">
                  {session.duration} min
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
