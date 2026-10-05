import prismadb from "@/lib/prismadb";
import { NextResponse } from "next/server";

const NIGHT = 6 * 60 * 60;

export async function POST(req: Request) {
  const { token, ticketId } = await req.json();
  const placement = await prismadb.placement.findFirst({
    where: { token, active: true },
  });
  if (!placement || !ticketId) {
    return NextResponse.json({ error: "Invalid ticket" }, { status: 400 });
  }

  const res = NextResponse.json({ ok: true, ticketId: String(ticketId) });
  res.cookies.set(`ib_ticket_${token}`, String(ticketId), {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: NIGHT,
  });
  return res;
}