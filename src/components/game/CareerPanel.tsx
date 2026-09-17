import { useState } from "react";
import { motion } from "framer-motion";
import { useGame, getTrackTenure, getTrackExperienceDays, getTrackExperienceBonus, getTrackCredential, getStudyFunding, getStudyPrereqNote } from "@/lib/GameContext";
import { formatMoney, formatCompact } from "@/lib/formatters";
import { CAREER_SALARY_RANGE, CAREER_TRACKS, JOBS, WEEK_HOURS, DAYS_PER_YEAR, getCareerTrack, JOB_HOP_SETTLED_DAYS, PROMOTION_MIN_DAYS, getTrackPrograms, workplaceImage } from "@/lib/gameData";
import { getImage } from "@/lib/gameImages";

export default function CareerPanel() {
  const { state, derived, dispatch } = useGame();
  const [showPaths, setShowPaths] = useState(false);
  
  const job = derived.job;
  
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
  const seasoned = daysInJob >= PROMOTION_MIN_DAYS;

  return (
    <div className="space-y-6">
      {/* Current position */}
      <div className="surface-card rounded-xl overflow-hidden">
        <div className="relative aspect-[16/10] w-full">
          <img
            src={getImage(workplaceImage(job.employer, state.jobIndex))}
            alt={`The room you work in as ${job.title} at ${job.employer}`}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent" />
        </div>
        <div className="p-4 -mt-10 relative">
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
          <span className="text-muted-foreground">Gross pay at 40h</span>
          <span className="font-mono-nums">{formatMoney(job.dailyPay)}/day</span>
        </div>
        {derived.workHours !== WEEK_HOURS && (
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Gross pay at your {derived.workHours}h</span>
            <span className="font-mono-nums">{formatMoney(job.dailyPay * (derived.workHours / WEEK_HOURS))}/day</span>
          </div>
        )}
        <p className="text-[11px] text-muted-foreground mb-2">
          Offers below are quoted at 40h — compare them with the 40h line above.
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

        <>
            <p className="text-[11px] text-muted-foreground mb-2 mt-3">
              Staying in {getCareerTrack(job.employer).name} usually means the next rank up, sometimes a sideways
              move, occasionally two rungs at once. Any other industry starts you at the rank your schooling and
              years there support — which can be well below where you stand now.
            </p>
            <p className="text-[11px] text-muted-foreground mb-2">
              {seasoned
                ? "You have served long enough here for employers to consider you for a higher rank."
                : `Nobody is promoted every morning: until you have ${PROMOTION_MIN_DAYS} days in this post (${Math.max(0, PROMOTION_MIN_DAYS - daysInJob)} to go), offers come at the rank you already hold. Schooling in an industry also caps how high it will hire you.`}
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
                className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-semibold text-sm transition-game disabled:opacity-40"
              >
                Seek a new job
              </motion.button>
            ) : (
              <div className="space-y-2 mt-3">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Your offers</p>
                <p className="text-[11px] text-muted-foreground">
                  Offers arrive in no particular order, at whatever rank each industry would hire you into.
                  The best-paid job today is not always the best career.
                </p>
                {state.careerOffers.map((offer, index) => {
                  const level = offer.level ?? state.jobIndex + 1;
                  const step = level - state.jobIndex;
                  const stepWord = step >= 2 ? "Double step up" : step === 1 ? "A step up" : step === 0 ? "A sideways move" : `A step down · ${-step} ${-step === 1 ? "rank" : "ranks"}`;
                  const delta40 = offer.dailyPay - job.dailyPay;
                  return (
                    <button
                      key={`${offer.employer}-${index}`}
                      onClick={() => dispatch({ type: "ACCEPT_JOB_OFFER", index })}
                      className="w-full surface-button rounded-lg overflow-hidden text-left transition-game"
                    >
                      <span className="block relative aspect-[16/6] w-full">
                        <img
                          src={getImage(workplaceImage(offer.employer, level))}
                          alt={`The room you would work in as ${offer.title} at ${offer.employer}`}
                          loading="lazy"
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                        <span className="absolute inset-0 bg-gradient-to-t from-surface to-transparent" />
                      </span>
                      <span className="block p-3">
                      <span className="flex justify-between gap-3 text-sm font-semibold">
                        <span>{offer.title}</span>
                        <span className="font-mono-nums text-primary shrink-0 text-right">
                          {formatMoney(offer.dailyPay)}/day at 40h
                          {derived.workHours !== WEEK_HOURS && (
                            <span className="block text-[11px] font-normal text-muted-foreground">
                              {formatMoney(offer.dailyPay * (derived.workHours / WEEK_HOURS))}/day at your {derived.workHours}h
                            </span>
                          )}
                        </span>
                      </span>
                      <span className="text-[11px] text-muted-foreground">{offer.employer} · {getCareerTrack(offer.employer).name}</span>
                      <span className="flex justify-between gap-3 text-[11px] mt-1">
                        <span className={delta40 >= 0 ? "font-mono-nums text-primary" : "font-mono-nums text-destructive"}>
                          {delta40 >= 0 ? "+" : "−"}{formatMoney(Math.abs(delta40))}/day at 40h vs your job
                        </span>
                        <span className={`shrink-0 ${step < 0 ? "text-destructive" : "text-primary"}`}>
                          Level {level + 1} of {JOBS.length} · {stepWord}
                        </span>
                      </span>
                      <span className="block text-[11px] text-muted-foreground">
                        {getCareerTrack(offer.employer).outlook}
                      </span>
                      <span className="block text-[11px] text-muted-foreground mt-1">{offer.note}</span>
                      </span>
                    </button>
                  );
                })}
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
        </div>
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
          You can pay outright or borrow. Government loans come first — 6.5% a year for courses and bachelor's
          degrees, 8.1% for graduate study, nothing due until six months after you finish — and they are capped
          at {formatCompact(FEDERAL_CAPS.undergrad)} for undergraduate study, {formatCompact(FEDERAL_CAPS.graduate)} for
          graduate degrees and {formatCompact(FEDERAL_CAPS.professional)} for medicine. Anything beyond that comes
          from a bank at 12%, sized against your pay and what you own, and it starts charging interest immediately.
          A master's needs a bachelor's behind it.
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
                    const prereq = getStudyPrereqNote(state, def);
                    const funding = getStudyFunding(state, def, def.cost);
                    const uncovered = Math.max(0, def.cost - funding.federal - funding.private);
                    return (
                      <div key={def.id} className="flex justify-between items-center gap-3">
                        <div className="min-w-0">
                          <p className="text-sm">{def.name}</p>
                          <p className="text-[11px] text-muted-foreground">{def.description}</p>
                          {!completed && (
                            <>
                              <p className="text-[11px] text-muted-foreground font-mono-nums">
                                {formatCompact(def.cost)} · {def.days} full-time days
                              </p>
                              {prereq ? (
                                <p className="text-[11px] text-muted-foreground mt-0.5">{prereq}</p>
                              ) : (
                                <p className="text-[11px] text-muted-foreground mt-0.5 font-mono-nums">
                                  {funding.federal > 0 && `Government ${formatCompact(funding.federal)}`}
                                  {funding.federal > 0 && funding.private > 0 && " · "}
                                  {funding.private > 0 && `Bank ${formatCompact(funding.private)} at 12%`}
                                  {funding.federal <= 0 && funding.private <= 0 && "No borrowing available"}
                                  {uncovered > 0.5 && ` · ${formatCompact(uncovered)} short`}
                                </p>
                              )}
                            </>
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
                              disabled={!!state.studying || !!prereq || state.cash < def.cost}
                              className="h-9 px-3 rounded-lg surface-button text-xs font-medium transition-game disabled:opacity-40"
                            >
                              Pay now
                            </motion.button>
                            <motion.button
                              whileTap={{ scale: 0.97 }}
                              onClick={() => dispatch({ type: "STUDY", majorId: def.id, financed: true })}
                              disabled={!!state.studying || !!prereq || !funding.covered}
                              className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium transition-game disabled:opacity-40"
                            >
                              Borrow
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
