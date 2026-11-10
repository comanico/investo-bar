import { expireUnsoldListings } from "@/lib/expire-listings";
import { notifyNewOrder } from "@/lib/notify-new-order";
import { liveMark } from "@/lib/live-mark";
import { mintTicketId } from "@/lib/mint-ticket";
import prismadb from "@/lib/prismadb";
import { NextResponse } from "next/server";

const NIGHT = 6 * 60 * 60;

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));
    const token = typeof body.token === "string" ? body.token : "";
    if (!token) {
      return NextResponse.json({ error: "Invalid table" }, { status: 400 });
    }

    const buyer = await prismadb.placement.findFirst({
      where: { token, active: true },
    });
    if (!buyer) {
      return NextResponse.json({ error: "Invalid table" }, { status: 404 });
    }

    await expireUnsoldListings();

    const requested = Math.max(1, Math.floor(Number(body.qty) || 1));

    const sell = await prismadb.order.findUnique({
      where: { id },
      include: { placement: true },
    });
    if (
      !sell ||
      sell.status !== "pending" ||
      sell.side !== "sell" ||
      sell.buyerPlacementId
    ) {
      return NextResponse.json({ error: "Already taken" }, { status: 409 });
    }
    if (sell.placementId === buyer.id) {
      return NextResponse.json({ error: "Cannot buy your own drink" }, { status: 400 });
    }
    if (requested > sell.qty) {
      return NextResponse.json({ error: "Not enough left" }, { status: 409 });
    }

    const mark = await liveMark(sell.product);
    const price = mark ?? sell.price;
    const qty = requested;

    const matched = await prismadb.$transaction(async (tx) => {
      const sellerOpen = await tx.order.findFirst({
        where: {
          placementId: sell.placementId,
          status: "pending",
          ticketId: { not: null },
          id: { not: sell.id },
        },
        orderBy: { createdAt: "desc" },
        select: { ticketId: true },
      });

      const ticketId = sellerOpen?.ticketId ?? (await mintTicketId(tx));
      if (!ticketId) return null;

      const current = await tx.order.findUnique({ where: { id: sell.id } });
      if (
        !current ||
        current.status !== "pending" ||
        current.side !== "sell" ||
        current.buyerPlacementId ||
        current.qty < qty
      ) {
        return null;
      }

      const claimed = await tx.order.updateMany({
        where: {
          id: current.id,
          status: "pending",
          side: "sell",
          buyerPlacementId: null,
          qty: current.qty,
        },
        data:
          current.qty === qty
            ? { buyerPlacementId: buyer.id, ticketId, price }
            : { qty: { decrement: qty } },
      });
      if (claimed.count !== 1) return null;

      if (current.qty > qty) {
        await tx.order.create({
          data: {
            placementId: sell.placementId,
            product: sell.product,
            type: sell.type,
            price,
            qty,
            side: "sell",
            buyerPlacementId: buyer.id,
            ticketId,
            status: "pending",
          },
        });
      }

      return {
        ticketId,
        orders: [
          {
            product: sell.product,
            qty,
            price,
            side: "buy",
          },
        ],
      };
    });

    if (!matched) {
      return NextResponse.json({ error: "Already taken" }, { status: 409 });
    }

    void notifyNewOrder(
      `🔁 ${buyer.label} bought ${qty}× from ${sell.placement.label}\n${sell.product} · ${price.toFixed(2)} RON`,
    );

    const res = NextResponse.json({
      ticketId: matched.ticketId,
      orders: matched.orders,
      exchange: true,
    });
    res.cookies.set(`ib_ticket_${token}`, matched.ticketId, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
      maxAge: NIGHT,
    });
    return res;
  } catch (e) {
    console.error("POST /api/orders/listings/[id]/buy", e);
    return NextResponse.json({ error: "Failed to buy listing" }, { status: 500 });
  }
}
