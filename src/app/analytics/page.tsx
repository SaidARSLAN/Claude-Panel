import { Header } from '@/components/layout/Header';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { TokenUsageChart } from '@/components/dashboard/TokenUsageChart';
import { CostBreakdownChart } from '@/components/analytics/CostBreakdownChart';
import { DailyTrendChart } from '@/components/analytics/DailyTrendChart';
import { ProjectComparisonChart } from '@/components/analytics/ProjectComparisonChart';
import { getAnalytics } from '@/lib/claude-reader';
import { formatCost, formatTokens, formatDuration } from '@/lib/cost-calculator';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const analytics = await getAnalytics();

  // Calculate averages
  const avgTokensPerSession = analytics.totalSessions > 0
    ? Math.round(analytics.totalTokens / analytics.totalSessions)
    : 0;
  const avgCostPerSession = analytics.totalSessions > 0
    ? analytics.totalCost / analytics.totalSessions
    : 0;

  return (
    <div className="flex flex-col w-full min-w-0">
      <Header title="Analytics" description="Detailed usage statistics" />

      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 w-full min-w-0 overflow-hidden">
        {/* Summary Stats */}
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Sessions"
            value={analytics.totalSessions.toString()}
            description="All time"
            icon="bar-chart"
          />
          <StatsCard
            title="Total Tokens"
            value={formatTokens(analytics.totalTokens)}
            description={`Avg: ${formatTokens(avgTokensPerSession)}/session`}
            icon="zap"
          />
          <StatsCard
            title="Total Cost"
            value={formatCost(analytics.totalCost)}
            description={`Avg: ${formatCost(avgCostPerSession)}/session`}
            icon="coins"
          />
          <StatsCard
            title="Total Time"
            value={formatDuration(analytics.totalDuration)}
            description="Active session time"
            icon="clock"
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
          <TokenUsageChart data={analytics.dailyStats} />
          <DailyTrendChart data={analytics.dailyStats} />
        </div>

        {/* Charts Row 2 */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
          <CostBreakdownChart data={analytics.modelStats} />
          <ProjectComparisonChart data={analytics.projectStats} />
        </div>

        {/* Model Statistics Table */}
        <div className="rounded-lg border">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Model Statistics</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">Model</th>
                  <th className="text-right p-3 font-medium">Sessions</th>
                  <th className="text-right p-3 font-medium">Input Tokens</th>
                  <th className="text-right p-3 font-medium">Output Tokens</th>
                  <th className="text-right p-3 font-medium">Cache Tokens</th>
                  <th className="text-right p-3 font-medium">Cost</th>
                </tr>
              </thead>
              <tbody>
                {analytics.modelStats.map((model) => (
                  <tr key={model.model} className="border-b hover:bg-muted/50">
                    <td className="p-3 font-mono text-sm">{model.model}</td>
                    <td className="p-3 text-right">{model.sessions}</td>
                    <td className="p-3 text-right">{formatTokens(model.tokens.input)}</td>
                    <td className="p-3 text-right">{formatTokens(model.tokens.output)}</td>
                    <td className="p-3 text-right">
                      {formatTokens(model.tokens.cacheCreation + model.tokens.cacheRead)}
                    </td>
                    <td className="p-3 text-right font-semibold text-green-600">
                      {formatCost(model.cost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Project Statistics Table */}
        <div className="rounded-lg border">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Project Statistics</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">Project</th>
                  <th className="text-right p-3 font-medium">Sessions</th>
                  <th className="text-right p-3 font-medium">Tokens</th>
                  <th className="text-right p-3 font-medium">Duration</th>
                  <th className="text-right p-3 font-medium">Cost</th>
                </tr>
              </thead>
              <tbody>
                {analytics.projectStats.map((project) => (
                  <tr key={project.name} className="border-b hover:bg-muted/50">
                    <td className="p-3 font-medium">{project.name}</td>
                    <td className="p-3 text-right">{project.sessions}</td>
                    <td className="p-3 text-right">{formatTokens(project.tokens)}</td>
                    <td className="p-3 text-right">{formatDuration(project.duration)}</td>
                    <td className="p-3 text-right font-semibold text-green-600">
                      {formatCost(project.cost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
