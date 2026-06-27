"use client";

import { useState, useEffect } from "react";
import { AdminTable } from "@/components/admin-table";
import { SalesTable } from "@/components/sales-table";
import { BereTable } from "@/components/bere-table";
import { VinTable } from "@/components/vin-table";
import { RacoritoareTable } from "@/components/racoritoare-table";
import { SpirtoaseTable } from "@/components/spirtoase-table";
import type { MenuItem } from "@/actions/getMenu";
import type { SalesItem } from "@/actions/getSales";
import type { BereItem } from "@/actions/getBere";
import type { VinItem } from "@/actions/getVin";
import type { RacoritoareItem } from "@/actions/getRacoritoare";
import type { SpirtoaseItem } from "@/actions/getSpirtoase";

type TableView =
  | "menu"
  | "sales"
  | "bere"
  | "vin"
  | "racoritoare"
  | "spirtoase";

interface DynamicTableProps {
  initialMenu: MenuItem[];
  salesData: SalesItem[];
  bereData: BereItem[];
  vinData: VinItem[];
  racoritoareData: RacoritoareItem[];
  spirtoaseData: SpirtoaseItem[];
}

export function DynamicTable({
  initialMenu,
  salesData,
  bereData,
  vinData,
  racoritoareData,
  spirtoaseData,
}: DynamicTableProps) {
  const [currentView, setCurrentView] = useState<TableView>("menu");

  useEffect(() => {
    // Listen for hash changes
    const handleHashChange = () => {
      const hash = window.location.hash;
      const view = hash.replace("#view=", "") as TableView;
      if (
        ["menu", "sales", "bere", "vin", "racoritoare", "spirtoase"].includes(
          view,
        )
      ) {
        setCurrentView(view);
      }
    };

    // Set initial view from hash
    handleHashChange();

    // Listen for hash changes
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const renderTable = () => {
    switch (currentView) {
      case "menu":
        return <AdminTable initial={initialMenu} />;
      case "sales":
        return <SalesTable items={salesData} />;
      case "bere":
        return <BereTable items={bereData} />;
      case "vin":
        return <VinTable items={vinData} />;
      case "racoritoare":
        return <RacoritoareTable items={racoritoareData} />;
      case "spirtoase":
        return <SpirtoaseTable items={spirtoaseData} />;
      default:
        return <AdminTable initial={initialMenu} />;
    }
  };

  return <div className="flex flex-1 flex-col">{renderTable()}</div>;
}
