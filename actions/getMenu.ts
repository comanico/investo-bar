"use server";

import prismadb from "@/lib/prismadb";
import { menu } from "@prisma/client"

export type MenuItem = {
    product: string;
    type: string;
    price: number;
    quantity: number;
};

export const getMenu = async (): Promise<MenuItem[]> => {
    const items = await prismadb.menu.findMany();
    return items.map((item: menu) => ({
        product: item.product,
        type: item.type,
        price: Number(item.price),
        quantity: 0,
    }));
};