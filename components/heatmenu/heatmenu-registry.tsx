"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type BoardOrder = {
  id: string;
  product: string;
  price: number;
  createdAt: string;
  placement: { label: string };
};

export function HeatmenuOrderRegistry() {
  const [orders, setOrders] = useState<BoardOrder[]>([]);

  const load = useCallback(async () => {
    const res = await fetch("/api/orders/board"); // or /api/orders?status=pending if authed
    if (!res.ok) return;
    const data = await res.json();
    const list: BoardOrder[] = data.orders ?? data;
    setOrders(list);
  }, []);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 2000);
    return () => clearInterval(id);
  }, [load]);

  return (
    <div className="flex h-full max-h-full flex-col rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/50">
        Order registry
      </h2>

      <div className="min-h-0 flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-white/45">Client</TableHead>
              <TableHead className="text-white/45">Product</TableHead>
              <TableHead className="text-white/45">Price</TableHead>
              <TableHead className="text-white/45">Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence initial={false}>
              {orders.map((o) => (
                <motion.tr
                  key={o.id}
                  layout
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 40 }}
                  transition={{ duration: 0.35 }}
                  className="border-white/5"
                >
                  <TableCell className="font-medium text-white">
                    {o.placement.label}
                  </TableCell>
                  <TableCell className="text-white/90">{o.product}</TableCell>
                  <TableCell className="tabular-nums text-white/90">
                    {Number(o.price).toFixed(2)} RON
                  </TableCell>
                  <TableCell className="text-white/50">
                    {new Date(o.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>
                </motion.tr>
              ))}
            </AnimatePresence>
          </TableBody>
        </Table>

        {!orders.length && (
          <p className="py-8 text-center text-sm text-white/40">
            Waiting for orders…
          </p>
        )}
      </div>
    </div>
  );
}
