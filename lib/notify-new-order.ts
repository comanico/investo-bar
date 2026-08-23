export type NotifyOrder = {
    id: string;
    product: string;
    price: number;
    placement: { label: string };
  };
  
  export function notifyNewOrder(o: NotifyOrder) {
    const title = "New order";
    const body = `${o.placement.label} · ${o.product} · ${Number(o.price).toFixed(2)} RON`;
  
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification(title, {
          body,
          tag: o.id,
        });
      }
    }
  
    try {
      navigator.vibrate?.(200);
    } catch {
      /* ignore */
    }
  
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.value = 0.05;
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      /* ignore — autoplay policies */
    }
  }