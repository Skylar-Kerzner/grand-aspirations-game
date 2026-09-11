import { motion } from "framer-motion";
import { useGame } from "@/lib/GameContext";
import { formatMoney, formatCompact, formatRate } from "@/lib/formatters";
import { LOANS, CONSULTANTS, LOAN_EQUITY_REQUIREMENT, amortizedPayment } from "@/lib/gameData";

export default function FinancePanel() {
  const { state, derived, dispatch } = useGame();
  const totalLevels = Object.values(state.businesses).reduce((s, b) => s + b.level, 0);

  return (
    <div className="space-y-6">
      {/* Cash flow */}
      <div className="surface-card rounded-xl p-4">
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Daily cash flow</h3>
        <div className="space-y-2 text-sm">
          <Row label="Salary (after tax)" value={formatRate(derived.salaryPerDay)} tone="pos" />
          <Row label="Business profit" value={formatRate(derived.businessPerDay)} tone="pos" />
          <Row label="Investment returns" value={formatRate(derived.investmentPerDay)} tone="pos" />
          <Row label="Living costs" value={formatRate(-derived.livingCosts)} tone="neg" />
          <Row label="Managers & retainers" value={formatRate(-derived.operatingCosts)} tone="neg" />
          <Row label="Loan payments" value={formatRate(-derived.loanPayments)} tone="neg" />
          <div className="flex justify-between border-t border-border pt-2">
            <span>Net</span>
            <span className={`font-mono-nums font-semibold ${derived.netPerDay >= 0 ? "text-primary" : "text-destructive"}`}>
              {formatRate(derived.netPerDay)}
            </span>
          </div>
        </div>
      </div>

      {/* Loans */}
      <div>
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-1 px-1">Loans</h3>
        <p className="text-[11px] text-muted-foreground mb-3 px-1">
          Credit history: {derived.creditTier} loan{derived.creditTier === 1 ? "" : "s"} repaid in full.
        </p>
        <div className="space-y-3">
          {LOANS.map((def) => {
            const loan = state.loans[def.id];
            const isActive = loan?.active;
            const repaid = state.loansRepaid.includes(def.id);
            const creditOk = state.loansRepaid.length >= def.requiresCredit;
            const equityNeeded = def.amount * LOAN_EQUITY_REQUIREMENT;
            const equityOk = derived.netWorth >= equityNeeded;
            const payment = amortizedPayment(def.amount, def.annualRate, def.termDays);

            return (
              <div key={def.id} className={`surface-card rounded-xl p-4 ${creditOk ? "" : "opacity-60"}`}>
                <div className="flex justify-between items-start mb-1">
                  <div className="pr-3">
                    <h4 className="font-semibold text-sm">{def.name}</h4>
                    <p className="text-[11px] text-muted-foreground">{def.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono-nums text-sm">{formatCompact(def.amount)}</p>
                    <p className="text-[10px] text-muted-foreground">{(def.annualRate * 100).toFixed(1)}% APR</p>
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground mb-2 font-mono-nums">
                  {formatMoney(payment)}/day for {def.termDays} days
                </p>

                {isActive && (
                  <p className="text-xs text-destructive font-mono-nums mb-2">
                    Outstanding {formatMoney(loan.remaining)}
                  </p>
                )}

                {!isActive && !creditOk && (
                  <p className="text-[11px] text-muted-foreground mb-2">
                    Requires {def.requiresCredit} repaid loan{def.requiresCredit === 1 ? "" : "s"}.
                  </p>
                )}
                {!isActive && creditOk && !equityOk && !repaid && (
                  <p className="text-[11px] text-muted-foreground mb-2">
                    Requires {formatCompact(equityNeeded)} net worth as collateral.
                  </p>
                )}

                {isActive ? (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => dispatch({ type: "REPAY_LOAN", id: def.id })}
                    disabled={state.cash <= 0}
                    className="w-full h-9 rounded-lg bg-primary/10 text-primary text-xs font-medium transition-game disabled:opacity-40"
                  >
                    Pay off now · {formatCompact(Math.min(state.cash, loan.remaining))}
                  </motion.button>
                ) : repaid ? (
                  <p className="text-xs text-primary">Repaid in full</p>
                ) : (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => dispatch({ type: "TAKE_LOAN", id: def.id })}
                    disabled={!creditOk || !equityOk}
                    className="w-full h-9 rounded-lg surface-button text-xs font-medium transition-game disabled:opacity-40"
                  >
                    Borrow {formatCompact(def.amount)}
                  </motion.button>
                )}
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
            const eligible = totalLevels >= def.requiresBusinessLevels;
            return (
              <div key={def.id} className={`surface-card rounded-xl p-4 ${eligible ? "" : "opacity-60"}`}>
                <div className="flex justify-between items-center gap-3">
                  <div className="min-w-0">
                    <h4 className="font-semibold text-sm">{def.name}</h4>
                    <p className="text-[11px] text-primary">{def.effect}</p>
                    <p className="text-[11px] text-muted-foreground font-mono-nums">
                      {formatMoney(def.dailyRetainer)}/day retainer
                      {!eligible && ` · needs ${def.requiresBusinessLevels} business levels`}
                    </p>
                  </div>
                  {hired ? (
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => dispatch({ type: "FIRE_CONSULTANT", id: def.id })}
                      className="h-9 px-4 rounded-lg surface-button text-xs font-medium transition-game shrink-0"
                    >
                      Release
                    </motion.button>
                  ) : (
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => dispatch({ type: "HIRE_CONSULTANT", id: def.id })}
                      disabled={state.cash < def.hireCost || !eligible}
                      className="h-9 px-4 rounded-lg surface-button text-xs font-medium transition-game disabled:opacity-40 shrink-0"
                    >
                      Hire · <span className="font-mono-nums">{formatCompact(def.hireCost)}</span>
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

function Row({ label, value, tone }: { label: string; value: string; tone: "pos" | "neg" }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-mono-nums ${tone === "pos" ? "text-primary" : "text-destructive"}`}>{value}</span>
    </div>
  );
}
