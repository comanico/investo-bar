"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import * as React from "react";
import axios from "axios";
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
}

const initialMenu: MenuItem[] = [
  {
    product: "Heineken",
    type: "Bere",
    price: 10,
    quantity: 0,
  },
  {
    product: "Corona",
    type: "Bere",
    price: 12,
    quantity: 0,
  },
  {
    product: "Peroni",
    type: "Bere",
    price: 10,
    quantity: 0,
  },
  {
    product: "Prosecco",
    type: "Vin",
    price: 15,
    quantity: 0,
  },
  {
    product: "Aperol Spritz",
    type: "Vin",
    price: 16,
    quantity: 0,
  },
  {
    product: "Vin Rosu",
    type: "Vin",
    price: 15,
    quantity: 0,
  },
  {
    product: "Vin Alb",
    type: "Vin",
    price: 15,
    quantity: 0,
  },
  {
    product: "Vin Spumant Fara Alcool",
    type: "Racoritoare",
    price: 12,
    quantity: 0,
  },
  {
    product: "Cola",
    type: "Racoritoare",
    price: 9,
    quantity: 0,
  },
  {
    product: "Apa",
    type: "Racoritoare",
    price: 8,
    quantity: 0,
  },
];

export function MenuTable({ initial }: { initial: MenuItem[] }) {
  // Use state to manage menu items
  const [menu, setMenu] = useState(initial?.length ? initial : initialMenu);
  const [diffs, setDiffs] = useState<Record<string, number>>({});
  const DATA_URL = "https://d2xgbzki9fbs74.cloudfront.net/api/prices.json";

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
  };

  const normalizeProduct = (name: string) =>
    name.toLowerCase().replace(/\s+/g, "_");

  // Calculate the next target time (00, 15, 30, or 45 minutes)
  const getNextTargetTime = (now: Date = new Date()) => {
    const currentMinutes = now.getMinutes();
    let targetMinutes = Math.ceil(currentMinutes / 15) * 15;
    // eslint-disable-next-line prefer-const
    let target = new Date(now);
    target.setMinutes(targetMinutes, 0, 0);
    if (targetMinutes >= 60) {
      target.setHours(now.getHours() + 1);
      target.setMinutes(0);
      targetMinutes = 0;
    }
    if (target.getTime() <= now.getTime()) {
      target.setMinutes(targetMinutes + 15, 0, 0);
      if (targetMinutes + 15 >= 60) {
        target.setHours(now.getHours() + 1);
        target.setMinutes(0);
      }
    }
    return target;
  };

  // Use a ref to track the initial prop without causing effect re-runs
  const initialRef = useRef(initial);
  useEffect(() => {
    initialRef.current = initial;
  }, [initial]);

  const newPrice = useCallback(async () => {
    try {
      const response = await axios.get<MenuDataPoint[]>(DATA_URL, {
        timeout: 5000,
      });
      const data: MenuDataPoint[] = response.data;
      if (!data.length) return;
      const lastUpdate = data[data.length - 1];
      const prevUpdate = data.length > 1 ? data[data.length - 2] : undefined;

      // update prices
      setMenu((prev) =>
        prev.map((item) => {
          const normalizedKey = item.product.toLowerCase().replace(/\s+/g, "_");
          const mapKey = productKeyMap[normalizedKey];
          if (!mapKey) return item;
          const candidate = lastUpdate[mapKey];
          return typeof candidate === "number"
            ? { ...item, price: candidate }
            : item;
        })
      );

      // compute diffs using last two entries
      const computedDiffs: Record<string, number> = {};
      const currentInitial = initialRef.current?.length
        ? initialRef.current
        : initialMenu;
      for (const item of currentInitial) {
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
    } catch (err) {
      console.error("Fetch error:", err);
    }
  }, []);

  // Fetch data initially and at every 15-minute interval
  useEffect(() => {
    // Initial fetch
    newPrice();

    // Schedule fetches at 15-minute intervals (00, 15, 30, 45)
    const scheduleNextFetch = (): ReturnType<typeof setTimeout> => {
      const now = new Date();
      const target = getNextTargetTime(now);
      const delay = Math.max(0, target.getTime() - now.getTime());

      // Schedule fetch at the next 15-minute mark
      return setTimeout(() => {
        newPrice();
        // After fetching, schedule the next one
        timeoutRef.current = scheduleNextFetch();
      }, delay);
    };

    const timeoutRef = { current: scheduleNextFetch() };

    return () => {
      clearTimeout(timeoutRef.current);
    };
  }, [newPrice]);

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
              // Group menu items by type
              const groupedMenu = menu.reduce((acc, item) => {
                if (!acc[item.type]) {
                  acc[item.type] = [];
                }
                acc[item.type].push(item);
                return acc;
              }, {} as Record<string, typeof menu>);

              // Define the order of types
              const typeOrder = ["Bere", "Vin", "Racoritoare"];

              return typeOrder.map((type) => {
                const items = groupedMenu[type] || [];
                if (items.length === 0) return null;

                return items.map((item) => (
                  <TableRow key={item.product}>
                    <TableCell className="text-xl text-center">
                      {item.product}
                    </TableCell>
                    <TableCell className="text-xl">{item.price}</TableCell>
                    <TableCell className="text-xl">
                      {(() => {
                        const diff = diffs[item.product] ?? 0;
                        const cls =
                          diff > 0
                            ? "text-red-600"
                            : diff < 0
                            ? "text-green-600"
                            : "text-muted-foreground";
                        const formatted = `${diff > 0 ? "+" : ""}${diff.toFixed(
                          2
                        )}`;
                        return <span className={cls}>{formatted}</span>;
                      })()}
                    </TableCell>
                  </TableRow>
                ));
              });
            })()}
          </TableBody>{" "}
        </Table>
      </div>
    </div>
  );
}
