import { useGame, getWorkHours, getTotalBusinessHours, getBusinessAttentionOf } from "@/lib/GameContext";
import { BUSINESSES, WEEK_HOURS, BUSINESS_ATTENTION_FULL_HOURS } from "@/lib/gameData";
import { formatMoney } from "@/lib/formatters";

export default function TimePanel() {
  const { state, derived, dispatch } = useGame();
  const owned = BUSINESSES.filter((b) => (state.businesses[b.id]?.level || 0) > 0);
  const bizHours = getTotalBusinessHours(state);
  const workHours = getWorkHours(state);
  const freeHours = Math.max(0, WEEK_HOURS - workHours - state.studyHours - bizHours);

  return (
    <div className="space-y-6">
      {/* The week */}
      <div className="surface-card rounded-xl p-4">
        <div className="flex justify-between items-baseline mb-1">
          <h3 className="text-xs uppercase tracking-widest text-muted-foreground">Your 40 hours</h3>
          <span className="font-mono-nums text-sm">{freeHours}h free</span>
        </div>
        <p className="text-[11px] text-muted-foreground mb-1">
          {workHours}h at your job · {state.studyHours}h school · {bizHours}h in your ventures
        </p>
        <p className="text-[11px] text-muted-foreground mb-3">
          Pay scales with the hours you work. Classes only progress with the hours you give them.
          Your ventures only reach their full return on the hours you personally put in.
        </p>
        <label className="text-[10px] uppercase tracking-widest text-muted-foreground">School</label>
        <input
          type="range"
          min={0}
          max={WEEK_HOURS - bizHours}
          step={4}
          value={state.studyHours}
          onChange={(e) => dispatch({ type: "SET_STUDY_HOURS", hours: Number(e.target.value) })}
          className="w-full accent-primary"
        />
        {state.studying && (
          <p className="text-[11px] text-muted-foreground mt-1 mb-3">
            {state.studyHours > 0
              ? "Studying at this pace"
              : "Paused — give your classes some hours"}
          </p>
        )}
        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
          <div className="h-full bg-primary" style={{ width: `${(workHours / WEEK_HOURS) * 100}%` }} />
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">
          {workHours}h at your job — everything you don't give to school or your ventures
        </p>
      </div>

      {/* Ventures */}
      <div>
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3 px-1">Time in your ventures</h3>
        <p className="text-[11px] text-muted-foreground mb-3 px-1">
          {BUSINESS_ATTENTION_FULL_HOURS} hours a week takes a venture to full swing. Spread thin, every venture
          you own runs at half steam.
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
                <input
                  type="range"
                  min={0}
                  max={WEEK_HOURS - state.studyHours - (bizHours - hours)}
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
