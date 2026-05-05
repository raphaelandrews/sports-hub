"use client";

import { EvilAreaChart } from "@/shared/components/evilcharts/charts/area-chart";
import { type ChartConfig } from "@/shared/components/evilcharts/ui/chart";
import type { components } from "@/types/api.gen";

type League = components["schemas"]["LeagueResponse"];

interface LeagueGrowthAreaChartProps {
  leagues: League[];
}

export function LeagueGrowthAreaChart({ leagues }: LeagueGrowthAreaChartProps) {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const monthLabels: string[] = [];
  const monthCounts: Record<string, number> = {};

  for (let i = 0; i < 6; i++) {
    const d = new Date(sixMonthsAgo.getFullYear(), sixMonthsAgo.getMonth() + i, 1);
    const key = d.toISOString().slice(0, 7);
    monthLabels.push(key);
    monthCounts[key] = 0;
  }

  leagues.forEach((league) => {
    const key = league.created_at.slice(0, 7);
    if (monthCounts[key] !== undefined) {
      monthCounts[key]++;
    }
  });

  let cumulative = 0;
  const data = monthLabels.map((key) => {
    cumulative += monthCounts[key];
    return {
      month: new Date(key + "-01").toLocaleDateString(undefined, { month: "short" }),
      leagues: cumulative,
    };
  });

  const chartConfig = {
    leagues: {
      label: "Leagues",
      colors: {
        light: ["#3b82f6"],
        dark: ["#60a5fa"],
      },
    },
  } satisfies ChartConfig;

  return (
    <EvilAreaChart
      showBrush
      isClickable
      className="h-[200px]"
      xDataKey="month"
      stackType="stacked"
      strokeVariant="solid"
      areaVariant="gradient"
      activeDotVariant="colored-border"
      dotVariant="border"
      data={data}
      chartConfig={chartConfig}
      brushFormatLabel={(value: unknown) => String(value).substring(0, 3)}
      xAxisProps={{ tickFormatter: (value: string) => value.substring(0, 3) }}
    />
  );
}
