'use client';

import { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTheme } from 'next-themes';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { DailyStats } from '@/lib/types';
import { formatCost, formatShortDate } from '@/lib/cost-calculator';

interface DailyTrendChartProps {
  data: DailyStats[];
}

export function DailyTrendChart({ data }: DailyTrendChartProps) {
  const { resolvedTheme } = useTheme();
  const chartRef = useRef<HighchartsReact.RefObject>(null);
  const isDark = resolvedTheme === 'dark';

  const chartData = data.slice(-30);
  const categories = chartData.map(d => formatShortDate(d.date));

  const options: Highcharts.Options = {
    chart: {
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
    yAxis: [
      {
        title: {
          text: 'Cost',
          style: {
            color: isDark ? '#a1a1aa' : '#71717a'
          }
        },
        labels: {
          style: {
            color: isDark ? '#a1a1aa' : '#71717a'
          },
          formatter: function() {
            return formatCost(this.value as number);
          }
        },
        gridLineColor: isDark ? '#27272a' : '#f4f4f5'
      },
      {
        title: {
          text: 'Sessions',
          style: {
            color: isDark ? '#a1a1aa' : '#71717a'
          }
        },
        labels: {
          style: {
            color: isDark ? '#a1a1aa' : '#71717a'
          }
        },
        opposite: true,
        gridLineWidth: 0
      }
    ],
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
    series: [
      {
        name: 'Cost',
        type: 'line',
        data: chartData.map(d => d.cost),
        color: '#3b82f6',
        yAxis: 0,
        marker: {
          enabled: false
        }
      },
      {
        name: 'Sessions',
        type: 'column',
        data: chartData.map(d => d.sessions),
        color: '#10b981',
        yAxis: 1,
        opacity: 0.7
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
    <Card>
      <CardHeader>
        <CardTitle>Daily Cost Trend (Last 30 Days)</CardTitle>
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
