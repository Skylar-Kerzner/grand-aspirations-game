# Job offers land at the rank you have earned

Right now every offer in the game is the next rung up, and taking any job — even in an industry you have never worked a day in — promotes you one level. That is what makes the ladder feel unearned.

## What will change

**Each offer carries its own rank.** An offer is no longer "your level plus one". It is a specific rank in that industry, chosen from what you have actually done in that industry.

**Staying in your industry still climbs.** Your own industry usually offers the next rank up. Sometimes it offers a sideways move at the same rank, and occasionally a double jump when your education, years served and interview readiness clearly justify it.

**Crossing industries puts you where you belong there.** A move into a new field lands at the rank your standing in that field supports:
- Your education in that industry sets the floor: a short course opens junior ranks, a bachelor's opens the middle, a graduate degree opens the top.
- Years already worked in that industry lift it further.
- A modest credit for seniority elsewhere applies only where it transfers — related fields, and general leadership roles where running people and budgets is the job. It never fully replaces industry standing.
- The result is capped: a cross-industry move can never be a bigger jump than staying put would be.

This means a senior finance executive moving into medicine with no medical schooling starts near the bottom of medicine, while the same person moving into corporate leadership carries much of their seniority with them.

**Pay follows rank.** Because a cross-industry offer now sits at its honest rank, the blunt across-the-board pay penalty for switching is reduced — the step down in rank is the cost, rather than being penalised twice.

**You can always look.** Searching stays available at the top of a ladder, where offers become sideways moves and cross-industry options instead of nothing at all.

## What you will see

- Every offer shows its rank ("Level 6 of 14") alongside the industry, and is labelled plainly: a step up, a sideways move, a double step, or a step down.
- A cross-industry offer says why it sits where it does — for example, "No schooling or years in Health & Medicine: you would start near the bottom" or "Your bachelor's in Technology places you mid-ladder".
- Your current position header keeps showing your level, and accepting a step down moves you down honestly.

## Technical details

- Add a `level` field to generated offers. `GENERATE_JOB_OFFERS` picks a target level per industry rather than one global `jobIndex + 1`, drawing roles from `CAREER_VARIANTS[level]` for that level and industry.
- New helper computes an earned level per track from `credentialLevelFrom`, `getTrackYears`, and a transferable-seniority term gated by `isAdjacentTrack` plus an explicit list of tracks that accept outside seniority (corporate leadership).
- Same-track target: `jobIndex + 1` normally, with a chance of `jobIndex` (lateral) and of `jobIndex + 2` when credentials, years and interview readiness clear a threshold.
- Cross-track target: `min(earnedLevel, jobIndex + 1)`, clamped to the available `CAREER_VARIANTS` range.
- Pay uses `JOBS[offer.level].dailyPay` as its base; reduce `TRACK_SWITCH_PENALTY` / `TRACK_FAR_SWITCH_PENALTY` since rank now carries most of the cost.
- `ACCEPT_JOB_OFFER` sets `jobIndex = offer.level` instead of incrementing, and records the level in `jobHistory`.
- Drop the `JOBS[state.jobIndex + 1]` early return so searching works at the top rank.
- Old saves and offers without a `level` fall back to the current behaviour on load.
- Verify with a typecheck and a playthrough: same-industry climbs, a cross-industry move without schooling landing low, one with a degree landing mid-ladder, and pay matching the offered rank.
