import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  try {
    const { userId } = await auth();
    const whitelist = (process.env.WHITELISTED_USERS || "").split(",");

    if (!userId || !whitelist.includes(userId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prismadb.order.findUnique({ where: { id } });
    if (!existing || existing.status !== "pending") {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    await prismadb.order.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("cancel order", e);
    return NextResponse.json({ error: "Failed to cancel" }, { status: 500 });
  }
}