import "server-only";

export type FiscalLine = {
  product: string;
  name: string;
  qty: number;
  unitPrice: number;
  taxPercent?: number;
};

export type FiscalRequest = {
  ref: string;
  source: "menu" | "order";
  clientName: string;
  payment?: string;
  lines: FiscalLine[];
};

export async function printFiscalReceipt(body: FiscalRequest) {
  const base = process.env.FISCAL_PI_URL;
  const token = process.env.FISCAL_API_TOKEN;
  if (!base || !token) {
    return { ok: false, error: "FISCAL_PI_URL or FISCAL_API_TOKEN missing" };
  }
  if (!body.lines.length) {
    return { ok: false, error: "No lines to print" };
  }

  const payload = {
    ref: body.ref,
    source: body.source,
    clientName: body.clientName,
    payment: body.payment ?? "card",
    lines: body.lines.map((line) => ({
      product: line.product,
      name: line.name || line.product,
      qty: line.qty,
      unitPrice: line.unitPrice,
      taxPercent: line.taxPercent ?? 0,
    })),
  };

  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/fiscal/receipt`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.ok === false) {
      return { ok: false, error: data.error || `Pi HTTP ${res.status}`, pi: data };
    }
    return { ok: true, pi: data };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Pi unreachable" };
  }
}