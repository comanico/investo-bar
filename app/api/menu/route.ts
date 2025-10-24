import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const items = await prisma.menu.findMany();
    const formattedItems = items.map((item) => ({
      product: item.product,
      type: item.type,
      price: Number(item.price),
      quantity: item.quantity ?? 0,
    }));
    return NextResponse.json(formattedItems);
  } catch (error) {
    console.error("Error fetching menu:", error);
    return NextResponse.json({ error: "Failed to fetch menu" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}