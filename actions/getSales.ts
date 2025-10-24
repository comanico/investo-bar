"use server";

import prismadb from "@/lib/prismadb";

export type SalesItem = {
  id: number;
  product: string;
  type: string;
  price: number;
  quantity: number;
  username: string;
  time: Date;
};

export const getSales = async (): Promise<SalesItem[]> => {
  const items = await prismadb.sales.findMany();
  return items.map((item) => ({
    id: item.id,
    product: item.product,
    type: item.type,
    price: Number(item.price),
    quantity: item.quantity ?? 0,
    username: item.username,
    time: item.time,
  }));
};