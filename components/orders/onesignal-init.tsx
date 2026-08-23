"use client";

import { useEffect } from "react";
import OneSignal from "react-onesignal";

export function OneSignalInit() {
    useEffect(() => {
        const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
        if (!appId) return;

        OneSignal.init({
            appId,
            allowLocalhostAsSecureOrigin: true, // dev only
        }).then(() => {
            OneSignal.Slidedown.promptPush();
        });
    }, []);

    return null;
}