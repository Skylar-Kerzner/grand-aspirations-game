import { useGame } from "@/lib/GameContext";
import { formatMoney, formatRate, formatDays } from "@/lib/formatters";

export default function Dashboard() {
  const { state, derived } = useGame();
  return (
    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border px-4 py-5">
      <div className="text-center mb-3">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">Cash</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-[-0.04em] font-mono-nums">
          {formatMoney(state.cash)}
        </h1>
        <p className="text-[11px] text-muted-foreground mt-1">
          Net worth {formatMoney(derived.netWorth)} · {formatDays(state.day)}
        </p>
      </div>
      <div className="flex justify-between items-end max-w-md mx-auto">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Income</p>
          <p className="font-mono-nums text-sm text-primary">{formatRate(derived.incomePerDay)}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Costs</p>
          <p className="font-mono-nums text-sm text-destructive">
            {formatRate(-(derived.livingCosts + derived.operatingCosts + derived.loanPayments))}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Banked</p>
          <p className={`font-mono-nums text-base ${derived.savedPerDay >= 0 ? "text-primary" : "text-destructive"}`}>
            {formatRate(derived.savedPerDay)}
          </p>
        </div>
      </div>
    </div>
  );
}
