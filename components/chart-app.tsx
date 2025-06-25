"use client";

import * as React from "react";
import axios from "axios";
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
import Timer from "./timer";

export const description = "An interactive line chart";

interface ChartDataPoint {
  time: string;
  heineken: number;
  corona: number;
  aperol_spritz: number;
  vin_spumant: number;
  vin_alb: number;
  prosecco: number;
  apa_plata: number;
  apa_minerala: number;
  cola: number;
}

const initialChartData = [
  {
    time: "17:00",
    heineken: 7,
    aperol_spritz: 8,
    prosecco: 8,
    corona: 7,
    cola: 6,
    vin_spumant: 7,
    vin_alb: 9,
    apa_plata: 5,
    apa_minerala: 5,
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
  aperol_spritz: {
    label: "Aperol Spritz Price",
    color: "var(--chart-2)",
  },
  prosecco: {
    label: "Prosecco Price",
    color: "var(--chart-3)",
  },
  corona: {
    label: "Corona Price",
    color: "var(--chart-4)",
  },
  cola: {
    label: "Cola Price",
    color: "var(--chart-5)",
  },
  vin_spumant: {
    label: "Vin Spumant Price",
    color: "var(--chart-6)",
  },
  vin_alb: {
    label: "Vin Alb Price",
    color: "var(--chart-7)",
  },
  apa_plata: {
    label: "Apa Plata Price",
    color: "var(--chart-8)",
  },
  apa_minerala: {
    label: "Apa Minerala Price",
    color: "var(--chart-9)",
  },
} satisfies ChartConfig;

export function ChartApp() {
  const [chartData, setChartData] =
    React.useState<ChartDataPoint[]>(initialChartData);
  const [error, setError] = React.useState<string | null>(null);
  const [activeChart, setActiveChart] =
    React.useState<keyof typeof chartConfig>("heineken");
  const [time, setTime] = React.useState<number>(900); // Countdown time in seconds
  const DATA_URL = "https://d2xgbzki9fbs74.cloudfront.net/api/prices.json";

  // Countdown logic
  React.useEffect(() => {
    if (time === 0) {
      return;
    }
    const interval = setInterval(() => {
      setTime((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval); // Cleanup interval
  }, [time]);

  // Fetch data from JSON file and reset timer if new data is longer
  const fetchChartData = async () => {
    try {
      const response = await axios.get<ChartDataPoint[]>(DATA_URL, {
        timeout: 5000,
      });
      console.log("Response status:", response.status);
      console.log("Response data:", response.data);
      if (!response) {
        throw new Error(`HTTP error! status: ${response}`);
      }
      const data: ChartDataPoint[] = await response.data;
      console.log("Fetched chart data:", data);

      // Update chartData and reset timer if fetched data has more entries
      if (data.length > chartData.length) {
        console.log("New data length is greater than current data length");
        setChartData(data);
        setTime(900); // Reset timer to 15:00
      }
      setChartData(chartData);
      setError(null);
    } catch (err) {
      setError("Failed to fetch chart data");
      console.error(axios.isAxiosError(err));
    }
  };

  const yAxisDomain = React.useMemo(() => {
    if (chartData.length === 0) return [0, 10];
    const allValues = chartData.flatMap((point) => [
      point.heineken,
      point.corona,
      point.aperol_spritz,
      point.vin_spumant,
      point.vin_alb,
      point.prosecco,
      point.apa_plata,
      point.apa_minerala,
      point.cola,
    ]);
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    return [Math.floor(min - 0.5), Math.ceil(max + 0.5)];
  }, [chartData]);

  // Fetch data initially and every 10 seconds
  React.useEffect(() => {
    setChartData(chartData); // Initialize with static data
    fetchChartData(); // Initial fetch
    const interval = setInterval(fetchChartData, 10000); // Poll every 10 seconds
    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  const total = React.useMemo(
    () => ({
      heineken:
        chartData.length > 0 ? chartData[chartData.length - 1].heineken : 0,
      corona: chartData.length > 0 ? chartData[chartData.length - 1].corona : 0,
      aperol_spritz:
        chartData.length > 0
          ? chartData[chartData.length - 1].aperol_spritz
          : 0,
      vin_spumant:
        chartData.length > 0 ? chartData[chartData.length - 1].vin_spumant : 0,
      vin_alb:
        chartData.length > 0 ? chartData[chartData.length - 1].vin_alb : 0,
      prosecco:
        chartData.length > 0 ? chartData[chartData.length - 1].prosecco : 0,
      apa_plata:
        chartData.length > 0 ? chartData[chartData.length - 1].apa_plata : 0,
      apa_minerala:
        chartData.length > 0 ? chartData[chartData.length - 1].apa_minerala : 0,
      cola: chartData.length > 0 ? chartData[chartData.length - 1].cola : 0,
    }),
    [chartData]
  );

  // Calculate minutes and seconds for Timer component
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;

  return (
    <div className="h-screen w-full">
      <Card className="h-full w-full flex flex-col">
        <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
          <div className="flex flex-1 flex-col justify-center gap-1 px-6 pb-3 sm:pb-0">
            <CardTitle>Inventory Price Updates</CardTitle>
            <CardDescription>Showing Price Fluctuations</CardDescription>
          </div>
          <div className="flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6">
            <span className="text-muted-foreground">
              Countdown until next update:
            </span>{" "}
            <span className="text-lg leading-none font-bold sm:text-3xl">
              <Timer minutes={minutes} seconds={seconds} />
            </span>
          </div>
          <div className="flex">
            {[
              "heineken",
              "corona",
              "aperol_spritz",
              "vin_spumant",
              "vin_alb",
              "prosecco",
              "apa_plata",
              "apa_minerala",
              "cola",
            ].map((key) => {
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
          {error ? (
            <div className="text-red-500 text-center">{error}</div>
          ) : (
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
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  domain={yAxisDomain}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
