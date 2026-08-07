"use client";

import * as React from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export const description = "An interactive line chart";

const chartData = [
  {
    time: "18:00",
    heineken: 6.62,
    aperol: 6.89,
  },
  {
    time: "18:05",
    heineken: 7.51,
    aperol: 6.25,
  },
  {
    time: "18:10",
    heineken: 7.89,
    aperol: 6.25,
  },
  {
    time: "18:15",
    heineken: 8.53,
    aperol: 6.25,
  },
  {
    time: "18:20",
    heineken: 9.49,
    aperol: 6.25,
  },
  {
    time: "18:25",
    heineken: 8.97,
    aperol: 6.6,
  },
  {
    time: "18:30",
    heineken: 6.3,
    aperol: 7.25,
  },
  {
    time: "18:35",
    heineken: 6.62,
    aperol: 6.89,
  },
  {
    time: "18:40",
    heineken: 6.67,
    aperol: 6.84,
  },
  {
    time: "18:45",
    heineken: 6.67,
    aperol: 6.84,
  },
  {
    time: "18:50",
    heineken: 6.84,
    aperol: 6.67,
  },
  {
    time: "18:55",
    heineken: 6.11,
    aperol: 7.38,
  },
  {
    time: "19:00",
    heineken: 5.32,
    aperol: 8.34,
  },
  {
    time: "19:05",
    heineken: 5.98,
    aperol: 7.3,
  },
  {
    time: "19:10",
    heineken: 5.72,
    aperol: 7.61,
  },
  {
    time: "19:15",
    heineken: 5.3,
    aperol: 8.56,
  },
  {
    time: "19:20",
    heineken: 5.3,
    aperol: 9.84,
  },
  {
    time: "19:25",
    heineken: 5.38,
    aperol: 9.69,
  },
  {
    time: "19:30",
    heineken: 5.31,
    aperol: 9.81,
  },
  {
    time: "19:35",
    heineken: 5.85,
    aperol: 8.8,
  },
  {
    time: "19:40",
    heineken: 5.69,
    aperol: 9.04,
  },
  {
    time: "19:45",
    heineken: 5.72,
    aperol: 8.99,
  },
  {
    time: "19:50",
    heineken: 5.72,
    aperol: 8.99,
  },
  {
    time: "19:55",
    heineken: 6.01,
    aperol: 8.54,
  },
  {
    time: "20:00",
    heineken: 6.16,
    aperol: 8.33,
  },
  {
    time: "20:05",
    heineken: 6.43,
    aperol: 7.96,
  },
  {
    time: "20:10",
    heineken: 6.69,
    aperol: 7.64,
  },
  {
    time: "20:15",
    heineken: 6.09,
    aperol: 8.33,
  },
  {
    time: "20:20",
    heineken: 5.61,
    aperol: 8.99,
  },
  {
    time: "20:25",
    heineken: 5.98,
    aperol: 8.4,
  },
  {
    time: "20:30",
    heineken: 6.16,
    aperol: 8.15,
  },
  {
    time: "20:35",
    heineken: 5.98,
    aperol: 8.39,
  },
  {
    time: "20:40",
    heineken: 6.62,
    aperol: 7.49,
  },
  {
    time: "20:45",
    heineken: 6.72,
    aperol: 7.38,
  },
  {
    time: "20:50",
    heineken: 6.58,
    aperol: 7.54,
  },
  {
    time: "20:55",
    heineken: 6.88,
    aperol: 7.2,
  },
  {
    time: "21:00",
    heineken: 7.2,
    aperol: 6.87,
  },
  {
    time: "21:05",
    heineken: 7.2,
    aperol: 6.87,
  },
  {
    time: "21:10",
    heineken: 6.3,
    aperol: 7.73,
  },
  {
    time: "21:15",
    heineken: 6.55,
    aperol: 7.42,
  },
  {
    time: "21:20",
    heineken: 6.67,
    aperol: 7.29,
  },
  {
    time: "21:25",
    heineken: 6.34,
    aperol: 7.65,
  },
  {
    time: "21:30",
    heineken: 6.49,
    aperol: 7.47,
  },
  {
    time: "21:35",
    heineken: 6.23,
    aperol: 7.76,
  },
  {
    time: "21:40",
    heineken: 6.23,
    aperol: 7.76,
  },
  {
    time: "21:45",
    heineken: 5.56,
    aperol: 8.59,
  },
  {
    time: "21:50",
    heineken: 6.39,
    aperol: 7.3,
  },
  {
    time: "21:55",
    heineken: 6.71,
    aperol: 6.94,
  },
];

const chartConfig = {
  views: {
    label: "Price",
  },
  heineken: {
    label: "Heineken Price",
    color: "var(--chart-1)",
  },
  aperol: {
    label: "Aperol Price",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export function ChartLineInteractive() {
  const [activeChart, setActiveChart] =
    React.useState<keyof typeof chartConfig>("heineken");

  const total = React.useMemo(
    () => ({
      heineken:
        chartData.length > 0 ? chartData[chartData.length - 1].heineken : 0,
      aperol: chartData.length > 0 ? chartData[chartData.length - 1].aperol : 0,
    }),
    []
  );

  return (
    <Card className="py-4 sm:py-0">
      <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pb-3 sm:pb-0">
          {" "}
          <CardTitle>Inventory Price Updates</CardTitle>
          <CardDescription>Showing Price Fluctuations</CardDescription>
        </div>
        <div className="flex">
          {["heineken", "aperol"].map((key) => {
            const chart = key as keyof typeof chartConfig;
            return (
              <button
                key={chart}
                data-active={activeChart === chart}
                className="data-[active=true]:bg-muted/50 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6"
                onClick={() => setActiveChart(chart)}
              >
                <span className="text-muted-foreground text-xs">
                  {chartConfig[chart].label}
                </span>
                <span className="text-lg leading-none font-bold sm:text-3xl">
                  {total[key as keyof typeof total].toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />{" "}
            <XAxis
              dataKey="time"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => value}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.toFixed(2)}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  nameKey="views"
                  labelFormatter={(value) => `Time: ${value}`}
                />
              }
            />
            <Line
              dataKey={activeChart}
              type="monotone"
              stroke={`var(--color-${activeChart})`}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
