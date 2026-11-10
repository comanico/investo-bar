import type { Prisma } from "@prisma/client";
import prismadb from "@/lib/prismadb";

type TicketDb = Prisma.TransactionClient | typeof prismadb;

export async function mintTicketId(db: TicketDb = prismadb) {
  const [open, sold] = await Promise.all([
    db.order.aggregate({ _max: { ticketId: true } }),
    db.sales.aggregate({
      where: { ticketId: { not: null } },
      _max: { ticketId: true },
    }),
  ]);

  const next =
    Math.max(Number(open._max.ticketId) || 0, Number(sold._max.ticketId) || 0) +
    1;

  for (let i = 0; i < 20; i++) {
    const ticketId = String(next + i);
    const [takenOpen, takenSold] = await Promise.all([
      db.order.findFirst({ where: { ticketId }, select: { id: true } }),
      db.sales.findFirst({ where: { ticketId }, select: { id: true } }),
    ]);
    if (!takenOpen && !takenSold) return ticketId;
  }

  return null;
}
