import prismadb from "@/lib/prismadb";
import { generatePresignedUrl } from "../live-prices/route";
import { sessionDateBucharest } from "@/lib/session-date";
import { buildLeaderboard, lastSnapshot } from "@/lib/leaderboard";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sessionDate = sessionDateBucharest()
    const next = new Date(sessionDate);
    next.setUTCDate(next.getUTCDate() + 1);

    const [lots, series] = await Promise.all([
      prismadb.portfolioLot.findMany({
        where: {
          sessionDate: { gte: sessionDate, lt: next },
          placement: { kind: "table" },
        }, select: {
          placementId: true,
          placementLabel: true,
          product: true,
          qty: true,
          unitPrice: true
        },
      }),
      fetchLivePrices()
    ]);

    const snapshot = lastSnapshot(series);
    const rows = buildLeaderboard(
      lots.map((l) => ({
        ...l,
        unitPrice: Number(l.unitPrice)
      })),
      snapshot,
    );

    return NextResponse.json({
      asOf: snapshot && "time" in snapshot ? snapshot.time : null,
      sessionDate: sessionDate.toISOString().slice(0, 10),
      rows
    });
  } catch (e) {
    console.error("GET /api/leaderboard", e);
    return NextResponse.json(
      { error: "Failed to build leaderboard" },
      { status: 500 },
    )
  }
}

async function fetchLivePrices(): Promise<unknown> {
  const presignedUrl = await generatePresignedUrl("live_prices.json", 86400);
  const res = await fetch(presignedUrl, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) return [];
  return res.json();
}

function dueStamp(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Bucharest",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const hour = Number(parts.find((p) => p.type === "hour")?.value);
  const minute = Number(parts.find((p) => p.type === "minute")?.value);
  const quarter = Math.floor(minute / 15) * 15;
  return `${String(hour).padStart(2, "0")}:${String(quarter).padStart(2, "0")}`;
}