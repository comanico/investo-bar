"use server";

import prismadb from "@/lib/prismadb";

export type RacoritoareItem = {
  id: number;
  Vin_Spumant_Fara_Alcool: number;
  Apa: number;
  Cola: number;
};

export const getRacoritoare = async (): Promise<RacoritoareItem[]> => {
  const items = await prismadb.racoritoare.findMany();
  return items.map((item) => ({
    id: item.id,
    Vin_Spumant_Fara_Alcool: item.Vin_Spumant_Fara_Alcool,
    Apa: item.Apa,
    Cola: item.Cola,
  }));
};

