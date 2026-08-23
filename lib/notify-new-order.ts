// lib/notify-staff-onesignal.ts
export async function notifyNewOrder(message: {
    title: string;
    body: string;
  }) {
    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
    const apiKey = process.env.ONESIGNAL_REST_API_KEY;
    if (!appId || !apiKey) return;
  
    await fetch("https://api.onesignal.com/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${apiKey}`,
      },
      body: JSON.stringify({
        app_id: appId,
        included_segments: ["Subscribed Users"],
        headings: { en: message.title },
        contents: { en: message.body },
        url: "https://investobar.com/dashboard#view=orders",
      }),
    });
  }