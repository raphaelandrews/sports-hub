"use client";

import { EvilLineChart } from "@/shared/components/evilcharts/charts/line-chart";
import { type ChartConfig } from "@/shared/components/evilcharts/ui/chart";
import type { ActivityFeedItem } from "@sports-system/contracts/activities";

interface ActivityTimelineLineChartProps {
  feedItems: ActivityFeedItem[];
}

export function ActivityTimelineLineChart({ feedItems }: ActivityTimelineLineChartProps) {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const dayLabels: string[] = [];
  const dayCounts: Record<string, number> = {};

  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo);
    d.setDate(sevenDaysAgo.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    dayLabels.push(key);
    dayCounts[key] = 0;
  }

  feedItems.forEach((item) => {
    const key = item.created_at.slice(0, 10);
    if (dayCounts[key] !== undefined) {
      dayCounts[key]++;
    }
  });

  const data = dayLabels.map((key) => ({
    day: new Date(key).toLocaleDateString(undefined, { weekday: "short" }),
    activities: dayCounts[key],
  }));

  const chartConfig = {
    activities: {
      label: "Activities",
      colors: {
        light: ["#047857"],
        dark: ["#10b981"],
      },
    },
  } satisfies ChartConfig;

  return (
    <EvilLineChart
      isClickable
      className="h-[200px]"
      xDataKey="day"
      strokeVariant="solid"
      activeDotVariant="colored-border"
      dotVariant="border"
      data={data}
      chartConfig={chartConfig}
      xAxisProps={{ tickFormatter: (value: unknown) => String(value).substring(0, 3) }}
      showBrush
      brushFormatLabel={(value: unknown) => String(value).substring(0, 3)}
    />
  );
}
