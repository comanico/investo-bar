import { expireUnsoldListings } from "@/lib/expire-listings";
import prismadb from "@/lib/prismadb";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  await expireUnsoldListings();
  const orders = await prismadb.order.findMany({
    where: { status: "pending", side: "sell", buyerPlacementId: null },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      product: true,
      qty: true,
      placementId: true,
      placement: { select: { label: true } },
    },
  });

  return NextResponse.json({
    listings: orders.map((order) => ({
      id: order.id,
      product: order.product,
      qty: order.qty,
      placementId: order.placementId,
      seller: order.placement.label,
    })),
  });
}
