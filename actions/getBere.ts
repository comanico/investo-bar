"use server";

import prismadb from "@/lib/prismadb";

export type BereItem = {
  id: number;
  Heineken: number;
  Corona: number;
  Peroni: number;
};

export const getBere = async (): Promise<BereItem[]> => {
  const items = await prismadb.bere.findMany();
  return items.map((item) => ({
    id: item.id,
    Heineken: item.Heineken,
    Corona: item.Corona,
    Peroni: item.Peroni,
  }));
};
