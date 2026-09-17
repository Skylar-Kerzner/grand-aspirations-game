# Lifestyle, careers, education and realism pass

## 1. A sixth lifestyle element, all framed around time

Add **Health & Fitness** as a sixth recurring category (No routine / Gym membership / Personal trainer / Full wellness team), priced like the others and giving 0/1/3/6 hours back.

Rewrite every lifestyle tier so the headline is the time, not the flavour:
- Each tier row reads as "+4h a week" first, cost second, flavour last.
- Tier 1 rows say "Baseline — costs you time" instead of "No time bought back yet", and the lowest tiers of some categories will carry a small negative (e.g. no car = -2h commuting) so moving up visibly buys hours.
- The Lifestyle tab header shows your current total: "40 base + 14 bought back = 54h this week", with the running total updating as you hover/select a tier.

## 2. Keep the money counters visible inside a lifestyle picker

The picker currently covers the whole screen. It will keep a compact strip at the top showing income per day, costs per day and net per day — the same three numbers as the main header — and that strip updates to a preview ("net would become ...") for the tier you are about to choose.

## 3. Volatility realism

Current behaviour:
- Investments move each day by their annual volatility spread over a year (index ~0.8%/day, digital assets ~3.7%/day). That is realistic for real markets, but because one day passes every second, it *looks* frantic.
- Businesses only drift a slow "trading conditions" number, so daily profit barely moves and the odd shock is rare.

Real life is the opposite way round: a small business's daily takings swing wildly while its *value* moves slowly; a listed fund's value moves daily and there is no daily cash at all.

Changes:
- Split business volatility into **daily takings noise** (large — a coffee shop's day can be 60% or 150% of normal, smaller swings for hotels/city projects) and a **slow trend** (mean-reverting, months long) which is the only part that moves the venture's valuation and sale price.
- Show both: "Today's takings" vs "Trading trend" on each venture.
- Damp the reported investment view rather than the maths: keep true daily returns, but the investment cards show smoothed 30-day performance alongside today's move, so digital assets read as volatile rather than broken. Crypto volatility trimmed 0.70 to 0.55 and venture capital 0.60 to 0.45 to sit in a believable range.

## 4. Education names

- Level 1 stays a short course/certificate/bootcamp.
- Level 2 becomes a **Bachelor's degree** in that field (Bachelor of Hospitality Management, BSc Computer Science, BBA, BEng, BSc Finance) — the word "diploma" disappears.
- Level 3 becomes a **graduate degree**: MBA, MSc Computer Science, MS Finance, MEng, MS Hospitality, plus PhD-level options at the very top of Technology and Finance.
- Copy throughout (career gates, roadmap of requirements) updated to say course / bachelor's / graduate degree.

## 5. New career paths and a comparison screen

Three new tracks joining the five existing ones:
- **Arts & Entertainment** (actor): almost nothing early, brutal middle, enormous ceiling; big lifestyle perks (invitations, endorsements) and a bonus to Fashion and Theme Park ventures.
- **Education & Public Service** (teacher): low ceiling, very steady, cheapest degrees, extra study speed and reduced program costs.
- **Health & Medicine** (doctor): longest and most expensive schooling, nothing until the degree, then very high steady pay.

Each track gains explicit perks beyond pay so the choice is not just a pay curve: venture industry bonus, investment return bonus, study speed, lifestyle cost relief.

A new **Career paths** screen (inside the Career tab) lists all eight with a small pay-curve sketch, start pay, top pay, how fast the middle moves, what schooling it needs, and its perks — the pros and cons side by side.

## 6. Student loans

Programs can be paid for with a **student loan** instead of cash:
- Borrow the program cost at ~6% a year, up to a lifetime cap that rises with the level of study.
- Nothing is due while you are enrolled (interest still accrues).
- Repayment starts six months after finishing, spread over ten years, as a daily payment in your costs like any other loan.
- The balance counts against net worth as principal only, and the Money tab shows it as its own line separate from other debt.
- The Education section shows both buttons: pay now, or finance it.

## Technical details

- `gameData.ts`: new `health` asset, rewritten asset tier copy and `hoursBonus` values; `MAJORS` renamed and extended for three new tracks; `CAREER_TRACKS` gains arts/education/medicine with a `perks` field; `CAREER_VARIANTS` gains a role per new track at each of the 14 levels; `EMPLOYER_TRACKS` additions; business defs gain `dailyNoise` separate from `risk`; `STUDENT_LOAN` constants.
- `GameContext.tsx`: takings noise applied to income without touching condition; condition becomes the slow trend used in valuation; `studentLoan` state (balance, accrued, status), daily accrual and repayment in the tick, net worth subtraction, `STUDY` accepts a `financed` flag; time budget includes the new asset; save migration bumps to v5 with defaults for the new fields.
- Components: `AssetGallery` (counter strip, hours-first rows, six categories), `CareerPanel` (career paths comparison, financed enrollment), new `CareerPathsPanel`, `BusinessList`/`TimePanel` (takings vs trend), `InvestmentPanel` (30-day smoothed view), `FinancePanel`/`LedgerPanel` (student loan line).
- Artwork: four new images for the health category.
