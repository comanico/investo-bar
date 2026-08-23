"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "investobar-order-alerts";

export function EnableOrderAlerts() {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    "default",
  );

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission);
  }, []);

  const enable = async () => {
    if (!("Notification" in window)) {
      alert("Notifications not supported");
      return;
    }

    const result = await Notification.requestPermission();
    setPermission(result);

    if (result === "granted") {
      localStorage.setItem(STORAGE_KEY, "1");
      new Notification("Investo Bar", {
        body: "Order alerts enabled",
        tag: "investobar-alerts-on",
      });
    } else {
      localStorage.removeItem(STORAGE_KEY);
      alert("Permission denied — enable notifications in browser settings");
    }
  };

  if (permission === "unsupported") {
    return (
      <span className="text-xs text-muted-foreground">Alerts N/A</span>
    );
  }

  if (permission === "granted") {
    return (
      <Button variant="secondary" size="sm" type="button" disabled>
        Alerts on
      </Button>
    );
  }

  return (
    <Button variant="default" size="sm" type="button" onClick={enable}>
      Enable order alerts
    </Button>
  );
}

export function orderAlertsEnabled(): boolean {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  return (
    Notification.permission === "granted" &&
    localStorage.getItem(STORAGE_KEY) === "1"
  );
}