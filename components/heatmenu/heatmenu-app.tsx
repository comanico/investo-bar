"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HeatmenuHeader } from "./heatmenu-header";
import { HeatmenuGrid } from "./heatmenu-grid";
import { HeatmenuItem, MenuDataPoint } from "@/lib/types";
import { buildItems } from "@/lib/buildItems";
import { useIsMobile } from "@/hooks/use-mobile";
import { HeatmenuCard } from "./heatmenu-card";
import { toast } from "sonner";
import { HeatmenuOrderRegistry } from "./heatmenu-registry";

type Props = {
  /** Set when opened from /t/[token] */
  placement?: { id: string; token: string; label: string; kind: string };
};

export function HeatmenuApp({ placement }: Props = {}) {
  const isMobile = useIsMobile();
  const showBuy = Boolean(placement);
  const [items, setItems] = useState<HeatmenuItem[]>(() => buildItems([]));
  const [lastFetchedMinute, setLastFetchedMinute] = useState<number | null>(
    null,
  );
  const [buying, setBuying] = useState(false);
  const lastBuyAt = useRef(0);

  const handleBuy = async (item: HeatmenuItem) => {
    if (!placement || buying) return;
  
    const now = Date.now();
    if (now - lastBuyAt.current < 5000) {
      toast.error("Wait a moment before ordering again");
      return;
    }
  
    setBuying(true);
    lastBuyAt.current = now;
  
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: placement.token,
          product: item.product,
          type: item.type,
          price: item.price,
        }),
      });
  
      const data = await res.json().catch(() => ({}));
  
      if (!res.ok) {
        toast.error(data.error ?? "Could not send order");
        return;
      }
  
      toast.success(`Order sent · ${placement.label}`);
    } catch {
      toast.error("Network error");
    } finally {
      setTimeout(() => setBuying(false), 3000);
    }
  };
  
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
        <HeatmenuHeader subtitle={placement ? placement.label : undefined} />
        {isMobile ? (
          <main className="w-full flex-1 space-y-3 px-4 pb-10">
            {items.map((item) => (
              <HeatmenuCard
                key={item.product}
                item={item}
                layout="row"
                showBuy={showBuy}
                onBuy={() => handleBuy(item)}
              />
            ))}
          </main>
        ) : (
          <div className="flex w-full flex-1 gap-4 px-4 pb-4">
            <main className="min-w-0 flex-1">
              <HeatmenuGrid items={items} />
            </main>
            <aside className="w-[min(100%,22rem)] shrink-0">
              <HeatmenuOrderRegistry />
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
