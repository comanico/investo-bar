"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HeatmenuHeader } from "./heatmenu-header";
import { HeatmenuGrid } from "./heatmenu-grid";
import { HeatmenuItem, MenuDataPoint, CartLine, MenuListing } from "@/lib/types";
import { buildItems } from "@/lib/buildItems";
import { useIsMobile } from "@/hooks/use-mobile";
import { HeatmenuCard } from "./heatmenu-card";
import { HeatmenuListing } from "./heatmenu-listing";
import { HeatmenuOrderRegistry } from "./heatmenu-registry";
import { TicketScreen } from "@/components/ticket/ticket-screen";
import { visibleSeries } from "@/lib/visible-series";

type OpenTicket = {
  id: string;
  orders: { product: string; qty: number; price: number; side?: string }[];
  exchange?: boolean;
};

type Props = {
  /** Set when opened from /t/[token] */
  placement?: { id: string; token: string; label: string; kind: string };
};

export function HeatmenuApp({ placement }: Props = {}) {
  const isMobile = useIsMobile();
  const showBuy = Boolean(placement) && isMobile;
  const [items, setItems] = useState<HeatmenuItem[]>(() => buildItems([]));
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ticket, setTicket] = useState<OpenTicket | null>(null);
  const [shown, setShown] = useState<OpenTicket | null>(ticket);
  const [listings, setListings] = useState<MenuListing[]>([]);
  const [stale, setStale] = useState(false);
  const shownTimeRef = useRef<string | null>(null);
  const lastFetchedMinuteRef = useRef<number | null>(null);
  const allowApplyRef = useRef(true);
  const staleTimerRef = useRef<number | null>(null);
  const applyAbortRef = useRef<AbortController | null>(null);

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

  const loadSeries = useCallback(async (signal?: AbortSignal) => {
    const response = await fetch("/api/get-file?key=live_prices.json", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal,
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: MenuDataPoint[] = await response.json();
    return visibleSeries(Array.isArray(data) ? data : []);
  }, []);

  const fetchPrices = useCallback(async () => {
    applyAbortRef.current?.abort();
    const ac = new AbortController();
    applyAbortRef.current = ac;
    try {
      const series = await loadSeries(ac.signal);
      const lastTime = series.at(-1)?.time ?? null;
      const moved =
        lastTime != null &&
        shownTimeRef.current != null &&
        lastTime !== shownTimeRef.current;
      if (showBuy && moved && !allowApplyRef.current) {
        setStale(true);
        return;
      }
      shownTimeRef.current = lastTime;
      setItems(buildItems(series));
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      console.error("heatmenu fetch error:", error);
      allowApplyRef.current = false;
    }
  }, [loadSeries, showBuy]);

  const checkStale = useCallback(async () => {
    if (!showBuy) return;
    try {
      const series = await loadSeries();
      const lastTime = series.at(-1)?.time;
      if (lastTime != null && lastTime !== shownTimeRef.current) {
        setStale(true);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      console.error("heatmenu stale check error:", error);
    }
  }, [loadSeries, showBuy]);

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
        setTicket({
          id: data.ticketId,
          orders: data.orders,
          exchange: Boolean(data.exchange),
        });
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
    if (!isMobile) return;
    let alive = true;

    const load = async () => {
      const res = await fetch("/api/orders/listings");
      if (!res.ok || !alive) return;
      const data = await res.json();
      if (!alive) return;
      const live: MenuListing[] = Array.isArray(data.listings) ? data.listings : [];
      setListings(live);
      setCart((cur) =>
        cur.flatMap((line) => {
          if (!line.listingId) return [line];
          const offer = live.find((item) => item.id === line.listingId);
          if (!offer) return [];
          const qty = Math.min(line.qty, offer.qty);
          if (qty < 1) return [];
          return [{ ...line, qty, maxQty: offer.qty, seller: offer.seller }];
        }),
      );
    };

    void load();
    const id = setInterval(() => void load(), 3000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [isMobile]);

  const addListing = (listing: MenuListing) => {
    if (!placement || listing.placementId === placement.id) return;
    const market = items.find((item) => item.product === listing.product);
    setCart((cur) => {
      const i = cur.findIndex((line) => line.listingId === listing.id);
      if (i >= 0) {
        const next = [...cur];
        next[i] = {
          ...next[i],
          qty: Math.min(listing.qty, next[i].qty + 1),
          maxQty: listing.qty,
          price: market?.price ?? next[i].price,
        };
        return next;
      }
      return [
        ...cur,
        {
          product: listing.product,
          type: market?.type ?? "Bere",
          price: market?.price ?? 0,
          qty: 1,
          listingId: listing.id,
          seller: listing.seller,
          maxQty: listing.qty,
        },
      ];
    });
  };

  const lineKey = (line: CartLine) => line.listingId ?? `bar:${line.product}`;

  useEffect(() => {
    allowApplyRef.current = true;
    void fetchPrices();

    const interval = setInterval(() => {
      const currentMinute = new Date().getMinutes();
      const allowedMinutes = [0, 15, 30, 45];

      if (
        allowedMinutes.includes(currentMinute) &&
        currentMinute !== lastFetchedMinuteRef.current
      ) {
        lastFetchedMinuteRef.current = currentMinute;
        allowApplyRef.current = true;
        void (async () => {
          await fetchPrices();
          if (!showBuy) return;
          await checkStale();
          if (staleTimerRef.current != null) {
            window.clearTimeout(staleTimerRef.current);
          }
          staleTimerRef.current = window.setTimeout(() => {
            void checkStale();
          }, 5000);
        })();
      }
    }, 1000);
    return () => {
      clearInterval(interval);
      if (staleTimerRef.current != null) {
        window.clearTimeout(staleTimerRef.current);
      }
    };
  }, [fetchPrices, showBuy, checkStale]);

  useEffect(() => {
    if (!showBuy) return;

    const onOffline = () => {
      applyAbortRef.current?.abort();
      allowApplyRef.current = false;
    };
    const onOnline = () => {
      void checkStale();
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") void checkStale();
    };

    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [showBuy, checkStale]);

  const submitCart = async () => {
    if (!placement || cart.length === 0 || submitting) return;
    setSubmitting(true);

    const offers = cart.filter((line) => line.listingId);
    const barLines = cart.filter((line) => !line.listingId);

    try {
      let exchange: OpenTicket | null = null;
      for (const line of offers) {
        const res = await fetch(`/api/orders/listings/${line.listingId}/buy`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: placement.token, qty: line.qty }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ticketId) return;
        exchange = {
          id: data.ticketId,
          orders: data.orders ?? [],
          exchange: true,
        };
      }

      if (barLines.length > 0) {
        const minted = await fetch("/api/ticket", { method: "POST" });
        const { ticketId } = await minted.json();
        if (!minted.ok || !ticketId) return;

        for (const line of barLines) {
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

        if (!exchange) {
          exchange = {
            id: ticketId,
            orders: barLines.map((line) => ({
              product: line.product,
              qty: line.qty,
              price: line.price,
              side: "buy",
            })),
          };
        }
      }

      if (exchange) setTicket(exchange);
      setCart([]);
      setCartOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const bump = (key: string, delta: number) => {
    setCart((cur) =>
      cur
        .map((line) => {
          if (lineKey(line) !== key) return line;
          const max = line.maxQty ?? Number.POSITIVE_INFINITY;
          return { ...line, qty: Math.min(max, line.qty + delta) };
        })
        .filter((line) => line.qty > 0),
    );
  };

  const remove = (key: string) => {
    setCart((cur) => cur.filter((line) => lineKey(line) !== key));
  };

  if (shown) {
    const exchanging =
      Boolean(shown.exchange) ||
      shown.orders.some(
        (line) => line.side === "sell" || line.side === "cashin",
      );

    return (
      <TicketScreen
        open={Boolean(ticket)}
        label={placement?.label}
        ticketId={shown.id}
        orders={shown.orders}
        caption={
          exchanging
            ? shown.orders.some((line) => line.side === "cashin")
              ? "Wait at the table, your drink is coming"
              : "Come to the bar to exchange"
            : "Waiting for the bar"
        }
      />
    );
  }

  if (showBuy && stale) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black px-6 text-white">
        <img
          src="/InvestoBar.svg"
          alt="InvestoBar"
          className="mb-8 h-24 w-auto opacity-90"
        />
        <h1 className="text-center text-3xl font-extrabold">Prices changed</h1>
        <p className="mt-3 text-center text-sm text-white/70">
          Reload or scan the table QR again
        </p>
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
          subtitle={placement?.label}
          href={placement ? `/t/${placement.token}/portfolio` : undefined}
        />
        {isMobile ? (
          <main className="w-full flex-1 space-y-3 px-4 pb-10">
            {listings.map((listing) => (
              <HeatmenuListing
                key={listing.id}
                listing={listing}
                market={items.find((item) => item.product === listing.product)}
                own={listing.placementId === placement?.id}
                canBuy={Boolean(placement)}
                onBuy={() => addListing(listing)}
              />
            ))}
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
                  {cart.map((line) => {
                    const key = lineKey(line);
                    const atMax = line.maxQty != null && line.qty >= line.maxQty;
                    return (
                    <div
                      key={key}
                      className="flex items-center gap-3 py-2"
                    >
                      <span className="flex-1 text-lg font-bold">
                        {line.product}
                        {line.seller ? (
                          <span className="mt-0.5 block text-xs font-medium text-amber-100">
                            {line.seller}
                          </span>
                        ) : null}
                      </span>
                      <button
                        type="button"
                        onClick={() => bump(key, -1)}
                        className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-sm font-bold text-zinc-900"
                      >
                        −
                      </button>
                      <span>{line.qty}</span>
                      <button
                        type="button"
                        onClick={() => bump(key, 1)}
                        disabled={atMax}
                        className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-sm font-bold text-zinc-900 disabled:opacity-30"
                      >
                        +
                      </button>
                      <span className="w-20 text-center text-lg font-bold tabular-nums">
                        {(line.qty * line.price).toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() => remove(key)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-sm font-bold text-white"
                      >
                        ✕
                      </button>
                    </div>
                    );
                  })}
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
