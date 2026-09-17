# No-degree careers slow to a stop

## Goal
Make education matter for staying in your own industry: without the track's major, promotions past the early levels demand ever more experience until they effectively stop.

## Changes
- Career offers at tier 4+ currently check "same track + 3 positions/3 years" — which anyone who climbed normally already has, so the gate never binds. Keep that check as the *eligibility* rule, but add a **no-degree drag** on the experience needed for the next promotion.
- If the player lacks the major for their current industry, the experience required for each next level past tier 4 is multiplied by a factor that grows per tier (quadratic), so promotions keep coming but slower and slower, practically stalling around tiers 7–8. With the major, requirements are unchanged.
- Career panel explains it plainly while the drag applies: "Without a degree in this industry, each next step takes longer — study the major to keep climbing at full pace." The experience bar and offer-search button copy reflect the inflated requirement automatically, since they already read the requirement figure.
- Offer pay rules, adjacency/switching rules, and the tier-4 eligibility gate stay exactly as they are.

## Technical notes
- `gameData.ts`: add `NO_DEGREE_DRAG_BASE` (per-tier drag start, e.g. 1.5) and a helper `noDegreeXpMultiplier(tier)` returning roughly `(1 + dragStart)^(tier - MAJOR_GATE_TIER)` growth, ~1.5× at tier 4, ~5× by tier 7, ~11× by tier 9.
- `GameContext.tsx`: in the derived `xpNeeded` calculation, multiply by `noDegreeXpMultiplier(nextTier)` when the player lacks the major for their current job's track. No other logic changes — offer generation, pay, and saves are untouched (xpNeeded is derived, so old saves migrate automatically).
- `CareerPanel.tsx`: add the explanatory line under the progress bar when the drag applies, naming the relevant major as the fix.

## Verification
- With no major: experience-to-next-level grows steeply past tier 4 and offers take far longer to unlock.
- With the track's major: requirements match the current game exactly.
- Old saves load with correct requirements; typecheck clean.
