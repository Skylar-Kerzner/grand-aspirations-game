# Make businesses earn their keep

## Why they feel overpowered

Today a business rolls a success multiplier once, and that number never really changes. Every expansion costs 16% more than the last but pays the same rate of return on the money, forever. So a lucky roll becomes a permanent money printer: pour cash in, get the same 45% a year back on every dollar, and sell any time for exactly what the business is worth. There is no point at which growing stops paying and no way to lose the good roll.

On hours: that part is already fine. An unattended business runs at 25% of its potential, the first hour jumps you to roughly half, and it curves up to full at 15 hours a week. Diminishing already — leaving as is.

## What changes

**1. A more believable baseline return**
The typical business drops from about 30% a year on capital to about 18%. Sector-by-sector spread stays (corner cafés are punchier than city developments), but the free money is gone.

**2. Returns fade as the business gets big**
Each expansion earns slightly less on the money than the one before it. Small operations keep the high headline rate; a giant chain settles toward a large, steady, low-rate business. Every business therefore has a size where further expansion is no longer the best use of cash — the player has to notice it and move on.

**3. Success drifts, biased downward**
The success multiplier stops being a permanent verdict. Each in-game year it drifts, with competition pulling winners back toward normal faster than strugglers are pulled up. A 45% roll is a window of opportunity to exploit, not an annuity. A visible line on the business card shows whether it's cooling or holding.

**4. Fewer, larger, slower steps**
Expansion becomes a commitment rather than a click: substantially fewer levels per tier, each a much bigger cheque, and a build-out period during which the new capital is in the ground and not yet earning. Same total path, far more deliberate.

**5. Selling costs something**
Exiting is no longer free. A sale takes a stretch of days to find a buyer, and you take a haircut on the price (steeper for a business you've only just expanded). Businesses become the illiquid half of the game, in contrast with investments you can move in and out of freely.

**6. Honest numbers on screen**
Business cards and the time sliders show the return at the current size, and flag when the next expansion would earn less than the one before. The sale panel states the wait and the haircut before you confirm.

Overall bite: moderate. Businesses stay the strongest wealth engine in the game, but they need timing, attention and an exit, rather than one lucky roll.

## Technical notes

- `gameData.ts`: lower per-sector `annualROI` to ~0.18 and retune `BUSINESS_BASELINE_ROI`; add a scale-decay factor applied inside `getBusinessIncome` so marginal capital earns less; raise `costMultiplier`/`baseCost` steps and cut `BUSINESS_TIER_THRESHOLDS` to fewer, larger levels.
- `GameContext.tsx`: annual fortune drift in `advanceChunk` (mean-reverting toward <1, faster decay above 1, small upward pull below); a pending build-out timer on `BusinessState` set by `BUY_BUSINESS` that suppresses income from the newest tranche; `SELL_BUSINESS` becomes a listing with a settlement day and a discount factor in `getBusinessSalePrice`.
- Saves: existing businesses migrate by rescaling levels to the new thresholds and preserving invested capital, so nobody loses progress.
- UI: `BusinessList.tsx` return lines, cooling indicator, next-expansion warning, sale confirmation copy.
