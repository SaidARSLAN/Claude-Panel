import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DailyTrendChart } from '@/components/analytics/DailyTrendChart';
import { getAnalytics } from '@/lib/claude-reader';
import { formatCost, formatTokens, formatDuration } from '@/lib/cost-calculator';
import { MODEL_PRICING } from '@/lib/cost-calculator';
import { Coins, TrendingUp, Calculator, Info } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function CostsPage() {
  const analytics = await getAnalytics();

  // Calculate this month and last month costs
  const now = new Date();
  const thisMonth = now.toISOString().slice(0, 7);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 7);

  const thisMonthStats = analytics.dailyStats.filter(d => d.date.startsWith(thisMonth));
  const lastMonthStats = analytics.dailyStats.filter(d => d.date.startsWith(lastMonth));

  const thisMonthCost = thisMonthStats.reduce((sum, d) => sum + d.cost, 0);
  const lastMonthCost = lastMonthStats.reduce((sum, d) => sum + d.cost, 0);

  const costChange = lastMonthCost > 0
    ? ((thisMonthCost - lastMonthCost) / lastMonthCost) * 100
    : 0;

  // Calculate cost breakdown by type
  let totalInputCost = 0;
  let totalOutputCost = 0;
  let totalCacheWriteCost = 0;
  let totalCacheReadCost = 0;

  for (const model of analytics.modelStats) {
    const pricing = MODEL_PRICING[model.model] || MODEL_PRICING['default'];
    totalInputCost += (model.tokens.input / 1_000_000) * pricing.input;
    totalOutputCost += (model.tokens.output / 1_000_000) * pricing.output;
    totalCacheWriteCost += (model.tokens.cacheCreation / 1_000_000) * pricing.cacheWrite;
    totalCacheReadCost += (model.tokens.cacheRead / 1_000_000) * pricing.cacheRead;
  }

  return (
    <div className="flex flex-col w-full min-w-0">
      <Header title="Costs" description="Cost analysis and details" />

      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 w-full min-w-0 overflow-hidden">
        {/* Summary Cards */}
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
              <Coins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCost(analytics.totalCost)}
              </div>
              <p className="text-xs text-muted-foreground">
                All time
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCost(thisMonthCost)}</div>
              <p className={`text-xs ${costChange >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                {costChange >= 0 ? '+' : ''}{costChange.toFixed(1)}% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Month</CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCost(lastMonthCost)}</div>
              <p className="text-xs text-muted-foreground">
                Previous billing period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg/Session</CardTitle>
              <Info className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCost(analytics.totalCost / Math.max(analytics.totalSessions, 1))}
              </div>
              <p className="text-xs text-muted-foreground">
                Per session average
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Daily Trend */}
        <DailyTrendChart data={analytics.dailyStats} />

        {/* Cost Breakdown by Type */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Cost Breakdown by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Input Tokens</span>
                  <span className="font-semibold">{formatCost(totalInputCost)}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-chart-1 rounded-full"
                    style={{
                      width: `${(totalInputCost / analytics.totalCost) * 100}%`
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {((totalInputCost / analytics.totalCost) * 100).toFixed(1)}% of total
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Output Tokens</span>
                  <span className="font-semibold">{formatCost(totalOutputCost)}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-chart-2 rounded-full"
                    style={{
                      width: `${(totalOutputCost / analytics.totalCost) * 100}%`
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {((totalOutputCost / analytics.totalCost) * 100).toFixed(1)}% of total
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Cache Write</span>
                  <span className="font-semibold">{formatCost(totalCacheWriteCost)}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-chart-3 rounded-full"
                    style={{
                      width: `${(totalCacheWriteCost / analytics.totalCost) * 100}%`
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {((totalCacheWriteCost / analytics.totalCost) * 100).toFixed(1)}% of total
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Cache Read</span>
                  <span className="font-semibold">{formatCost(totalCacheReadCost)}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-chart-4 rounded-full"
                    style={{
                      width: `${(totalCacheReadCost / analytics.totalCost) * 100}%`
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {((totalCacheReadCost / analytics.totalCost) * 100).toFixed(1)}% of total
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Model Pricing Reference */}
        <Card>
          <CardHeader>
            <CardTitle>Model Pricing Reference</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">Model</th>
                    <th className="text-right p-3 font-medium">Input (per 1M)</th>
                    <th className="text-right p-3 font-medium">Output (per 1M)</th>
                    <th className="text-right p-3 font-medium">Cache Write (per 1M)</th>
                    <th className="text-right p-3 font-medium">Cache Read (per 1M)</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(MODEL_PRICING)
                    .filter(([key]) => key !== 'default')
                    .map(([model, pricing]) => (
                      <tr key={model} className="border-b hover:bg-muted/50">
                        <td className="p-3 font-mono text-sm">{model}</td>
                        <td className="p-3 text-right">${pricing.input.toFixed(2)}</td>
                        <td className="p-3 text-right">${pricing.output.toFixed(2)}</td>
                        <td className="p-3 text-right">${pricing.cacheWrite.toFixed(2)}</td>
                        <td className="p-3 text-right">${pricing.cacheRead.toFixed(2)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Project Costs */}
        <Card>
          <CardHeader>
            <CardTitle>Cost by Project</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.projectStats.slice(0, 10).map((project) => (
                <div key={project.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{project.name}</span>
                    <span className="font-semibold text-green-600">{formatCost(project.cost)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{
                        width: `${(project.cost / analytics.totalCost) * 100}%`
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{project.sessions} sessions</span>
                    <span>{formatTokens(project.tokens)} tokens</span>
                    <span>{formatDuration(project.duration)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
