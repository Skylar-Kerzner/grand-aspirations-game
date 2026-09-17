# Make business volatility visible again

## What went wrong

The "realistic volatility" rework put all the big swings into a hidden `takings` multiplier — but the income you actually see (`getBusinessIncomeOf`) is still `steady x condition`, and `condition` was made to drift very slowly (risk / 365 per day, halved again by low attention). Two more things flatten it further:

- The "season" wave barely moves: its random step is tiny and it reverts to normal fast, so it hovers within about +/-7% and is invisible.
- Industry knowledge and low time allocation both shrink what's left of the swings.

So the math got busier while every number on screen got smoother. Net effect: less volatile than before.

## The fix

**1. Show the day's real takings in the numbers you watch.**
- The income counter up top and each business's income line use `steady x condition x today's takings`, so income visibly jumps around day to day (weekend booms, washout days) instead of crawling.
- The business detail panel shows "today's takings" alongside the trading trend, same as the Time tab already does.

**2. Make the slow waves actually slow and actually big.**
- Season random step up (0.02 to 0.05/day) and reversion down (0.04 to 0.015/day) so good and bad runs genuinely cluster over weeks, with a wider range (0.65x to 1.5x of normal instead of 0.75-1.3).
- Trading-trend drift up about 2.5x so a venture's condition visibly moves over a month — still slow enough that value doesn't jitter daily.

**3. Keep the long-run average honest.**
- All multipliers stay mean-one (weekday rhythm, season, luck), so monthly income is unchanged on average — only the day-to-day ride gets wilder, which is the realistic part.

## Technical details

- `src/lib/GameContext.tsx`: `getBusinessIncomeOf` gains the `takings` factor; tick loop constants unchanged in shape.
- `src/lib/gameData.ts`: `BUSINESS_SEASON_REVERSION` 0.04 → 0.015, `BUSINESS_SEASON_VOL` 0.02 → 0.05, `BUSINESS_SEASON_MIN/MAX` 0.75/1.3 → 0.65/1.5; trend drift multiplier ~2.5x.
- `src/components/game/BusinessList.tsx`: detail panel shows today's takings line (already available in state).
- Verified with a quick simulated year per business type (daily swing %, min/max day, unchanged monthly mean) and a Playwright pass watching the income counter move.

## Not changing

- Venture sale values still follow only the slow trend/condition, never the daily noise.
- Investment volatility is untouched.
