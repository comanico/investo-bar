export async function notifyNewOrder(text: string): Promise<void> {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
  
    if (!token || !chatId) {
      console.warn("Telegram env missing — skip notify");
      return;
    }
  
    try {
      const res = await fetch(
        `https://api.telegram.org/bot${token}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text,
            disable_web_page_preview: true,
          }),
        },
      );
  
      if (!res.ok) {
        console.error("Telegram error", res.status, await res.text());
      }
    } catch (e) {
      console.error("Telegram notify failed", e);
    }
  }