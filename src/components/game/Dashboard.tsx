import { useGame } from "@/lib/GameContext";
import { formatMoney, formatRate, formatDays } from "@/lib/formatters";

export default function Dashboard() {
  const { state, derived, dispatch } = useGame();
  return (
    <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-md border-b border-border px-4 py-5">
      <div className="text-center mb-3">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">Cash</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-[-0.04em] font-mono-nums">
          {formatMoney(state.cash)}
        </h1>
        <p className="text-[11px] text-muted-foreground mt-1">
          Net worth {formatMoney(derived.netWorth)} · {formatDays(state.day)}
        </p>
      </div>

      {state.ccDebt > 0.5 && (
        <div className="max-w-md mx-auto mb-3 flex items-center justify-between rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-destructive">Credit card</p>
            <p className="font-mono-nums text-sm text-destructive">
              {formatMoney(state.ccDebt)} · 29% APR
            </p>
          </div>
          <button
            onClick={() => dispatch({ type: "PAY_CC" })}
            disabled={state.cash <= 0}
            className="h-8 px-3 rounded-lg surface-button text-xs font-medium transition-game disabled:opacity-40"
          >
            Pay down
          </button>
        </div>
      )}

      <div className="flex justify-between items-end max-w-md mx-auto">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Income</p>
          <p className="font-mono-nums text-sm text-primary">{formatRate(derived.incomePerDay)}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Costs</p>
          <p className="font-mono-nums text-sm text-destructive">
            {formatRate(-(derived.livingCosts + derived.trainingCost + derived.operatingCosts + derived.loanPayments + derived.ccPaymentPerDay))}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Net</p>
          <p className={`font-mono-nums text-base ${derived.netPerDay >= 0 ? "text-primary" : "text-destructive"}`}>
            {formatRate(derived.netPerDay)}
          </p>
        </div>
      </div>
    </div>
  );
}
