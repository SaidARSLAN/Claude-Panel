import { Header } from '@/components/layout/Header';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { getOptimizationAnalysis } from '@/lib/claude-reader';
import { formatCost, formatTokens } from '@/lib/cost-calculator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingDown, Zap, Database, MessageSquare } from 'lucide-react';

export const dynamic = 'force-dynamic';

function getPriorityColor(priority: 'high' | 'medium' | 'low') {
  switch (priority) {
    case 'high': return 'bg-red-100 text-red-800 border-red-200';
    case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
  }
}

function getTypeIcon(type: 'model' | 'prompt' | 'cache' | 'output') {
  switch (type) {
    case 'model': return <Zap className="h-5 w-5" />;
    case 'cache': return <Database className="h-5 w-5" />;
    case 'prompt': return <MessageSquare className="h-5 w-5" />;
    case 'output': return <TrendingDown className="h-5 w-5" />;
  }
}

export default async function OptimizationPage() {
  const analysis = await getOptimizationAnalysis();

  return (
    <div className="flex flex-col w-full min-w-0">
      <Header
        title="Cost Optimization"
        description="Analyze your usage patterns and find ways to reduce costs"
      />

      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 w-full min-w-0 overflow-hidden">
        {/* Summary Stats */}
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Current Total Cost"
            value={formatCost(analysis.totalCurrentCost)}
            description="All time spending"
            icon="coins"
          />
          <StatsCard
            title="Potential Savings"
            value={formatCost(analysis.totalPotentialSavings)}
            description={`${analysis.savingsPercentage.toFixed(1)}% of total`}
            icon="trending-down"
          />
          <StatsCard
            title="Optimization Tips"
            value={analysis.suggestions.length.toString()}
            description="Available recommendations"
            icon="lightbulb"
          />
          <StatsCard
            title="Cache Hit Rate"
            value={`${(analysis.cacheAnalysis.cacheHitRate * 100).toFixed(1)}%`}
            description="Context reuse efficiency"
            icon="database"
          />
        </div>

        {/* Optimization Suggestions */}
        {analysis.suggestions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Top Optimization Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {analysis.suggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className={`p-4 rounded-lg border ${getPriorityColor(suggestion.priority)}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {getTypeIcon(suggestion.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold">{suggestion.title}</h4>
                        <Badge variant="outline" className="uppercase text-xs">
                          {suggestion.priority}
                        </Badge>
                      </div>
                      <p className="text-sm mt-1 opacity-90">{suggestion.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="font-semibold text-green-700">
                          Save {formatCost(suggestion.potentialSavings)}
                        </span>
                        <span className="opacity-75">
                          {suggestion.affectedSessions} sessions affected
                        </span>
                      </div>
                      <p className="text-xs mt-2 opacity-75 italic">
                        {suggestion.implementation}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Two Column Layout */}
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          {/* Most Expensive Patterns */}
          <Card>
            <CardHeader>
              <CardTitle>Most Expensive Prompt Patterns</CardTitle>
            </CardHeader>
            <CardContent>
              {analysis.topExpensivePatterns.length === 0 ? (
                <p className="text-muted-foreground text-sm">No patterns analyzed yet</p>
              ) : (
                <div className="space-y-3">
                  {analysis.topExpensivePatterns.slice(0, 5).map((pattern, index) => (
                    <div key={index} className="p-3 rounded-lg bg-muted/50 border">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-mono truncate flex-1" title={pattern.fullPrompt}>
                          "{pattern.pattern.slice(0, 60)}..."
                        </p>
                        <span className="text-sm font-semibold text-green-600 whitespace-nowrap">
                          {formatCost(pattern.totalCost)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span>{pattern.count}x used</span>
                        <span>{formatTokens(pattern.totalInputTokens)} input</span>
                        <span>{formatTokens(pattern.totalOutputTokens)} output</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Model Usage Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Model Usage Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {analysis.modelUsage.length === 0 ? (
                <p className="text-muted-foreground text-sm">No usage data available</p>
              ) : (
                <div className="space-y-3">
                  {analysis.modelUsage.map((model) => (
                    <div key={model.model} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-mono truncate">{model.model}</span>
                        <span className="font-semibold text-green-600">{formatCost(model.cost)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${model.percentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-12 text-right">
                          {model.percentage.toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {model.sessions} sessions
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Model Suggestions Table */}
        {analysis.modelSuggestions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Model Downgrade Suggestions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-medium">Current Model</th>
                      <th className="text-left p-3 font-medium">Suggested Model</th>
                      <th className="text-right p-3 font-medium">Current Cost</th>
                      <th className="text-right p-3 font-medium">Projected Cost</th>
                      <th className="text-right p-3 font-medium">Savings</th>
                      <th className="text-right p-3 font-medium">Sessions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.modelSuggestions.map((suggestion, index) => (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="p-3 font-mono text-sm">{suggestion.currentModel}</td>
                        <td className="p-3 font-mono text-sm text-primary">{suggestion.suggestedModel}</td>
                        <td className="p-3 text-right">{formatCost(suggestion.currentCost)}</td>
                        <td className="p-3 text-right">{formatCost(suggestion.projectedCost)}</td>
                        <td className="p-3 text-right font-semibold text-green-600">
                          {formatCost(suggestion.savings)}
                        </td>
                        <td className="p-3 text-right">{suggestion.sessionsAffected}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> These are estimates based on your usage patterns.
                  Actual savings may vary depending on task complexity.
                  Complex reasoning tasks benefit from more capable models.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cache Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Cache Efficiency Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Cache Read Tokens</p>
                <p className="text-2xl font-bold">{formatTokens(analysis.cacheAnalysis.totalCacheRead)}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Cache Write Tokens</p>
                <p className="text-2xl font-bold">{formatTokens(analysis.cacheAnalysis.totalCacheWrite)}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Total Input Tokens</p>
                <p className="text-2xl font-bold">{formatTokens(analysis.cacheAnalysis.totalInputTokens)}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Cache Hit Rate</p>
                <p className="text-2xl font-bold">{(analysis.cacheAnalysis.cacheHitRate * 100).toFixed(1)}%</p>
              </div>
            </div>
            {analysis.cacheAnalysis.potentialSavings > 0 && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Potential Cache Savings:</strong> {formatCost(analysis.cacheAnalysis.potentialSavings)} -
                  Improve cache utilization by maintaining consistent system prompts across sessions.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
