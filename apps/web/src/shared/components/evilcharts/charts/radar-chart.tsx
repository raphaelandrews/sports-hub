"use client";

import {
  type ChartConfig,
  ChartContainer,
} from "@/shared/components/evilcharts/ui/chart";
import {
  ChartTooltip,
  ChartTooltipContent,
} from "@/shared/components/evilcharts/ui/tooltip";
import { ChartLegend, ChartLegendContent } from "@/shared/components/evilcharts/ui/legend";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import { useState } from "react";

type RadarVariant = "default" | "filled";
type DotVariant = "default" | "border" | "colored-border";
type ActiveDotVariant = "default" | "colored-border";

type EvilRadarChartProps<TData extends Record<string, unknown>> = {
  data: TData[];
  dataKey: keyof TData & string;
  chartConfig: ChartConfig;
  className?: string;
  variant?: RadarVariant;
  dotVariant?: DotVariant;
  activeDotVariant?: ActiveDotVariant;
  hideTooltip?: boolean;
  hideLegend?: boolean;
  isLoading?: boolean;
} & (
  | { isClickable: true; onSelectionChange?: (selectedDataKey: string | null) => void }
  | { isClickable?: false; onSelectionChange?: never }
);

export function EvilRadarChart<TData extends Record<string, unknown>>({
  data,
  dataKey,
  chartConfig,
  className,
  variant = "default",
  dotVariant = "default",
  activeDotVariant = "default",
  hideTooltip = false,
  hideLegend = false,
  isClickable = false,
  onSelectionChange,
  isLoading = false,
}: EvilRadarChartProps<TData>) {
  const [selectedDataKey, setSelectedDataKey] = useState<string | null>(null);

  const handleSelectionChange = (newSelectedDataKey: string | null) => {
    setSelectedDataKey(newSelectedDataKey);
    if (isClickable && onSelectionChange) {
      onSelectionChange(newSelectedDataKey);
    }
  };

  const getDotProps = () => {
    if (dotVariant === "colored-border" || dotVariant === "border") {
      return { r: 4, strokeWidth: 2, fill: "var(--background)" };
    }
    return { r: 4, strokeWidth: 0 };
  };

  const getActiveDotProps = () => {
    if (activeDotVariant === "colored-border") {
      return { r: 6, strokeWidth: 2, fill: "var(--background)" };
    }
    return { r: 6, strokeWidth: 0 };
  };

  return (
    <ChartContainer className={className} config={chartConfig}>
      <RadarChart
        id="evil-charts-radar-chart"
        accessibilityLayer
        data={data}
        cx="50%"
        cy="50%"
        outerRadius="80%"
      >
        {!hideLegend && (
          <ChartLegend
            verticalAlign="top"
            align="right"
            content={
              <ChartLegendContent
                selected={selectedDataKey}
                onSelectChange={handleSelectionChange}
                isClickable={isClickable}
              />
            }
          />
        )}
        {!hideTooltip && !isLoading && (
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent selected={selectedDataKey} />}
          />
        )}
        <PolarGrid stroke="var(--border)" />
        <PolarAngleAxis
          dataKey={dataKey as string}
          tick={{ fill: "currentColor", fontSize: 12 }}
        />
        <PolarRadiusAxis tick={{ fill: "currentColor", fontSize: 10 }} />
        {!isLoading &&
          Object.keys(chartConfig).map((configKey) => (
            <Radar
              key={configKey}
              name={String(chartConfig[configKey]?.label ?? configKey)}
              dataKey={configKey}
              stroke={`var(--color-${configKey}-0)`}
              fill={variant === "filled" ? `var(--color-${configKey}-0)` : "transparent"}
              fillOpacity={variant === "filled" ? 0.3 : 0}
              strokeWidth={2}
              dot={getDotProps()}
              activeDot={getActiveDotProps()}
            />
          ))}
      </RadarChart>
    </ChartContainer>
  );
}
