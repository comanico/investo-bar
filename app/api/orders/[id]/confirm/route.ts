import prismadb from "@/lib/prismadb";
import { incrementProductQuantity } from "@/lib/product-stock-map";
import { sessionDateBucharest, sessionWindow } from "@/lib/session-date";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { printFiscalReceipt } from "@/lib/fiscal-pi";
import type { Prisma } from "@prisma/client";

async function consumeLots(
  tx: Prisma.TransactionClient,
  placementId: string,
  product: string,
  qty: number,
) {
  const session = sessionWindow();
  const lots = await tx.portfolioLot.findMany({
    where: {
      placementId,
      product,
      sessionDate: { gte: session.gte, lt: session.lt },
    },
    orderBy: { createdAt: "asc" },
  });
  let left = qty;
  let basis = 0;
  for (const lot of lots) {
    if (left <= 0) break;
    const have = lot.qty > 0 ? lot.qty : 1;
    const unit = Number(lot.unitPrice);
    if (have <= left) {
      basis += unit * have;
      await tx.portfolioLot.delete({ where: { id: lot.id } });
      left -= have;
    } else {
      basis += unit * left;
      await tx.portfolioLot.update({
        where: { id: lot.id },
        data: { qty: have - left },
      });
      left = 0;
    }
  }
  return Math.round(basis * 100) / 100;
}

export async function POST(_req: Request, context: { params: Promise<{ id: string }> }) {
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

    if (order.side === "sell" && !order.buyerPlacementId) {
      return NextResponse.json({ error: "Waiting for a buyer" }, { status: 409 });
    }

    if (order.side === "sell" && order.buyerPlacementId) {
      const buyer = await prismadb.placement.findUnique({
        where: { id: order.buyerPlacementId },
      });
      if (!buyer) {
        return NextResponse.json({ error: "Buyer missing" }, { status: 409 });
      }

      await prismadb.$transaction(async (tx) => {
        const basis = await consumeLots(
          tx,
          order.placementId,
          order.product,
          order.qty,
        );
        await tx.portfolioClose.create({
          data: {
            placementId: order.placementId,
            placementLabel: order.placement.label,
            product: order.product,
            qty: order.qty,
            cost: basis,
            proceeds: Math.round(order.price * order.qty * 100) / 100,
            sessionDate: sessionDateBucharest(new Date()),
          },
        });
        await tx.portfolioLot.create({
          data: {
            placementId: buyer.id,
            placementLabel: buyer.label,
            product: order.product,
            qty: order.qty,
            unitPrice: order.price,
            sessionDate: sessionDateBucharest(new Date()),
          },
        });
        await tx.order.deleteMany({
          where: {
            side: "buy",
            status: "pending",
            product: order.product,
            placementId: buyer.id,
            buyerPlacementId: order.placementId,
          },
        });
        await tx.order.delete({ where: { id: order.id } });
      });

      return NextResponse.json({ ok: true, exchange: true });
    }

    await prismadb.$transaction(async (tx) => {
      await tx.sales.create({
        data: {
          product: order.product,
          type: order.type,
          price: order.price,
          quantity: order.qty,
          username: order.placement.label,
          ticketId: order.ticketId,
        },
      });

      await tx.portfolioLot.create({
        data: {
          placementId: order.placementId,
          placementLabel: order.placement.label,
          product: order.product,
          qty: order.qty,
          unitPrice: order.price,
          sessionDate: sessionDateBucharest(new Date()),
        },
      });

      await tx.order.delete({ where: { id: order.id } });
    });

    await incrementProductQuantity(order.product, order.qty);

    const fiscal = await printFiscalReceipt({
      ref: `order-${order.id}`,
      source: "order",
      clientName: order.placement.label,
      payment: "card",
      lines: [
        {
          product: order.product,
          name: order.product,
          qty: order.qty,
          unitPrice: order.price,
          taxPercent: 0,
        },
      ],
    });

    return NextResponse.json({ ok: true, fiscal });  
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