# Lifestyle overhaul

## What will change
- Replace the current Assets tab with a **Lifestyle** tab containing five separate categories: Housing, Food, Clothing, Car, and Watch.
- Convert every lifestyle choice from a one-time purchase into a recurring daily expense. Players can move up or down a tier as their finances change.
- Keep each category visually rewarding with its existing large artwork, tier progression, and background appearance.
- Remove the duplicate housing, food, and clothing controls from Career.

## Benefits and clarity
- Every lifestyle tier will show its exact daily cost and concrete benefit before selection.
- Better lifestyle choices will accelerate both career experience and education progress, rather than being a mostly negative expense.
- Replace vague “focus” wording with clear labels such as **Career progress** and **School progress**, including the resulting multipliers.
- Career and education screens will show how the active lifestyle affects promotion and course completion speed.

## Economy and safeguards
- Charge the selected Housing, Food, Clothing, Car, and Watch costs each in-game day.
- Stop treating lifestyle tiers as owned resale assets in net worth, since they are subscriptions/ongoing standards of living.
- Preserve credit-card fallback behavior: if debt exceeds the limit, automatically downgrade lifestyle choices to affordable baseline tiers.
- Migrate existing saves by mapping owned House, Wardrobe, Car, and Watch tiers to equivalent active lifestyle tiers without charging a new purchase price.

## Technical details
- Consolidate lifestyle definitions into a shared tier model with daily cost, career benefit, school benefit, and artwork.
- Update game state, actions, daily expense calculations, experience gain, study speed, save migration, ledger labels, background scene, and all affected summaries.
- Verify selection changes, daily deductions, school speed, promotion progress, debt downgrades, save migration, and desktop/mobile presentation.
