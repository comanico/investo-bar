import prismadb from "@/lib/prismadb";
import { lastSnapshot } from "@/lib/leaderboard";
import { sessionDateBucharest } from "@/lib/session-date";
import { visibleSeries } from "@/lib/visible-series";
import { productKeyMap, type MenuDataPoint } from "@/lib/types";
import { NextResponse } from "next/server";
import { generatePresignedUrl } from "../live-prices/route";

export const dynamic = "force-dynamic";

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function markOf(snapshot: Record<string, unknown> | null, product: string) {
  if (!snapshot) return undefined;
  const key = productKeyMap[product.toLowerCase().replace(/\s+/g, "_")];
  const raw = key ? snapshot[key] : undefined;
  return typeof raw === "number" ? raw : undefined;
}

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const placement = await prismadb.placement.findFirst({
    where: { token, active: true },
  });
  if (!placement) {
    return NextResponse.json({ error: "Invalid table" }, { status: 404 });
  }

  const sessionDate = sessionDateBucharest();
  const next = new Date(sessionDate);
  next.setUTCDate(next.getUTCDate() + 1);

  const [lots, series] = await Promise.all([
    prismadb.portfolioLot.findMany({
      where: {
        placementId: placement.id,
        sessionDate: { gte: sessionDate, lt: next },
      },
      select: { product: true, qty: true, unitPrice: true },
    }),
    fetchLivePrices(),
  ]);

  const snapshot = lastSnapshot(visibleSeries(series as MenuDataPoint[]));

  const byProduct = new Map<string, { qty: number; cost: number; value: number }>();

  for (const lot of lots) {
    const qty = lot.qty > 0 ? lot.qty : 1;
    const unit = Number(lot.unitPrice);
    const mark = markOf(snapshot, lot.product);
    const priceNow = typeof mark === "number" ? mark : unit;
    const cur = byProduct.get(lot.product) ?? { qty: 0, cost: 0, value: 0 };
    cur.qty += qty;
    cur.cost += unit * qty;
    cur.value += priceNow * qty;
    byProduct.set(lot.product, cur);
  }

  const positions = [...byProduct.entries()].map(([product, p]) => {
    const pnl = p.value - p.cost;
    const ret = p.cost === 0 ? 0 : pnl / p.cost;
    return {
      product,
      qty: p.qty,
      cost: round2(p.cost),
      value: round2(p.value),
      pnl: round2(pnl),
      ret: Math.round(ret * 1000) / 1000,
    };
  });

  positions.sort((a, b) => b.pnl - a.pnl);

  const cost = round2(positions.reduce((n, p) => n + p.cost, 0));
  const value = round2(positions.reduce((n, p) => n + p.value, 0));
  const pnl = round2(value - cost);

  return NextResponse.json({
    label: placement.label,
    asOf: snapshot && "time" in snapshot ? snapshot.time : null,
    cost,
    value,
    pnl,
    ret: cost === 0 ? 0 : Math.round((pnl / cost) * 1000) / 1000,
    positions,
  });
}

async function fetchLivePrices(): Promise<MenuDataPoint[]> {
  const url = await generatePresignedUrl("live_prices.json", 86400);
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}