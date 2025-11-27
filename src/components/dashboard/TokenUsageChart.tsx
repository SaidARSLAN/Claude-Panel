'use client';

import { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTheme } from 'next-themes';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { DailyStats } from '@/lib/types';
import { formatShortDate } from '@/lib/cost-calculator';

interface TokenUsageChartProps {
  data: DailyStats[];
}

export function TokenUsageChart({ data }: TokenUsageChartProps) {
  const { theme, resolvedTheme } = useTheme();
  const chartRef = useRef<HighchartsReact.RefObject>(null);
  const isDark = resolvedTheme === 'dark';

  const chartData = data.slice(-30);
  const categories = chartData.map(d => formatShortDate(d.date));

  const options: Highcharts.Options = {
    chart: {
      type: 'area',
      backgroundColor: 'transparent',
      style: {
        fontFamily: 'inherit'
      }
    },
    title: {
      text: undefined
    },
    xAxis: {
      categories,
      labels: {
        style: {
          color: isDark ? '#a1a1aa' : '#71717a'
        }
      },
      lineColor: isDark ? '#3f3f46' : '#e4e4e7',
      tickColor: isDark ? '#3f3f46' : '#e4e4e7'
    },
    yAxis: {
      title: {
        text: undefined
      },
      labels: {
        style: {
          color: isDark ? '#a1a1aa' : '#71717a'
        },
        formatter: function() {
          const val = this.value as number;
          if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
          if (val >= 1000) return (val / 1000).toFixed(0) + 'K';
          return val.toString();
        }
      },
      gridLineColor: isDark ? '#27272a' : '#f4f4f5'
    },
    legend: {
      itemStyle: {
        color: isDark ? '#a1a1aa' : '#71717a'
      },
      itemHoverStyle: {
        color: isDark ? '#fafafa' : '#18181b'
      }
    },
    tooltip: {
      backgroundColor: isDark ? '#27272a' : '#ffffff',
      borderColor: isDark ? '#3f3f46' : '#e4e4e7',
      style: {
        color: isDark ? '#fafafa' : '#18181b'
      },
      shared: true
    },
    plotOptions: {
      area: {
        stacking: 'normal',
        lineWidth: 1,
        marker: {
          enabled: false
        }
      }
    },
    series: [
      {
        name: 'Input',
        type: 'area',
        data: chartData.map(d => d.tokens.input),
        color: '#3b82f6',
        fillOpacity: 0.5
      },
      {
        name: 'Output',
        type: 'area',
        data: chartData.map(d => d.tokens.output),
        color: '#10b981',
        fillOpacity: 0.5
      },
      {
        name: 'Cache',
        type: 'area',
        data: chartData.map(d => d.tokens.cacheRead + d.tokens.cacheCreation),
        color: '#8b5cf6',
        fillOpacity: 0.5
      }
    ],
    credits: {
      enabled: false
    }
  };

  useEffect(() => {
    if (chartRef.current?.chart) {
      chartRef.current.chart.reflow();
    }
  }, [isDark]);

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Token Usage (Last 30 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <HighchartsReact
            highcharts={Highcharts}
            options={options}
            ref={chartRef}
          />
        </div>
      </CardContent>
    </Card>
  );
}
