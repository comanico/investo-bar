import prismadb from "@/lib/prismadb";
import { NextResponse } from "next/server";

export async function GET() {
    const orders = await prismadb.order.findMany({
      where: { status: "pending" },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        product: true,
        qty: true,
        price: true,
        createdAt: true,
        placement: { select: { label: true } },
      },
    });
    return NextResponse.json({ orders });
  }