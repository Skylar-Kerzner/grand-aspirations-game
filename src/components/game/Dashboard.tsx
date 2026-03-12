import { useGame } from "@/lib/GameContext";
import { formatMoney, formatRate } from "@/lib/formatters";

export default function Dashboard() {
  const { state, derived } = useGame();
  return (
    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border px-4 py-5">
      <div className="text-center mb-3">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">Net Worth</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-[-0.04em] font-mono-nums">
          {formatMoney(derived.netWorth)}
        </h1>
      </div>
      <div className="flex justify-between items-end max-w-md mx-auto">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Cash</p>
          <p className="font-mono-nums text-base sm:text-lg">{formatMoney(state.cash)}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Income</p>
          <p className="font-mono-nums text-sm text-primary">{formatRate(derived.incomePerSecond)}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Cashflow</p>
          <p className={`font-mono-nums text-base sm:text-lg ${derived.netPerSecond >= 0 ? "text-primary" : "text-destructive"}`}>
            {formatRate(derived.netPerSecond)}
          </p>
        </div>
      </div>
    </div>
  );
}
