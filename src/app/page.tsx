import { Header } from '@/components/layout/Header';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { RecentSessions } from '@/components/dashboard/RecentSessions';
import { TokenUsageChart } from '@/components/dashboard/TokenUsageChart';
import { ProjectDistribution } from '@/components/dashboard/ProjectDistribution';
import { getDashboardStats, getAnalytics } from '@/lib/claude-reader';
import { formatCost, formatTokens, formatDuration } from '@/lib/cost-calculator';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  const analytics = await getAnalytics();

  return (
    <div className="flex flex-col w-full min-w-0">
      <Header title="Dashboard" description="Claude Code usage overview" />

      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 w-full min-w-0 overflow-hidden">
        {/* Stats Cards */}
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Sessions"
            value={stats.totalSessions.toString()}
            description="All time sessions"
            icon="message-square"
          />
          <StatsCard
            title="Total Tokens"
            value={formatTokens(stats.totalTokens)}
            description="Input + Output + Cache"
            icon="zap"
          />
          <StatsCard
            title="Total Cost"
            value={formatCost(stats.totalCost)}
            description="Estimated USD"
            icon="coins"
          />
          <StatsCard
            title="Total Time"
            value={formatDuration(stats.totalDuration)}
            description="Active session time"
            icon="clock"
          />
        </div>

        {/* Charts */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-3">
          <TokenUsageChart data={analytics.dailyStats} />
          <ProjectDistribution data={stats.projectStats} />
        </div>

        {/* Recent Sessions */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-3">
          <RecentSessions sessions={stats.recentSessions} />
        </div>
      </div>
    </div>
  );
}
