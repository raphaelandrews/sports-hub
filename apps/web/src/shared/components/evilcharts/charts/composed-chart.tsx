"use client";

import {
  type ChartConfig,
  ChartContainer,
} from "@/shared/components/evilcharts/ui/chart";
import { EvilBrush, useEvilBrush, type EvilBrushRange } from "@/shared/components/evilcharts/ui/evil-brush";
import {
  ChartTooltip,
  ChartTooltipContent,
} from "@/shared/components/evilcharts/ui/tooltip";
import { ChartLegend, ChartLegendContent } from "@/shared/components/evilcharts/ui/legend";
import { Bar, Line, ComposedChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { useState, type ComponentProps } from "react";

type ChartProps = ComponentProps<typeof ComposedChart>;
type XAxisProps = ComponentProps<typeof XAxis>;
type YAxisProps = ComponentProps<typeof YAxis>;

type DotVariant = "default" | "border" | "colored-border";

type EvilComposedChartProps<TData extends Record<string, unknown>> = {
  data: TData[];
  xDataKey?: keyof TData & string;
  yDataKey?: keyof TData & string;
  className?: string;
  chartProps?: ChartProps;
  xAxisProps?: XAxisProps;
  yAxisProps?: YAxisProps;
  barConfig: ChartConfig;
  lineConfig: ChartConfig;
  dotVariant?: DotVariant;
  hideTooltip?: boolean;
  hideCartesianGrid?: boolean;
  hideLegend?: boolean;
  showBrush?: boolean;
  brushHeight?: number;
  brushFormatLabel?: (value: unknown, index: number) => string;
  onBrushChange?: (range: EvilBrushRange) => void;
  isLoading?: boolean;
} & (
  | { isClickable: true; onSelectionChange?: (selectedDataKey: string | null) => void }
  | { isClickable?: false; onSelectionChange?: never }
);

export function EvilComposedChart<TData extends Record<string, unknown>>({
  data,
  xDataKey,
  yDataKey,
  className,
  chartProps,
  xAxisProps,
  yAxisProps,
  barConfig,
  lineConfig,
  dotVariant = "default",
  hideTooltip = false,
  hideCartesianGrid = false,
  hideLegend = false,
  showBrush = false,
  brushHeight,
  brushFormatLabel,
  onBrushChange,
  isClickable = false,
  onSelectionChange,
  isLoading = false,
}: EvilComposedChartProps<TData>) {
  const [selectedDataKey, setSelectedDataKey] = useState<string | null>(null);

  const { visibleData, brushProps } = useEvilBrush({ data });
  const displayData = showBrush && !isLoading ? visibleData : data;

  const handleSelectionChange = (newSelectedDataKey: string | null) => {
    setSelectedDataKey(newSelectedDataKey);
    if (isClickable && onSelectionChange) {
      onSelectionChange(newSelectedDataKey);
    }
  };

  const mergedConfig = { ...barConfig, ...lineConfig };

  const getDotProps = () => {
    const baseProps: ComponentProps<typeof Line>["dot"] = {
      r: 4,
      strokeWidth: dotVariant === "border" || dotVariant === "colored-border" ? 2 : 0,
    };
    if (dotVariant === "colored-border" || dotVariant === "border") {
      return { ...baseProps, fill: "var(--background)" };
    }
    return baseProps;
  };

  return (
    <ChartContainer
      className={className}
      config={mergedConfig}
      footer={
        showBrush && !isLoading ? (
          <EvilBrush
            data={data}
            chartConfig={mergedConfig}
            xDataKey={xDataKey}
            variant="bar"
            height={brushHeight}
            formatLabel={brushFormatLabel}
            skipStyle
            className="mt-1"
            {...brushProps}
            onChange={(range) => {
              brushProps.onChange(range);
              onBrushChange?.(range);
            }}
          />
        ) : null
      }
    >
      <ComposedChart
        id="evil-charts-composed-chart"
        accessibilityLayer
        data={displayData}
        {...chartProps}
      >
        {!hideCartesianGrid && (
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
        )}
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
        {xDataKey && !isLoading && (
          <XAxis
            dataKey={xDataKey}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={8}
            {...xAxisProps}
          />
        )}
        {yDataKey && !isLoading && (
          <YAxis
            dataKey={yDataKey}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={8}
            width="auto"
            {...yAxisProps}
          />
        )}
        {!hideTooltip && !isLoading && (
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent selected={selectedDataKey} />}
          />
        )}
        {!isLoading &&
          Object.keys(barConfig).map((dataKey) => (
            <Bar
              key={dataKey}
              dataKey={dataKey}
              fill={`var(--color-${dataKey}-0)`}
              radius={4}
              style={isClickable ? { cursor: "pointer" } : undefined}
              onClick={() => {
                if (!isClickable) return;
                handleSelectionChange(selectedDataKey === dataKey ? null : dataKey);
              }}
            />
          ))}
        {!isLoading &&
          Object.keys(lineConfig).map((dataKey) => (
            <Line
              key={dataKey}
              dataKey={dataKey}
              type="monotone"
              stroke={`var(--color-${dataKey}-0)`}
              strokeWidth={2}
              dot={getDotProps()}
              style={isClickable ? { cursor: "pointer" } : undefined}
              onClick={() => {
                if (!isClickable) return;
                handleSelectionChange(selectedDataKey === dataKey ? null : dataKey);
              }}
            />
          ))}
      </ComposedChart>
    </ChartContainer>
  );
}
