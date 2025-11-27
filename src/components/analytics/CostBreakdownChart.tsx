'use client';

import { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTheme } from 'next-themes';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { ModelStats } from '@/lib/types';
import { formatCost } from '@/lib/cost-calculator';

interface CostBreakdownChartProps {
  data: ModelStats[];
}

export function CostBreakdownChart({ data }: CostBreakdownChartProps) {
  const { resolvedTheme } = useTheme();
  const chartRef = useRef<HighchartsReact.RefObject>(null);
  const isDark = resolvedTheme === 'dark';

  const categories = data.map(m => m.model.split('-').slice(-2).join('-'));

  const options: Highcharts.Options = {
    chart: {
      type: 'bar',
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
      lineColor: isDark ? '#3f3f46' : '#e4e4e7'
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
          return formatCost(this.value as number);
        }
      },
      gridLineColor: isDark ? '#27272a' : '#f4f4f5',
      stackLabels: {
        enabled: true,
        style: {
          color: isDark ? '#a1a1aa' : '#71717a'
        },
        formatter: function() {
          return formatCost(this.total || 0);
        }
      }
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
      formatter: function() {
        return `<b>${this.series.name}</b>: ${formatCost(this.y || 0)}`;
      }
    },
    plotOptions: {
      bar: {
        stacking: 'normal',
        borderRadius: 2
      }
    },
    series: [
      {
        name: 'Input',
        type: 'bar',
        data: data.map(m => (m.tokens.input / 1_000_000) * 3),
        color: '#3b82f6'
      },
      {
        name: 'Output',
        type: 'bar',
        data: data.map(m => (m.tokens.output / 1_000_000) * 15),
        color: '#10b981'
      },
      {
        name: 'Cache',
        type: 'bar',
        data: data.map(m =>
          ((m.tokens.cacheCreation / 1_000_000) * 3.75) +
          ((m.tokens.cacheRead / 1_000_000) * 0.30)
        ),
        color: '#8b5cf6'
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
        <CardTitle>Cost by Model</CardTitle>
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
