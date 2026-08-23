import { OneSignalInit } from "@/components/orders/onesignal-init";
import { auth } from "@clerk/nextjs/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  const whitelistedUserIds = (process.env.WHITELISTED_USERS || "").split(",");

  if (userId && !whitelistedUserIds.includes(userId)) {
    return <div className="p-8 text-center text-red-600">Access denied...</div>;
  }

  return <>
    <OneSignalInit />
    {children}
  </>;
}
