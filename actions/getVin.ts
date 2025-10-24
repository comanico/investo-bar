"use server";

import prismadb from "@/lib/prismadb";

export type VinItem = {
  id: number;
  Aperol: number;
  Vin_Alb: number;
  Vin_Rosu: number;
  Prosecco: number;
};

export const getVin = async (): Promise<VinItem[]> => {
  const items = await prismadb.vin.findMany();
  return items.map((item) => ({
    id: item.id,
    Aperol: item.Aperol,
    Vin_Alb: item.Vin_Alb,
    Vin_Rosu: item.Vin_Rosu,
    Prosecco: item.Prosecco,
  }));
};
