'use client';

import { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTheme } from 'next-themes';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { ProjectStats } from '@/lib/types';
import { formatCost } from '@/lib/cost-calculator';

interface ProjectDistributionProps {
  data: ProjectStats[];
}

export function ProjectDistribution({ data }: ProjectDistributionProps) {
  const { resolvedTheme } = useTheme();
  const chartRef = useRef<HighchartsReact.RefObject>(null);
  const isDark = resolvedTheme === 'dark';

  const chartData = data.slice(0, 5).map(p => ({
    name: p.name,
    y: p.cost,
    sessions: p.sessions
  }));

  const options: Highcharts.Options = {
    chart: {
      type: 'pie',
      backgroundColor: 'transparent',
      style: {
        fontFamily: 'inherit'
      }
    },
    title: {
      text: undefined
    },
    tooltip: {
      backgroundColor: isDark ? '#27272a' : '#ffffff',
      borderColor: isDark ? '#3f3f46' : '#e4e4e7',
      style: {
        color: isDark ? '#fafafa' : '#18181b'
      },
      pointFormatter: function() {
        return `<b>${formatCost(this.y || 0)}</b> (${((this.percentage || 0)).toFixed(1)}%)`;
      }
    },
    plotOptions: {
      pie: {
        innerSize: '50%',
        dataLabels: {
          enabled: true,
          format: '{point.name}',
          style: {
            color: isDark ? '#a1a1aa' : '#71717a',
            textOutline: 'none',
            fontWeight: 'normal'
          },
          distance: 20
        },
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
      }
    },
    series: [{
      name: 'Cost',
      type: 'pie',
      data: chartData
    }],
    legend: {
      enabled: false
    },
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
