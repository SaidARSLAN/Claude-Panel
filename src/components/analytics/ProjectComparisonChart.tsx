'use client';

import { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTheme } from 'next-themes';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { ProjectStats } from '@/lib/types';
import { formatCost } from '@/lib/cost-calculator';

interface ProjectComparisonChartProps {
  data: ProjectStats[];
}

export function ProjectComparisonChart({ data }: ProjectComparisonChartProps) {
  const { resolvedTheme } = useTheme();
  const chartRef = useRef<HighchartsReact.RefObject>(null);
  const isDark = resolvedTheme === 'dark';

  const chartData = data.slice(0, 10);
  const categories = chartData.map(p =>
    p.name.length > 15 ? p.name.slice(0, 15) + '...' : p.name
  );

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
      gridLineColor: isDark ? '#27272a' : '#f4f4f5'
    },
    legend: {
      enabled: false
    },
    tooltip: {
      backgroundColor: isDark ? '#27272a' : '#ffffff',
      borderColor: isDark ? '#3f3f46' : '#e4e4e7',
      style: {
        color: isDark ? '#fafafa' : '#18181b'
      },
      formatter: function() {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sessions = (this as any).point?.sessions || 0;
        return `<b>${this.x}</b><br/>Cost: ${formatCost(this.y || 0)}<br/>Sessions: ${sessions}`;
      }
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        dataLabels: {
          enabled: true,
          formatter: function() {
            return formatCost(this.y || 0);
          },
          style: {
            color: isDark ? '#a1a1aa' : '#71717a',
            textOutline: 'none'
          }
        }
      }
    },
    series: [{
      name: 'Cost',
      type: 'bar',
      data: chartData.map(p => ({
        y: p.cost,
        sessions: p.sessions
      })),
      color: '#3b82f6'
    }],
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
        <CardTitle>Cost by Project</CardTitle>
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
