"use client";

import { EvilRadarChart } from "@/shared/components/evilcharts/charts/radar-chart";
import { type ChartConfig } from "@/shared/components/evilcharts/ui/chart";
import type { ActivityFeedItem } from "@sports-system/contracts/activities";

interface ActivityBySportRadarChartProps {
  feedItems: ActivityFeedItem[];
}

export function ActivityBySportRadarChart({ feedItems }: ActivityBySportRadarChartProps) {
  const sportCounts = feedItems.reduce(
    (acc, item) => {
      const sport = item.sport_name ?? "Unknown";
      acc[sport] = (acc[sport] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const data = Object.entries(sportCounts).map(([sport, count]) => ({
    sport: sport.length > 15 ? sport.slice(0, 15) + "..." : sport,
    count,
  }));

  const chartConfig = {
    count: {
      label: "Activities",
      colors: {
        light: ["#3b82f6"],
        dark: ["#60a5fa"],
      },
    },
  } satisfies ChartConfig;

  return (
    <EvilRadarChart
      isClickable
      className="h-[300px]"
      data={data}
      dataKey="sport"
      dotVariant="colored-border"
      activeDotVariant="default"
      chartConfig={chartConfig}
      variant="filled"
    />
  );
}
