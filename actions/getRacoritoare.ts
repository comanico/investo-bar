"use server";

import prismadb from "@/lib/prismadb";

export type RacoritoareItem = {
  id: number;
  Apa: number;
  Cola: number;
};

export const getRacoritoare = async (): Promise<RacoritoareItem[]> => {
  const items = await prismadb.racoritoare.findMany();
  return items.map((item) => ({
    id: item.id,
    Apa: item.Apa,
    Cola: item.Cola,
  }));
};
