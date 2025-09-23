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

const initialMenu = [
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

export function AdminTable() {
  // Use state to manage menu items
  const [menu, setMenu] = useState(initialMenu);

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

  const handleSubmit = () => {
    console.log(menu);
  }

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
