import { mintTicketId } from "@/lib/mint-ticket";
import prismadb from "@/lib/prismadb";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const NIGHT = 6 * 60 * 60;

export async function POST() {
  const ticketId = await mintTicketId();
  if (!ticketId) {
    return NextResponse.json({ error: "No ticket number" }, { status: 503 });
  }
  return NextResponse.json({ ticketId });
}

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) return NextResponse.json({ ticket: null });

  const placement = await prismadb.placement.findFirst({
    where: { token, active: true },
    select: { id: true },
  });
  if (!placement) return NextResponse.json({ ticket: null });

  const claimed = await prismadb.order.findMany({
    where: {
      buyerPlacementId: placement.id,
      side: "sell",
      status: "pending",
      ticketId: { not: null },
    },
    select: {
      product: true,
      qty: true,
      price: true,
      status: true,
      ticketId: true,
    },
    orderBy: { createdAt: "desc" },
  });
  if (claimed.length && claimed[0].ticketId) {
    const ticketId = claimed[0].ticketId;
    const orders = claimed.filter((order) => order.ticketId === ticketId);
    const res = NextResponse.json({
      ticketId,
      exchange: true,
      orders: orders.map((order) => ({
        product: order.product,
        qty: order.qty,
        price: order.price,
        status: order.status,
        side: "buy",
      })),
    });
    res.cookies.set(`ib_ticket_${token}`, ticketId, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
      maxAge: NIGHT,
    });
    return res;
  }

  const pending = await prismadb.order.findMany({
    where: {
      placementId: placement.id,
      status: "pending",
      ticketId: { not: null },
    },
    select: {
      product: true,
      qty: true,
      price: true,
      status: true,
      side: true,
      ticketId: true,
      buyerPlacementId: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const cookieTicket = (await cookies()).get(`ib_ticket_${token}`)?.value;
  if (!pending.length) {
    if (!cookieTicket) return NextResponse.json({ ticket: null });
    const res = NextResponse.json({ ticket: null, resolved: true });
    res.cookies.delete(`ib_ticket_${token}`);
    return res;
  }

  const groups = new Map<string, typeof pending>();
  for (const order of pending) {
    if (!order.ticketId) continue;
    const list = groups.get(order.ticketId) ?? [];
    list.push(order);
    groups.set(order.ticketId, list);
  }

  const exchangeId = [...groups.entries()].find(([, list]) =>
    list.some((order) => order.side === "sell" || order.buyerPlacementId),
  )?.[0];
  const ticketId =
    exchangeId ??
    (cookieTicket && groups.has(cookieTicket) ? cookieTicket : null) ??
    pending[pending.length - 1]?.ticketId;

  if (!ticketId) return NextResponse.json({ ticket: null });

  const orders = groups.get(ticketId) ?? [];
  const exchange = orders.some(
    (order) => order.side === "sell" || Boolean(order.buyerPlacementId),
  );

  const res = NextResponse.json({
    ticketId,
    exchange,
    orders: orders.map((order) => ({
      product: order.product,
      qty: order.qty,
      price: order.price,
      status: order.status,
      side: order.side,
    })),
  });
  res.cookies.set(`ib_ticket_${token}`, ticketId, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: NIGHT,
  });
  return res;
}
