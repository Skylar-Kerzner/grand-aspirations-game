import { motion } from "framer-motion";
import { useGame } from "@/lib/GameContext";
import { formatMoney, formatCompact } from "@/lib/formatters";
import { CAREER_SALARY_RANGE, EDUCATION, JOBS, WEEK_HOURS } from "@/lib/gameData";

export default function CareerPanel() {
  const { state, derived, dispatch } = useGame();
  const job = derived.job;
  const next = derived.nextJob;
  const xpPct = Math.min(100, (state.xp / (derived.xpNeeded || 1)) * 100);
  const educationOk = next ? state.education >= next.education : true;
  const canSeekOffers = !!next && state.xp >= derived.xpNeeded && educationOk && state.careerOffers.length === 0;

  return (
    <div className="space-y-6">
      {/* Current position */}
      <div className="surface-card rounded-xl p-4">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Current position</p>
        <h3 className="text-lg font-semibold tracking-tight">{job.title}</h3>
        <p className="text-[11px] text-muted-foreground mb-3">{job.employer}</p>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-muted-foreground">Gross pay at {derived.workHours}h</span>
          <span className="font-mono-nums">{formatMoney(job.dailyPay * (derived.workHours / WEEK_HOURS))}/day</span>
        </div>
        <p className="text-[11px] text-muted-foreground mb-2">
          Market range {formatMoney(JOBS[state.jobIndex].dailyPay * CAREER_SALARY_RANGE.min)}–{formatMoney(JOBS[state.jobIndex].dailyPay * CAREER_SALARY_RANGE.max)}/day
        </p>
        {job.perfFee && (
          <p className="text-[11px] text-primary mb-2">
            Plus 2% a year on the portfolio and 20% of its gains.
          </p>
        )}
        {state.payUntil > state.day && (
          <p className="text-[11px] text-muted-foreground mb-2">
            {state.payMult > 1 ? "Raise" : "Pay cut"} in effect: pay ×{state.payMult.toFixed(2)} for{" "}
            {Math.ceil(state.payUntil - state.day)} more days.
          </p>
        )}

        {next ? (
          <>
            <div className="flex justify-between text-[11px] text-muted-foreground mb-1 mt-3">
              <span>Experience toward {next.title}</span>
              <span className="font-mono-nums">{Math.floor(state.xp)} / {derived.xpNeeded}</span>
            </div>
            <div className="h-1.5 rounded-full bg-secondary overflow-hidden mb-3">
              <motion.div className="h-full bg-primary" animate={{ width: `${xpPct}%` }} transition={{ duration: 0.3 }} />
            </div>
            {!educationOk && (
              <p className="text-[11px] text-muted-foreground mb-2">Requires {EDUCATION[next.education].name}.</p>
            )}
            {state.careerOffers.length === 0 ? (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => dispatch({ type: "GENERATE_JOB_OFFERS" })}
                disabled={!canSeekOffers}
                className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-semibold text-sm transition-game disabled:opacity-40"
              >
                Seek offers for the next career level
              </motion.button>
            ) : (
              <div className="space-y-2 mt-3">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Your offers</p>
                {state.careerOffers.map((offer, index) => (
                  <button
                    key={`${offer.employer}-${index}`}
                    onClick={() => dispatch({ type: "ACCEPT_JOB_OFFER", index })}
                    className="w-full surface-button rounded-lg p-3 text-left transition-game"
                  >
                    <span className="flex justify-between gap-3 text-sm font-semibold">
                      <span>{offer.title}</span>
                      <span className="font-mono-nums text-primary shrink-0">{formatMoney(offer.dailyPay)}/day</span>
                    </span>
                    <span className="text-[11px] text-muted-foreground">{offer.employer}</span>
                  </button>
                ))}
                <p className="text-[10px] text-muted-foreground text-center">Accept one, or earn the next experience target to search again.</p>
              </div>
            )}
          </>
        ) : (
          <p className="text-xs text-primary">Top of the ladder.</p>
        )}
      </div>

      {/* Hours */}
      <div className="surface-card rounded-xl p-4">
        <div className="flex justify-between items-baseline mb-1">
          <h3 className="text-xs uppercase tracking-widest text-muted-foreground">Your 40 hours</h3>
          <span className="font-mono-nums text-sm">{derived.workHours}h work · {state.studyHours}h school</span>
        </div>
        <p className="text-[11px] text-muted-foreground mb-3">
          Pay scales with the hours you work. Classes only progress with the hours you give them.
          Extra shifts are always available on top.
        </p>
        <input
          type="range"
          min={0}
          max={WEEK_HOURS}
          step={4}
          value={state.studyHours}
          onChange={(e) => dispatch({ type: "SET_STUDY_HOURS", hours: Number(e.target.value) })}
          className="w-full accent-primary"
        />
        {state.studying && (
          <p className="text-[11px] text-muted-foreground mt-2">
            {EDUCATION[state.studying.level].name} ·{" "}
            {state.studyHours > 0
              ? `${Math.ceil(state.studying.daysLeft / ((state.studyHours / WEEK_HOURS) * derived.schoolProgress))} days left at this pace`
              : "paused — give it some hours"}
          </p>
        )}
      </div>

      {/* Training budget */}
      <div className="surface-card rounded-xl p-4">
        <div className="flex justify-between items-baseline mb-1">
          <h3 className="text-xs uppercase tracking-widest text-muted-foreground">Training budget</h3>
          <span className="font-mono-nums text-sm">{formatMoney(state.trainingBudget)}/day</span>
        </div>
        <p className="text-[11px] text-muted-foreground mb-3">
          Courses, certifications, coaching and conferences. This raises career progress to {derived.focus.toFixed(2)}×.
          Your Lifestyle choices also improve career and school progress.
        </p>
        <input
          type="range"
          min={0}
          max={Math.max(50, Math.round(Math.max(derived.salaryPerDay, 50) * 1.5))}
          step={1}
          value={Math.min(state.trainingBudget, Math.max(50, Math.round(Math.max(derived.salaryPerDay, 50) * 1.5)))}
          onChange={(e) => dispatch({ type: "SET_TRAINING", amount: Number(e.target.value) })}
          className="w-full accent-primary"
        />
      </div>

      {/* Education */}
      <div>
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3 px-1">Education</h3>
        <div className="space-y-3">
          {EDUCATION.map((def, i) => {
            const completed = state.education >= i;
            const isNext = i === state.education + 1;
            const inProgress = state.studying?.level === i;
            if (i > state.education + 1) return null;
            return (
              <div key={def.id} className="surface-card rounded-xl p-4">
                <div className="flex justify-between items-center gap-3">
                  <div className="min-w-0">
                    <h4 className="font-semibold text-sm">{def.name}</h4>
                    <p className="text-[11px] text-muted-foreground">{def.description}</p>
                    {!completed && (
                      <p className="text-[11px] text-muted-foreground font-mono-nums">
                        {formatCompact(def.cost)} · {def.days} full-time days
                      </p>
                    )}
                  </div>
                  {completed ? (
                    <span className="text-xs text-primary shrink-0">Completed</span>
                  ) : inProgress ? (
                    <span className="text-xs text-muted-foreground shrink-0">
                      {Math.ceil(state.studying?.daysLeft || 0)}d of work left
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

      {/* Ladder — only what you can see from here */}
      <div>
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3 px-1">Career ladder</h3>
        <div className="surface-card rounded-xl p-4 space-y-2">
          {JOBS.slice(0, state.jobIndex + 3).map((j, i) => (
            <div
              key={j.id}
              className={`flex justify-between text-sm py-1 ${i < Math.min(JOBS.length, state.jobIndex + 3) - 1 ? "border-b border-border" : ""}`}
            >
              <div>
                <p className={i <= state.jobIndex ? "text-foreground" : "text-muted-foreground"}>{j.title}</p>
                <p className="text-[11px] text-muted-foreground">{j.employer}</p>
              </div>
              <span className="font-mono-nums text-xs text-muted-foreground self-center">
                {i === state.jobIndex
                  ? `${formatMoney(job.dailyPay)}/day`
                  : `${formatMoney(j.dailyPay * CAREER_SALARY_RANGE.min)}–${formatMoney(j.dailyPay * CAREER_SALARY_RANGE.max)}`}
              </span>
            </div>
          ))}
          {state.jobIndex + 3 < JOBS.length && (
            <p className="text-[11px] text-muted-foreground pt-1">More opens up as you climb.</p>
          )}
        </div>
      </div>
    </div>
  );
}
