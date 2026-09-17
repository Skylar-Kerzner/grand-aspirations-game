# More realistic daily cash flow for businesses

## The problem

Today's takings model is a flat random wobble (sum of three dice) around a normal
day. It has no weekly rhythm, no seasons, and no really good or really bad days.
Real ventures range much more: a café does 2–3× on a Saturday and almost nothing
on a stormy Tuesday, and slow stretches come in weeks, not single days.

## What changes

Each owned venture's daily takings become three multiplied layers:

```text
day's takings = weekly rhythm × season × daily luck
```

1. **Weekly rhythm (new, deterministic).** A fixed pattern over the 7-day week.
   Hospitality ventures (food truck, coffee, restaurant, hotel) peak on
   weekends (~1.6× Sat, ~0.75× Mon). Operations, tech and corporate ventures
   peak midweek and dip on weekends (~0.6× Sun). The week starts on the in-game
   day count, so this just works with the existing tick.

2. **Season (new, slow random wave per venture).** Each venture carries a `season`
   multiplier (starts at 1.0) that drifts daily, mean-reverting over roughly a
   month, ranging about 0.8×–1.25×. This makes good and bad stretches cluster
   into realistic multi-week runs, and it is saved with the game.

3. **Daily luck (wider, heavier tails).** The existing dice wobble gets a wider
   base range, plus rare special days: ~2% chance of a near-washout day
   (0.15–0.35×) and ~2% chance of a bumper day (2–3×). Still floored at zero,
   still pure noise — it does not move the venture's value (the slow trading
   trend remains the only thing that does), and it still averages out over time.

The existing per-venture `dailyNoise` values keep their meaning as the overall
width of the swing; small ventures stay choppier than the city-scale ones.

## What you'll see

- Day-to-day income in the header and ledger visibly swings much more,
  with quiet Mondays, big weekends, and occasional standout or dire days.
- The Time tab's "today's takings" percentage reflects the combined rhythm,
  season and luck, so a 220% Saturday or a 30% washout reads clearly.
- No changes to pricing, ROI, fortune rolls, condition trend, shocks, or
  valuation — average income over a month stays essentially the same.

## Technical details

- `src/lib/GameContext.tsx`: tick loop — compute weekday factor from the day
  count, drift a new `season` field on `BusinessState` (AR(1), reversion ~0.04,
  clamp 0.75–1.3), replace the flat `dayNoise` with the three-layer product
  including rare washout/bumper draws.
- `src/lib/gameData.ts`: add `WEEKDAY_FACTORS` per business track
  (hospitality vs weekday-oriented), `SEASON_REVERSION`/`SEASON_VOL`
  constants, and washout/bumper chances and ranges.
- Save compatibility: `season` defaults to 1.0 when missing; existing saves
  load unchanged.
- Verify: `npx tsgo --noEmit`, then a quick simulation script printing the
  distribution of daily multipliers (min/max/std) to confirm the wider,
  realistic range, then Playwright check that the game ticks normally.
