// lib/product-stock-map.ts
import prismadb from "@/lib/prismadb";

export const productStockMap: Record<
  string,
  { model: any; column: string }
> = {
  Heineken: { model: prismadb.bere, column: "Heineken" },
  Corona: { model: prismadb.bere, column: "Corona" },
  Peroni: { model: prismadb.bere, column: "Peroni" },
  "Aperol Spritz": { model: prismadb.vin, column: "Aperol_Spritz" },
  Prosecco: { model: prismadb.vin, column: "Prosecco" },
  "Vin Rosu": { model: prismadb.vin, column: "Vin_Rosu" },
  "Vin Alb": { model: prismadb.vin, column: "Vin_Alb" },
  "Vin Spumant Fara Alcool": {
    model: prismadb.racoritoare,
    column: "Vin_Spumant_Fara_Alcool",
  },
  Cola: { model: prismadb.racoritoare, column: "Cola" },
  Apa: { model: prismadb.racoritoare, column: "Apa" },
  Jameson: { model: prismadb.spirtoase, column: "Jameson" },
  "Jameson Black Barrel": {
    model: prismadb.spirtoase,
    column: "Jameson_Black_Barrel",
  },
  Fireball: { model: prismadb.spirtoase, column: "Fireball" },
  Tequilla: { model: prismadb.spirtoase, column: "Tequilla" },
};

export async function incrementProductQuantity(
  product: string,
  qty: number,
) {
  const entry = productStockMap[product];
  if (!entry || qty <= 0) return;

  const { model, column } = entry;
  const lastRow = await model.findFirst({
    orderBy: { id: "desc" },
    select: { id: true },
  });

  if (!lastRow) {
    const newRow = await model.create({ data: {} });
    await model.update({
      where: { id: newRow.id },
      data: { [column]: { increment: qty } },
    });
  } else {
    await model.update({
      where: { id: lastRow.id },
      data: { [column]: { increment: qty } },
    });
  }
}