// components/orders/order-table.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { OrderRow } from "@/lib/types";
import { useIsMobile } from "@/hooks/use-mobile";
import { notifyNewOrder } from "@/lib/notify-new-order";
import { toast } from "sonner";

type Props = {
  /** Optional: SSR initial data */
  initialOrders?: OrderRow[];
  status?: "pending" | "confirmed" | "all";
};

export function OrderTable({ initialOrders = [], status = "pending" }: Props) {
  const isMobile = useIsMobile();
  const [orders, setOrders] = useState<OrderRow[]>(initialOrders);
  const [loading, setLoading] = useState(!initialOrders.length);
  const prevIdsRef = useRef<Set<string>>(new Set());
  const primedRef = useRef(false);

  const load = useCallback(async () => {
    try {
      const q = status === "all" ? "" : `?status=${status}`;
      const res = await fetch(`/api/orders${q}`);
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      const list: OrderRow[] = Array.isArray(data) ? data : (data.orders ?? []);

      const nextIds = new Set(list.map((o) => o.id));

      if (primedRef.current) {
        const alertsOn =
          typeof window !== "undefined" &&
          "Notification" in window &&
          Notification.permission === "granted";

        if (alertsOn) {
          for (const o of list) {
            if (!prevIdsRef.current.has(o.id)) {
              notifyNewOrder(
                `New order: ${o.product} ×${o.qty ?? 1} - ${((o.qty ?? 1) * Number(o.price)).toFixed(2)} RON`,
              );
            }
          }
        }
      } else {
        primedRef.current = true;
      }

      prevIdsRef.current = nextIds;
      setOrders(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 3000);
    return () => clearInterval(id);
  }, [load]);

  const confirm = async (id: string) => {
    const res = await fetch(`/api/orders/${id}/confirm`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(data.error || "Confirm failed", { duration: 5000 });
      return;
    }
    if (data.exchange) {
      toast.success("Exchange confirmed", { duration: 5000 });
    } else if (data.fiscal?.ok === false) {
      toast.error(data.fiscal?.error || "Bon not printed", { duration: 5000 });
    } else {
      toast.success(`Bon ${data.fiscal?.pi?.unp || "printed"}`, {
        duration: 5000,
      });
    }
    void load();
  };

  const cancel = async (id: string) => {
    const res = await fetch(`/api/orders/${id}/cancel`, {
      method: "POST",
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      console.error("cancel failed", res.status, data);
      return;
    }
    void load();
  };

  if (loading) {
    return <p className="text-sm text-white/50">Loading orders…</p>;
  }

  if (!orders.length) {
    return <p className="text-sm text-white/50">No orders in queue</p>;
  }

  if (isMobile) {
    return (
      <ul className="flex flex-col gap-3">
        {orders.map((o) => (
          <li
            key={o.id}
            className={cn(
              "rounded-2xl border p-4 shadow-sm",
              o.side === "sell"
                ? "border-red-400/40 bg-red-600/30"
                : "border-emerald-400/40 bg-emerald-600/30",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">
                  Ticket {o.ticketId ?? "-"} ·{" "}
                  {new Date(o.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <p className="mt-1 text-lg font-semibold">
                  {o.placement.label}
                </p>
                <p className="text-sm">
                  {o.product} · {o.qty ?? 1}×
                </p>
                <p className="mt-0.5 text-xs font-bold uppercase tracking-wide">
                  {o.side === "sell" ? "Sell" : "Buy"}
                  {o.buyerLabel ? ` · ${o.buyerLabel}` : ""}
                </p>
                <p className="tabular-nums">
                  {((o.qty ?? 1) * Number(o.price)).toFixed(2)} RON
                </p>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                  o.status === "pending" && "bg-yellow-500/15 text-yellow-700",
                )}
              >
                {o.status}
              </span>
            </div>

            {o.status === "pending" && (
              <div className="mt-4 flex gap-2">
                {o.side === "sell" && !o.buyerPlacementId ? (
                  <button
                    type="button"
                    disabled
                    title="Waiting for a buyer"
                    className="min-h-11 flex-1 cursor-not-allowed rounded-xl border border-dashed border-white/25 bg-white/5 px-3 py-2.5 text-sm font-bold text-white/35 line-through"
                  >
                    Confirm
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => confirm(o.id)}
                    className="min-h-11 flex-1 rounded-xl bg-primary px-3 py-2.5 text-sm font-bold text-primary-foreground"
                  >
                    Confirm
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => cancel(o.id)}
                  className="min-h-11 flex-1 rounded-xl border border-border px-3 py-2.5 text-sm font-semibold"
                >
                  Cancel
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-white/10 text-xs uppercase text-white/45">
          <tr>
            <th className="px-4 py-3">#</th>
            <th className="px-4 py-3">Placement</th>
            <th className="px-4 py-3">Product</th>
            <th className="px-4 py-3">Side</th>
            <th className="px-4 py-3">Buyer</th>
            <th className="px-4 py-3">Qty</th>
            <th className="px-4 py-3">Price</th>
            <th className="px-4 py-3">Total</th>
            <th className="px-4 py-3">Time</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr
              key={o.id}
              className={cn(
                "border-b border-white/5 text-white/90 last:border-0",
                o.side === "sell" ? "bg-red-600/30" : "bg-emerald-600/30",
              )}
            >
              <td className="px-4 py-3 tabular-nums text-white/50">
                {o.ticketId ?? "–"}
              </td>
              <td className="px-4 py-3 font-medium">{o.placement.label}</td>
              <td className="px-4 py-3">
                {o.product}
                {o.qty > 1 ? ` ×${o.qty}` : ""}
              </td>
              <td className="px-4 py-3 text-xs font-bold uppercase tracking-wide">
                {o.side === "sell" ? "Sell" : "Buy"}
              </td>
              <td className="px-4 py-3 font-medium">
                {o.buyerLabel ?? "–"}
              </td>
              <td className="px-4 py-3 tabular-nums">
                {o.price.toFixed(2)} RON
              </td>
              <td className="px-4 py-3 tabular-nums">{o.qty ?? 1}</td>
              <td className="px-4 py-3 tabular-nums">
                {((o.qty ?? 1) * Number(o.price)).toFixed(2)} RON
              </td>
              <td className="px-4 py-3 text-white/50">
                {new Date(o.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    o.status === "pending" &&
                      "bg-yellow-400/15 text-yellow-200",
                    o.status === "confirmed" &&
                      "bg-emerald-400/15 text-emerald-200",
                    o.status === "cancelled" && "bg-white/10 text-white/50",
                  )}
                >
                  {o.status}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                {o.status === "pending" &&
                  (o.side === "sell" && !o.buyerPlacementId ? (
                    <button
                      type="button"
                      disabled
                      title="Waiting for a buyer"
                      className="cursor-not-allowed rounded-xl border border-dashed border-white/25 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/35 line-through"
                    >
                      Confirm
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => confirm(o.id)}
                      className="rounded-xl bg-white/15 px-3 py-1.5 text-xs font-bold hover:bg-white/25"
                    >
                      Confirm
                    </button>
                  ))}
                {o.status === "pending" && (
                  <button
                    type="button"
                    onClick={() => cancel(o.id)}
                    className="rounded-xl bg-white/15 px-3 py-1.5 text-xs font-bold hover:bg-white/25 ml-2"
                  >
                    Cancel
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
