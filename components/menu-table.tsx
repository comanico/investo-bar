"use client";

import { useState, useEffect } from "react";
import axios from "axios";
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
import { toast } from "sonner"

interface MenuDataPoint {
  time: string;
  heineken: number;
  corona: number;
  aperol_spritz: number;
  vin_spumant: number;
  vin_alb: number;
  prosecco: number;
  apa_plata: number;
  apa_minerala: number;
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
    product: "Prosecco",
    type: "Vin",
    price: 20,
    quantity: 0,
  },
  {
    product: "Aperol",
    type: "Vin",
    price: 15,
    quantity: 0,
  },
  {
    product: "Cola",
    type: "Racoritoare",
    price: 5,
    quantity: 0,
  },
  {
    product: "Apa",
    type: "Racoritoare",
    price: 5,
    quantity: 0,
  },
];

export function MenuTable({ initial }: { initial: MenuItem[] }) {
  // Use state to manage menu items
  const [menu, setMenu] = useState(initial?.length ? initial : initialMenu);
  const DATA_URL = "https://d2xgbzki9fbs74.cloudfront.net/api/prices.json";

  const productKeyMap: Record<string, keyof MenuDataPoint> = {
    heineken: "heineken",
    corona: "corona",
    prosecco: "prosecco",
    aperol: "aperol_spritz",
    cola: "cola",
    apa: "apa_plata",
  };


  // Function to handle quantity increase
  const handleIncrement = (product: string) => {
    setMenu((prevMenu) =>
      prevMenu.map((item) =>
        item.product === product
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  };

  // Function to handle quantity decrease
  const handleDecrement = (product: string) => {
    setMenu((prevMenu) =>
      prevMenu.map((item) =>
        item.product === product && item.quantity > 0
          ? { ...item, quantity: item.quantity - 1 }
          : item
      )
    );
  };

  // Calculate total quantity for the footer
  const totalPrice = menu.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const newPrice = async () => {
    try {
      const response = await axios.get<MenuDataPoint[]>(DATA_URL, { timeout: 5000 });
      const data: MenuDataPoint[] = response.data;
      if (!data.length) return;
      const lastUpdate = data[data.length - 1];
      setMenu((prev) =>
        prev.map((item) => {
          const mapKey = productKeyMap[item.product.toLowerCase()];
          if (!mapKey) return item;
          const candidate = lastUpdate[mapKey];
          return typeof candidate === "number" ? { ...item, price: candidate } : item;
        })
      );
    } catch (err) {
      console.error("Fetch error:", err);
    }
  }

  useEffect(() => {
    newPrice();
    const interval = setInterval(newPrice, 10000); // Pull every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async () => {
    try {
      const response = await fetch('api/update-quantity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(menu),
      });

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || 'Failed to submit order')
      }

      toast("Order quantities updated!")
      setMenu((prevMenu) => prevMenu.map((item) => ({ ...item, quantity: 0 })))

    } catch (error) {
      console.error('Submit error:', error);
      toast('Failed to submit order. Please try again.')
    }
  };

  return (
    <div className="flex justify-center w-full">
      <div className="w-[50%]">
        <Table>
          <TableCaption>
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {menu.map((item) => (
              <TableRow key={item.product}>
                <TableCell className="font-medium">{item.product}</TableCell>
                <TableCell>{item.type}</TableCell>
                <TableCell>{item.price}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
