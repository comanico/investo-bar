"use client";

import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { InfiniteSlider } from "@/components/ui/infinite-slider";

type Point = {
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
};

const KEYS = [
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

type ProductKey = (typeof KEYS)[number];

export const rankChartConfig = {
    heineken: { label: "Heineken", color: "var(--chart-1)" },
    aperol_spritz: { label: "Aperol Spritz", color: "var(--chart-2)" },
    prosecco: { label: "Prosecco", color: "var(--chart-3)" },
    corona: { label: "Corona", color: "var(--chart-4)" },
    cola: { label: "Cola", color: "var(--chart-5)" },
    vin_rosu: { label: "Vin Rosu", color: "var(--chart-6)" },
    vin_alb: { label: "Vin Alb", color: "var(--chart-7)" },
    apa: { label: "Apa", color: "var(--chart-8)" },
    peroni: { label: "Peroni", color: "var(--chart-9)" },
    vin_spumant_fara_alcool: {
        label: "Vin Spumant Fara Alcool",
        color: "var(--chart-10)",
    },
    jameson: { label: "Jameson", color: "var(--chart-11)" },
    jameson_black_barrel: { label: "Jameson Black Barrel", color: "var(--chart-12)" },
    fireball: { label: "Fireball", color: "var(--chart-1)" },
    tequilla: { label: "Tequilla", color: "var(--chart-2)" },
} satisfies ChartConfig;

export function RankMarket() {
    const [series, setSeries] = useState<Point[]>([]);
    const [active, setActive] = useState<ProductKey>("heineken");

    useEffect(() => {
        const load = async () => {
            const res = await fetch("/api/get-file?key=live_prices.json", {
                cache: "no-store",
            });
            if (!res.ok) return;
            const data = await res.json();
            if (!Array.isArray(data)) return;
            setSeries(
                data.map((row: Record<string, unknown>) => {
                    const point: Record<string, unknown> = { time: row.time };
                    for (const key of KEYS) {
                        const v = row[key];
                        if (typeof v === "number") point[key] = v;
                    }
                    return point as Point;
                }),
            );
        };

        void load();
        const id = setInterval(() => {
            const m = new Date().getMinutes();
            if ([0, 15, 30, 45].includes(m)) void load();
        }, 15_000);
        return () => clearInterval(id);
    }, []);

    useEffect(() => {
        const id = setInterval(() => {
            setActive((cur) => KEYS[(KEYS.indexOf(cur) + 1) % KEYS.length]);
        }, 8000);
        return () => clearInterval(id);
    }, []);

    const domain = useMemo(() => {
        const vals = series
            .map((p) => p[active])
            .filter((n): n is number => typeof n === "number");
        if (!vals.length) return [0, 20] as [number, number];
        return [Math.floor(Math.min(...vals) - 1), Math.ceil(Math.max(...vals) + 1)];
    }, [series, active]);

    const color = rankChartConfig[active].color;
    const last = series.at(-1)?.[active];

    return (
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-4 shadow-[0_0_40px_rgba(255,255,255,0.04)] backdrop-blur-xl">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.08),transparent_55%)]"
            />

            <div className="relative mb-3 flex items-end justify-between gap-3">
                <div>
                    <p className="text-xs uppercase tracking-wide text-white/45">Market</p>
                    <p className="text-lg font-semibold text-white">
                        {rankChartConfig[active].label}
                    </p>
                </div>
                {typeof last === "number" && (
                    <p className="text-xl font-semibold tabular-nums text-white">
                        {last.toFixed(2)} RON
                    </p>
                )}
            </div>

            <div className="relative mb-3">
                <InfiniteSlider speed={28} gap={12} className="py-1">
                    {KEYS.map((key) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setActive(key)}
                            className={cn(
                                "shrink-0 rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap",
                                active === key ? "bg-white/20 text-white" : "text-white/45",
                            )}
                        >
                            {rankChartConfig[key].label}
                        </button>
                    ))}
                </InfiniteSlider>
            </div>
            <ChartContainer
                config={rankChartConfig}
                className="relative aspect-auto h-64 w-full sm:h-80"
            >
                <AreaChart data={series} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
                    <defs>
                        <linearGradient id={`fill-${active}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity={0.45} />
                            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
                        </linearGradient>
                        <filter id="grid-glow">
                            <feGaussianBlur stdDeviation="0.6" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    <CartesianGrid
                        stroke="rgba(180,180,180,0.22)"
                        strokeDasharray="3 10"
                        vertical
                        horizontal
                    />

                    <XAxis
                        dataKey="time"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        minTickGap={24}
                        tick={{ fill: "rgba(220,220,220,0.7)", fontSize: 11 }}
                    />
                    <YAxis
                        domain={domain}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={6}
                        width={36}
                        tick={{ fill: "rgba(220,220,220,0.7)", fontSize: 11 }}
                        tickFormatter={(v) => Number(v).toFixed(0)}
                    />

                    <ChartTooltip
                        content={
                            <ChartTooltipContent
                                labelFormatter={(v) => String(v)}
                                formatter={(value) =>
                                    `${Number(value).toFixed(2)} RON`
                                }
                            />
                        }
                    />

                    <Area
                        type="monotone"
                        dataKey={active}
                        stroke={color}
                        strokeWidth={2.5}
                        fill={`url(#fill-${active})`}
                        style={{
                            filter: `drop-shadow(0 0 8px ${color})`,
                        }}
                        dot={{
                            r: 3,
                            fill: color,
                            stroke: "rgba(255,255,255,0.7)",
                            strokeWidth: 1,
                        }}
                        activeDot={{ r: 5 }}
                    />
                </AreaChart>
            </ChartContainer>
        </div>
    );
}