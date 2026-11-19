export function sessionDateBucharest(now = new Date()): Date{
    const parts = new Intl.DateTimeFormat("en-CA", 
        {
            timeZone: "Europe/Bucharest",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        }
    ).format(now);

    return new Date(`${parts}T00:00:00.000Z`)
}

export function dueStamp(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Bucharest",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const hour = Number(parts.find((p) => p.type === "hour")?.value);
  const minute = Number(parts.find((p) => p.type === "minute")?.value);
  const quarter = Math.floor(minute / 15) * 15;
  return `${String(hour).padStart(2, "0")}:${String(quarter).padStart(2, "0")}`;
}

export function quarterStartBucharest(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Bucharest",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const minute = Number(parts.find((part) => part.type === "minute")?.value);
  const intoQuarter =
    (minute % 15) * 60 * 1000 + now.getSeconds() * 1000 + now.getMilliseconds();
  return new Date(now.getTime() - intoQuarter);
}

export function sessionWindow(now = new Date()) {
  const sessionDate = sessionDateBucharest(now);
  const next = new Date(sessionDate);
  next.setUTCDate(next.getUTCDate() + 1);
  return { sessionDate, gte: sessionDate, lt: next };
}