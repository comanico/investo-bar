"use client"

import { RankRow } from "@/lib/types";
import { useCallback, useEffect, useState } from "react";
import { RankingBars } from "./ranking-bars";
import { HeatmenuHeader } from "../heatmenu/heatmenu-header";

type LeaderBoardResponse = {
    asOf: string | null;
    sessionDate: string;
    rows: RankRow[]
};

export function RankApp() {
    const [rows, setRows] = useState<RankRow[]>([]);
    const [asOf, setAsOf] = useState<string | null>(null);
    const [lastFetchedMinute, setLastFetchedMinute] = useState<number | null>(null);

    const load = useCallback(async () => {
        try {
            const res = await fetch("/api/leaderboard", { cache: "no-store" });
            if (!res.ok) throw Error("leaderboard failed");
            const data: LeaderBoardResponse = await res.json()
            setRows(Array.isArray(data.rows) ? data.rows : []);
            setAsOf(data.asOf ?? null);
            setLastFetchedMinute(new Date().getMinutes());
        } catch (e) {
            console.error(e)
        }
    }, []);

    useEffect(() => {
        void load;

        const id = setInterval(() => {
            const minute = new Date().getMinutes();
            const ticks = [0, 15, 30, 45];
            if (ticks.includes(minute) && minute !== lastFetchedMinute) {
                void load();
            }
        }, 1000);

        return () => clearInterval(id)
    }, [load, lastFetchedMinute])

    return (
        <div className="relative flex min-h-screen flex-col items-center overflow-x-hidden bg-background py-12 text-foreground">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 z-0"
                style={{
                    backgroundImage:
                        "url('https://www.transparenttextures.com/patterns/stardust.png')",
                }}
            />

            <div className="relative z-10 flex w-full max-w-3xl flex-col px-4">
                <HeatmenuHeader
                    title="Leaderboard"
                    subtitle={asOf ? `Marked to ${asOf}` : "Tonight's tables"}
                />

                {rows.length === 0 ? (
                    <p className="text-center text-sm text-white/45">
                        No fills yet tonight
                    </p>
                ) : (
                    <RankingBars rows={rows} />
                )}
            </div>
        </div>
    )
}