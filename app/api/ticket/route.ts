import prismadb from "@/lib/prismadb";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const [open, sold] = await Promise.all([
    prismadb.order.aggregate({_max: {ticketId: true}}),
    prismadb.sales.aggregate({_max: {ticketId: true}}),
  ])

  for (let i = 0; i < 20; i++) {
    const ticketId = String(
      Math.max(Number(open._max.ticketId) || 0, Number(sold._max.ticketId) || 0) + 1,
    );
    const taken = await prismadb.order.findFirst({
      where: { ticketId, status: "pending" },
      select: { id: true },
    });
    if (!taken) return NextResponse.json({ ticketId });
  }
  return NextResponse.json({ error: "No ticket number" }, { status: 503 });
}

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) return NextResponse.json({ ticket: null });

  const ticketId = (await cookies()).get(`ib_ticket_${token}`)?.value;
  if (!ticketId) return NextResponse.json({ ticket: null });

  const orders = await prismadb.order.findMany({
    where: { ticketId },
    select: { product: true, qty: true, price: true, status: true },
  });

  if (!orders.length) {
    const res = NextResponse.json({ ticket: null, resolved: true });
    res.cookies.delete(`ib_ticket_${token}`);
    return res;
  }

  return NextResponse.json({ ticketId, orders });
}