import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { printFiscalReceipt } from "@/lib/fiscal-pi";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    const whitelist = (process.env.WHITELISTED_USERS || "").split(",");
    if (!userId || !whitelist.includes(userId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const lines = Array.isArray(body.lines) ? body.lines : [];
    const fiscal = await printFiscalReceipt({
      ref: body.ref || `menu-${Date.now()}`,
      source: "menu",
      clientName: body.clientName || "bar",
      payment: "card",
      lines: lines
        .filter((line: { qty?: number }) => Number(line.qty) > 0)
        .map((line: { product: string; name?: string; qty: number; unitPrice: number }) => ({
          product: line.product,
          name: line.name || line.product,
          qty: Number(line.qty),
          unitPrice: Number(line.unitPrice),
          taxPercent: 0,
        })),
    });

    return NextResponse.json({ ok: true, fiscal });
  } catch (error) {
    console.error("POST /api/fiscal/receipt", error);
    return NextResponse.json({ ok: false, error: "Fiscal print failed" }, { status: 500 });
  }
}