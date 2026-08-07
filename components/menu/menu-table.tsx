"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { MenuItem } from "@/actions/getMenu";
import { DEFAULT_MENU_ITEMS, MENU_TYPE_ORDER } from "@/lib/menu-items";
import Counter from "../ui/counter";
import { getPricePlaces, getDiffPlaces } from "@/actions/getPlaces";

interface MenuDataPoint {
  time: string;
  heineken: number;
  corona: number;
  peroni: number;
  aperol_spritz: number;
  vin_rosu: number;
  vin_alb: number;
  prosecco: number;
  vin_spumant_fara_alcool: number;
  apa: number;
  cola: number;
  jameson: number;
  jameson_black_barrel: number;
  fireball: number;
  tequilla: number;
}

const initialMenu = DEFAULT_MENU_ITEMS;

export function MenuTable({ initial }: { initial: MenuItem[] }) {
  const [menu, setMenu] = useState(initial.length > 0 ? initial : initialMenu);
  const [diffs, setDiffs] = useState<Record<string, number>>({});
  const [lastFetchedMinute, setLastFetchedMinute] = useState<number | null>(
    null,
  );

  const productKeyMap: Record<string, keyof MenuDataPoint> = {
    heineken: "heineken",
    corona: "corona",
    peroni: "peroni",
    prosecco: "prosecco",
    aperol_spritz: "aperol_spritz",
    vin_rosu: "vin_rosu",
    vin_alb: "vin_alb",
    vin_spumant_fara_alcool: "vin_spumant_fara_alcool",
    cola: "cola",
    apa: "apa",
    jameson: "jameson",
    jameson_black_barrel: "jameson_black_barrel",
    fireball: "fireball",
    tequilla: "tequilla",
  };

  const normalizeProduct = (name: string) =>
    name.toLowerCase().replace(/\s+/g, "_");

  const newPrice = async () => {
    try {
      const response = await fetch("/api/get-file?key=live_prices.json", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: MenuDataPoint[] = await response.json();
      if (!data.length) return;

      const lastUpdate = data[data.length - 1];
      const prevUpdate = data.length > 1 ? data[data.length - 2] : undefined;

      // Update prices
      setMenu((prev) =>
        prev.map((item) => {
          const normalizedKey = item.product.toLowerCase().replace(/\s+/g, "_");
          const mapKey = productKeyMap[normalizedKey];
          if (!mapKey) return item;
          const candidate = lastUpdate[mapKey];
          return typeof candidate === "number"
            ? { ...item, price: candidate }
            : item;
        }),
      );

      // Compute diffs
      const computedDiffs: Record<string, number> = {};
      for (const item of menu) {
        const key = productKeyMap[normalizeProduct(item.product)];
        if (!key) continue;
        const latest = lastUpdate[key];
        const previous = prevUpdate ? prevUpdate[key] : undefined;
        const latestNum = typeof latest === "number" ? latest : Number(latest);
        const prevNum =
          typeof previous === "number" ? previous : Number(previous);
        computedDiffs[item.product] =
          Number.isFinite(latestNum) && Number.isFinite(prevNum)
            ? latestNum - prevNum
            : 0;
      }
      setDiffs(computedDiffs);

      // Mark this minute as fetched
      const now = new Date();
      setLastFetchedMinute(now.getMinutes());
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => {
    // Initial fetch on mount
    newPrice();

    const interval = setInterval(() => {
      const now = new Date();
      const currentMinute = now.getMinutes();

      // Only fetch at minutes 0, 15, 30, 45
      const allowedMinutes = [0, 15, 30, 45];
      const shouldFetch = allowedMinutes.includes(currentMinute);

      // Prevent multiple fetches in the same minute
      if (shouldFetch && currentMinute !== lastFetchedMinute) {
        newPrice();
      }
    }, 1000); // Check every second

    return () => clearInterval(interval);
  }, [lastFetchedMinute]);

  return (
    <div className="flex justify-center w-full h-full">
      <div className="w-[75%] h-[700%]">
        <Table>
          <TableCaption></TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="text-3xl font-bold text-center">
                Produs
              </TableHead>
              <TableHead className="text-3xl font-bold">Preț</TableHead>
              <TableHead className="text-3xl font-bold">⇅</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(() => {
              const groupedMenu = menu.reduce(
                (acc, item) => {
                  if (!acc[item.type]) acc[item.type] = [];
                  acc[item.type].push(item);
                  return acc;
                },
                {} as Record<string, typeof menu>,
              );

              const typeOrder = MENU_TYPE_ORDER;

              return typeOrder.map((type) => {
                const items = groupedMenu[type] || [];
                if (items.length === 0) return null;

                return items.map((item) => (
                  <TableRow key={item.product}>
                    <TableCell className="text-xl text-center">
                      {item.product}
                    </TableCell>
                    <TableCell className="text-xl">
                      <Counter
                        value={item.price}
                        fontSize={20}
                        places={getPricePlaces(item.price)}
                        gap={1}
                        horizontalPadding={0}
                        gradientFrom="transparent"
                        gradientTo="transparent"
                        fontWeight={600}
                      />
                    </TableCell>
                    <TableCell className="text-xl">
                      {(() => {
                        const diff = diffs[item.product] ?? 0;
                        const cls =
                          diff > 0
                            ? "text-red-600"
                            : diff < 0
                              ? "text-green-600"
                              : "text-muted-foreground";
                        return (
                          <span
                            className={`inline-flex items-center gap-0.5 ${cls}`}
                          >
                            {diff > 0 ? "+" : ""}
                            <Counter
                              value={Math.abs(diff)}
                              fontSize={18}
                              places={getDiffPlaces(diff)}
                              gap={1}
                              horizontalPadding={0}
                              gradientFrom="transparent"
                              gradientTo="transparent"
                              fontWeight={600}
                            />
                          </span>
                        );
                      })()}
                    </TableCell>
                  </TableRow>
                ));
              });
            })()}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
