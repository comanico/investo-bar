"use client";

import * as React from "react";

interface ChartDataPoint {
  time: string;
  heineken: number;
  corona: number;
  peroni: number;
  aperol_spritz: number;
  vin_rosu: number;
  vin_alb: number;
  prosecco: number;
  vin_spumant_fara_alcool: number;
  apa: number;
  cola: number;
  jameson: number;
  jameson_black_barrel: number;
  fireball: number;
  tequilla: number;
}

const initialChartData: ChartDataPoint[] = [
  {
    time: "17:00",
    heineken: 10,
    peroni: 10,
    aperol_spritz: 16,
    prosecco: 15,
    corona: 12,
    vin_rosu: 15,
    vin_alb: 15,
    vin_spumant_fara_alcool: 12,
    cola: 9,
    apa: 8,
    jameson: 18,
    jameson_black_barrel: 25,
    fireball: 12,
    tequilla: 12,
  },
];

const priceKeys = [
  "heineken",
  "corona",
  "peroni",
  "aperol_spritz",
  "vin_rosu",
  "vin_alb",
  "prosecco",
  "vin_spumant_fara_alcool",
  "apa",
  "cola",
  "jameson",
  "jameson_black_barrel",
  "fireball",
  "tequilla",
] as const;

type ProductKey = (typeof priceKeys)[number];

const productLabels: Record<ProductKey, string> = {
  heineken: "Heineken",
  corona: "Corona",
  peroni: "Peroni",
  aperol_spritz: "Aperol Spritz",
  vin_rosu: "Vin Rosu",
  vin_alb: "Vin Alb",
  prosecco: "Prosecco",
  vin_spumant_fara_alcool: "Vin Spumant Fara Alcool",
  apa: "Apa",
  cola: "Cola",
  jameson: "Jameson",
  jameson_black_barrel: "Jameson Black Barrel",
  fireball: "Fireball",
  tequilla: "Tequilla",
};

export function HeatmapApp() {
  const [chartData, setChartData] =
    React.useState<ChartDataPoint[]>(initialChartData);
  const [error, setError] = React.useState<string | null>(null);
  const [lastFetchedMinute, setLastFetchedMinute] = React.useState<
    number | null
  >(null);

  const fetchChartData = React.useCallback(async () => {
    try {
      const response = await fetch("/api/get-file?key=live_prices.json", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ChartDataPoint[] = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        const now = new Date();
        const currentTime = now.toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Europe/Bucharest",
        });

        const updatedData = [...data];
        updatedData[updatedData.length - 1] = {
          ...updatedData[updatedData.length - 1],
          time: currentTime,
        };

        setChartData(updatedData);
        setLastFetchedMinute(now.getMinutes());
        setError(null);
      }
    } catch (err) {
      setError("Failed to fetch chart data");
      console.error("Fetch error:", err);
    }
  }, []);

  React.useEffect(() => {
    void fetchChartData();

    const interval = setInterval(() => {
      const now = new Date();
      const currentMinute = now.getMinutes();
      const allowedMinutes = [0, 15, 30, 45];

      if (
        allowedMinutes.includes(currentMinute) &&
        currentMinute !== lastFetchedMinute
      ) {
        void fetchChartData();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [fetchChartData, lastFetchedMinute]);

  const latestPrices = React.useMemo(
    () =>
      priceKeys.reduce(
        (accumulator, key) => {
          accumulator[key] =
            chartData.length > 0
              ? (chartData[chartData.length - 1][key] ?? 0)
              : 0;
          return accumulator;
        },
        {} as Record<ProductKey, number>,
      ),
    [chartData],
  );

  const getTileColor = (key: ProductKey) => {
    if (chartData.length < 2) return "bg-muted/50 text-foreground";

    const currentPrice = chartData[chartData.length - 1][key] ?? 0;
    const previousPrice = chartData[chartData.length - 2][key] ?? 0;

    if (currentPrice < previousPrice) return "bg-green-500 text-white";
    if (currentPrice > previousPrice) return "bg-red-500 text-white";
    return "bg-muted/50 text-foreground";
  };

  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center px-6 text-center text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="grid h-screen w-full grid-cols-2 grid-rows-7 gap-px bg-border md:grid-cols-7 md:grid-rows-2">
      {priceKeys.map((key) => (
        <div
          key={key}
          className={`flex min-h-0 flex-col items-center justify-center gap-3 px-4 py-6 text-center transition-colors duration-300 ease-in-out ${getTileColor(
            key,
          )}`}
        >
          <span className="max-w-[16ch] text-xl leading-tight font-bold uppercase tracking-[0.15em] sm:text-2xl md:text-3xl lg:text-4xl">
            {productLabels[key]}
          </span>
          <span className="text-3xl leading-none font-bold sm:text-4xl md:text-5xl lg:text-6xl">
            {latestPrices[key].toLocaleString()} RON
          </span>
        </div>
      ))}
    </div>
  );
}
