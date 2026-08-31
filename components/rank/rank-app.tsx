"use client"

import { RankRow } from "@/lib/types";
import { useCallback, useEffect, useState } from "react";
import { RankingBars } from "./ranking-bars";
import { HeatmenuHeader } from "../heatmenu/heatmenu-header";
import { RankMarket } from "./rank-market";
import { SponsorRail } from "./sponsored-list";

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
        void load();

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
        <div className="relative flex min-h-screen flex-col items-center overflow-x-hidden bg-background py-8 text-foreground">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 z-0"
                style={{
                    backgroundImage:
                        "url('https://www.transparenttextures.com/patterns/stardust.png')",
                }}
            />

            <div className="relative z-10 flex w-full flex-col px-4">
                <HeatmenuHeader
                    title="Leaderboard"
                    subtitle={asOf ? `Marked to ${asOf}` : "Tonight's tables"}
                />

                <div className="grid w-full grid-cols-1 items-start gap-6 lg:grid-cols-[7rem_minmax(0,1fr)_minmax(0,1fr)_7rem] lg:gap-x-12">
                    <div className="hidden justify-self-start lg:block">
                        <SponsorRail />
                    </div>


                    <div className="min-w-0">
                        {rows.length === 0 ? (
                            <p className="text-center text-sm text-white/45">
                                No fills yet tonight
                            </p>
                        ) : (
                            <RankingBars rows={rows} />
                        )}
                    </div>

                    <div className="min-w-0">
                        <RankMarket />
                    </div>
                    <div className="hidden justify-self-end lg:block">
                        <SponsorRail reverse />
                    </div>
                </div>
            </div>
        </div>
    )
}