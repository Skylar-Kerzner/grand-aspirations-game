# Plan: Training budget can't be gamed

## The problem

The offer-pay bonus reads today's training budget directly (`getOfferTrainingBonus` uses `state.trainingBudget`). So you can set it to a huge amount, hit "Seek a new job", and set it back to zero — paying one day of training for a +35% pay bump on every offer.

## The fix: training momentum

Training now has to be *sustained* to count:

- **New state field `trainingMomentum`** — a rolling average of your recent daily training budgets, updated each day in the game tick:
  - `momentum = momentum × decay + budget × (1 − decay)`, with a ~30-day time constant (decay = e^(−1/30)).
- **Offers use momentum, not the raw slider.** `getOfferTrainingBonus` reads the momentum, so reaching the +35% cap requires holding roughly $140/day for about a month. Dropping the budget lets the bonus fade over a few weeks.
- **Time tab copy updated** — the training card explains that courses and coaching build up over time, and shows the current effective boost and how close it is to the cap (e.g. "Effective +12% on offers · full boost in about 20 days at this pace").
- **Old saves:** momentum seeds from the save's current training budget so existing players who were paying all along keep their boost.

## Technical details

- `src/lib/GameContext.tsx`: add `trainingMomentum: number` to `GameState`, initialize at 0, update in `advance()` alongside the training spend deduction, recompute `getOfferTrainingBonus` off momentum, seed from `trainingBudget` in the legacy-save migration.
- `src/components/game/TimePanel.tsx`: rewrite the training card copy and add an effective-boost readout.
- Typecheck, then Playwright-verify the Time tab and a job seek after simulating days of training.
