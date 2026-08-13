// app/t/[token]/page.tsx

import prismadb from "@/lib/prismadb";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ token: string }>;
};

export default async function TableTokenPage({ params }: Props) {
  const { token } = await params;

  const placement = await prismadb.placement.findFirst({
    where: {
      token,
      active: true,
    },
  });

  if (!placement) {
    notFound();
  }

  const payload = {
    ok: true,
    placement: {
      id: placement.id,
      venueId: placement.venueId,
      kind: placement.kind,
      label: placement.label,
      token: placement.token,
      active: placement.active,
      url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/t/${placement.token}`,
      createdAt: placement.createdAt,
      updatedAt: placement.updatedAt,
    },
  };

  return (
    <pre
      style={{
        padding: 24,
        color: "#e8e8e8",
        background: "#0b0b0b",
        minHeight: "100vh",
        overflow: "auto",
      }}
    >
      {JSON.stringify(payload, null, 2)}
    </pre>
  );
}
