"use client";

import { useCallback, useEffect, useState } from "react";
import { HeatmenuHeader } from "./heatmenu-header";
import { HeatmenuGrid } from "./heatmenu-grid";
import { HeatmenuItem, MenuDataPoint, productKeyMap } from "@/lib/types";
import { DEFAULT_MENU_ITEMS } from "@/lib/menu-items";

const normalizeProduct = (name: string) =>
  name.toLowerCase().replace(/\s+/g, "_");

function buildItems(series: MenuDataPoint[]): HeatmenuItem[] {
  if (!series.length) {
    return DEFAULT_MENU_ITEMS.map((item) => ({
      product: item.product,
      type: item.type,
      price: item.price,
      prevPrice: item.price,
    }));
  }

  const last = series[series.length - 1];
  const prev = series.length > 1 ? series[series.length - 2] : last;

  return DEFAULT_MENU_ITEMS.map((item) => {
    const key = productKeyMap[normalizeProduct(item.product)];
    const live = key != null ? last[key] : undefined;
    const previous = key != null ? prev[key] : undefined;
    const price = typeof live === "number" ? live : item.price;
    const prevPrice = typeof previous === "number" ? previous : price;

    return {
      product: item.product,
      type: item.type,
      price,
      prevPrice,
    };
  });
}

export function HeatmenuApp() {
  const [items, setItems] = useState<HeatmenuItem[]>(() => buildItems([]));
  const [lastFetchedMinute, setLastFetchedMinute] = useState<number | null>(
    null,
  );

  const fetchPrices = useCallback(async () => {
    try {
      const response = await fetch("/api/get-file?key=live_prices.json", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: MenuDataPoint[] = await response.json();
      setItems(buildItems(Array.isArray(data) ? data : []));
      setLastFetchedMinute(new Date().getMinutes());
    } catch (error) {
      console.error("heatmenu fetch error:", error);
      setItems(buildItems([]));
    }
  }, []);

  useEffect(() => {
    void fetchPrices();

    const interval = setInterval(() => {
      const now = new Date();
      const currentMinute = now.getMinutes();
      const allowedMinutes = [0, 15, 30, 45];

      if (
        allowedMinutes.includes(currentMinute) &&
        currentMinute !== lastFetchedMinute
      ) {
        void fetchPrices();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [fetchPrices, lastFetchedMinute]);

  return (
    <div className="relative flex min-h-screen flex-col items-center overflow-x-hidden bg-background py-12 text-foreground xl:h-screen xl:overflow-hidden xl:py-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center"
        style={{
          backgroundImage:
            "url('https://www.transparenttextures.com/patterns/stardust.png')",
        }}
      />
      <div className="relative z-10 flex min-h-0 w-full flex-1 flex-col items-center">
        <HeatmenuHeader />
        <main className="min-h-0 flex-1 overflow-hidden px-4">
          <HeatmenuGrid items={items} />
        </main>
      </div>{" "}
    </div>
  );
}
