"use client";

import { useCallback, useEffect, useState } from "react";
import { HeatmenuHeader } from "./heatmenu-header";
import { HeatmenuGrid } from "./heatmenu-grid";
import { HeatmenuItem, MenuDataPoint, CartLine } from "@/lib/types";
import { buildItems } from "@/lib/buildItems";
import { useIsMobile } from "@/hooks/use-mobile";
import { HeatmenuCard } from "./heatmenu-card";
import { HeatmenuOrderRegistry } from "./heatmenu-registry";
import { visibleSeries } from "@/lib/visible-series";

type Props = {
  /** Set when opened from /t/[token] */
  placement?: { id: string; token: string; label: string; kind: string };
};

export function HeatmenuApp({ placement }: Props = {}) {
  const isMobile = useIsMobile();
  const showBuy = Boolean(placement) && isMobile;
  const [items, setItems] = useState<HeatmenuItem[]>(() => buildItems([]));
  const [lastFetchedMinute, setLastFetchedMinute] = useState<number | null>(
    null,
  );
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ticket, setTicket] = useState<{
    id: string;
    orders: { product: string; qty: number; price: number }[];
  } | null>(null);
  const [shown, setShown] = useState(ticket);

  const handleBuy = (item: HeatmenuItem) => {
    if (!placement) return;
    setCart((cur) => {
      const i = cur.findIndex((l) => l.product === item.product);
      if (i >= 0) {
        const next = [...cur];
        next[i] = { ...next[i], qty: next[i].qty + 1 };
        return next;
      }
      return [
        ...cur,
        { product: item.product, type: item.type, price: item.price, qty: 1 },
      ];
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
      const series = visibleSeries(Array.isArray(data) ? data : []);
      setItems(buildItems(series));
      setLastFetchedMinute(new Date().getMinutes());
    } catch (error) {
      console.error("heatmenu fetch error:", error);
      setItems(buildItems([]));
    }
  }, []);

  useEffect(() => {
    if (ticket) {
      setShown(ticket);
      return;
    }
    const t = setTimeout(() => setShown(null), 450);
    return () => clearTimeout(t);
  }, [ticket]);

  useEffect(() => {
    if (!showBuy || !placement?.token) return;
    let alive = true;

    const load = async () => {
      const res = await fetch(`/api/ticket?token=${placement.token}`);
      const data = await res.json();
      if (!alive) return;
      if (data.ticketId && Array.isArray(data.orders) && data.orders.length) {
        setTicket({ id: data.ticketId, orders: data.orders });
      } else if (data.resolved) {
        setTicket(null);
      }
    };

    void load();
    const id = setInterval(() => void load(), 3000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [showBuy, placement?.token]);

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
    if (!placement || cart.length === 0 || submitting) return;
    setSubmitting(true);

    const minted = await fetch("/api/ticket", { method: "POST" });
    const { ticketId } = await minted.json();
    if (!minted.ok || !ticketId) return;

    try {
      for (const line of cart) {
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: placement.token,
            ticketId,
            product: line.product,
            type: line.type,
            price: line.price,
            qty: line.qty,
          }),
        });
        if (!res.ok) return;
      }

      await fetch("/api/ticket/claim", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: placement.token, ticketId }),
      });

      setTicket({
        id: ticketId,
        orders: cart.map((l) => ({
          product: l.product,
          qty: l.qty,
          price: l.price,
        })),
      });
      setCart([]);
      setCartOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const bump = (product: string, delta: number) => {
    setCart((cur) =>
      cur
        .map((l) => (l.product === product ? { ...l, qty: l.qty + delta } : l))
        .filter((l) => l.qty > 0),
    );
  };

  const remove = (product: string) => {
    setCart((cur) => cur.filter((l) => l.product !== product));
  };

  if (shown) {
    const open = Boolean(ticket);
    const total = shown.orders.reduce((n, l) => n + l.qty * l.price, 0);

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black px-6">
        <img
          src="/InvestoBar.svg"
          alt="InvestoBar"
          className={[
            "mb-8 h-24 w-auto transition-opacity duration-500",
            open ? "opacity-90" : "opacity-0",
          ].join(" ")}
        />
        <article
          className={[
            "w-full max-w-sm rounded-3xl border border-white/20 bg-[#2E8B57]/80 p-6 text-white shadow-[0_0_28px_rgba(60,179,113,0.45)] backdrop-blur-xl",
            "transition-all duration-1000 ease-out",
            open ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
          ].join(" ")}
        >
          <p className="text-center text-sm text-white/70">
            {placement?.label}
          </p>
          <h1 className="mt-1 text-center text-4xl font-extrabold">
            Ticket {shown.id}
          </h1>
          <ul className="mt-6 space-y-3">
            {shown.orders.map((l) => (
              <li
                key={l.product}
                className="flex items-center justify-between rounded-2xl border border-white/15 bg-white/10 px-4 py-3"
              >
                <span className="font-semibold">
                  {l.qty} × {l.product}
                </span>
                <span className="tabular-nums">
                  {(l.qty * l.price).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-center text-2xl font-bold">
            {total.toFixed(2)} RON
          </p>
          <p className="mt-2 text-center text-sm text-white/70">
            Waiting for the bar
          </p>
        </article>
      </div>
    );
  }

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
        <HeatmenuHeader
          title="Investo Bar Menu"
          subtitle={placement ? placement.label : undefined}
        />
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
                className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between bg-[#2E8B57] px-4 py-3 text-white shadow-[0_0_24px_rgba(60,179,113,0.45)]"
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

                <div className="min-h-0 flex-1 overflow-y-auto">
                  {cart.map((line) => (
                    <div
                      key={line.product}
                      className="flex items-center gap-3 py-2"
                    >
                      <span className="flex-1 text-lg font-bold">
                        {line.product}
                      </span>
                      <button
                        type="button"
                        onClick={() => bump(line.product, -1)}
                        className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-sm font-bold text-zinc-900"
                      >
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
                      <span className="w-20 text-center text-lg font-bold tabular-nums">
                        {(line.qty * line.price).toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() => remove(line.product)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-sm font-bold text-white"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={submitCart}
                  disabled={submitting}
                  className="mx-auto mt-4 w-4/5 shrink-0 rounded-2xl bg-[#3CB371] py-3 text-base font-bold text-white disabled:opacity-60"
                >
                  {submitting ? "Sending…" : "Submit"}
                </button>
              </div>
            )}{" "}
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
