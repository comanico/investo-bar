import prismadb from "@/lib/prismadb";
import { NextResponse } from "next/server";

const MAX_AGE = 10 * 60;

export async function POST(req: Request) {
  const { token } = await req.json();
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const placement = await prismadb.placement.findFirst({
    where: { token, active: true },
  });
  if (!placement) {
    return NextResponse.json({ error: "Invalid table" }, { status: 404 });
  }

  const res = NextResponse.json({
    ok: true,
    label: placement.label,
    expiresIn: MAX_AGE,
  });

  res.cookies.set("ib_table", placement.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });

  return res;
}