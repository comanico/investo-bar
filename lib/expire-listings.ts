import prismadb from "@/lib/prismadb";
import { quarterStartBucharest } from "@/lib/session-date";

export async function expireUnsoldListings(now = new Date()) {
  const start = quarterStartBucharest(now);
  await prismadb.order.deleteMany({
    where: {
      side: "sell",
      status: "pending",
      buyerPlacementId: null,
      createdAt: { lt: start },
    },
  });
}
