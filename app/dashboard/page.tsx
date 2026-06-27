import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { DynamicTable } from "@/components/dynamic-table";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getMenu } from "@/actions/getMenu";
import { getSales } from "@/actions/getSales";
import { getBere } from "@/actions/getBere";
import { getVin } from "@/actions/getVin";
import { getRacoritoare } from "@/actions/getRacoritoare";
import { getSpirtoase } from "@/actions/getSpirtoase";

async function Page() {
  // Fetch all data on the server side
  const [
    initialMenu,
    salesData,
    bereData,
    vinData,
    racoritoareData,
    spirtoaseData,
  ] = await Promise.all([
    getMenu(),
    getSales(),
    getBere(),
    getVin(),
    getRacoritoare(),
    getSpirtoase(),
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
          spirtoaseData={spirtoaseData}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}

export default Page;
