import { motion } from "framer-motion";
import { useGame, getTrackTenure, getTrackExperienceDays, getTrackExperienceBonus } from "@/lib/GameContext";
import { formatMoney, formatCompact } from "@/lib/formatters";
import { CAREER_SALARY_RANGE, CAREER_TRACKS, MAJORS, JOBS, WEEK_HOURS, DAYS_PER_YEAR, getCareerTrack, JOB_HOP_SETTLED_DAYS } from "@/lib/gameData";

export default function CareerPanel() {
  const { state, derived, dispatch } = useGame();
  const job = derived.job;
  const next = derived.nextJob;
  const homeTrack = getCareerTrack(job.employer).id;
  const tenure = getTrackTenure(state);
  const years = getTrackExperienceDays(state) / DAYS_PER_YEAR;
  const experienceBonus = getTrackExperienceBonus(state);
  // Every industry stays open — switching simply pays less
  const openTracks = Object.values(CAREER_TRACKS);
  const daysInJob = state.jobHistory.length > 0
    ? Math.floor(state.day) - state.jobHistory[state.jobHistory.length - 1].startDay
    : 0;
  const settled = daysInJob >= JOB_HOP_SETTLED_DAYS;
  const canSeekOffers = !!next && state.careerOffers.length === 0;

  return (
    <div className="space-y-6">
      {/* Current position */}
      <div className="surface-card rounded-xl p-4">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Current position</p>
        <h3 className="text-lg font-semibold tracking-tight">{job.title}</h3>
        <p className="text-[11px] text-muted-foreground">{job.employer}</p>
        <p className="text-[11px] text-primary">{getCareerTrack(job.employer).name}</p>
        <p className="text-[11px] text-muted-foreground mb-3">
          {tenure} {tenure === 1 ? "position" : "positions"} and {years.toFixed(1)} years in this industry.
          {Math.round(experienceBonus * 100) >= 1
            ? ` Years served are adding +${Math.round(experienceBonus * 100)}% to offers in this industry.`
            : " Staying here builds industry experience that raises the pay of offers in this industry."}
        </p>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-muted-foreground">Gross pay at {derived.workHours}h</span>
          <span className="font-mono-nums">{formatMoney(job.dailyPay * (derived.workHours / WEEK_HOURS))}/day</span>
        </div>
        <p className="text-[11px] text-muted-foreground mb-2">
          Market range {formatMoney(JOBS[state.jobIndex].dailyPay * CAREER_SALARY_RANGE.min)}–{formatMoney(JOBS[state.jobIndex].dailyPay * CAREER_SALARY_RANGE.max)}/day
          {" · "}{formatMoney(JOBS[state.jobIndex].dailyPay * CAREER_SALARY_RANGE.min / 8)}–{formatMoney(JOBS[state.jobIndex].dailyPay * CAREER_SALARY_RANGE.max / 8)}/hour
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
              <span>Experience toward the next level</span>
              <span className="font-mono-nums">{Math.floor(state.xp)} / {derived.xpNeeded}</span>
            </div>
            <div className="h-1.5 rounded-full bg-secondary overflow-hidden mb-3">
              <motion.div className="h-full bg-primary" animate={{ width: `${xpPct}%` }} transition={{ duration: 0.3 }} />
            </div>
            {degreeDrag && (
              <p className="text-[11px] text-muted-foreground mb-2">
                Without a degree in this industry, each next step takes longer. Study {trackMajor?.name} below to
                keep climbing at full pace.
              </p>
            )}
            <p className="text-[11px] text-muted-foreground mb-2">
              Every industry is open to you: {openTracks.map((t) => t.name).join(", ")}. Leaving your own costs you
              pay — more so into a distant field, less if you hold its degree.
            </p>
            <p className="text-[11px] text-muted-foreground mb-2">
              {settled
                ? "You have been here long enough that employers take you seriously — offers come in at full pay."
                : `Changing jobs too often reads as restless: offers are discounted until you have a year in a post (${Math.max(0, JOB_HOP_SETTLED_DAYS - daysInJob)} more days).`}
            </p>
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
                <p className="text-[11px] text-muted-foreground">
                  Offers arrive in no particular order. The best-paid job today is not always the best career.
                </p>
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
                    <span className="block text-[11px] text-primary mt-1">{getCareerTrack(offer.employer).name}</span>
                    <span className="block text-[11px] text-muted-foreground">
                      {getCareerTrack(offer.employer).outlook}
                    </span>
                    <span className="block text-[11px] text-muted-foreground mt-1">
                      {getCareerTrack(offer.employer).id === homeTrack
                        ? "Same industry — your years here are paid for in this offer."
                        : "A change of industry — you start over as an outsider, and the pay reflects it."}
                    </span>
                  </button>
                ))}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => dispatch({ type: "GENERATE_JOB_OFFERS" })}
                  disabled={state.xp < derived.xpNeeded}
                  className="w-full h-9 rounded-lg surface-button text-xs transition-game disabled:opacity-40"
                >
                  {state.xp >= derived.xpNeeded
                    ? "Search again"
                    : `Search again at ${Math.ceil(derived.xpNeeded - state.xp)} more experience`}
                </motion.button>
              </div>
            )}
          </>
        ) : (
          <p className="text-xs text-primary">Top of the ladder.</p>
        )}
      </div>

      {/* Time pointer */}
      <div className="surface-card rounded-xl p-4">
        <div className="flex justify-between items-baseline mb-1">
          <h3 className="text-xs uppercase tracking-widest text-muted-foreground">Your time</h3>
          <span className="font-mono-nums text-sm">{derived.workHours}h work · {state.studyHours}h school</span>
        </div>
        <p className="text-[11px] text-muted-foreground">
          You split your week between your job, school and your ventures from the Time tab.
          Extra shifts are always available on top.
        </p>
      </div>

      {/* Education — pick a major, it opens a career path */}
      <div>
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3 px-1">Education</h3>
        <p className="text-[11px] text-muted-foreground mb-3 px-1">
          Each major leads to a different career path. Study any of them, in any order.
        </p>
        <div className="space-y-3">
          {MAJORS.map((def) => {
            const completed = state.majors.includes(def.id);
            const inProgress = state.studying?.majorId === def.id;
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
                      onClick={() => dispatch({ type: "STUDY", majorId: def.id })}
                      disabled={!!state.studying || state.cash < def.cost}
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

    </div>
  );
}
