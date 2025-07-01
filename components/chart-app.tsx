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
  const finalChartData = React.useRef(chartData);
  const [error, setError] = React.useState<string | null>(null);
  const [activeChart, setActiveChart] =
    React.useState<keyof typeof chartConfig>("heineken");
  const [minutes, setMinutes] = React.useState<number>(15);
  const [seconds, setSeconds] = React.useState<number>(0);
  const DATA_URL = "https://d2xgbzki9fbs74.cloudfront.net/api/prices.json";

  // Calculate the next target time (00, 15, 30, or 45 minutes)
  const getNextTargetTime = (now: Date = new Date()) => {
    const currentMinutes = now.getMinutes();
    let targetMinutes = Math.ceil(currentMinutes / 15) * 15;
    // eslint-disable-next-line prefer-const
    let target = new Date(now);
    target.setMinutes(targetMinutes, 0, 0); // Set to next 15-minute mark
    if (targetMinutes >= 60) {
      target.setHours(now.getHours() + 1);
      target.setMinutes(0);
      targetMinutes = 0;
    }
    // If target is in the past, add 15 minutes
    if (target.getTime() <= now.getTime()) {
      target.setMinutes(targetMinutes + 15, 0, 0);
      if (targetMinutes + 15 >= 60) {
        target.setHours(now.getHours() + 1);
        target.setMinutes(0);
      }
    }
    console.log("Calculated target time:", {
      currentTime: now.toLocaleTimeString(),
      currentMinutes,
      targetMinutes,
      target: target.toLocaleTimeString(),
    });
    return target;
  };

  // Initialize and update timer
  React.useEffect(() => {
    let target = getNextTargetTime();

    const interval = setInterval(() => {
      const now = new Date();
      const difference = target.getTime() - now.getTime();

      if (difference <= 0) {
        // Reached target, set new target
        target = getNextTargetTime();
        console.log(
          "Timer reached 0, setting new target:",
          target.toLocaleTimeString()
        );
      }

      const m = Math.max(
        0,
        Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      );
      const s = Math.max(0, Math.floor((difference % (1000 * 60)) / 1000));
      console.log("Timer tick:", {
        minutes: m,
        seconds: s,
        difference,
        target: target.toLocaleTimeString(),
      });
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
      console.log("Fetched chart data:", data);
      console.log("Current chart data:", chartData);

      if (data.length > chartData.length) {
        console.log("New data detected with different timestamp");
        finalChartData.current = data;
        setChartData(data);
        // Reset timer to next 15-minute interval
        const target = getNextTargetTime();
        const now = new Date();
        const difference = target.getTime() - now.getTime();
        const m = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((difference % (1000 * 60)) / 1000);
        console.log("Resetting timer on new data:", { minutes: m, seconds: s });
        setMinutes(m);
        setSeconds(s);
      } else {
        console.log("No new data, keeping current timer");
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
    fetchChartData(); // Initial fetch
    const interval = setInterval(fetchChartData, 10000); // Poll every 10 seconds
    return () => clearInterval(interval); // Cleanup on unmount
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

  // Get initial prices for comparison
  const initialPrices = React.useMemo(() => {
    const initial = initialChartData[0];
    return {
      heineken: initial.heineken,
      corona: initial.corona,
      aperol_spritz: initial.aperol_spritz,
      vin_spumant: initial.vin_spumant,
      vin_alb: initial.vin_alb,
      prosecco: initial.prosecco,
      apa_plata: initial.apa_plata,
      apa_minerala: initial.apa_minerala,
      cola: initial.cola,
    };
  }, []);

  const getButtonColor = (key: keyof typeof total) => {
    const currentPrice = total[key];
    const initialPrice = initialPrices[key];
    console.log("Button color check:", {
      key,
      currentPrice,
      initialPrice,
      color:
        currentPrice < initialPrice
          ? "bg-red-500 text-white"
          : currentPrice > initialPrice
          ? "bg-green-500 text-white"
          : "bg-gray-100 text-black",
    });
    if (currentPrice < initialPrice) {
      return "bg-red-500 text-white";
    } else if (currentPrice > initialPrice) {
      return "bg-green-500 text-white";
    }
    return "bg-muted/50"; // Neutral color if equal
  };

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
                    {total[chart].toLocaleString()}
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
