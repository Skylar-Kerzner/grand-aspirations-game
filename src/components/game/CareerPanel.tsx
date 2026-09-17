import { useState } from "react";
import { motion } from "framer-motion";
import { useGame, getTrackTenure, getTrackExperienceDays, getTrackExperienceBonus, getTrackCredential, getStudentLoanHeadroom } from "@/lib/GameContext";
import { formatMoney, formatCompact } from "@/lib/formatters";
import { CAREER_SALARY_RANGE, CAREER_TRACKS, JOBS, WEEK_HOURS, DAYS_PER_YEAR, getCareerTrack, JOB_HOP_SETTLED_DAYS, getTrackPrograms, requiredCredentialLevel, CAREER_VARIANTS, trackPayMultiplier } from "@/lib/gameData";

export default function CareerPanel() {
  const { state, derived, dispatch } = useGame();
  const [showPaths, setShowPaths] = useState(false);
  const loanHeadroom = getStudentLoanHeadroom(state);
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
  const levelWord = ["", "short course", "bachelor's degree", "graduate degree"][neededLevel] || "graduate degree";

  return (
    <div className="space-y-6">
      {/* Current position */}
      <div className="surface-card rounded-xl p-4">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Current position · Level {state.jobIndex + 1} of {JOBS.length}
        </p>
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
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Your offers · Level {state.jobIndex + 2} of {JOBS.length}
                </p>
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

      {/* Interview preparation */}
      <div className="surface-card rounded-xl p-4">
        <div className="flex justify-between items-baseline mb-1">
          <h3 className="text-xs uppercase tracking-widest text-muted-foreground">Interview readiness</h3>
          <span className="font-mono-nums text-sm">
            {state.trainingBudget > 0 ? `${formatMoney(derived.interviewPrepRate)}/day` : "Off"}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground mb-3">
          A steady retainer for coaching, mock interviews and certifications. Keep it running and you warm up
          over about a month — every offer you seek pays up to +35% more. Stop and you cool off again.
        </p>

        <div className="h-3 rounded-full bg-secondary overflow-hidden mb-2">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary/40 via-primary to-primary"
            animate={{ width: `${Math.round(derived.interviewReadiness * 100)}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
        <div className="flex justify-between text-[11px] mb-3">
          <span className="text-muted-foreground">
            {derived.interviewReadiness >= 0.99
              ? "Fully warmed up"
              : state.trainingBudget > 0
                ? "Heating up"
                : "Cooling off"}
            {" · "}{Math.round(derived.interviewReadiness * 100)}% ready
          </span>
          <span className="font-mono-nums text-primary">+{Math.round(derived.offerTrainingBonus * 100)}% on offers</span>
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => dispatch({ type: "SET_TRAINING", amount: state.trainingBudget > 0 ? 0 : derived.interviewPrepRate })}
          className={`w-full h-10 rounded-lg font-semibold text-sm transition-game ${
            state.trainingBudget > 0 ? "surface-button" : "bg-primary text-primary-foreground"
          }`}
        >
          {state.trainingBudget > 0 ? "Stop interview prep" : `Start interview prep — ${formatMoney(derived.interviewPrepRate)}/day`}
        </motion.button>
      </div>

      {/* Career paths — how each industry pays over a working life */}
      <div className="surface-card rounded-xl p-4">
        <div className="flex justify-between items-baseline mb-1">
          <h3 className="text-xs uppercase tracking-widest text-muted-foreground">Career paths</h3>
          <button
            onClick={() => setShowPaths((v) => !v)}
            className="text-[11px] text-primary hover:underline"
          >
            {showPaths ? "Hide" : "Compare all eight"}
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Some fields pay well from the first day and level off. Others ask for years and a graduate degree,
          then pay for the rest of your life. Each also changes your week, your costs and what you understand
          as an owner and investor.
        </p>
        {showPaths && (
          <div className="space-y-3 mt-3">
            {openTracks.map((track) => {
              const shape = track.curve <= -0.5
                ? "Pays from day one, flattens early"
                : track.curve < 0.2
                  ? "Steady climb, moderate ceiling"
                  : track.curve < 0.8
                    ? "Slow start, strong later years"
                    : "Modest for years, then a very high ceiling";
              return (
                <div key={track.id} className="rounded-lg p-3 surface-button">
                  <div className="flex justify-between items-baseline gap-3">
                    <h4 className="font-semibold text-sm">{track.name}</h4>
                    <span className="text-[11px] text-primary shrink-0">{shape}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">{track.outlook}</p>
                  <p className="text-[11px] text-muted-foreground">Mid-career: {track.middle}</p>
                  <ul className="mt-1 space-y-0.5">
                    {track.perks.map((perk) => (
                      <li key={perk} className="text-[11px] text-primary">{perk}</li>
                    ))}
                  </ul>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Study: {getTrackPrograms(track.id).map((p) => p.name).join(" · ")}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Education — short courses, bachelor's and graduate degrees, one per industry */}
      <div>
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3 px-1">Education</h3>
        <p className="text-[11px] text-muted-foreground mb-3 px-1">
          Every industry has a short course, a bachelor's degree and a graduate degree. Junior roles ask for the
          course, senior roles for the bachelor's, and the very top of an industry only opens with graduate study.
          Years worked in an industry can stand in for the first two, never for the graduate degree.
        </p>
        <p className="text-[11px] text-muted-foreground mb-3 px-1">
          You can pay for a program outright or take a student loan: 6% a year, nothing due while you study or
          for six months after, then ten years of payments. You can still borrow {formatCompact(loanHeadroom)}.
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
                          <div className="flex gap-2 shrink-0">
                            <motion.button
                              whileTap={{ scale: 0.97 }}
                              onClick={() => dispatch({ type: "STUDY", majorId: def.id })}
                              disabled={!!state.studying || state.cash < def.cost}
                              className="h-9 px-3 rounded-lg surface-button text-xs font-medium transition-game disabled:opacity-40"
                            >
                              Pay now
                            </motion.button>
                            <motion.button
                              whileTap={{ scale: 0.97 }}
                              onClick={() => dispatch({ type: "STUDY", majorId: def.id, financed: true })}
                              disabled={!!state.studying || loanHeadroom < def.cost}
                              className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium transition-game disabled:opacity-40"
                            >
                              Student loan
                            </motion.button>
                          </div>
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
