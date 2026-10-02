import type { MenuDataPoint } from "@/lib/types";

export function visibleSeries(
  series: MenuDataPoint[],
  now = new Date(),
): MenuDataPoint[] {
  if (!Array.isArray(series) || series.length === 0) return [];
  const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const ready = series.filter((row) => row.time <= hhmm);
  return ready.length ? ready : series.slice(0, 1);
}