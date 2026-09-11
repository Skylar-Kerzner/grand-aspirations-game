const TIERS = [
  { threshold: 1e15, suffix: "Q" },
  { threshold: 1e12, suffix: "T" },
  { threshold: 1e9, suffix: "B" },
  { threshold: 1e6, suffix: "M" },
];

export function formatMoney(amount: number): string {
  if (!Number.isFinite(amount)) return "$0";
  if (amount < 0) return "-" + formatMoney(-amount);
  for (const tier of TIERS) {
    if (amount >= tier.threshold) {
      return "$" + (amount / tier.threshold).toFixed(2) + tier.suffix;
    }
  }
  if (amount >= 1000) {
    return "$" + amount.toLocaleString("en-US", { maximumFractionDigits: 0 });
  }
  return "$" + amount.toFixed(2);
}

/** Per-day rate — one real second is one in-game day. */
export function formatRate(amount: number): string {
  if (!Number.isFinite(amount)) return "$0/day";
  const sign = amount >= 0 ? "+" : "";
  return sign + formatMoney(amount) + "/day";
}

export function formatCompact(amount: number): string {
  if (!Number.isFinite(amount)) return "$0";
  if (amount < 0) return "-" + formatCompact(-amount);
  for (const tier of TIERS) {
    if (amount >= tier.threshold) {
      return "$" + (amount / tier.threshold).toFixed(1) + tier.suffix;
    }
  }
  if (amount >= 1000) {
    return "$" + (amount / 1000).toFixed(1) + "K";
  }
  return "$" + amount.toFixed(0);
}

export function formatDays(days: number): string {
  const d = Math.max(0, Math.floor(days));
  const years = Math.floor(d / 365);
  const rem = d % 365;
  if (years > 0) return `Year ${years + 1}, Day ${rem + 1}`;
  return `Day ${d + 1}`;
}
