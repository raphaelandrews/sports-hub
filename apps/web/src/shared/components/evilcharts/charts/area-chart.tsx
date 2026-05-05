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
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { useId, useState, type ComponentProps } from "react";

type ChartProps = ComponentProps<typeof AreaChart>;
type XAxisProps = ComponentProps<typeof XAxis>;
type YAxisProps = ComponentProps<typeof YAxis>;

type AreaVariant = "default" | "gradient";
type StrokeVariant = "solid" | "dashed";
type DotVariant = "default" | "border" | "colored-border";
type ActiveDotVariant = "default" | "colored-border";
type StackType = "default" | "stacked";

type ValidateConfigKeys<TData, TConfig> = {
  [K in keyof TConfig]: K extends keyof TData ? ChartConfig[string] : never;
};

type EvilAreaChartProps<
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
  areaVariant?: AreaVariant;
  strokeVariant?: StrokeVariant;
  dotVariant?: DotVariant;
  activeDotVariant?: ActiveDotVariant;
  stackType?: StackType;
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

export function EvilAreaChart<
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
  areaVariant = "default",
  strokeVariant = "solid",
  dotVariant = "default",
  activeDotVariant = "default",
  stackType = "default",
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
}: EvilAreaChartProps<TData, TConfig>) {
  const [selectedDataKey, setSelectedDataKey] = useState<string | null>(null);
  const chartId = useId().replace(/:/g, "");

  const { visibleData, brushProps } = useEvilBrush({ data });
  const displayData = showBrush && !isLoading ? visibleData : data;

  const handleSelectionChange = (newSelectedDataKey: string | null) => {
    setSelectedDataKey(newSelectedDataKey);
    if (isClickable && onSelectionChange) {
      onSelectionChange(newSelectedDataKey);
    }
  };

  const isStacked = stackType === "stacked";
  const strokeDasharray = strokeVariant === "dashed" ? "5 5" : undefined;

  const getDotProps = (_dataKey: string) => {
    const baseProps: ComponentProps<typeof Area>["dot"] = {
      r: 4,
      strokeWidth: dotVariant === "border" || dotVariant === "colored-border" ? 2 : 0,
    };
    if (dotVariant === "colored-border" || dotVariant === "border") {
      return { ...baseProps, fill: "var(--background)" };
    }
    return baseProps;
  };

  const getActiveDotProps = (_dataKey: string) => {
    const baseProps: ComponentProps<typeof Area>["activeDot"] = {
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
            variant="area"
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
      <AreaChart
        id="evil-charts-area-chart"
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
            <Area
              key={dataKey}
              dataKey={dataKey}
              type="monotone"
              stackId={isStacked ? "evil-stacked" : undefined}
              stroke={`var(--color-${dataKey}-0)`}
              strokeDasharray={strokeDasharray}
              fill={
                areaVariant === "gradient"
                  ? `url(#${chartId}-area-gradient-${dataKey})`
                  : `var(--color-${dataKey}-0)`
              }
              fillOpacity={areaVariant === "gradient" ? 0.4 : 0.2}
              dot={getDotProps(dataKey)}
              activeDot={getActiveDotProps(dataKey)}
              style={isClickable ? { cursor: "pointer" } : undefined}
              onClick={() => {
                if (!isClickable) return;
                handleSelectionChange(selectedDataKey === dataKey ? null : dataKey);
              }}
            />
          ))}
        <defs>
          {Object.keys(chartConfig).map((dataKey) => (
            <linearGradient
              key={`${chartId}-area-gradient-${dataKey}`}
              id={`${chartId}-area-gradient-${dataKey}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={`var(--color-${dataKey}-0)`} stopOpacity={0.4} />
              <stop offset="100%" stopColor={`var(--color-${dataKey}-0)`} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
      </AreaChart>
    </ChartContainer>
  );
}
