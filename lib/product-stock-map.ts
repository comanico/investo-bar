import prismadb from "./prismadb";

type StockTarget = {
  /** which table */
  table: "bere" | "vin" | "racoritoare" | "spirtoase";
  column: string;
};

export const productStockMap: Record<string, StockTarget> = {
  Heineken: { table: "bere", column: "Heineken" },
  Corona: { table: "bere", column: "Corona" },
  Peroni: { table: "bere", column: "Peroni" },
  "Aperol Spritz": { table: "vin", column: "Aperol_Spritz" },
  Prosecco: { table: "vin", column: "Prosecco" },
  "Vin Rosu": { table: "vin", column: "Vin_Rosu" },
  "Vin Alb": { table: "vin", column: "Vin_Alb" },
  "Vin Spumant Fara Alcool": {
    table: "racoritoare",
    column: "Vin_Spumant_Fara_Alcool",
  },
  Cola: { table: "racoritoare", column: "Cola" },
  Apa: { table: "racoritoare", column: "Apa" },
  Jameson: { table: "spirtoase", column: "Jameson" },
  "Jameson Black Barrel": {
    table: "spirtoase",
    column: "Jameson_Black_Barrel",
  },
  Fireball: { table: "spirtoase", column: "Fireball" },
  Tequilla: { table: "spirtoase", column: "Tequilla" },
};

function stockModel(table: StockTarget["table"]) {
  switch (table) {
    case "bere":
      return prismadb.bere;
    case "vin":
      return prismadb.vin;
    case "racoritoare":
      return prismadb.racoritoare;
    case "spirtoase":
      return prismadb.spirtoase;
  }
}

export async function incrementProductQuantity(
  product: string,
  qty: number,
): Promise<void> {
  const entry = productStockMap[product];
  if (!entry || qty <= 0) return;

  const model = stockModel(entry.table);
  const lastRow = await model.findFirst({
    orderBy: { id: "desc" },
    select: { id: true },
  });

  const data = { [entry.column]: { increment: qty } };

  if (!lastRow) {
    const newRow = await model.create({ data: {} });
    await model.update({ where: { id: newRow.id }, data });
  } else {
    await model.update({ where: { id: lastRow.id }, data });
  }
}