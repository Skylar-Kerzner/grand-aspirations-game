import { motion } from "framer-motion";
import { useGame } from "@/lib/GameContext";
import { formatMoney, formatCompact } from "@/lib/formatters";
import {
  EDUCATION, JOBS, WEEK_HOURS,
  HOUSING_OPTIONS, FOOD_OPTIONS, CLOTHING_OPTIONS,
} from "@/lib/gameData";
import type { LifestyleOption } from "@/lib/gameData";

export default function CareerPanel() {
  const { state, derived, dispatch } = useGame();
  const job = derived.job;
  const next = derived.nextJob;
  const xpPct = Math.min(100, (state.xp / (derived.xpNeeded || 1)) * 100);
  const educationOk = next ? state.education >= next.education : true;
  const canPromote = !!next && state.xp >= derived.xpNeeded && educationOk;
  const ownsHouse = (state.assets["house"] || 0) > 0;
  const hasCar = (state.assets["car"] || 0) > 0;

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
              ? `${Math.ceil(state.studying.daysLeft / (state.studyHours / WEEK_HOURS))} days left at this pace`
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
          Courses, certifications, coaching and conferences. Money spent here turns into experience —
          you learn {derived.focus.toFixed(2)}x as fast as someone who spends nothing and eats badly.
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

      {/* Lifestyle */}
      <div>
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-1 px-1">Cost of living</h3>
        <p className="text-[11px] text-muted-foreground mb-3 px-1">
          {formatMoney(derived.livingCosts)}/day all in. You always need somewhere to sleep, food and clothes —
          the only way to pay nothing for housing is to live in your car.
        </p>
        <div className="space-y-3">
          <LifestyleRow
            title="Housing"
            options={HOUSING_OPTIONS}
            current={ownsHouse ? "" : state.housing}
            disabledNote={ownsHouse ? "You own your home — no rent to pay." : undefined}
            isDisabled={(o) => !!o.requiresCar && !hasCar}
            onPick={(id) => dispatch({ type: "SET_LIFESTYLE", slot: "housing", id })}
          />
          <LifestyleRow
            title="Food"
            options={FOOD_OPTIONS}
            current={state.food}
            onPick={(id) => dispatch({ type: "SET_LIFESTYLE", slot: "food", id })}
          />
          <LifestyleRow
            title="Clothing"
            options={CLOTHING_OPTIONS}
            current={state.clothing}
            onPick={(id) => dispatch({ type: "SET_LIFESTYLE", slot: "clothing", id })}
          />
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
                      {Math.ceil(state.studying!.daysLeft)}d of work left
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
                {formatMoney(j.dailyPay)}/day
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

function LifestyleRow({
  title, options, current, onPick, disabledNote, isDisabled,
}: {
  title: string;
  options: LifestyleOption[];
  current: string;
  onPick: (id: string) => void;
  disabledNote?: string;
  isDisabled?: (o: LifestyleOption) => boolean;
}) {
  return (
    <div className="surface-card rounded-xl p-4">
      <div className="flex justify-between items-baseline mb-2">
        <h4 className="text-sm font-semibold">{title}</h4>
        {disabledNote && <span className="text-[11px] text-primary">{disabledNote}</span>}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const off = isDisabled?.(o) || !!disabledNote;
          const active = o.id === current;
          return (
            <button
              key={o.id}
              onClick={() => !off && onPick(o.id)}
              disabled={off}
              className={`px-3 py-2 rounded-lg text-left text-[11px] transition-game disabled:opacity-40 ${
                active ? "bg-primary/15 text-primary" : "surface-button"
              }`}
            >
              <span className="block font-medium">{o.name}</span>
              <span className="block font-mono-nums opacity-80">
                {formatMoney(o.cost)}/day
                {o.focus !== 0 && ` · focus ${o.focus > 0 ? "+" : ""}${Math.round(o.focus * 100)}%`}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
