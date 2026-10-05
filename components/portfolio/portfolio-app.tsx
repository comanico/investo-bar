"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Beer, Wine, CupSoda, Martini, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Book } from "@/lib/types";
import Counter from "@/components/ui/counter";
import { getPricePlaces, getDiffPlaces } from "@/actions/getPlaces";

const ICONS: Record<string, LucideIcon> = {
  Bere: Beer,
  Vin: Wine,
  Racoritoare: CupSoda,
  Spirtoase: Martini,
};

export function PortfolioApp({
  token,
  label,
}: {
  token: string;
  label: string;
}) {
  const [book, setBook] = useState<Book | null>(null);

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/portfolio?token=${token}`);
      if (!res.ok) return;
      setBook(await res.json());
    };
    void load();
    const id = setInterval(() => void load(), 15000);
    return () => clearInterval(id);
  }, [token]);

  const ret = book?.ret ?? 0;
  const up = ret > 0;
  const down = ret < 0;

  return (
    <div className="relative min-h-screen bg-background px-4 py-10 text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "url('https://www.transparenttextures.com/patterns/stardust.png')",
        }}
      />
      <div className="relative z-10 mx-auto flex w-full max-w-md flex-col items-center">
        <Link
          href={`/t/${token}`}
          className="absolute left-0 top-0 inline-flex rounded-full border border-white/20 bg-white/15 px-4 py-1.5 text-sm font-semibold text-white backdrop-blur-xl"
        >
          ← Menu
        </Link>
        <img
          src="/InvestoBar.svg"
          alt="InvestoBar"
          className="mb-6 h-16 w-auto"
        />
        <h1 className="text-3xl font-extrabold">{label}</h1>
        <p className="mt-1 text-sm text-white/50">Portfolio</p>

        <p
          className={cn(
            "mt-4 text-2xl font-bold tabular-nums",
            up && "text-[#b6f5c8]",
            down && "text-red-200",
            !up && !down && "text-white/60",
          )}
        >
          {up ? "+" : ""}
          <Counter
            value={Math.abs(ret * 100)}
            fontSize={28}
            places={getDiffPlaces(ret * 100)}
            gap={1}
            horizontalPadding={0}
            borderRadius={0}
            padding={0}
            gradientHeight={0}
            gradientFrom="transparent"
            gradientTo="transparent"
            fontWeight={700}
            textColor="inherit"
          />
        </p>
        <p className="text-sm text-white/50">
          Cost {book?.cost.toFixed(2) ?? "0.00"} · Value{" "}
          {book?.value.toFixed(2) ?? "0.00"}
        </p>

        <div className="mt-8 w-full space-y-3">
          {book?.positions.map((line) => {
            const gain = line.pnl > 0;
            const loss = line.pnl < 0;
            const shell = gain
              ? "border-emerald-400/30 bg-gradient-to-br from-[#2E8B57]/70 to-[#3CB371]/50"
              : loss
                ? "border-red-400/30 bg-gradient-to-br from-[#DC143C]/70 to-[#FF4500]/50"
                : "border-white/10 bg-white/5";
            const Icon = ICONS.Bere;

            return (
              <article
                key={line.product}
                className={cn(
                  "flex items-center gap-3 rounded-3xl border p-3 backdrop-blur-xl",
                  shell,
                )}
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10">
                  <Icon className="h-5 w-5 text-white/90" strokeWidth={1.5} />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-sm font-semibold">
                    {line.product}
                    <span className="ml-2 text-white/60">{line.qty}×</span>
                  </h2>
                  <p className="flex items-baseline gap-1 text-lg font-bold tabular-nums">
                    <Counter
                      value={line.value}
                      fontSize={18}
                      places={getPricePlaces(line.value)}
                      gap={1}
                      horizontalPadding={0}
                      borderRadius={0}
                      padding={0}
                      gradientHeight={0}
                      gradientFrom="transparent"
                      gradientTo="transparent"
                      fontWeight={700}
                      textColor="inherit"
                    />
                    <span className="text-xs font-medium">RON</span>
                  </p>{" "}
                  <p className="mt-0.5 flex items-center gap-0.5 text-xs font-medium text-yellow-200">
                    <span>{gain ? "+" : loss ? "−" : ""}</span>
                    <Counter
                      value={Math.abs(line.ret * 100)}
                      fontSize={12}
                      places={getDiffPlaces(line.ret * 100)}
                      gap={1}
                      horizontalPadding={0}
                      borderRadius={0}
                      padding={0}
                      gradientHeight={0}
                      gradientFrom="transparent"
                      gradientTo="transparent"
                      fontWeight={600}
                      textColor="inherit"
                    />
                    <span>%</span>
                  </p>{" "}
                </div>
              </article>
            );
          })}
          {book && book.positions.length === 0 && (
            <p className="py-10 text-center text-sm text-white/40">
              No confirmed drinks yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
