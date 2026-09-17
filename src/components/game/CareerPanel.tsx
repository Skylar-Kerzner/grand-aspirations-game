import { motion } from "framer-motion";
import { useGame, getTrackTenure, getTrackExperienceDays, getTrackExperienceBonus, getTrackCredential } from "@/lib/GameContext";
import { formatMoney, formatCompact } from "@/lib/formatters";
import { CAREER_SALARY_RANGE, CAREER_TRACKS, JOBS, WEEK_HOURS, DAYS_PER_YEAR, getCareerTrack, JOB_HOP_SETTLED_DAYS, getTrackPrograms, requiredCredentialLevel } from "@/lib/gameData";

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
  const neededLevel = requiredCredentialLevel(state.jobIndex + 1);
  const qualifiedTracks = openTracks.filter((t) => getTrackCredential(state, t.id).effective >= neededLevel);
  const canSeekOffers = !!next && state.careerOffers.length === 0 && qualifiedTracks.length > 0;
  const levelWord = ["", "short course", "diploma", "degree"][neededLevel] || "degree";

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
            <p className="text-[11px] text-muted-foreground mb-2 mt-3">
              {neededLevel === 0
                ? `Every industry is open to you: ${openTracks.map((t) => t.name).join(", ")}. Leaving your own costs you pay — more so into a distant field, less if you hold its degree.`
                : qualifiedTracks.length > 0
                  ? `At this level, employers want a ${levelWord} in their industry — or years already served in it. You qualify in: ${qualifiedTracks.map((t) => t.name).join(", ")}.`
                  : `No industry will take you at this level yet — employers want a ${levelWord} in their field, or years already served in it. Study below, or stay where you are and build the years.`}
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
                Seek a new job
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
                  className="w-full h-9 rounded-lg surface-button text-xs transition-game"
                >
                  Search again
                </motion.button>
              </div>
            )}
          </>
        ) : (
          <p className="text-xs text-primary">Top of the ladder.</p>
        )}
      </div>

      {/* Training budget */}
      <div className="surface-card rounded-xl p-4">
        <div className="flex justify-between items-baseline mb-1">
          <h3 className="text-xs uppercase tracking-widest text-muted-foreground">Training budget</h3>
          <span className="font-mono-nums text-sm">{formatMoney(state.trainingBudget)}/day</span>
        </div>
        <p className="text-[11px] text-muted-foreground mb-1">
          Courses, certifications, coaching and conferences for your career. They build up over weeks of
          sustained spending — every offer you seek out pays +{Math.round(derived.offerTrainingBonus * 100)}%
          (up to +35%). Ease off and the edge fades.
        </p>
        <p className="text-[11px] text-muted-foreground mb-3">
          {derived.offerTrainingBonus >= 0.349
            ? "You are at the full boost."
            : `Effective spend ${formatMoney(state.trainingMomentum)}/day — it takes about $140/day held for a month to reach the cap.`}
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

      {/* Education — short courses, diplomas and degrees, one per industry */}
      <div>
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3 px-1">Education</h3>
        <p className="text-[11px] text-muted-foreground mb-3 px-1">
          Every industry has a short course, a diploma and a full degree. Junior roles ask for the course,
          senior roles for the diploma, and the very top of an industry only opens with its degree. Years
          worked in an industry can stand in for the first two, never for the degree.
        </p>
        <div className="space-y-4">
          {openTracks.map((track) => {
            const programs = getTrackPrograms(track.id);
            const cred = getTrackCredential(state, track.id);
            return (
              <div key={track.id} className="surface-card rounded-xl p-4">
                <div className="flex justify-between items-baseline gap-3 mb-1">
                  <h4 className="font-semibold text-sm">{track.name}</h4>
                  <span className="text-[11px] text-primary shrink-0">
                    {cred.effective === 0 ? "No standing" : `Counts as level ${cred.effective} of 3`}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mb-3">
                  {cred.years >= 1
                    ? `${cred.years.toFixed(1)} years worked in this industry.`
                    : "Study here, or work in the industry to build standing."}
                </p>
                <div className="space-y-2">
                  {programs.map((def) => {
                    const completed = state.majors.includes(def.id);
                    const inProgress = state.studying?.majorId === def.id;
                    return (
                      <div key={def.id} className="flex justify-between items-center gap-3">
                        <div className="min-w-0">
                          <p className="text-sm">{def.name}</p>
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
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
