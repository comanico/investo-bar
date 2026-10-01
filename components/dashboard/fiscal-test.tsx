"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function FiscalTest() {
  const [busy, setBusy] = useState<"nf" | "sales" | null>(null);

  const run = async (test: "nf" | "sales") => {
    setBusy(test);
    try {
      const res = await fetch("/api/fiscal/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test: test === "nf" ? "nf" : "heineken" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.fiscal?.ok === false) {
        toast.error(data.fiscal?.error || data.error || "Test failed", {
          duration: 5000,
        });
        return;
      }
      toast.success(
        test === "nf"
          ? "NF slip sent"
          : `Bon ${data.fiscal?.pi?.unp || "printed"}`,
        { duration: 5000 },
      );
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        type="button"
        variant="secondary"
        disabled={busy !== null}
        onClick={() => run("nf")}
      >
        {busy === "nf" ? "Printing…" : "NF Test"}
      </Button>
      <Button
        type="button"
        variant="destructive"
        disabled={busy !== null}
        onClick={() => run("sales")}
      >
        {busy === "sales" ? "Printing…" : "Sales Test"}
      </Button>
    </div>
  );
}
