import { HeatmenuApp } from "@/components/heatmenu/heatmenu-app";
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

  return (
    <HeatmenuApp
      placement={{
        id: placement.id,
        token: placement.token,
        label: placement.label,
        kind: placement.kind,
      }}
    />
  );
}
