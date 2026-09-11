import { motion } from "framer-motion";
import { useGame } from "@/lib/GameContext";
import { formatMoney, formatCompact } from "@/lib/formatters";
import { EDUCATION, JOBS } from "@/lib/gameData";

export default function CareerPanel() {
  const { state, derived, dispatch } = useGame();
  const job = derived.job;
  const next = derived.nextJob;
  const xpPct = Math.min(100, (state.xp / (derived.xpNeeded || 1)) * 100);
  const educationOk = next ? state.education >= next.education : true;
  const canPromote = !!next && state.xp >= derived.xpNeeded && educationOk;

  return (
    <div className="space-y-6">
      {/* Current position */}
      <div className="surface-card rounded-xl p-4">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Current position</p>
        <h3 className="text-lg font-semibold tracking-tight">{job.title}</h3>
        <p className="text-[11px] text-muted-foreground mb-3">{job.employer}</p>
        <div className="flex justify-between text-sm mb-3">
          <span className="text-muted-foreground">Gross pay</span>
          <span className="font-mono-nums">{formatMoney(job.dailyPay)}/day</span>
        </div>

        {state.studying ? (
          <p className="text-xs text-muted-foreground">
            Studying {EDUCATION[state.studying.level].name} · {Math.ceil(state.studying.daysLeft)} days left.
            No salary while enrolled.
          </p>
        ) : next ? (
          <>
            <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
              <span>Experience toward {next.title}</span>
              <span className="font-mono-nums">{Math.floor(state.xp)} / {derived.xpNeeded}</span>
            </div>
            <div className="h-1.5 rounded-full bg-secondary overflow-hidden mb-3">
              <motion.div className="h-full bg-primary" animate={{ width: `${xpPct}%` }} transition={{ duration: 0.3 }} />
            </div>
            {!educationOk && (
              <p className="text-[11px] text-muted-foreground mb-2">
                Requires {EDUCATION[next.education].name}.
              </p>
            )}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => dispatch({ type: "PROMOTE" })}
              disabled={!canPromote}
              className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-semibold text-sm transition-game disabled:opacity-40"
            >
              Accept promotion to {next.title}
            </motion.button>
          </>
        ) : (
          <p className="text-xs text-primary">Top of the ladder.</p>
        )}
      </div>

      {/* Savings rate */}
      <div className="surface-card rounded-xl p-4">
        <div className="flex justify-between items-baseline mb-1">
          <h3 className="text-xs uppercase tracking-widest text-muted-foreground">Savings rate</h3>
          <span className="font-mono-nums text-sm">{Math.round(state.savingsRate * 100)}%</span>
        </div>
        <p className="text-[11px] text-muted-foreground mb-3">
          What you don't bank you spend on yourself — which buys energy and contacts.
          Focus multiplier {derived.focus.toFixed(2)}x on experience gained.
        </p>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={Math.round(state.savingsRate * 100)}
          onChange={(e) => dispatch({ type: "SET_SAVINGS_RATE", rate: Number(e.target.value) / 100 })}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-[11px] text-muted-foreground mt-2">
          <span>Banking {formatMoney(Math.max(0, derived.salaryPerDay - derived.livingCosts) * state.savingsRate)}/day</span>
          <span>Living costs {formatMoney(derived.livingCosts)}/day</span>
        </div>
      </div>

      {/* Education */}
      <div>
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3 px-1">Education</h3>
        <div className="space-y-3">
          {EDUCATION.map((def, i) => {
            const completed = state.education >= i;
            const isNext = i === state.education + 1;
            const inProgress = state.studying?.level === i;
            return (
              <div key={def.id} className={`surface-card rounded-xl p-4 ${completed || isNext || inProgress ? "" : "opacity-60"}`}>
                <div className="flex justify-between items-center gap-3">
                  <div className="min-w-0">
                    <h4 className="font-semibold text-sm">{def.name}</h4>
                    <p className="text-[11px] text-muted-foreground">{def.description}</p>
                    {!completed && (
                      <p className="text-[11px] text-muted-foreground font-mono-nums">
                        {formatCompact(def.cost)} · {def.days} days
                      </p>
                    )}
                  </div>
                  {completed ? (
                    <span className="text-xs text-primary shrink-0">Completed</span>
                  ) : inProgress ? (
                    <span className="text-xs text-muted-foreground shrink-0">
                      {Math.ceil(state.studying!.daysLeft)}d left
                    </span>
                  ) : (
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => dispatch({ type: "STUDY", level: i })}
                      disabled={!isNext || !!state.studying || state.cash < def.cost}
                      className="h-9 px-4 rounded-lg surface-button text-xs font-medium transition-game disabled:opacity-40 shrink-0"
                    >
                      Enroll
                    </motion.button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ladder */}
      <div>
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3 px-1">Career ladder</h3>
        <div className="surface-card rounded-xl p-4 space-y-2">
          {JOBS.map((j, i) => (
            <div
              key={j.id}
              className={`flex justify-between text-sm py-1 ${i < JOBS.length - 1 ? "border-b border-border" : ""}`}
            >
              <div>
                <p className={i <= state.jobIndex ? "text-foreground" : "text-muted-foreground"}>{j.title}</p>
                <p className="text-[11px] text-muted-foreground">{j.employer}</p>
              </div>
              <span className="font-mono-nums text-xs text-muted-foreground self-center">
                {formatMoney(j.dailyPay)}/day
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
