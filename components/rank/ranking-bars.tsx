"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type RankRow = {
  placementId: string;
  label: string;
  cost: number;
  value: number;
  pnl: number;
  ret: number;
  qty: number;
};

export function RankingBars({ rows }: { rows: RankRow[] }) {
  const maxAbs = Math.max(...rows.map((r) => Math.abs(r.ret)), 0.01);

  return (
    <ul className="mx-auto flex w-full max-w-4xl flex-col gap-3">
      {rows.map((row) => {
        const width = Math.max(10, (Math.abs(row.ret) / maxAbs) * 85);
        const up = row.ret > 0.0005;
        const down = row.ret < -0.0005;
        const pct = `${row.ret > 0 ? "+" : row.ret < 0 ? "−" : ""}${Math.abs(row.ret * 100).toFixed(1)}%`;

        return (
          <motion.li
            key={row.placementId}
            layout
            transition={{ type: "spring", stiffness: 260, damping: 32 }}
            className="flex items-center gap-3"
          >
            <span className="w-28 shrink-0 truncate text-right text-base font-semibold text-white sm:text-lg">
              {row.label}
            </span>

            <div className="relative min-w-0 flex-1">
              <div
                className={cn(
                  "flex h-10 items-center rounded-full transition-[width] duration-500",
                  up &&
                    "bg-gradient-to-r from-[#2E8B57] to-[#3CB371] shadow-[0_0_18px_rgba(60,179,113,0.7),0_0_36px_rgba(46,139,87,0.35)]",
                  down &&
                    "bg-gradient-to-r from-[#DC143C] to-[#FF4500] shadow-[0_0_18px_rgba(255,69,0,0.65),0_0_36px_rgba(220,20,60,0.3)]",
                  !up && !down && "bg-white/25",
                )}
                style={{ width: `${width}%` }}
              />
              <span
                className="absolute top-1/2 -translate-y-1/2 text-base font-semibold tabular-nums text-white sm:text-lg"
                style={{ left: `calc(${width}% + 10px)` }}
              >
                {pct}
              </span>
            </div>
          </motion.li>
        );
      })}
    </ul>
  );
}