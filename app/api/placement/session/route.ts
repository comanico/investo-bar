import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const id = (await cookies()).get("ib_table")?.value;
  return NextResponse.json({ ok: Boolean(id) });
}