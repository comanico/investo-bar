import { SiteHeader } from "@/components/menu/menu-header";
import { MenuTable } from "@/components/menu/menu-table";
import { getMenu } from "@/actions/getMenu";

export const dynamic = "force-dynamic";

async function Page() {
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
