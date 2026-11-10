import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  try {
    const { userId } = await auth();
    const whitelist = (process.env.WHITELISTED_USERS || "").split(",");

    if (!userId || !whitelist.includes(userId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prismadb.order.findUnique({ where: { id } });
    if (!existing || existing.status !== "pending") {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    await prismadb.$transaction(async (tx) => {
      if (existing.side === "sell" && existing.buyerPlacementId) {
        await tx.order.deleteMany({
          where: {
            side: "buy",
            status: "pending",
            product: existing.product,
            placementId: existing.buyerPlacementId,
            buyerPlacementId: existing.placementId,
          },
        });
      }

      if (existing.side === "buy" && existing.buyerPlacementId) {
        await tx.order.updateMany({
          where: {
            side: "sell",
            status: "pending",
            product: existing.product,
            placementId: existing.buyerPlacementId,
            buyerPlacementId: existing.placementId,
          },
          data: { buyerPlacementId: null, ticketId: null },
        });
      }

      await tx.order.delete({ where: { id: existing.id } });
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("cancel order", e);
    return NextResponse.json({ error: "Failed to cancel" }, { status: 500 });
  }
}
