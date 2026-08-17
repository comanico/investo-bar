// components/orders/order-table.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { OrderRow } from "@/lib/types";

type Props = {
  /** Optional: SSR initial data */
  initialOrders?: OrderRow[];
  status?: "pending" | "confirmed" | "all";
};

export function OrderTable({ initialOrders = [], status = "pending" }: Props) {
  const [orders, setOrders] = useState<OrderRow[]>(initialOrders);
  const [loading, setLoading] = useState(!initialOrders.length);

  const load = useCallback(async () => {
    try {
      const q = status === "all" ? "" : `?status=${status}`;
      const res = await fetch(`/api/orders${q}`);
      if (!res.ok) throw new Error("Failed to load orders");
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : (data.orders ?? []));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 1000); // queue refresh
    return () => clearInterval(id);
  }, [load]);

  const confirm = async (id: string) => {
    const res = await fetch(`/api/orders/${id}/confirm`, { method: "POST" });
    if (res.ok) void load();
  };

  if (loading) {
    return <p className="text-sm text-white/50">Loading orders…</p>;
  }

  if (!orders.length) {
    return <p className="text-sm text-white/50">No orders in queue</p>;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-white/10 text-xs uppercase text-white/45">
          <tr>
            <th className="px-4 py-3">#</th>
            <th className="px-4 py-3">Placement</th>
            <th className="px-4 py-3">Product</th>
            <th className="px-4 py-3">Price</th>
            <th className="px-4 py-3">Time</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {orders.map((o, i) => (
            <tr
              key={o.id}
              className="border-b border-white/5 text-white/90 last:border-0"
            >
              <td className="px-4 py-3 tabular-nums text-white/50">
                {orders.length - i}
              </td>
              <td className="px-4 py-3 font-medium">{o.placement.label}</td>
              <td className="px-4 py-3">
                {o.product}
                {o.qty > 1 ? ` ×${o.qty}` : ""}
              </td>
              <td className="px-4 py-3 tabular-nums">
                {o.price.toFixed(2)} RON
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
                {o.status === "pending" && (
                  <button
                    type="button"
                    onClick={() => confirm(o.id)}
                    className="rounded-xl bg-white/15 px-3 py-1.5 text-xs font-bold hover:bg-white/25"
                  >
                    Confirm
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
