"use client";

import { Button } from "@/components/ui/button";
import OneSignal from "react-onesignal";

export function EnableOrderAlerts() {
    const enable = async () => {
        try {
            OneSignal.init({
                appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!,
                allowLocalhostAsSecureOrigin: true,
            });
            await OneSignal.Notifications.requestPermission();
            await OneSignal.User.PushSubscription.optIn();
            alert("Order alerts enabled on this device");
        } catch (e) {
            console.error(e);
            alert("Could not enable push — check browser settings");
        }
    };

    return (
        <Button variant="default" size="sm" type="button" onClick={enable}>
            Enable order alerts
        </Button>
    );
}