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
  {
    time: "18:00",
    heineken: 6.62,
    aperol: 6.89,
    prosecco: 7.45,
    corona: 6.78,
    cola: 5.92,
  },
  {
    time: "18:05",
    heineken: 7.51,
    aperol: 6.25,
    prosecco: 8.12,
    corona: 5.67,
    cola: 9.34,
  },
  {
    time: "18:10",
    heineken: 7.89,
    aperol: 6.25,
    prosecco: 6.89,
    corona: 7.23,
    cola: 8.56,
  },
  {
    time: "18:15",
    heineken: 8.53,
    aperol: 6.25,
    prosecco: 9.01,
    corona: 6.45,
    cola: 7.12,
  },
  {
    time: "18:20",
    heineken: 9.49,
    aperol: 6.25,
    prosecco: 5.78,
    corona: 8.9,
    cola: 6.34,
  },
  {
    time: "18:25",
    heineken: 8.97,
    aperol: 6.6,
    prosecco: 7.56,
    corona: 9.12,
    cola: 5.89,
  },
  {
    time: "18:30",
    heineken: 6.3,
    aperol: 7.25,
    prosecco: 8.23,
    corona: 7.67,
    cola: 9.45,
  },
  {
    time: "18:35",
    heineken: 6.62,
    aperol: 6.89,
    prosecco: 6.12,
    corona: 5.78,
    cola: 8.01,
  },
  {
    time: "18:40",
    heineken: 6.67,
    aperol: 6.84,
    prosecco: 9.34,
    corona: 6.89,
    cola: 7.23,
  },
  {
    time: "18:45",
    heineken: 6.67,
    aperol: 6.84,
    prosecco: 7.89,
    corona: 8.45,
    cola: 6.56,
  },
  {
    time: "18:50",
    heineken: 6.84,
    aperol: 6.67,
    prosecco: 5.67,
    corona: 9.01,
    cola: 8.78,
  },
  {
    time: "18:55",
    heineken: 6.11,
    aperol: 7.38,
    prosecco: 8.56,
    corona: 7.12,
    cola: 5.9,
  },
  {
    time: "19:00",
    heineken: 5.32,
    aperol: 8.34,
    prosecco: 6.78,
    corona: 8.23,
    cola: 9.12,
  },
  {
    time: "19:05",
    heineken: 5.98,
    aperol: 7.3,
    prosecco: 9.45,
    corona: 6.34,
    cola: 7.67,
  },
  {
    time: "19:10",
    heineken: 5.72,
    aperol: 7.61,
    prosecco: 7.23,
    corona: 5.89,
    cola: 8.45,
  },
  {
    time: "19:15",
    heineken: 5.3,
    aperol: 8.56,
    prosecco: 8.01,
    corona: 9.34,
    cola: 6.12,
  },
  {
    time: "19:20",
    heineken: 5.3,
    aperol: 9.84,
    prosecco: 6.56,
    corona: 7.45,
    cola: 8.9,
  },
  {
    time: "19:25",
    heineken: 5.38,
    aperol: 9.69,
    prosecco: 9.12,
    corona: 8.56,
    cola: 5.78,
  },
  {
    time: "19:30",
    heineken: 5.31,
    aperol: 9.81,
    prosecco: 7.67,
    corona: 6.78,
    cola: 9.01,
  },
  {
    time: "19:35",
    heineken: 5.85,
    aperol: 8.8,
    prosecco: 8.45,
    corona: 5.67,
    cola: 7.23,
  },
  {
    time: "19:40",
    heineken: 5.69,
    aperol: 9.04,
    prosecco: 6.12,
    corona: 8.9,
    cola: 8.56,
  },
  {
    time: "19:45",
    heineken: 5.72,
    aperol: 8.99,
    prosecco: 9.34,
    corona: 7.12,
    cola: 6.45,
  },
  {
    time: "19:50",
    heineken: 5.72,
    aperol: 8.99,
    prosecco: 7.45,
    corona: 9.01,
    cola: 5.89,
  },
  {
    time: "19:55",
    heineken: 6.01,
    aperol: 8.54,
    prosecco: 8.23,
    corona: 6.34,
    cola: 9.12,
  },
  {
    time: "20:00",
    heineken: 6.16,
    aperol: 8.33,
    prosecco: 6.78,
    corona: 8.45,
    cola: 7.67,
  },
  {
    time: "20:05",
    heineken: 6.43,
    aperol: 7.96,
    prosecco: 9.01,
    corona: 5.78,
    cola: 8.23,
  },
  {
    time: "20:10",
    heineken: 6.69,
    aperol: 7.64,
    prosecco: 7.12,
    corona: 9.34,
    cola: 6.56,
  },
  {
    time: "20:15",
    heineken: 6.09,
    aperol: 8.33,
    prosecco: 8.56,
    corona: 7.23,
    cola: 5.9,
  },
  {
    time: "20:20",
    heineken: 5.61,
    aperol: 8.99,
    prosecco: 6.45,
    corona: 8.01,
    cola: 9.45,
  },
  {
    time: "20:25",
    heineken: 5.98,
    aperol: 8.4,
    prosecco: 9.12,
    corona: 6.12,
    cola: 7.12,
  },
  {
    time: "20:30",
    heineken: 6.16,
    aperol: 8.15,
    prosecco: 7.67,
    corona: 8.9,
    cola: 8.56,
  },
  {
    time: "20:35",
    heineken: 5.98,
    aperol: 8.39,
    prosecco: 8.23,
    corona: 5.67,
    cola: 6.78,
  },
  {
    time: "20:40",
    heineken: 6.62,
    aperol: 7.49,
    prosecco: 6.34,
    corona: 9.12,
    cola: 9.01,
  },
  {
    time: "20:45",
    heineken: 6.72,
    aperol: 7.38,
    prosecco: 8.9,
    corona: 7.45,
    cola: 5.89,
  },
  {
    time: "20:50",
    heineken: 6.58,
    aperol: 7.54,
    prosecco: 7.23,
    corona: 8.56,
    cola: 8.23,
  },
  {
    time: "20:55",
    heineken: 6.88,
    aperol: 7.2,
    prosecco: 9.45,
    corona: 6.78,
    cola: 7.67,
  },
  {
    time: "21:00",
    heineken: 7.2,
    aperol: 6.87,
    prosecco: 6.12,
    corona: 9.01,
    cola: 8.45,
  },
  {
    time: "21:05",
    heineken: 7.2,
    aperol: 6.87,
    prosecco: 8.56,
    corona: 7.23,
    cola: 6.34,
  },
  {
    time: "21:10",
    heineken: 6.3,
    aperol: 7.73,
    prosecco: 7.45,
    corona: 8.9,
    cola: 9.12,
  },
  {
    time: "21:15",
    heineken: 6.55,
    aperol: 7.42,
    prosecco: 9.01,
    corona: 6.12,
    cola: 5.78,
  },
  {
    time: "21:20",
    heineken: 6.67,
    aperol: 7.29,
    prosecco: 6.78,
    corona: 8.23,
    cola: 8.56,
  },
  {
    time: "21:25",
    heineken: 6.34,
    aperol: 7.65,
    prosecco: 8.45,
    corona: 7.67,
    cola: 7.23,
  },
  {
    time: "21:30",
    heineken: 6.49,
    aperol: 7.47,
    prosecco: 7.12,
    corona: 9.45,
    cola: 6.45,
  },
  {
    time: "21:35",
    heineken: 6.23,
    aperol: 7.76,
    prosecco: 8.9,
    corona: 5.89,
    cola: 8.01,
  },
  {
    time: "21:40",
    heineken: 6.23,
    aperol: 7.76,
    prosecco: 6.34,
    corona: 8.56,
    cola: 9.34,
  },
  {
    time: "21:45",
    heineken: 5.56,
    aperol: 8.59,
    prosecco: 9.12,
    corona: 7.12,
    cola: 7.45,
  },
  {
    time: "21:50",
    heineken: 6.39,
    aperol: 7.3,
    prosecco: 7.67,
    corona: 8.23,
    cola: 6.78,
  },
  {
    time: "21:55",
    heineken: 6.71,
    aperol: 6.94,
    prosecco: 8.01,
    corona: 9.01,
    cola: 8.9,
  },
];
export default chartData;

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
  corona: {
    label: "Corona Price",
    color: "var(--chart-3)",
  },
  prosecco: {
    label: "Prosecco Price",
    color: "var(--chart-4)",
  },
  cola: {
    label: "Cola Price",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig;

export function ChartApp() {
  const [activeChart, setActiveChart] =
    React.useState<keyof typeof chartConfig>("heineken");

  const total = React.useMemo(
    () => ({
      heineken:
        chartData.length > 0 ? chartData[chartData.length - 1].heineken : 0,
      aperol: chartData.length > 0 ? chartData[chartData.length - 1].aperol : 0,
      prosecco:
        chartData.length > 0 ? chartData[chartData.length - 1].prosecco : 0,
      corona: chartData.length > 0 ? chartData[chartData.length - 1].corona : 0,
      cola: chartData.length > 0 ? chartData[chartData.length - 1].cola : 0,
    }),
    [chartData]
  );

  return (
    <div className="h-screen w-full">
      <Card className="h-full w-full flex flex-col">
        <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
          <div className="flex flex-1 flex-col justify-center gap-1 px-6 pb-3 sm:pb-0">
            <CardTitle>Inventory Price Updates</CardTitle>
            <CardDescription>
              Showing Price Fluctuations from Market Open (18:00) to Market
              Close.
            </CardDescription>
          </div>
          <div className="flex">
            {["heineken", "aperol", "prosecco", "corona", "cola"].map((key) => {
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
        <CardContent className="flex-1 px-2 sm:p-6">
          <ChartContainer
            config={chartConfig}
            className="h-full w-full aspect-auto"
          >
            <LineChart
              accessibilityLayer
              data={chartData}
              margin={{
                left: 12,
                right: 12,
              }}
            >
              <CartesianGrid vertical={false} />
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
    </div>
  );
}
