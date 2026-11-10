type TicketLine = {
  product: string;
  qty: number;
  price: number;
};

export function TicketScreen({
  open,
  label,
  ticketId,
  orders,
  caption,
}: {
  open: boolean;
  label?: string;
  ticketId: string;
  orders: TicketLine[];
  caption: string;
}) {
  const total = orders.reduce((n, line) => n + line.qty * line.price, 0);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black px-6">
      <img
        src="/InvestoBar.svg"
        alt="InvestoBar"
        className={[
          "mb-8 h-24 w-auto transition-opacity duration-500",
          open ? "opacity-90" : "opacity-0",
        ].join(" ")}
      />
      <article
        className={[
          "w-full max-w-sm rounded-3xl border border-white/20 bg-[#2E8B57]/80 p-6 text-white shadow-[0_0_28px_rgba(60,179,113,0.45)] backdrop-blur-xl",
          "transition-all duration-1000 ease-out",
          open ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
        ].join(" ")}
      >
        <p className="text-center text-sm text-white/70">{label}</p>
        <h1 className="mt-1 text-center text-4xl font-extrabold">
          Ticket {ticketId}
        </h1>
        <ul className="mt-6 space-y-3">
          {orders.map((line) => (
            <li
              key={line.product}
              className="flex items-center justify-between rounded-2xl border border-white/15 bg-white/10 px-4 py-3"
            >
              <span className="font-semibold">
                {line.qty} × {line.product}
              </span>
              <span className="tabular-nums">
                {(line.qty * line.price).toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-center text-2xl font-bold">
          {total.toFixed(2)} RON
        </p>
        <p className="mt-2 text-center text-sm text-white/70">{caption}</p>
      </article>
    </div>
  );
}
