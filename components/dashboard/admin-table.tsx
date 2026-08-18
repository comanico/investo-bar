"use client";

import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MenuItem } from "@/actions/getMenu";
import { DEFAULT_MENU_ITEMS, MENU_TYPE_ORDER } from "@/lib/menu-items";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";
import {
  formatPosPunchSummary,
  toPosPunchLine,
} from "@/lib/smartbill-map";

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

export function AdminTable({ initial }: { initial?: MenuItem[] }) {
  const [menu, setMenu] = useState(
    initial && initial.length > 0 ? initial : initialMenu,
  );
  const [isToastActive, setIsToastActive] = useState(false);
  const [lastFetchedMinute, setLastFetchedMinute] = useState<number | null>(
    null,
  );

  const { user } = useUser();
  const username = user
    ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
    : "Unknown User";

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

  const handleIncrement = (product: string) => {
    setMenu((prevMenu) =>
      prevMenu.map((item) =>
        item.product === product
          ? { ...item, quantity: item.quantity + 1 }
          : item,
      ),
    );
  };

  const handleDecrement = (product: string) => {
    setMenu((prevMenu) =>
      prevMenu.map((item) =>
        item.product === product && item.quantity > 0
          ? { ...item, quantity: item.quantity - 1 }
          : item,
      ),
    );
  };

  const totalPrice = menu.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const newPrice = async () => {
    try {
      const response = await fetch("/api/get-file?key=live_prices.json", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!Array.isArray(data) || data.length === 0) return;

      const lastUpdate = data[data.length - 1];

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

      const now = new Date();
      setLastFetchedMinute(now.getMinutes());
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => {
    newPrice();

    const interval = setInterval(() => {
      const now = new Date();
      const currentMinute = now.getMinutes();
      const allowedMinutes = [0, 15, 30, 45];
      const shouldFetch = allowedMinutes.includes(currentMinute);

      if (shouldFetch && currentMinute !== lastFetchedMinute) {
        newPrice();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lastFetchedMinute]);

  const handleSubmit = async () => {
    try {
      const sold = menu.filter((item) => item.quantity > 0);
      const localPosLines = sold.map((item) =>
        toPosPunchLine(item.product, item.quantity, Number(item.price)),
      );
      const localSummary = formatPosPunchSummary(localPosLines);

      const response = await fetch("api/update-quantity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menu, username }),
      });

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || "Failed to submit order");
      }

      const data = await response.json().catch(() => ({}));
      const summary =
        (data.pos?.summary as string | undefined) ||
        localSummary ||
        `Total ${totalPrice.toFixed(2)} RON`;

      setIsToastActive(true);
      toast.success("Salvat în DB — bate în SmartBill POS", {
        description: summary,
        id: "submit-toast",
        action: {
          label: "OK",
          onClick: () => {
            setIsToastActive(false);
          },
        },
        position: "top-center",
        duration: 15_000,
        onAutoClose: () => setIsToastActive(false),
      });
      setMenu((prevMenu) => prevMenu.map((item) => ({ ...item, quantity: 0 })));
    } catch (error) {
      console.error("Submit error:", error);
      setIsToastActive(true);
      toast.error("Failed to submit order. Please try again.", {
        position: "top-center",
        duration: 5000,
        onAutoClose: () => setIsToastActive(false),
      });
    }
  };

  return (
    <div className="relative">
      {isToastActive && (
        <div
          className="fixed inset-0 bg-black/50 z-40 pointer-events-auto"
          aria-hidden="true"
        />
      )}
      <Table className={isToastActive ? "opacity-50 pointer-events-none" : ""}>
        <TableCaption>
          <Button
            aria-label="submit"
            variant="destructive"
            className="rounded-full p-8 px-30 cursor-pointer"
            onClick={handleSubmit}
          >
            <span className="md:block text-center">Submit</span>
          </Button>
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Product</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Price</TableHead>
            <TableHead className="text-center">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(() => {
            const groupedMenu = menu.reduce(
              (acc, item) => {
                if (!acc[item.type]) {
                  acc[item.type] = [];
                }
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
                  <TableCell className="font-medium">{item.product}</TableCell>
                  <TableCell>{item.type}</TableCell>
                  <TableCell>{item.price}</TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="size-8"
                      onClick={() => handleDecrement(item.product)}
                    >
                      <Minus />
                    </Button>
                    <span className="mx-4">{item.quantity}</span>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="size-8"
                      onClick={() => handleIncrement(item.product)}
                    >
                      <Plus />
                    </Button>
                  </TableCell>
                </TableRow>
              ));
            });
          })()}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={3}>Total</TableCell>
            <TableCell className="text-center">{totalPrice}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
