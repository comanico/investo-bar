import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { printFiscalReceipt } from "@/lib/fiscal-pi";

async function callPi(path: string, body: unknown) {
  const base = process.env.FISCAL_PI_URL;
  const token = process.env.FISCAL_API_TOKEN;
  if (!base || !token) {
    return { ok: false, error: "FISCAL_PI_URL or FISCAL_API_TOKEN missing" };
  }
  try {
    const res = await fetch(`${base.replace(/\/$/, "")}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
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

export async function POST(req: Request) {
  const { userId } = await auth();
  const whitelist = (process.env.WHITELISTED_USERS || "").split(",");
  if (!userId || !whitelist.includes(userId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  if (body.test === "nf") {
    const fiscal = await callPi("/fiscal/nf", {
      lines: ["INVESTOBAR TEST", "non-fiscal ping"],
    });
    return NextResponse.json({ ok: true, fiscal });
  }

  const fiscal = await printFiscalReceipt({
    ref: `test-heineken-${Date.now()}`,
    source: "menu",
    clientName: "test",
    payment: "card",
    lines: [{ product: "Heineken", name: "Heineken", qty: 1, unitPrice: 1, taxPercent: 0 }],
  });
  return NextResponse.json({ ok: true, fiscal });
}