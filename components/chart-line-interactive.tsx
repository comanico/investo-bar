"use client";

import * as React from "react";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";

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
  { time: "18:00", heineken: 222, aperol: 150 },
  { time: "18:05", heineken: 97, aperol: 180 },
  { time: "18:10", heineken: 167, aperol: 120 },
  { time: "18:15", heineken: 242, aperol: 260 },
  { time: "18:20", heineken: 373, aperol: 290 },
  { time: "18:25", heineken: 301, aperol: 340 },
  { time: "18:30", heineken: 245, aperol: 180 },
  { time: "18:35", heineken: 409, aperol: 320 },
  { time: "18:40", heineken: 59, aperol: 110 },
  { time: "18:45", heineken: 261, aperol: 190 },
  { time: "18:50", heineken: 327, aperol: 350 },
  { time: "18:55", heineken: 292, aperol: 210 },
  { time: "19:00", heineken: 342, aperol: 380 },
  { time: "19:05", heineken: 137, aperol: 220 },
  { time: "19:10", heineken: 120, aperol: 170 },
  { time: "19:15", heineken: 138, aperol: 190 },
  { time: "19:20", heineken: 446, aperol: 360 },
  { time: "19:25", heineken: 364, aperol: 410 },
  { time: "19:30", heineken: 243, aperol: 180 },
  { time: "19:35", heineken: 89, aperol: 150 },
  { time: "19:40", heineken: 137, aperol: 200 },
  { time: "19:45", heineken: 224, aperol: 170 },
  { time: "19:50", heineken: 138, aperol: 230 },
  { time: "19:55", heineken: 387, aperol: 290 },
  { time: "20:00", heineken: 215, aperol: 250 },
  { time: "20:05", heineken: 75, aperol: 130 },
  { time: "20:10", heineken: 383, aperol: 420 },
  { time: "20:15", heineken: 122, aperol: 180 },
  { time: "20:20", heineken: 315, aperol: 240 },
  { time: "20:25", heineken: 454, aperol: 380 },
  { time: "20:30", heineken: 165, aperol: 220 },
  { time: "20:35", heineken: 293, aperol: 310 },
  { time: "20:40", heineken: 247, aperol: 190 },
  { time: "20:45", heineken: 385, aperol: 420 },
  { time: "20:50", heineken: 481, aperol: 390 },
  { time: "20:55", heineken: 498, aperol: 520 },
  { time: "21:00", heineken: 388, aperol: 300 },
  { time: "21:05", heineken: 149, aperol: 210 },
  { time: "21:10", heineken: 227, aperol: 180 },
  { time: "21:15", heineken: 293, aperol: 330 },
  { time: "21:20", heineken: 335, aperol: 270 },
  { time: "21:25", heineken: 197, aperol: 240 },
  { time: "21:30", heineken: 197, aperol: 160 },
  { time: "21:35", heineken: 448, aperol: 490 },
  { time: "21:40", heineken: 473, aperol: 380 },
  { time: "21:45", heineken: 338, aperol: 400 },
  { time: "21:50", heineken: 499, aperol: 420 },
  { time: "21:55", heineken: 315, aperol: 350 },
];

const chartConfig = {
  views: {
    label: "Page Views",
  },
  heineken: {
    label: "Heineken Units Sold",
    color: "var(--chart-1)",
  },
  aperol: {
    label: "Aperol Units Sold",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export function ChartLineInteractive() {
  const [activeChart, setActiveChart] =
    React.useState<keyof typeof chartConfig>("heineken");

  const total = React.useMemo(
    () => ({
      heineken: chartData.reduce((acc, curr) => acc + curr.heineken, 0),
      aperol: chartData.reduce((acc, curr) => acc + curr.aperol, 0),
    }),
    []
  );

  return (
    <Card className="py-4 sm:py-0">
      <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pb-3 sm:pb-0">
          {" "}
          <CardTitle>Inventory Price Updates</CardTitle>
          <CardDescription>
            Showing Price Fluctuations from Market Open (18:00) to Market Close.
          </CardDescription>
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
