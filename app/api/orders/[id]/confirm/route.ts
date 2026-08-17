import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req: Request, context: {params: Promise<{id: string}>}) {
  const {id} = await context.params
  const body = await req.json();
  console.log(body)
  console.log(id)
  return NextResponse.json({ok: true})
  // try {
    
  //   const body = await req.json();
  //   const { token, product, type, price, qty = 1 } = body;

  //   if (!token || !product || typeof price !== "number") {
  //     return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  //   }

  //   const placement = await prismadb.placement.findFirst({
  //     where: { token, active: true },
  //   });

  //   if (!placement) {
  //     return NextResponse.json({ error: "Invalid table" }, { status: 404 });
  //   }

  //   const order = await prismadb.order.create({
  //     data: {
  //       placementId: placement.id,
  //       product,
  //       type: type ?? "Unknown",
  //       price,
  //       qty: Number(qty) || 1,
  //       status: "pending",
  //     },
  //     include: { placement: true },
  //   });

  //   return NextResponse.json({ order }, { status: 201 });
  // } catch (e) {
  //   console.error("POST /api/orders", e);
  //   return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  // }
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