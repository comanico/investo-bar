"use client";

import { useState, useEffect } from "react";
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
    cola: "cola",
    apa: "apa",
  };

  const normalizeProduct = (name: string) =>
    name.toLowerCase().replace(/\s+/g, "_");

  const newPrice = async () => {
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
      for (const item of initial?.length ? initial : initialMenu) {
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
  };

  useEffect(() => {
    newPrice();
    const interval = setInterval(newPrice, 10000); // Pull every 10 seconds
    return () => clearInterval(interval);
  }, []);

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
