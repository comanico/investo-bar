import { LeaderboardRow, PortfolioLotRow, productKeyMap, type MenuDataPoint } from "./types";

function normalizeProduct(name: string) {
    return name.toLowerCase().replace(/\s+/g, "_");
}

function livePrice(
    snapshot: MenuDataPoint | Record<string, unknown>,
    product: string,
): number | undefined {
    const key = productKeyMap[normalizeProduct(product)];
    if (!key) return undefined;
    const raw = snapshot[key];
    return typeof raw === "number" ? raw : undefined;
}

export function lastSnapshot(
    series: unknown,
): Record<string, unknown> | null {
    if (!Array.isArray(series) || series.length === 0) return null;
    const last = series[series.length - 1];
    if (!last || typeof last !== "object" || Array.isArray(last)) return null;
    return last as Record<string, unknown>;
}

export function buildLeaderboard(lots: PortfolioLotRow[], snapshot: Record<string, unknown> | null): LeaderboardRow[] {

    type Acc = {
        placementId: string;
        label: string;
        cost: number;
        value: number;
        qty: number;
    }

    const byTable = new Map<string, Acc>();

    for (const lot of lots) {
        const qty = lot.qty > 0 ? lot.qty : 1;
        const unit = Number(lot.unitPrice)
        const mark = snapshot != null ? livePrice(snapshot, lot.product) : undefined;
        const priceNow = typeof mark === "number" ? mark : unit;

        const cur = byTable.get(lot.placementId) ?? {
            placementId: lot.placementId,
            label: lot.placementLabel,
            cost: 0,
            value: 0,
            qty: 0
        }

        cur.cost += unit * qty;
        cur.value += priceNow * qty;
        cur.qty += qty;
        byTable.set(lot.placementId, cur)
    }

    const rows: LeaderboardRow[] = [...byTable.values()].map((t) => {
        const pnl = t.value - t.cost;
        const ret = t.cost === 0 ? 0 : pnl / t.cost;

        return {
            placementId: t.placementId,
            label: t.label,
            cost: round2(t.cost),
            value: round2(t.cost),
            pnl: round2(pnl),
            ret: Math.round(ret * 1000) / 1000,
            qty: t.qty
        }
    })

    rows.sort((a, b) => {
        if (b.ret !== a.ret) return b.ret - a.ret;
        if (b.pnl !== a.pnl) return b.pnl - a.pnl;
        return a.label.localeCompare(b.label);
      });

    return rows;
}

function round2(n: number) {
    return Math.round(n * 100) / 100;
  }