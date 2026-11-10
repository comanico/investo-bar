import { expireUnsoldListings } from "@/lib/expire-listings";
import { notifyNewOrder } from "@/lib/notify-new-order";
import prismadb from "@/lib/prismadb";
import { sessionWindow } from "@/lib/session-date";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const text = await req.text();
    if (!text) {
      return NextResponse.json({ error: "Empty body" }, { status: 400 });
    }
    const body = JSON.parse(text);
    const {
      token,
      product,
      type,
      price,
      qty = 1,
      ticketId,
      side = "buy",
    } = body;
    const isSell = side === "sell";

    if (!token || !product || typeof price !== "number") {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const placement = await prismadb.placement.findFirst({
      where: { token, active: true },
    });

    if (!placement) {
      return NextResponse.json({ error: "Invalid table" }, { status: 404 });
    }

    const units = Math.max(1, Math.floor(Number(qty) || 1));
    if (isSell) {
      const session = sessionWindow();
      const [lots, listed] = await Promise.all([
        prismadb.portfolioLot.findMany({
          where: {
            placementId: placement.id,
            product,
            sessionDate: { gte: session.gte, lt: session.lt },
          },
          select: { qty: true },
        }),
        prismadb.order.aggregate({
          where: {
            placementId: placement.id,
            product,
            side: "sell",
            status: "pending",
          },
          _sum: { qty: true },
        }),
      ]);
      const owned = lots.reduce((sum, lot) => sum + (lot.qty > 0 ? lot.qty : 1), 0);
      const held = listed._sum.qty ?? 0;
      if (held + units > owned) {
        return NextResponse.json({ error: "Not enough to sell" }, { status: 400 });
      }
    }

    const order = await prismadb.order.create({
      data: {
        placementId: placement.id,
        ticketId: typeof ticketId === "string" ? ticketId : null,
        product,
        type: type ?? "Unknown",
        price,
        qty: units,
        side: isSell ? "sell" : "buy",
        status: "pending",
      },
      include: { placement: true },
    });

    void notifyNewOrder(
      `🆕 ${placement.label} ${isSell ? "sold" : "bought"} ${units}×\n${product} · ${Number(price).toFixed(2)} RON`,
    );

    return NextResponse.json({ order }, { status: 201 });
  } catch (e) {
    console.error("POST /api/orders", e);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 },
    );
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

    await expireUnsoldListings();

    const orders = await prismadb.order.findMany({
      where: {
        ...(status === "all" ? {} : { status }),
        OR: [{ side: { not: "buy" } }, { buyerPlacementId: null }],
      },
      include: {
        placement: { select: { label: true, kind: true, token: true } },
      },
      orderBy: { createdAt: "asc" }, // first order on top
    });

    const buyerIds = [
      ...new Set(
        orders
          .map((order) => order.buyerPlacementId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    const buyers = buyerIds.length
      ? await prismadb.placement.findMany({
          where: { id: { in: buyerIds } },
          select: { id: true, label: true },
        })
      : [];
    const buyerLabels = new Map(buyers.map((buyer) => [buyer.id, buyer.label]));

    return NextResponse.json({
      orders: orders.map((order) => ({
        ...order,
        buyerLabel: order.buyerPlacementId
          ? (buyerLabels.get(order.buyerPlacementId) ?? null)
          : null,
      })),
    });
  } catch (e) {
    console.error("GET /api/orders", e);
    return NextResponse.json(
      { error: "Failed to load orders" },
      { status: 500 },
    );
  }
}
