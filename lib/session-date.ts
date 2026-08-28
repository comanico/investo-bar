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