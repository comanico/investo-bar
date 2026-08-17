import { DEFAULT_MENU_ITEMS } from "./menu-items";
import { HeatmenuItem, MenuDataPoint, productKeyMap } from "./types";

const normalizeProduct = (name: string) =>
    name.toLowerCase().replace(/\s+/g, "_");  

export function buildItems(series: MenuDataPoint[]): HeatmenuItem[] {
    if (!series.length) {
      return DEFAULT_MENU_ITEMS.map((item) => ({
        product: item.product,
        type: item.type,
        price: item.price,
        prevPrice: item.price,
      }));
    }
    const last = series[series.length - 1];
    const prev = series.length > 1 ? series[series.length - 2] : last;
  
    return DEFAULT_MENU_ITEMS.map((item) => {
      const key = productKeyMap[normalizeProduct(item.product)];
      const live = key != null ? last[key] : undefined;
      const previous = key != null ? prev[key] : undefined;
      const price = typeof live === "number" ? live : item.price;
      const prevPrice = typeof previous === "number" ? previous : price;
  
      return {
        product: item.product,
        type: item.type,
        price,
        prevPrice,
      };
    });
  
}