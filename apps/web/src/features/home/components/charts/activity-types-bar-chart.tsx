"use client";

import { EvilBarChart } from "@/shared/components/evilcharts/charts/bar-chart";
import { type ChartConfig } from "@/shared/components/evilcharts/ui/chart";
import type { ActivityFeedItem } from "@sports-system/contracts/activities";

interface ActivityTypesBarChartProps {
  feedItems: ActivityFeedItem[];
}

export function ActivityTypesBarChart({ feedItems }: ActivityTypesBarChartProps) {
  const typeCounts = feedItems.reduce(
    (acc, item) => {
      acc[item.item_type] = (acc[item.item_type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const data = Object.entries(typeCounts).map(([type, count]) => ({
    type: type
      .replace("MATCH_", "")
      .replace("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase()),
    count,
  }));

  const chartConfig = {
    count: {
      label: "Count",
      colors: {
        light: ["#be123c"],
        dark: ["#f43f5e"],
      },
    },
  } satisfies ChartConfig;

  return (
    <EvilBarChart
      isClickable
      className="h-[200px]"
      xDataKey="type"
      barVariant="default"
      data={data}
      chartConfig={chartConfig}
      xAxisProps={{ tickFormatter: (value) => String(value).substring(0, 3) }}
      showBrush
      brushFormatLabel={(value) => String(value).substring(0, 3)}
    />
  );
}
