const TIERS = [
  { threshold: 1e15, suffix: "Q" },
  { threshold: 1e12, suffix: "T" },
  { threshold: 1e9, suffix: "B" },
  { threshold: 1e6, suffix: "M" },
];

export function formatMoney(amount: number): string {
  if (amount < 0) return "-" + formatMoney(-amount);
  for (const tier of TIERS) {
    if (amount >= tier.threshold) {
      return "$" + (amount / tier.threshold).toFixed(2) + tier.suffix;
    }
  }
  if (amount >= 1000) {
    return "$" + amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return "$" + amount.toFixed(2);
}

export function formatRate(amount: number): string {
  const sign = amount >= 0 ? "+" : "";
  return sign + formatMoney(amount) + "/s";
}

export function formatCompact(amount: number): string {
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
