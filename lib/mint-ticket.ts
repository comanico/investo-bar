import type { Prisma } from "@prisma/client";
import prismadb from "@/lib/prismadb";

type TicketDb = Prisma.TransactionClient | typeof prismadb;

function asNum(n: unknown) {
  if (n == null) return 0;
  const v = typeof n === "bigint" ? Number(n) : Number(n);
  return Number.isFinite(v) ? v : 0;
}

export async function mintTicketId(db: TicketDb = prismadb) {
  const [open, sold] = await Promise.all([
    db.$queryRaw<[{ n: bigint | number | null }]>`
      SELECT MAX(CAST(ticketId AS UNSIGNED)) AS n
      FROM orders
      WHERE ticketId REGEXP '^[0-9]+$'
    `,
    db.$queryRaw<[{ n: bigint | number | null }]>`
      SELECT MAX(CAST(ticketId AS UNSIGNED)) AS n
      FROM sales
      WHERE ticketId REGEXP '^[0-9]+$'
    `,
  ]);

  const next = Math.max(asNum(open[0]?.n), asNum(sold[0]?.n)) + 1;

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
