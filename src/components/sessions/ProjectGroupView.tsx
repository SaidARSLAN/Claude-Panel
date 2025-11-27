'use client';

import { SessionSummary } from '@/lib/types';
import { SessionCard } from './SessionCard';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { formatCost } from '@/lib/cost-calculator';

interface ProjectGroupViewProps {
  sessions: SessionSummary[];
  onDelete?: (id: string) => void;
}

interface ProjectGroup {
  projectName: string;
  sessions: SessionSummary[];
  totalCost: number;
  sessionCount: number;
}

export function ProjectGroupView({ sessions, onDelete }: ProjectGroupViewProps) {
  // Group sessions by project
  const projectGroups = sessions.reduce((acc, session) => {
    const existing = acc.find(g => g.projectName === session.projectName);
    if (existing) {
      existing.sessions.push(session);
      existing.totalCost += session.cost;
      existing.sessionCount++;
    } else {
      acc.push({
        projectName: session.projectName,
        sessions: [session],
        totalCost: session.cost,
        sessionCount: 1,
      });
    }
    return acc;
  }, [] as ProjectGroup[]);

  // Sort by total cost descending
  projectGroups.sort((a, b) => b.totalCost - a.totalCost);

  if (projectGroups.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No sessions found
      </div>
    );
  }

  return (
    <Accordion type="multiple" className="space-y-2" defaultValue={[]}>
      {projectGroups.map((group) => (
        <AccordionItem
          key={group.projectName}
          value={group.projectName}
          className="border rounded-lg px-4"
        >
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center justify-between w-full pr-4">
              <div className="flex items-center gap-3">
                <span className="font-semibold">{group.projectName}</span>
                <Badge variant="secondary" className="font-normal">
                  {group.sessionCount} {group.sessionCount === 1 ? 'session' : 'sessions'}
                </Badge>
              </div>
              <div className="text-sm font-semibold text-green-600">
                {formatCost(group.totalCost)}
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-4">
            <div className="space-y-3">
              {group.sessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
