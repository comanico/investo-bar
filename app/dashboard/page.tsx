import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { DynamicTable } from "@/components/dynamic-table";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getMenu } from "@/actions/getMenu";
import { getSales } from "@/actions/getSales";
import { getBere } from "@/actions/getBere";
import { getVin } from "@/actions/getVin";
import { getRacoritoare } from "@/actions/getRacoritoare";

async function Page() {
  const whitelistedUserIds = (process.env.WHITELISTED_USERS || "").split(",");

  // Fetch all data on the server side
  const [initialMenu, salesData, bereData, vinData, racoritoareData] =
    await Promise.all([
      getMenu(),
      getSales(),
      getBere(),
      getVin(),
      getRacoritoare(),
    ]);

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <DynamicTable
          initialMenu={initialMenu}
          salesData={salesData}
          bereData={bereData}
          vinData={vinData}
          racoritoareData={racoritoareData}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}

export default Page;
