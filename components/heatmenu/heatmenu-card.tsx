import Counter from "../ui/counter";
import { cn } from "@/lib/utils";
import type { HeatmenuItem } from "@/lib/types";
import { Beer, Wine, CupSoda, Martini, type LucideIcon } from "lucide-react";
import { getPricePlaces, getDiffPlaces, PlaceValue } from "@/actions/getPlaces";

const TYPE_ICONS: Record<string, LucideIcon> = {
  Bere: Beer,
  Vin: Wine,
  Racoritoare: CupSoda,
  Spirtoase: Martini,
};

export function HeatmenuCard({ item }: { item: HeatmenuItem }) {
  const Icon = TYPE_ICONS[item.type] ?? Beer;
  const diff = item.price - item.prevPrice;
  const pct = item.prevPrice === 0 ? 0 : (diff / item.prevPrice) * 100;
  const isUp = diff > 0;
  const isDown = diff < 0;

  return (
    <article
      className={cn(
        // even size + clip children
        "relative flex h-full min-h-0 w-full flex-col overflow-hidden rounded-3xl",
        "aspect-[3/4] sm:aspect-square xl:aspect-[4/3]",
        "border border-white/10 bg-white/5 p-4 backdrop-blur-xl",
        "transition-all duration-500",
        isUp &&
          "border-red-400/30 bg-gradient-to-br from-[#DC143C]/70 to-[#FF4500]/50 shadow-[0_0_28px_rgba(255,69,0,0.45)]",
        isDown &&
          "border-emerald-400/30 bg-gradient-to-br from-[#2E8B57]/70 to-[#3CB371]/50 shadow-[0_0_28px_rgba(60,179,113,0.45)]",
      )}
    >
      <div className="flex min-h-0 flex-1 items-center justify-center pt-2">
        <div
          className="
            flex aspect-square w-[40%] max-w-[5.5rem] min-w-[2.75rem]
            shrink-0 items-center justify-center rounded-full
            bg-white/10 text-2xl font-bold sm:text-3xl
          "
        >
          <Icon className="h-[55%] w-[55%] text-white/90" strokeWidth={1.5} />
        </div>
      </div>

      <div className="mt-auto w-full shrink-0 space-y-1 pb-1 text-center">
        <h2 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-tight sm:text-base">
          {item.product}
        </h2>

        <div className="flex items-center justify-center gap-1 text-xl font-bold sm:text-2xl">
          <Counter
            value={item.price}
            fontSize={22}
            places={getPricePlaces(item.price)}
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
          <span className="text-sm opacity-80">RON</span>
        </div>

        <div
          className={cn(
            "flex items-center justify-center gap-1 text-xs font-medium",
            isUp && "text-yellow-300",
            isDown && "text-yellow-200",
            !isUp && !isDown && "text-white/60",
          )}
        >
          <span>{isUp ? "▲" : isDown ? "▼" : "–"}</span>
          <span className="inline-flex items-center gap-0.5">
            {isUp ? "+" : isDown ? "−" : ""}
            <Counter
              value={Math.abs(diff)}
              fontSize={12}
              places={getDiffPlaces(diff)}
              gap={1}
              horizontalPadding={0}
              borderRadius={0}
              padding={0}
              gradientHeight={0}
              gradientFrom="transparent"
              gradientTo="transparent"
              fontWeight={600}
              textColor="inherit"
            />
            <span className="ml-0.5">
              RON ({isUp ? "+" : isDown ? "−" : ""}
              {Math.abs(pct).toFixed(1)}%)
            </span>
          </span>
        </div>
      </div>
    </article>
  );
}
