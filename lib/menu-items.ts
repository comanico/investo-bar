import type { MenuItem } from "@/actions/getMenu";

export const DEFAULT_MENU_ITEMS: MenuItem[] = [
  { product: "Heineken", type: "Bere", price: 10, quantity: 0 },
  { product: "Corona", type: "Bere", price: 12, quantity: 0 },
  { product: "Peroni", type: "Bere", price: 10, quantity: 0 },
  { product: "Prosecco", type: "Vin", price: 15, quantity: 0 },
  { product: "Aperol Spritz", type: "Vin", price: 16, quantity: 0 },
  { product: "Vin Rosu", type: "Vin", price: 15, quantity: 0 },
  { product: "Vin Alb", type: "Vin", price: 15, quantity: 0 },
  {
    product: "Vin Spumant Fara Alcool",
    type: "Racoritoare",
    price: 12,
    quantity: 0,
  },
  { product: "Cola", type: "Racoritoare", price: 9, quantity: 0 },
  { product: "Apa", type: "Racoritoare", price: 8, quantity: 0 },
  { product: "Jameson", type: "Spirtoase", price: 18, quantity: 0 },
  {
    product: "Jameson Black Barrel",
    type: "Spirtoase",
    price: 25,
    quantity: 0,
  },
  { product: "Fireball", type: "Spirtoase", price: 12, quantity: 0 },
  { product: "Tequilla", type: "Spirtoase", price: 12, quantity: 0 },
];

export const MENU_TYPE_ORDER = ["Bere", "Vin", "Racoritoare", "Spirtoase"];

export function mergeMenuWithDefaults(dbItems: MenuItem[]): MenuItem[] {
  const dbByProduct = new Map(dbItems.map((item) => [item.product, item]));

  const merged = DEFAULT_MENU_ITEMS.map((defaultItem) => {
    const dbItem = dbByProduct.get(defaultItem.product);
    if (!dbItem) return defaultItem;

    return {
      product: defaultItem.product,
      type: defaultItem.type,
      price: dbItem.price,
      quantity: 0,
    };
  });

  for (const dbItem of dbItems) {
    if (!DEFAULT_MENU_ITEMS.some((item) => item.product === dbItem.product)) {
      merged.push({ ...dbItem, quantity: 0 });
    }
  }

  return merged;
}
