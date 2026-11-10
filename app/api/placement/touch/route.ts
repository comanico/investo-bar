import prismadb from "@/lib/prismadb";
import { NextResponse } from "next/server";

const SESSION_MS = 10 * 60 * 1000;

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

  const sessionExpiresAt = new Date(Date.now() + SESSION_MS);
  await prismadb.placement.update({
    where: { id: placement.id },
    data: { sessionExpiresAt },
  });

  return NextResponse.json({
    label: placement.label,
    kind: placement.kind,
    sessionExpiresAt,
  });
}