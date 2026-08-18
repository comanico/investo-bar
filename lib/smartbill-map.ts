/**
 * Mapare stabilă InvestoBar → SmartBill (nomenclator / POS).
 * Codurile trebuie să coincidă cu cele din Cloud după import.
 * Prețul de vânzare NU se ia din nomenclator — vine din live_prices / order.
 */

export type SmartBillProduct = {
  /** Denumire afișată (UI InvestoBar / SmartBill) */
  name: string;
  /** Cod produs în SmartBill (case-sensitive față de nomenclator) */
  code: string;
  measuringUnitName: string;
  taxPercentage: number;
  taxName: string;
};

export const SMARTBILL_PRODUCT_MAP: Record<string, SmartBillProduct> = {
  Heineken: {
    name: "Heineken",
    code: "HEINEKEN",
    measuringUnitName: "buc",
    taxPercentage: 21,
    taxName: "Normala",
  },
  Corona: {
    name: "Corona",
    code: "CORONA",
    measuringUnitName: "buc",
    taxPercentage: 21,
    taxName: "Normala",
  },
  Peroni: {
    name: "Peroni",
    code: "PERONI",
    measuringUnitName: "buc",
    taxPercentage: 21,
    taxName: "Normala",
  },
  Prosecco: {
    name: "Prosecco",
    code: "PROSECCO",
    measuringUnitName: "buc",
    taxPercentage: 21,
    taxName: "Normala",
  },
  "Aperol Spritz": {
    name: "Aperol Spritz",
    code: "APEROL_SPRITZ",
    measuringUnitName: "buc",
    taxPercentage: 21,
    taxName: "Normala",
  },
  "Vin Rosu": {
    name: "Vin Rosu",
    code: "VIN_ROSU",
    measuringUnitName: "buc",
    taxPercentage: 21,
    taxName: "Normala",
  },
  "Vin Alb": {
    name: "Vin Alb",
    code: "VIN_ALB",
    measuringUnitName: "buc",
    taxPercentage: 21,
    taxName: "Normala",
  },
  "Vin Spumant Fara Alcool": {
    name: "Vin Spumant Fara Alcool",
    code: "VIN_SPUMANT_0",
    measuringUnitName: "buc",
    taxPercentage: 21,
    taxName: "Normala",
  },
  Cola: {
    name: "Cola",
    code: "COLA",
    measuringUnitName: "buc",
    taxPercentage: 21,
    taxName: "Normala",
  },
  Apa: {
    name: "Apa",
    code: "APA",
    measuringUnitName: "buc",
    taxPercentage: 21,
    taxName: "Normala",
  },
  Jameson: {
    name: "Jameson",
    code: "JAMESON",
    measuringUnitName: "buc",
    taxPercentage: 21,
    taxName: "Normala",
  },
  "Jameson Black Barrel": {
    name: "Jameson Black Barrel",
    code: "JAMESON_BB",
    measuringUnitName: "buc",
    taxPercentage: 21,
    taxName: "Normala",
  },
  Fireball: {
    name: "Fireball",
    code: "FIREBALL",
    measuringUnitName: "buc",
    taxPercentage: 21,
    taxName: "Normala",
  },
  Tequilla: {
    name: "Tequilla",
    code: "TEQUILLA",
    measuringUnitName: "buc",
    taxPercentage: 21,
    taxName: "Normala",
  },
};

export type PosPunchLine = {
  product: string;
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
  const code = sb?.code ?? product.toUpperCase().replace(/\s+/g, "_");
  const um = sb?.measuringUnitName ?? "buc";
  const q = Math.max(0, Number(qty) || 0);
  const price = Number(unitPrice) || 0;
  const lineTotal = Math.round(price * q * 100) / 100;

  return {
    product,
    code,
    qty: q,
    unitPrice: price,
    lineTotal,
    measuringUnitName: um,
    label: `${product} (${code}) ×${q} @ ${price.toFixed(2)} RON = ${lineTotal.toFixed(2)} RON`,
  };
}

export function formatPosPunchSummary(lines: PosPunchLine[]): string {
  if (!lines.length) return "";
  const body = lines.map((l) => `• ${l.label}`).join("\n");
  const total =
    Math.round(lines.reduce((s, l) => s + l.lineTotal, 0) * 100) / 100;
  return `${body}\nTotal POS: ${total.toFixed(2)} RON`;
}
