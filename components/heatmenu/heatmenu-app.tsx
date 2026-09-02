"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HeatmenuHeader } from "./heatmenu-header";
import { HeatmenuGrid } from "./heatmenu-grid";
import { HeatmenuItem, MenuDataPoint, CartLine } from "@/lib/types";
import { buildItems } from "@/lib/buildItems";
import { useIsMobile } from "@/hooks/use-mobile";
import { HeatmenuCard } from "./heatmenu-card";
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
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  const handleBuy = (item: HeatmenuItem) => {
    if (!placement) return;
    setCart((cur) => {
      const i = cur.findIndex((l) => l.product === item.product);
      if (i >= 0) {
        const next = [...cur];
        next[i] = { ...next[i], qty: next[i].qty + 1 };
        return next;
      }
      return [...cur, { product: item.product, type: item.type, price: item.price, qty: 1 }];
    });
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

  const submitCart = async () => {
    if (!placement || cart.length === 0) return;
    for (const line of cart) {
      await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: placement.token,
          product: line.product,
          type: line.type,
          price: line.price,
          qty: line.qty,
        }),
      });
    }
    setCart([]);
    setCartOpen(false);
  };

  const bump = (product: string, delta: number) => {
    setCart((cur) =>
      cur
        .map((l) =>
          l.product === product ? { ...l, qty: l.qty + delta } : l,
        )
        .filter((l) => l.qty > 0),
    );
  };

  const remove = (product: string) => {
    setCart((cur) => cur.filter((l) => l.product !== product));
  };

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
        <HeatmenuHeader title="Investo Bar Menu" subtitle={placement ? placement.label : undefined} />
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

            {cart.length > 0 && !cartOpen && (
              <button
                type="button"
                onClick={() => setCartOpen(true)}
                className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between bg-black/80 px-4 py-3 backdrop-blur-xl"
              >
                <span>{cart.reduce((n, l) => n + l.qty, 0)} items</span>
                <span>
                  {cart.reduce((n, l) => n + l.qty * l.price, 0).toFixed(2)} RON
                </span>
              </button>
            )}

            {cartOpen && (
              <div className="fixed inset-x-0 bottom-0 z-50 flex h-[75vh] flex-col rounded-t-3xl border-t border-white/10 bg-zinc-950 p-4">
                <button
                  type="button"
                  onClick={() => setCartOpen(false)}
                  className="mb-3 self-center rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-zinc-900"
                >
                  ↓ Menu
                </button>

                {cart.map((line) => (
                  <div key={line.product} className="flex items-center gap-3 py-2">
                    <span className="flex-1 text-lg font-bold">{line.product}</span>
                    <button 
                    type="button" 
                    onClick={() => bump(line.product, -1)} 
                    className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-sm font-bold text-zinc-900">
                      −
                    </button>
                    <span>{line.qty}</span>
                    <button 
                    type="button" 
                    onClick={() => bump(line.product, 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-sm font-bold text-zinc-900"
                    >
                      +
                    </button>
                    <span className="w-20 text-center text-lg font-bold tabular-nums">{(line.qty * line.price).toFixed(2)}</span>
                    <button 
                    type="button" 
                    onClick={() => remove(line.product)} 
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-sm font-bold text-white"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={submitCart}
                  className="mx-auto mt-4 w-4/5 rounded-2xl bg-[#3CB371] py-3 text-base font-bold text-white"
                >
                  Submit
                </button>
              </div>
            )}

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
