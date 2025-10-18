import { SiteHeader } from "@/components/menu-header";
import { MenuTable } from "@/components/menu-table";
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
        <>
            <SiteHeader />
            <div className="flex flex-1 flex-col">
                <MenuTable initial={initial} />
            </div>
        </>
    );
}

export default Page;