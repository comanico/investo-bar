"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

const tableNames: Record<string, string> = {
  menu: "Menu",
  sales: "Sales",
  bere: "Bere",
  vin: "Vin",
  racoritoare: "Racoritoare",
};

export function SiteHeader() {
  const [currentTable, setCurrentTable] = useState("Menu");

  useEffect(() => {
    // Function to get current table name from hash
    const getCurrentTableName = () => {
      const hash = window.location.hash;
      const view = hash.replace("#view=", "");
      return tableNames[view] || "Menu";
    };

    // Set initial table name
    setCurrentTable(getCurrentTableName());

    // Listen for hash changes
    const handleHashChange = () => {
      setCurrentTable(getCurrentTableName());
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{currentTable}</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" asChild size="sm" className="hidden sm:flex">
            <a
              href="https://github.com/shadcn-ui/ui/tree/main/apps/v4/app/(examples)/dashboard"
              rel="noopener noreferrer"
              target="_blank"
              className="dark:text-foreground"
            >
              GitHub
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}
