import { useState } from "react";
import { motion } from "framer-motion";
import { useGame, isInvestmentUnlocked } from "@/lib/GameContext";
import { formatMoney, formatCompact } from "@/lib/formatters";
import { INVESTMENTS } from "@/lib/gameData";

const QUICK_AMOUNTS = [1000, 10000, 100000, 1000000];

export default function InvestmentPanel() {
  const { state, derived, dispatch } = useGame();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {INVESTMENTS.map((def) => {
        const inv = state.investments[def.id] || { value: 0, deposited: 0 };
        const unlocked = isInvestmentUnlocked(state, def.id);
        const isExpanded = expandedId === def.id && unlocked;
        const gain = inv.value - inv.deposited;
        const prev = INVESTMENTS.find((i) => i.id === def.unlockPrev);

        return (
          <div key={def.id} className={`surface-card rounded-xl p-4 ${unlocked ? "" : "opacity-60"}`}>
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => unlocked && setExpandedId(isExpanded ? null : def.id)}
            >
              <div className="min-w-0 pr-3">
                <h3 className="font-semibold text-sm">{def.name}</h3>
                <p className="text-[11px] text-muted-foreground">
                  {unlocked
                    ? def.description
                    : `Deposit ${formatCompact(def.unlockAmount || 0)} into ${prev?.name} to unlock`}
                </p>
              </div>
              <div className="text-right shrink-0">
                {inv.value > 0 ? (
                  <>
                    <p className="font-mono-nums text-sm">{formatMoney(inv.value)}</p>
                    <p className={`text-[10px] font-mono-nums ${gain >= 0 ? "text-primary" : "text-destructive"}`}>
                      {gain >= 0 ? "+" : ""}{formatCompact(gain)}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-[11px] text-muted-foreground">Min {formatCompact(def.minInvestment)}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {(def.annualReturn * 100).toFixed(1)}%/yr · {def.risk}
                    </p>
                  </>
                )}
              </div>
            </div>

            {isExpanded && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-[11px] text-muted-foreground mb-2">
                  {(def.annualReturn * 100).toFixed(1)}% a year expected · volatility {(def.annualVolatility * 100).toFixed(0)}%
                </p>
                <div className="flex gap-2 flex-wrap">
                  {QUICK_AMOUNTS.map((amt) => (
                    <motion.button
                      key={amt}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => dispatch({ type: "INVEST", id: def.id, amount: amt })}
                      disabled={state.cash < amt || (inv.value === 0 && amt < def.minInvestment)}
                      className="h-8 px-3 rounded-lg surface-button text-xs font-mono-nums transition-game disabled:opacity-30"
                    >
                      {formatCompact(amt)}
                    </motion.button>
                  ))}
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => dispatch({ type: "INVEST", id: def.id, amount: Math.floor(state.cash) })}
                    disabled={state.cash < (inv.value === 0 ? def.minInvestment : 1)}
                    className="h-8 px-3 rounded-lg surface-button text-xs font-medium transition-game disabled:opacity-30"
                  >
                    MAX
                  </motion.button>
                </div>

                {inv.value > 0 && (
                  <div className="mt-2 flex gap-2">
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => dispatch({ type: "WITHDRAW", id: def.id, amount: inv.value * 0.5 })}
                      className="h-8 px-3 rounded-lg surface-button text-xs transition-game"
                    >
                      Withdraw half
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => dispatch({ type: "WITHDRAW", id: def.id, amount: inv.value })}
                      className="h-8 px-3 rounded-lg surface-button text-xs transition-game"
                    >
                      Withdraw all
                    </motion.button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      <div className="surface-card rounded-xl p-4 mt-4">
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Portfolio</h3>
        <p className="font-mono-nums text-lg">{formatMoney(derived.investmentTotal)}</p>
        <p className="text-[11px] text-primary font-mono-nums mt-1">
          Expected {formatMoney(derived.investmentPerDay)}/day
        </p>
      </div>
    </div>
  );
}
