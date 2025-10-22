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
  peroni: number;
  aperol: number;
  vin_rosu: number;
  vin_alb: number;
  prosecco: number;
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
    price: 10,
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

export function AdminTable({ initial }: { initial: MenuItem[] }) {
  // Use state to manage menu items
  const [menu, setMenu] = useState(initial?.length ? initial : initialMenu);
  // State of page while Toast is active
  const [isToastActive, setIsToastActive] = useState(false);
  const DATA_URL = "https://d2xgbzki9fbs74.cloudfront.net/api/prices.json";
  
  const productKeyMap: Record<string, keyof MenuDataPoint> = {
    heineken: "heineken",
    corona: "corona",
    peroni: "peroni",
    prosecco: "prosecco",
    aperol: "aperol",
    vin_rosu: "vin_rosu",
    vin_alb: "vin_alb",
    cola: "cola",
    apa: "apa",
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
      console.log(data)
      if (!data.length) return;
      const lastUpdate = data[data.length - 1];
      setMenu((prev) =>
        prev.map((item) => {
          const normalizedKey = item.product.toLowerCase().replace(/\s+/g, "_");
          const mapKey = productKeyMap[normalizedKey];
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
    const interval = setInterval(newPrice, 10000); // Poll every 10 seconds
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

      setIsToastActive(true);
      toast("oOoOoOOrder quantities updated!", {
        description: `Please add the sum of ${totalPrice} in POS!`,
        id: "submit-toast",
        action: {
          label: "YEEEEEE",
          onClick: () => {
            setIsToastActive(false); // Hide overlay on click
            console.log("Added to POS");
          },
        },
        position: "top-center",
        duration: 5000, // Auto-dismiss after 5 seconds
        onAutoClose: () => setIsToastActive(false), // Hide overlay on timeout
      });
      setMenu((prevMenu) => prevMenu.map((item) => ({ ...item, quantity: 0 })))
    } catch (error) {
      console.error('Submit error:', error);
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
          <Button aria-label="submit" variant="destructive" className="rounded-full p-8 px-30 cursor-pointer" onClick={handleSubmit}>
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
          {menu.map((item) => (
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
          ))}
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
