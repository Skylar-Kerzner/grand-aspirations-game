import { useGame } from "@/lib/GameContext";
import { formatMoney, formatRate, formatDays } from "@/lib/formatters";

export default function Dashboard() {
  const { state, derived, dispatch } = useGame();
  const periodLabel = derived.recentCashFlowDays >= 7
    ? "Last 7 days"
    : derived.recentCashFlowDays === 1 ? "Today" : derived.recentCashFlowDays > 1
      ? `Last ${derived.recentCashFlowDays} days` : "No history yet";
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

      <div className="grid grid-cols-3 items-end max-w-md mx-auto gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{periodLabel}</p>
          <p className="font-mono-nums text-sm text-primary">
            {formatMoney(derived.recentSalary + derived.recentBusiness + derived.recentInvestments)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Costs</p>
          <p className="font-mono-nums text-sm text-destructive">
            -{formatMoney(derived.recentCosts)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Net</p>
          <p className={`font-mono-nums text-base ${derived.recentNet >= 0 ? "text-primary" : "text-destructive"}`}>
            {derived.recentNet >= 0 ? "+" : ""}{formatMoney(derived.recentNet)}
          </p>
          <p className="text-[10px] text-muted-foreground font-mono-nums">Pace {formatRate(derived.netPerDay)}</p>
        </div>
      </div>
    </div>
  );
}
