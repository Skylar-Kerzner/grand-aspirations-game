# Clearer net income

## Goal
Make the main money signal useful for decisions by leading with what actually happened over the last seven game days, while preserving the current forward-looking estimate for planning.

## Changes
- Record a rolling seven-day cash-flow history in the saved game state.
- For each simulated day, capture actual job income, business profit, investment gain or loss, and recurring costs.
- Keep purchases, sales, borrowing, repayments made on demand, and surprise-event windfalls/losses out of this operating result so a major transaction does not make the weekly figure misleading.
- Handle offline progress day-by-day for this history, then retain only the latest seven game days.
- Add derived totals for:
  - **Last 7 days:** the summed actual operating net.
  - **Current pace:** the existing estimated net per day.
- Update every current Net display—the top summary, Time, Money, and lifestyle chooser—to lead with **Last 7 days**, with **Current pace** shown beneath or beside it in a quieter style.
- In Money, show the seven-day actual breakdown by job, businesses, investments, and recurring costs so the player can identify what changed.
- For new games and older saves without seven days of history, label the shorter available period accurately rather than pretending it covers a full week.

## Technical details
- Add a compact daily cash-flow bucket type and a maximum seven-entry history to game state, with backward-compatible save loading.
- Aggregate simulation output into calendar-day buckets even when one tick advances multiple days.
- Keep the existing forecast calculation intact; this is an additional historical measure, not an economy rebalance.

## Verification
- Check a fresh game, a migrated existing save, a full seven-day run, and an offline multi-day advance.
- Confirm purchases and surprise events do not spike the operating net, while real business volatility and investment gains/losses do appear.
- Confirm all four displays agree and remain readable on the current layout.
