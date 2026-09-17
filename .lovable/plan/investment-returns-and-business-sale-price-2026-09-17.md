# Investment returns and business sale price

## What I checked

I read the actual return code and ran a 20,000-year simulation of Digital Assets as it is written today.

The maths is not broken in the way it first looks: the **average** year is exactly the advertised +30%. But averages are not what you experience. In the simulation:

- the typical (middle) year is only **+12%**
- **42%** of years end below where they started
- **7%** of years end at half or less

So "it always halves" is bad luck compounding a real design problem: the headline number is an average dragged upward by rare huge years, while most years feel flat or negative. The same gap exists everywhere — the Index Fund says 9% and typically gives 7.5%; Venture Capital says 35% and typically gives 22%.

## Change 1 — make the stated return the typical year

Stop treating the advertised figure as the long-run average and make it the **typical** year instead. A fund that says 30% will, in a normal year, actually land near 30%; good years go well above, bad years still happen, but the middle of the distribution matches what the card promises.

Alongside that, pull the wildest swings in: Digital Assets from 55% to 42% yearly swing, Venture Capital from 45% to 38%. Still the two riskiest things on the board, still capable of a bad year, just no longer near-coinflip on losing money.

Expected feel after the change (Digital Assets over one year): typical +30%, about a quarter of years negative, roughly 2% of years halving.

Each investment card will also show the realistic spread for a year — something like "a typical year: +30%, though a bad one can take a third off" — so the promise and the experience line up.

## Change 2 — sale price tied to what you put in

Right now a business is valued at four times its yearly profit and then further reduced by how many hours a week you personally give it, so a neglected venture sells for a fraction of the money you sank into it. That is why the numbers look broken.

New rule, exactly as you described:

- Every venture's baseline is a 30% return on capital.
- **Overall business success of 30% sells for 100% of everything you have invested in it.**
- Anything else scales straight in proportion: 45% success sells for 150% of invested capital, 21% sells for 70%, 60% sells for 200%.

Hours allocated no longer affect the sale price — time you spend changes what it earns you, not what the business is worth. The same figure is what counts toward your net worth, so the number you see in your wealth is the number you would actually get on a sale.

The sale panel will state it plainly: total invested, success multiple, and what that comes to.

## Technical notes

- `src/lib/GameContext.tsx` (investment tick, ~line 836): the lognormal drift term currently subtracts `sigma^2 / 2`, which is what makes the median land below the stated return. Remove the subtraction so the stated return becomes the median of the distribution; per-tick draw and scaling by `days / DAYS_PER_YEAR` are unchanged.
- `src/lib/gameData.ts` `INVESTMENTS`: `crypto.annualVolatility` 0.55 → 0.42, `vc.annualVolatility` 0.45 → 0.38. Others unchanged.
- `src/lib/GameContext.tsx` `getBusinessValueOf` (line 418): replace the income × 4 × attention valuation with `getBusinessCapital(def, level) * (fortune * def.annualROI / 0.30)`, which equals `capital * fortune` while every sector's baseline ROI is 0.30. Drop `BUSINESS_VALUATION_MULTIPLE` and the attention factor from this path.
- `getBusinessSalePrice` (line 427): return the value directly; retire `BUSINESS_SALE_DISCOUNT` so 30% success returns exactly 100% of capital.
- Net worth (line 534) uses the same helper rather than its own inline copy, so the two can never diverge again.
- `BusinessList.tsx` sale block (~line 444): show invested capital, success multiple and proceeds.
- `InvestmentPanel.tsx`: replace the current swing line with the typical-year and bad-year framing.
