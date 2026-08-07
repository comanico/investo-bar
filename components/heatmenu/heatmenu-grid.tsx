"use client";

import { HeatmenuCard } from "./heatmenu-card";
import type { HeatmenuItem } from "@/lib/types";

export function HeatmenuGrid({ items }: { items: HeatmenuItem[] }) {
  return (
    <div
      className="grid w-full h-full gap-4
        grid-cols-1
        sm:grid-cols-2
        lg:grid-cols-3
        xl:grid-cols-4
        2xl:grid-cols-5
        auto-rows-fr
      "
    >
      {items.map((item) => (
        <HeatmenuCard key={item.product} item={item} />
      ))}
    </div>
  );
}
