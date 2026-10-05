import { PortfolioApp } from "@/components/portfolio/portfolio-app";
import prismadb from "@/lib/prismadb";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ token: string }> };

export default async function PortfolioPage({ params }: Props) {
  const { token } = await params;
  const placement = await prismadb.placement.findFirst({
    where: { token, active: true },
  });
  if (!placement) notFound();

  return <PortfolioApp token={placement.token} label={placement.label} />;
}
