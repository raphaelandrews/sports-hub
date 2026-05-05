"use client";

import { EvilComposedChart } from "@/shared/components/evilcharts/charts/composed-chart";
import { type ChartConfig } from "@/shared/components/evilcharts/ui/chart";
import type { components } from "@/types/api.gen";

type League = components["schemas"]["LeagueResponse"];

interface MonthlyLeaguesComposedChartProps {
  leagues: League[];
}

export function MonthlyLeaguesComposedChart({ leagues }: MonthlyLeaguesComposedChartProps) {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const monthLabels: string[] = [];
  const monthData: Record<string, { count: number; totalMembers: number }> = {};

  for (let i = 0; i < 6; i++) {
    const d = new Date(sixMonthsAgo.getFullYear(), sixMonthsAgo.getMonth() + i, 1);
    const key = d.toISOString().slice(0, 7);
    monthLabels.push(key);
    monthData[key] = { count: 0, totalMembers: 0 };
  }

  leagues.forEach((league) => {
    const key = league.created_at.slice(0, 7);
    if (monthData[key] !== undefined) {
      monthData[key].count++;
      monthData[key].totalMembers += league.member_count;
    }
  });

  const data = monthLabels.map((key) => {
    const { count, totalMembers } = monthData[key];
    return {
      month: new Date(key + "-01").toLocaleDateString(undefined, { month: "short" }),
      leagues: count,
      avgMembers: count > 0 ? Math.round(totalMembers / count) : 0,
    };
  });

  const barConfig = {
    leagues: {
      label: "New Leagues",
      colors: {
        light: ["#3b82f6"],
        dark: ["#6A5ACD"],
      },
    },
  } satisfies ChartConfig;

  const lineConfig = {
    avgMembers: {
      label: "Avg Members",
      colors: {
        light: ["#10b981"],
        dark: ["#34d399"],
      },
    },
  } satisfies ChartConfig;

  return (
    <EvilComposedChart
      isClickable
      className="h-[200px]"
      xDataKey="month"
      data={data}
      dotVariant="colored-border"
      barConfig={barConfig}
      lineConfig={lineConfig}
      xAxisProps={{ tickFormatter: (value: unknown) => String(value).substring(0, 3) }}
      showBrush
      brushFormatLabel={(value: unknown) => String(value).substring(0, 3)}
    />
  );
}
