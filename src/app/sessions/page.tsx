import { Header } from '@/components/layout/Header';
import { SessionList } from '@/components/sessions/SessionList';
import { getSessions, getProjects } from '@/lib/claude-reader';

export const dynamic = 'force-dynamic';

export default async function SessionsPage() {
  const { sessions } = await getSessions({ limit: 50, page: 1 });
  const projects = await getProjects();

  return (
    <div className="flex flex-col w-full min-w-0">
      <Header title="Sessions" description="All Claude Code conversations" />

      <div className="p-4 sm:p-6 w-full min-w-0 overflow-hidden">
        <SessionList initialSessions={sessions} projects={projects} />
      </div>
    </div>
  );
}
