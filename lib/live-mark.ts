import { generatePresignedUrl } from "@/app/api/live-prices/route";
import { lastSnapshot } from "@/lib/leaderboard";
import { productKeyMap, type MenuDataPoint } from "@/lib/types";
import { visibleSeries } from "@/lib/visible-series";

export async function liveMark(product: string) {
  try {
    const url = await generatePresignedUrl("live_prices.json", 60);
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return undefined;
    const data = await res.json();
    const series = visibleSeries(
      Array.isArray(data) ? (data as MenuDataPoint[]) : [],
    );
    const snapshot = lastSnapshot(series);
    if (!snapshot) return undefined;
    const key = productKeyMap[product.toLowerCase().replace(/\s+/g, "_")];
    const raw = key ? snapshot[key] : undefined;
    return typeof raw === "number" && raw > 0
      ? Math.round(raw * 100) / 100
      : undefined;
  } catch {
    return undefined;
  }
}
