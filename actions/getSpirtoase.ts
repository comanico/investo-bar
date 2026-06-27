"use server";

import prismadb from "@/lib/prismadb";

export type SpirtoaseItem = {
  id: number;
  Jameson: number;
  Jameson_Black_Barrel: number;
  Fireball: number;
  Tequilla: number;
};

export const getSpirtoase = async (): Promise<SpirtoaseItem[]> => {
  const items = await prismadb.spirtoase.findMany();
  return items.map((item) => ({
    id: item.id,
    Jameson: item.Jameson,
    Jameson_Black_Barrel: item.Jameson_Black_Barrel,
    Fireball: item.Fireball,
    Tequilla: item.Tequilla,
  }));
};
