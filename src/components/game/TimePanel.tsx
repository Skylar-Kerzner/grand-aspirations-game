import { useGame, getWorkHours, getTotalBusinessHours, getBusinessAttentionOf, getTimeBudget, getBusinessEffectiveROI } from "@/lib/GameContext";
import { BUSINESSES, MAJORS, WEEK_HOURS, BUSINESS_ATTENTION_FULL_HOURS, getBusinessCapital } from "@/lib/gameData";
import { formatMoney } from "@/lib/formatters";

export default function TimePanel() {
  const { state, derived, dispatch } = useGame();
  const owned = BUSINESSES.filter((b) => (state.businesses[b.id]?.level || 0) > 0);
  const bizHours = getTotalBusinessHours(state);
  const budget = getTimeBudget(state);
  const lifestyleHours = budget - WEEK_HOURS;
  const workHours = getWorkHours(state);
  const freeHours = Math.max(0, budget - workHours - state.studyHours - bizHours);

  return (
    <div className="space-y-6">
      {/* Where the money lands */}
      <div className="surface-card rounded-xl p-4">
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Where your week lands</h3>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Job</span>
            <span className="font-mono-nums">{formatMoney(derived.salaryPerDay)}/day</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Ventures</span>
            <span className="font-mono-nums">{formatMoney(derived.businessPerDay)}/day</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Investments</span>
            <span className="font-mono-nums">{formatMoney(derived.investmentPerDay)}/day</span>
          </div>
          <div className="flex justify-between border-t border-border pt-1">
            <span className="text-muted-foreground">Total income</span>
            <span className="font-mono-nums text-primary">{formatMoney(derived.incomePerDay)}/day</span>
          </div>
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>Living costs, training, loans</span>
            <span className="font-mono-nums">
              -{formatMoney(derived.livingCosts + derived.trainingCost + derived.operatingCosts + derived.loanPayments + derived.ccPaymentPerDay)}/day
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Net</span>
            <span className={`font-mono-nums font-semibold ${derived.netPerDay >= 0 ? "text-primary" : "text-destructive"}`}>
              {derived.netPerDay >= 0 ? "+" : ""}{formatMoney(derived.netPerDay)}/day
            </span>
          </div>
        </div>
      </div>

      {/* The week */}
      <div className="surface-card rounded-xl p-4">
        <div className="flex justify-between items-baseline mb-1">
          <h3 className="text-xs uppercase tracking-widest text-muted-foreground">Your {budget} hours</h3>
          <span className="font-mono-nums text-sm">{freeHours}h free</span>
        </div>
        <p className="text-[11px] text-muted-foreground mb-1">
          {workHours}h at your job{state.studying ? ` · ${state.studyHours}h school` : ""} · {bizHours}h in your ventures
        </p>
        <p className="text-[11px] text-muted-foreground mb-3">
          Pay scales with the hours you work. Your ventures only reach their full return on the hours you
          personally put in.
          {lifestyleHours > 0
            ? ` Your lifestyle buys back ${lifestyleHours}h a week — better housing, food, clothing and a chauffeur.`
            : " A finer lifestyle buys hours back: staff, services and convenience."}
        </p>
        {state.studying && (
          <>
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">School</label>
            <input
              type="range"
              min={0}
              max={budget - bizHours}
              step={4}
              value={state.studyHours}
              onChange={(e) => dispatch({ type: "SET_STUDY_HOURS", hours: Number(e.target.value) })}
              className="w-full accent-primary"
            />
            <p className="text-[11px] text-muted-foreground mt-1 mb-3">
              {MAJORS.find((m) => m.id === state.studying?.majorId)?.name} ·{" "}
              {state.studyHours > 0
                ? `${Math.ceil(state.studying.daysLeft / ((state.studyHours / WEEK_HOURS) * derived.schoolProgress))} days left at this pace`
                : "Paused — give your classes some hours"}
            </p>
          </>
        )}
        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
          <div className="h-full bg-primary" style={{ width: `${(workHours / budget) * 100}%` }} />
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">
          {workHours}h at your job — everything you don't give to school or your ventures
        </p>
      </div>

      {/* Ventures */}
      <div>
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3 px-1">Time in your ventures</h3>
        <p className="text-[11px] text-muted-foreground mb-3 px-1">
          A venture you never visit limps along at a quarter of its potential — the first hour jumps it to half.
          {BUSINESS_ATTENTION_FULL_HOURS} takes it to full swing. A little time in each of several ventures often
          beats everything in one.
        </p>
        <div className="space-y-3">
          {owned.map((def) => {
            const hours = state.businessHours[def.id] || 0;
            const attention = getBusinessAttentionOf(state, def.id);
            return (
              <div key={def.id} className="surface-card rounded-xl p-4">
                <div className="flex justify-between items-baseline mb-1">
                  <h4 className="font-semibold text-sm truncate pr-2">{def.name}</h4>
                  <span className="font-mono-nums text-xs text-muted-foreground shrink-0">
                    {hours}h · {Math.round(attention * 100)}%
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mb-1">
                  {formatMoney(getBusinessCapital(def, state.businesses[def.id]?.level || 0))} invested ·{" "}
                  <span className={getBusinessEffectiveROI(state, def.id) >= 0.15 ? "text-primary" : ""}>
                    {(getBusinessEffectiveROI(state, def.id) * 100).toFixed(0)}% annual return
                  </span>{" "}
                  at {hours}h a week
                </p>
                <input
                  type="range"
                  min={0}
                  max={budget - state.studyHours - (bizHours - hours)}
                  step={1}
                  value={hours}
                  onChange={(e) => dispatch({ type: "SET_BUSINESS_HOURS", id: def.id, hours: Number(e.target.value) })}
                  className="w-full accent-primary"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  {hours >= BUSINESS_ATTENTION_FULL_HOURS
                    ? "It has your full attention."
                    : `${BUSINESS_ATTENTION_FULL_HOURS - hours}h more takes it to full swing.`}
                </p>
              </div>
            );
          })}
          {owned.length === 0 && (
            <p className="text-[11px] text-muted-foreground px-1">
              You don't run any ventures yet. Once you open one, its hours live here.
            </p>
          )}
        </div>
      </div>

      {/* Training budget */}
      <div className="surface-card rounded-xl p-4">
        <div className="flex justify-between items-baseline mb-1">
          <h3 className="text-xs uppercase tracking-widest text-muted-foreground">Training budget</h3>
          <span className="font-mono-nums text-sm">{formatMoney(state.trainingBudget)}/day</span>
        </div>
        <p className="text-[11px] text-muted-foreground mb-3">
          Courses, certifications, coaching and conferences for your career. This raises career progress to{" "}
          {derived.focus.toFixed(2)}×. Your Lifestyle choices also improve career and school progress.
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
    </div>
  );
}
