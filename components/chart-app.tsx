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
import { ScrollArea, ScrollBar } from "./ui/scroll-area";

export const description = "An interactive line chart";

interface ChartDataPoint {
  time: string;
  heineken: number;
  corona: number;
  peroni: number;
  aperol_spritz: number;
  vin_rosu: number;
  vin_alb: number;
  prosecco: number;
  apa: number;
  cola: number;
}

const initialChartData = [
  {
    time: "17:00",
    heineken: 10,
    peroni: 10,
    aperol_spritz: 16,
    prosecco: 15,
    corona: 12,
    cola: 8,
    vin_rosu: 15,
    vin_alb: 15,
    apa: 8,
  },
];

const chartConfig = {
  views: {
    label: "Price",
  },
  heineken: {
    label: "Heineken",
    color: "var(--chart-1)",
  },
  aperol_spritz: {
    label: "Aperol Spritz",
    color: "var(--chart-2)",
  },
  prosecco: {
    label: "Prosecco",
    color: "var(--chart-3)",
  },
  corona: {
    label: "Corona",
    color: "var(--chart-4)",
  },
  cola: {
    label: "Cola",
    color: "var(--chart-5)",
  },
  vin_rosu: {
    label: "Vin Rosu",
    color: "var(--chart-6)",
  },
  vin_alb: {
    label: "Vin Alb",
    color: "var(--chart-7)",
  },
  apa: {
    label: "Apa",
    color: "var(--chart-8)",
  },
  peroni: {
    label: "Peroni",
    color: "var(--chart-9)",
  },
} satisfies ChartConfig;

export function ChartApp() {
  const [chartData, setChartData] =
    React.useState<ChartDataPoint[]>(initialChartData);
  const finalChartData = React.useRef(chartData);
  const [error, setError] = React.useState<string | null>(null);
  const [activeChart, setActiveChart] =
    React.useState<keyof typeof chartConfig>("heineken");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [minutes, setMinutes] = React.useState<number>(15);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [seconds, setSeconds] = React.useState<number>(0);
  const DATA_URL = "https://d2xgbzki9fbs74.cloudfront.net/api/prices.json";

  // Calculate the next target time (00, 15, 30, or 45 minutes)
  const getNextTargetTime = (now: Date = new Date()) => {
    const currentMinutes = now.getMinutes();
    let targetMinutes = Math.ceil(currentMinutes / 15) * 15;
    // eslint-disable-next-line prefer-const
    let target = new Date(now);
    target.setMinutes(targetMinutes, 0, 0);
    if (targetMinutes >= 60) {
      target.setHours(now.getHours() + 1);
      target.setMinutes(0);
      targetMinutes = 0;
    }
    if (target.getTime() <= now.getTime()) {
      target.setMinutes(targetMinutes + 15, 0, 0);
      if (targetMinutes + 15 >= 60) {
        target.setHours(now.getHours() + 1);
        target.setMinutes(0);
      }
    }
    return target;
  };

  // Initialize and update timer logic (for API updates, not displayed)
  React.useEffect(() => {
    let target = getNextTargetTime();

    const interval = setInterval(() => {
      const now = new Date();
      const difference = target.getTime() - now.getTime();

      if (difference <= 0) {
        target = getNextTargetTime();
      }

      const m = Math.max(
        0,
        Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      );
      const s = Math.max(0, Math.floor((difference % (1000 * 60)) / 1000));
      setMinutes(m);
      setSeconds(s);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Fetch data from JSON file
  const fetchChartData = async () => {
    try {
      const response = await axios.get<ChartDataPoint[]>(DATA_URL, {
        timeout: 5000,
      });
      const data: ChartDataPoint[] = response.data;

      if (data.length > chartData.length) {
        finalChartData.current = data;
        setChartData(data);
        const target = getNextTargetTime();
        const now = new Date();
        const difference = target.getTime() - now.getTime();
        const m = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((difference % (1000 * 60)) / 1000);
        setMinutes(m);
        setSeconds(s);
      }
      setError(null);
    } catch (err) {
      setError("Failed to fetch chart data");
      console.error("Fetch error:", err);
    }
  };

  const yAxisDomain = React.useMemo(() => {
    if (chartData.length === 0) return [0, 10];
    const allValues = chartData.flatMap((point) => [
      point.heineken,
      point.corona,
      point.peroni,
      point.aperol_spritz,
      point.vin_rosu,
      point.vin_alb,
      point.prosecco,
      point.apa,
      point.cola,
    ]);
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    return [Math.floor(min - 0.5), Math.ceil(max + 0.5)];
  }, [chartData]);

  // Fetch data initially and every 10 seconds
  React.useEffect(() => {
    fetchChartData();
    const interval = setInterval(fetchChartData, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, [chartData]);

  const total = React.useMemo(
    () => ({
      heineken:
        chartData.length > 0 ? chartData[chartData.length - 1].heineken : 0,
      corona: chartData.length > 0 ? chartData[chartData.length - 1].corona : 0,
      aperol_spritz:
        chartData.length > 0
          ? chartData[chartData.length - 1].aperol_spritz
          : 0,
      vin_rosu:
        chartData.length > 0 ? chartData[chartData.length - 1].vin_rosu : 0,
      vin_alb:
        chartData.length > 0 ? chartData[chartData.length - 1].vin_alb : 0,
      prosecco:
        chartData.length > 0 ? chartData[chartData.length - 1].prosecco : 0,
      apa:
        chartData.length > 0 ? chartData[chartData.length - 1].apa : 0,
      peroni:
        chartData.length > 0 ? chartData[chartData.length - 1].peroni : 0,
      cola: chartData.length > 0 ? chartData[chartData.length - 1].cola : 0,
    }),
    [chartData]
  );

  const getButtonColor = (key: keyof typeof total) => {
    if (chartData.length < 2) return "bg-muted/50"; // Neutral if insufficient data
    const currentPrice = chartData[chartData.length - 1][key];
    const previousPrice = chartData[chartData.length - 2][key];
    if (currentPrice < previousPrice) {
      return "bg-green-500 text-white";
    } else if (currentPrice > previousPrice) {
      return "bg-red-500 text-white";
    }
    return "bg-muted/50";
  };

  return (
    <div className="h-screen w-full">
      <Card className="h-full w-full flex flex-col">
        <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
          <div className="flex flex-1 flex-col justify-center gap-1 px-6 pb-3 sm:pb-0">
            <CardTitle>Inventory Price Updates</CardTitle>
            <CardDescription>Showing Price Fluctuations</CardDescription>
          </div>
          <ScrollArea className="w-screen overflow-hidden">
            <div className="flex flex-row items-stretch min-h-[80px] sm:min-h-[160px]">
              {[
                "heineken",
                "corona",
                "peroni",
                "aperol_spritz",
                "vin_rosu",
                "vin_alb",
                "prosecco",
                "apa",
                "cola",
              ].map((key) => {
                const chart = key as keyof typeof total;
                return (
                  <button
                    key={chart}
                    data-active={activeChart === chart}
                    className={`flex flex-1 flex-col justify-center gap-1 border-t px-4 py-4 text-left sm:border-t-0 sm:border-l sm:px-6 sm:py-6 transition-colors duration-300 ease-in-out ${getButtonColor(
                      chart
                    )} data-[active=true]:bg-gray-100 data-[active=true]:text-black`}
                    onClick={() => setActiveChart(chart)}
                  >
                    <span className="text-xs">{chartConfig[chart].label}</span>
                    <span className="text-lg leading-none font-bold sm:text-xl">
                      {total[chart].toLocaleString()} RON
                    </span>
                  </button>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
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