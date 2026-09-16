# Open any venture, and let your work history pay off

Two changes to how ventures work.

## 1. No more buying your way up the ladder

Right now each venture is locked until the one before it reaches level 8, so the only way into a hotel is through a coffee shop and a restaurant. That chain goes away. Every venture is available from the start; the only thing standing between you and a theme park is the price of one.

The neighbouring-venture network bonus stays as it is, so building two related ventures side by side is still rewarded — it just isn't compulsory.

## 2. Ventures belong to an industry you may already know

Each venture is tied to one of the five career industries:

- Hospitality & Retail: Coffee Shop, Restaurant, Hotel, Fashion Brand
- Operations & Industry: Theme Park
- Technology: Tech Startup, Media Network
- Corporate Leadership: City Development
- Finance & Investing: (no venture; finance experience instead gives a smaller cross-industry edge nowhere — see note)

If your working life has been in a venture's industry, you run it better:

- Holding its industry's degree: +8% annual return
- Time worked in that industry: +2% return per full year, up to +16%
- Both stack, so a maximum of +24% return
- Experience also steadies the venture: its swings and setback chance drop by up to 20% at full experience

The venture card and detail view state plainly what you bring: "Hospitality — your degree and 4 years in the industry: +16% return, steadier trade."

Ventures outside your experience run at the plain baseline — no penalty, just no edge. This gives a real reason to pick ventures that match your career, and a reason to change career industry before a big move.

## Technical notes

- `gameData.ts`: drop `unlockLevelOfPrev` from `BusinessDef` and all eight defs; add `track: string` keyed to `CAREER_TRACKS`. Add `INDUSTRY_MAJOR_BONUS = 0.08`, `INDUSTRY_YEAR_STEP = 0.02`, `INDUSTRY_YEAR_CAP = 0.16`, `INDUSTRY_RISK_RELIEF = 0.2`.
- `GameContext.tsx`: add `getIndustryKnowledge(state, businessId)` returning `{ returnBonus, riskRelief, hasMajor, years }`, using `state.majors` and a new `getTrackYears(state, trackId)` that sums days across all `jobHistory` entries whose employer maps to that track (not just the trailing run). Fold `returnBonus` into `getBusinessEffectiveROI` alongside the network bonus, and apply `riskRelief` to the daily condition drift and shock chance in the tick.
- `BusinessList.tsx`: remove the locked state, the `unlocked` checks and the "Needs X at level Y" copy — affordability alone governs the buy button. Add an industry line on the card and in the modal.
- Existing saves need no migration; business state is untouched.
