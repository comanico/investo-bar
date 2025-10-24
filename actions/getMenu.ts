"use server";

import prismadb from "@/lib/prismadb";

export type MenuItem = {
  product: string;
  type: string;
  price: number;
  quantity: number;
};

export const getMenu = async (): Promise<MenuItem[]> => {
  const items = await prismadb.menu.findMany();
  return items.map((item) => ({
    product: item.product,
    type: item.type,
    price: Number(item.price),
    quantity: 0,
  }));
};