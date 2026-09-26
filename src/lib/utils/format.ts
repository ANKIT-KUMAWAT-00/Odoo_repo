export function formatCurrency(amount: number, currency: string = "USD ($)"): string {
  const symbol = currency.includes("$") ? "$" : currency.includes("€") ? "€" : currency.includes("£") ? "£" : "$";
  return `${symbol}${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getStatusBadgeVariant(status: string): { bg: string; text: string; dot: string } {
  const s = status.toUpperCase();
  switch (s) {
    case "DONE":
    case "ACTIVE":
    case "COMPLETED":
    case "IN_STOCK":
      return { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" };
    case "READY":
    case "PACKING":
    case "PICKING":
      return { bg: "bg-blue-50 text-blue-700 border-blue-200", text: "text-blue-700", dot: "bg-blue-500" };
    case "IN_PROGRESS":
    case "WAITING":
    case "LOW_STOCK":
      return { bg: "bg-amber-50 text-amber-700 border-amber-200", text: "text-amber-700", dot: "bg-amber-500" };
    case "DRAFT":
      return { bg: "bg-slate-100 text-slate-700 border-slate-200", text: "text-slate-700", dot: "bg-slate-400" };
    case "CANCELED":
    case "CANCELLED":
    case "OUT_OF_STOCK":
    case "INACTIVE":
      return { bg: "bg-rose-50 text-rose-700 border-rose-200", text: "text-rose-700", dot: "bg-rose-500" };
    default:
      return { bg: "bg-slate-50 text-slate-600 border-slate-200", text: "text-slate-600", dot: "bg-slate-400" };
  }
}
