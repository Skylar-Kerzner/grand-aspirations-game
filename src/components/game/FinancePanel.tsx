import { motion } from "framer-motion";
import { useGame } from "@/lib/GameContext";
import { formatMoney, formatCompact, formatRate } from "@/lib/formatters";
import { LOANS, CONSULTANTS } from "@/lib/gameData";

export default function FinancePanel() {
  const { state, derived, dispatch } = useGame();

  return (
    <div className="space-y-6">
      {/* Expenses Overview */}
      <div className="surface-card rounded-xl p-4">
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Expenses</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Operating costs</span>
            <span className="font-mono-nums text-destructive">{formatRate(-derived.expensesPerSecond)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Loan interest</span>
            <span className="font-mono-nums text-destructive">{formatRate(-derived.loanInterestPerSecond)}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-2">
            <span>Total outflow</span>
            <span className="font-mono-nums text-destructive font-semibold">
              {formatRate(-(derived.expensesPerSecond + derived.loanInterestPerSecond))}
            </span>
          </div>
        </div>
      </div>

      {/* Loans */}
      <div>
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3 px-1">Loans</h3>
        <div className="space-y-3">
          {LOANS.map((def) => {
            const loan = state.loans[def.id];
            const isActive = loan?.active;

            return (
              <div key={def.id} className="surface-card rounded-xl p-4">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <h4 className="font-semibold text-sm">{def.name}</h4>
                    <p className="text-[11px] text-muted-foreground">{def.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono-nums text-sm">{formatCompact(def.amount)}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {(def.interestRate * 100).toFixed(3)}%/s
                    </p>
                  </div>
                </div>

                {isActive && (
                  <p className="text-xs text-destructive font-mono-nums mb-2">
                    Remaining: {formatMoney(loan.remaining)}
                  </p>
                )}

                <div className="flex gap-2">
                  {!isActive && (
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => dispatch({ type: "TAKE_LOAN", id: def.id })}
                      className="flex-1 h-9 rounded-lg surface-button text-xs font-medium transition-game"
                    >
                      Borrow {formatCompact(def.amount)}
                    </motion.button>
                  )}
                  {isActive && (
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => dispatch({ type: "REPAY_LOAN", id: def.id })}
                      disabled={state.cash <= 0}
                      className="flex-1 h-9 rounded-lg bg-primary/10 text-primary text-xs font-medium transition-game disabled:opacity-40"
                    >
                      Repay (up to {formatCompact(Math.min(state.cash, loan.remaining))})
                    </motion.button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Consultants */}
      <div>
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3 px-1">Consultants</h3>
        <div className="space-y-3">
          {CONSULTANTS.map((def) => {
            const hired = state.consultants.includes(def.id);
            return (
              <div key={def.id} className="surface-card rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold text-sm">{def.name}</h4>
                    <p className="text-[11px] text-primary">{def.effect}</p>
                  </div>
                  {hired ? (
                    <span className="text-xs text-primary font-medium">Active</span>
                  ) : (
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => dispatch({ type: "HIRE_CONSULTANT", id: def.id })}
                      disabled={state.cash < def.cost}
                      className="h-9 px-4 rounded-lg surface-button text-xs font-medium transition-game disabled:opacity-40"
                    >
                      Hire · <span className="font-mono-nums">{formatCompact(def.cost)}</span>
                    </motion.button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
