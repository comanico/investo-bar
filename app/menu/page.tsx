import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { AdminTable } from "@/components/admin-table";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { auth } from "@clerk/nextjs/server";
import { getMenu } from "@/actions/getMenu";

async function Page() {

    const { userId } = await auth();
    const whitelistedUserIds = (process.env.WHITELISTED_USERS || "").split(',')

    if (userId && !whitelistedUserIds.includes(userId)) {
        return <div>Access denied...</div>;
    }

    const initial = await getMenu();

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
                <div className="flex flex-1 flex-col">
                    <AdminTable initial={initial} />
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}

export default Page;