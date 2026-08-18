/**
 * Mapare InvestoBar (UI, cu spații) → denumirea exactă din nomenclatorul SmartBill.
 *
 * Import Cloud (fără coloană Cod produs):
 *   Heineken, Corona, Peroni, Prosecco, AperolSpritz, VinRosu, VinAlb,
 *   VinSpumantFaraAlcool, Cola, Apa, Jameson, JamesonBlackBarrel, Fireball, Tequilla
 *
 * Prețul de vânzare NU se ia din nomenclator — vine din live_prices / order.
 */

export type SmartBillProduct = {
  /** Denumire exactă în SmartBill Cloud / POS */
  name: string;
  /**
   * Cod produs SmartBill — gol dacă nomenclatorul nu folosește coduri.
   * Poți completa ulterior în Cloud și aici, fără a schimba cheile InvestoBar.
   */
  code: string;
  measuringUnitName: string;
  taxPercentage: number;
  taxName: string;
};

/**
 * Cheie = `product` din Order / menu (InvestoBar, cu spații unde e cazul).
 * `name` = textul pe care îl cauți / bați în SmartBill POS.
 */
export const SMARTBILL_PRODUCT_MAP: Record<string, SmartBillProduct> = {
  Heineken: {
    name: "Heineken",
    code: "",
    measuringUnitName: "buc",
    taxPercentage: 21,
    taxName: "Normala",
  },
  Corona: {
    name: "Corona",
    code: "",
    measuringUnitName: "buc",
    taxPercentage: 21,
    taxName: "Normala",
  },
  Peroni: {
    name: "Peroni",
    code: "",
    measuringUnitName: "buc",
    taxPercentage: 21,
    taxName: "Normala",
  },
  Prosecco: {
    name: "Prosecco",
    code: "",
    measuringUnitName: "buc",
    taxPercentage: 21,
    taxName: "Normala",
  },
  "Aperol Spritz": {
    name: "AperolSpritz",
    code: "",
    measuringUnitName: "buc",
    taxPercentage: 21,
    taxName: "Normala",
  },
  "Vin Rosu": {
    name: "VinRosu",
    code: "",
    measuringUnitName: "buc",
    taxPercentage: 21,
    taxName: "Normala",
  },
  "Vin Alb": {
    name: "VinAlb",
    code: "",
    measuringUnitName: "buc",
    taxPercentage: 21,
    taxName: "Normala",
  },
  "Vin Spumant Fara Alcool": {
    name: "VinSpumantFaraAlcool",
    code: "",
    measuringUnitName: "buc",
    taxPercentage: 21,
    taxName: "Normala",
  },
  Cola: {
    name: "Cola",
    code: "",
    measuringUnitName: "buc",
    taxPercentage: 21,
    taxName: "Normala",
  },
  Apa: {
    name: "Apa",
    code: "",
    measuringUnitName: "buc",
    taxPercentage: 21,
    taxName: "Normala",
  },
  Jameson: {
    name: "Jameson",
    code: "",
    measuringUnitName: "buc",
    taxPercentage: 21,
    taxName: "Normala",
  },
  "Jameson Black Barrel": {
    name: "JamesonBlackBarrel",
    code: "",
    measuringUnitName: "buc",
    taxPercentage: 21,
    taxName: "Normala",
  },
  Fireball: {
    name: "Fireball",
    code: "",
    measuringUnitName: "buc",
    taxPercentage: 21,
    taxName: "Normala",
  },
  Tequilla: {
    name: "Tequilla",
    code: "",
    measuringUnitName: "buc",
    taxPercentage: 21,
    taxName: "Normala",
  },
};

export type PosPunchLine = {
  /** Nume InvestoBar (UI) */
  product: string;
  /** Denumire exactă SmartBill */
  smartbillName: string;
  code: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  measuringUnitName: string;
  /** Text scurt de bătut în POS */
  label: string;
};

export function getSmartBillProduct(
  product: string,
): SmartBillProduct | undefined {
  return SMARTBILL_PRODUCT_MAP[product];
}

/** O linie de comandă → ce trebuie bătut în SmartBill POS */
export function toPosPunchLine(
  product: string,
  qty: number,
  unitPrice: number,
): PosPunchLine {
  const sb = getSmartBillProduct(product);
  const smartbillName = sb?.name ?? product.replace(/\s+/g, "");
  const code = sb?.code ?? "";
  const um = sb?.measuringUnitName ?? "buc";
  const q = Math.max(0, Number(qty) || 0);
  const price = Number(unitPrice) || 0;
  const lineTotal = Math.round(price * q * 100) / 100;

  const codePart = code ? ` [${code}]` : "";
  const label = `${smartbillName}${codePart} ×${q} @ ${price.toFixed(2)} RON = ${lineTotal.toFixed(2)} RON`;

  return {
    product,
    smartbillName,
    code,
    qty: q,
    unitPrice: price,
    lineTotal,
    measuringUnitName: um,
    label,
  };
}

export function formatPosPunchSummary(lines: PosPunchLine[]): string {
  if (!lines.length) return "";
  const body = lines.map((l) => `• ${l.label}`).join("\n");
  const total =
    Math.round(lines.reduce((s, l) => s + l.lineTotal, 0) * 100) / 100;
  return `${body}\nTotal POS: ${total.toFixed(2)} RON`;
}
