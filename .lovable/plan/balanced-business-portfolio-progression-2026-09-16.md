# Balanced business portfolio progression

## Goal
Make business upgrades a portfolio-building decision rather than letting the earliest business permanently dominate on return.

## Changes
- Give every business the same sensible baseline return on invested capital, so Coffee is not strictly better than Restaurant or every later venture.
- Add **business network milestones** between neighboring ventures. When both businesses in a pair reach levels 8, 20, or 40, both receive increasingly strong permanent income bonuses.
  - Coffee + Restaurant becomes the first operating group.
  - Restaurant + Tech, Tech + Hotel, and later pairs follow the same progression.
  - Unlocking a new business never removes an existing bonus.
- Keep individual upgrades productive: capital added at every level continues earning the baseline return, while reaching paired milestones creates the larger strategic payoff.
- Calculate business value from the resulting income without charging future interest or treating purchases as lost net worth.
- Update the business cards and detail view to show:
  - current effective annual return,
  - active network bonus,
  - the next paired milestone and which business needs levels,
  - daily income added by the next upgrade.
- Update the review page to report effective returns rather than the old fixed rate.

## Balance and verification
- Tune milestone bonuses so balanced Coffee/Restaurant upgrades outperform concentrating indefinitely in Coffee, without creating an instant runaway economy.
- Verify new and existing saves, automated collection, business valuation, and the business screens on desktop and mobile.
- Run the project type check and a short simulated play-through comparing concentrated versus balanced upgrade strategies.

## Technical details
- Keep the existing 1-second-per-day economy and business tier thresholds of 1, 8, 20, and 40.
- Centralize network-bonus and effective-return calculations in the economy helpers so income, valuation, cards, and review figures always agree.
