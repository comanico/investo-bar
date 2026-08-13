// prisma/seed.ts
import prismadb from "@/lib/prismadb";
import { randomBytes } from "crypto";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const VENUE_ID = process.env.VENUE_ID ?? "investobar-default";

function token(prefix: "tbl" | "smk") {
  return `${prefix}_${randomBytes(12).toString("hex")}`;
}

async function main() {

  const tables = Array.from({ length: 20 }, (_, i) => {
    const t = token("tbl");
    return {
      venueId: VENUE_ID,
      kind: "table",
      label: `Table ${i + 1}`,
      token: t,
      active: true,
    };
  });

  const smoking = Array.from({ length: 10 }, (_, i) => {
    const t = token("smk");
    return {
      venueId: VENUE_ID,
      kind: "smoking",
      label: `Smoking ${i + 1}`,
      token: t,
      active: true,
    };
  });

  const rows = [...tables, ...smoking];

  await prismadb.placement.createMany({ data: rows });

  const saved = await prismadb.placement.findMany({
    where: { venueId: VENUE_ID },
    orderBy: [{ kind: "asc" }, { label: "asc" }],
  });

  console.log(`Seeded ${saved.length} placements\n`);
  for (const p of saved) {
    console.log(`${p.label}\t${APP_URL}/t/${p.token}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prismadb.$disconnect();
  });