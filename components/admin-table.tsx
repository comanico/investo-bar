"use client";
import { useState } from "react";
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

export function AdminTable({ initial }: { initial: MenuItem[] }) {
  // Use state to manage menu items
  const [menu, setMenu] = useState(initial?.length ? initial : initialMenu);

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

  const handleSubmit = async () => {
    try {
      const response = await fetch('api/update-price', {
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
    <Table>
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
  );
}
