import { useState } from "react";
import { motion } from "framer-motion";
import { useGame } from "@/lib/GameContext";
import { formatMoney, formatCompact } from "@/lib/formatters";
import { INVESTMENTS } from "@/lib/gameData";

const QUICK_AMOUNTS = [100, 1000, 10000, 100000];

export default function InvestmentPanel() {
  const { state, dispatch } = useGame();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {INVESTMENTS.map((def) => {
        const value = state.investments[def.id] || 0;
        const isExpanded = expandedId === def.id;

        return (
          <div key={def.id} className="surface-card rounded-xl p-4">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setExpandedId(isExpanded ? null : def.id)}
            >
              <div>
                <h3 className="font-semibold text-sm">{def.name}</h3>
                <p className="text-[11px] text-muted-foreground">{def.description}</p>
              </div>
              <div className="text-right">
                {value > 0 ? (
                  <p className="font-mono-nums text-sm text-primary">{formatMoney(value)}</p>
                ) : (
                  <p className="text-[11px] text-muted-foreground">Min {formatCompact(def.minInvestment)}</p>
                )}
                <p className="text-[10px] text-muted-foreground">Risk: {def.risk}</p>
              </div>
            </div>

            {isExpanded && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-[11px] text-muted-foreground mb-2">Quick invest:</p>
                <div className="flex gap-2 flex-wrap">
                  {QUICK_AMOUNTS.map((amt) => (
                    <motion.button
                      key={amt}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => dispatch({ type: "INVEST", id: def.id, amount: amt })}
                      disabled={state.cash < amt || (value === 0 && amt < def.minInvestment)}
                      className="h-8 px-3 rounded-lg surface-button text-xs font-mono-nums transition-game disabled:opacity-30"
                    >
                      {formatCompact(amt)}
                    </motion.button>
                  ))}
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      const max = Math.max(0, state.cash);
                      if (max >= (value === 0 ? def.minInvestment : 1))
                        dispatch({ type: "INVEST", id: def.id, amount: max });
                    }}
                    disabled={state.cash < (value === 0 ? def.minInvestment : 1)}
                    className="h-8 px-3 rounded-lg surface-button text-xs font-medium transition-game disabled:opacity-30"
                  >
                    MAX
                  </motion.button>
                </div>

                {value > 0 && (
                  <div className="mt-2 flex gap-2">
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => dispatch({ type: "WITHDRAW", id: def.id, amount: value * 0.5 })}
                      className="h-8 px-3 rounded-lg surface-button text-xs transition-game"
                    >
                      Withdraw 50%
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => dispatch({ type: "WITHDRAW", id: def.id, amount: value })}
                      className="h-8 px-3 rounded-lg surface-button text-xs transition-game"
                    >
                      Withdraw All
                    </motion.button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Portfolio Summary */}
      <div className="surface-card rounded-xl p-4 mt-4">
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Portfolio</h3>
        <p className="font-mono-nums text-lg">
          {formatMoney(Object.values(state.investments).reduce((s, v) => s + v, 0))}
        </p>
      </div>
    </div>
  );
}
