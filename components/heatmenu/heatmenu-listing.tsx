import Counter from "../ui/counter";
import { cn } from "@/lib/utils";
import type { HeatmenuItem, MenuListing } from "@/lib/types";
import { Beer, Wine, CupSoda, Martini, type LucideIcon } from "lucide-react";
import { getPricePlaces } from "@/actions/getPlaces";
import { DEFAULT_MENU_ITEMS } from "@/lib/menu-items";

const TYPE_ICONS: Record<string, LucideIcon> = {
  Bere: Beer,
  Vin: Wine,
  Racoritoare: CupSoda,
  Spirtoase: Martini,
};

export function HeatmenuListing({
  listing,
  market,
  own,
  canBuy,
  onBuy,
}: {
  listing: MenuListing;
  market?: HeatmenuItem;
  own: boolean;
  canBuy: boolean;
  onBuy: () => void;
}) {
  const type =
    DEFAULT_MENU_ITEMS.find((item) => item.product === listing.product)?.type ??
    "Bere";
  const Icon = TYPE_ICONS[type] ?? Beer;
  const price = market?.price;
  const prev = market?.prevPrice ?? price;
  const diff = price != null && prev != null ? price - prev : 0;
  const pct = !prev ? 0 : (diff / prev) * 100;
  const moved = diff !== 0;

  return (
    <article
      className={cn(
        "flex w-full flex-row items-center gap-3 rounded-3xl border p-3 text-white",
        "border-amber-200/50 bg-amber-300/15 backdrop-blur-xl",
        "shadow-[inset_0_1px_0_rgba(255,236,200,0.5),0_10px_30px_rgba(217,119,6,0.2)]",
      )}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-amber-100/30 bg-amber-200/15">
        <Icon className="h-5 w-5 text-amber-50" strokeWidth={1.5} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold uppercase tracking-wide text-amber-100/80">
          For sale · {listing.seller}
        </p>
        <h2 className="truncate text-sm font-semibold leading-tight">
          {listing.product}
          {listing.qty > 1 ? ` · ${listing.qty}×` : ""}
        </h2>
        {price != null && (
          <>
            <div className="mt-0.5 flex items-baseline gap-1">
              <span className="text-lg font-bold tabular-nums">
                <Counter
                  value={price}
                  fontSize={18}
                  places={getPricePlaces(price)}
                  gap={1}
                  horizontalPadding={0}
                  borderRadius={0}
                  padding={0}
                  gradientHeight={0}
                  gradientFrom="transparent"
                  gradientTo="transparent"
                  fontWeight={700}
                  textColor="inherit"
                />
              </span>
              <span className="text-xs text-amber-50/80">RON</span>
            </div>
            <p className="mt-0.5 text-xs font-medium text-amber-100">
              {moved ? (diff > 0 ? "▲ +" : "▼ −") : "– "}
              {Math.abs(diff).toFixed(2)} RON ({diff > 0 ? "+" : diff < 0 ? "−" : ""}
              {Math.abs(pct).toFixed(1)}%)
            </p>
          </>
        )}
      </div>
      {own ? (
        <span className="shrink-0 rounded-2xl bg-white/15 px-4 py-2.5 text-sm font-bold text-amber-50">
          Yours
        </span>
      ) : (
        canBuy && (
          <button
            type="button"
            onClick={onBuy}
            className="shrink-0 rounded-2xl bg-white/15 px-4 py-2.5 text-sm font-bold active:scale-95"
          >
            Buy
          </button>
        )
      )}
    </article>
  );
}
