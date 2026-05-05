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
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { useState, type ComponentProps } from "react";

type ChartProps = ComponentProps<typeof LineChart>;
type XAxisProps = ComponentProps<typeof XAxis>;
type YAxisProps = ComponentProps<typeof YAxis>;

type StrokeVariant = "solid" | "dashed";
type DotVariant = "default" | "border" | "colored-border";
type ActiveDotVariant = "default" | "colored-border";

type ValidateConfigKeys<TData, TConfig> = {
  [K in keyof TConfig]: K extends keyof TData ? ChartConfig[string] : never;
};

type EvilLineChartProps<
  TData extends Record<string, unknown>,
  TConfig extends Record<string, ChartConfig[string]>,
> = {
  chartConfig: TConfig & ValidateConfigKeys<TData, TConfig>;
  data: TData[];
  xDataKey?: keyof TData & string;
  yDataKey?: keyof TData & string;
  className?: string;
  chartProps?: ChartProps;
  xAxisProps?: XAxisProps;
  yAxisProps?: YAxisProps;
  strokeVariant?: StrokeVariant;
  dotVariant?: DotVariant;
  activeDotVariant?: ActiveDotVariant;
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

export function EvilLineChart<
  TData extends Record<string, unknown>,
  TConfig extends Record<string, ChartConfig[string]>,
>({
  chartConfig,
  data,
  xDataKey,
  yDataKey,
  className,
  chartProps,
  xAxisProps,
  yAxisProps,
  strokeVariant = "solid",
  dotVariant = "default",
  activeDotVariant = "default",
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
}: EvilLineChartProps<TData, TConfig>) {
  const [selectedDataKey, setSelectedDataKey] = useState<string | null>(null);

  const { visibleData, brushProps } = useEvilBrush({ data });
  const displayData = showBrush && !isLoading ? visibleData : data;

  const handleSelectionChange = (newSelectedDataKey: string | null) => {
    setSelectedDataKey(newSelectedDataKey);
    if (isClickable && onSelectionChange) {
      onSelectionChange(newSelectedDataKey);
    }
  };

  const strokeDasharray = strokeVariant === "dashed" ? "5 5" : undefined;

  const getDotProps = (_dataKey: string) => {
    const baseProps: ComponentProps<typeof Line>["dot"] = {
      r: 4,
      strokeWidth: dotVariant === "border" || dotVariant === "colored-border" ? 2 : 0,
    };
    if (dotVariant === "colored-border" || dotVariant === "border") {
      return { ...baseProps, fill: "var(--background)" };
    }
    return baseProps;
  };

  const getActiveDotProps = (_dataKey: string) => {
    const baseProps: ComponentProps<typeof Line>["activeDot"] = {
      r: 6,
      strokeWidth: activeDotVariant === "colored-border" ? 2 : 0,
    };
    if (activeDotVariant === "colored-border") {
      return { ...baseProps, fill: "var(--background)" };
    }
    return baseProps;
  };

  return (
    <ChartContainer
      className={className}
      config={chartConfig}
      footer={
        showBrush && !isLoading ? (
          <EvilBrush
            data={data}
            chartConfig={chartConfig}
            xDataKey={xDataKey}
            variant="line"
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
      <LineChart
        id="evil-charts-line-chart"
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
          Object.keys(chartConfig).map((dataKey) => (
            <Line
              key={dataKey}
              dataKey={dataKey}
              type="monotone"
              stroke={`var(--color-${dataKey}-0)`}
              strokeDasharray={strokeDasharray}
              strokeWidth={2}
              dot={getDotProps(dataKey)}
              activeDot={getActiveDotProps(dataKey)}
              style={isClickable ? { cursor: "pointer" } : undefined}
              onClick={() => {
                if (!isClickable) return;
                handleSelectionChange(selectedDataKey === dataKey ? null : dataKey);
              }}
            />
          ))}
      </LineChart>
    </ChartContainer>
  );
}
