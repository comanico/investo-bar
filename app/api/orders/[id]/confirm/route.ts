import prismadb from "@/lib/prismadb";
import { incrementProductQuantity } from "@/lib/product-stock-map";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(_req: Request, context: {params: Promise<{id: string}>}) {
  try {
    const { userId } = await auth();
    const whitelist = (process.env.WHITELISTED_USERS || "").split(",");

    if (!userId || !whitelist.includes(userId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const order = await prismadb.order.findUnique({
      where: { id },
      include: { placement: true },
    });

    if (!order || order.status !== "pending") {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // 1) sales  2) remove from queue
    await prismadb.$transaction(async (tx) => {
      await tx.sales.create({
        data: {
          product: order.product,
          type: order.type,
          price: order.price,
          quantity: order.qty,
          username: order.placement.label, 
        },
      });

      await tx.order.delete({ where: { id: order.id } });
    });

    await incrementProductQuantity(order.product, order.qty);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("POST /api/orders/[id]/confirm", e);
    return NextResponse.json({ error: "Failed to confirm" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    const whitelist = (process.env.WHITELISTED_USERS || "").split(",");

    if (!userId || !whitelist.includes(userId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? "pending";

    const orders = await prismadb.order.findMany({
      where: status === "all" ? undefined : { status },
      include: {
        placement: { select: { label: true, kind: true, token: true } },
      },
      orderBy: { createdAt: "asc" }, // first order on top
    });

    return NextResponse.json({ orders });
  } catch (e) {
    console.error("GET /api/orders", e);
    return NextResponse.json({ error: "Failed to load orders" }, { status: 500 });
  }
}