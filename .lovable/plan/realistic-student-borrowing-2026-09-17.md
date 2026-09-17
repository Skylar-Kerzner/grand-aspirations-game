# Realistic student borrowing

Today one flat pot of "student debt" grows with your highest degree ($30k / $120k / $400k) at a single 6% rate, and nothing stops you enrolling in a master's without a bachelor's. Replace it with how US borrowing actually works as of September 2026.

## What changes for the player

**You need the degree below before the one above.** Short courses are open to anyone. A bachelor's needs nothing. A master's, MBA, MD or similar needs a bachelor's first — in that industry, or an adjacent one. The button explains what's missing instead of just failing.

**Two kinds of borrowing, shown separately.**

- Government loans: cheap, fixed, capped by law. Anyone qualifies — no credit check, your wealth is irrelevant.
- Private loans: cover whatever the government won't, but they are lent on your finances — your pay, what you already owe, and your net worth. They cost roughly twice as much and start charging interest the day you take them.

**The government caps follow the real 2026 rules.**

- Bachelor's: $57,500 total across your whole undergraduate life.
- Master's / MBA / most graduate study: $20,500 a year, $100,000 lifetime.
- Professional degrees (medicine, dentistry, law, veterinary, pharmacy, clinical psychology and the rest of the eleven-field list): $50,000 a year, $200,000 lifetime.
- $257,500 across everything, forever.
- The old "borrow the whole cost of school" option (Grad PLUS) is gone — it ended 1 July 2026, which is exactly why expensive programs now leave a gap.

So the $320k medical degree draws $200k of government money and leaves $120k to find privately; the $150k MBA draws $100k and leaves $50k; a bachelor's usually fits entirely.

**Private lending actually judges you.** Your borrowing room is about four times your yearly pay minus what you already owe, softened by a slice of your net worth as collateral. Early on you simply cannot borrow $120k for medical school — you pay cash, choose a cheaper path, or work up to it. Rates around 12%, and the balance grows while you study.

**Repayment is realistic.** Government loans stay quiet while you study plus six months, then ten years of payments. Private loans start accruing immediately and begin payments as soon as you finish.

The Money tab shows the two balances on separate lines, and the Career tab shows, per program, how much is government money, how much private, and whether you can actually get it.

## Technical notes

- `gameData.ts`: add `kind: "undergrad" | "graduate" | "professional"` and `requires?: level` to `MajorDef` (MD, and any future JD/DDS/PharmD/DVM/PsyD, are professional; MBA, MSc, MFA, MEd, quant finance are graduate). Replace `STUDENT_LOAN_CAPS`/`studentLoanCap` with `FEDERAL_CAPS = { undergrad: 57500, graduate: 100000, professional: 200000, lifetime: 257500 }`, `FEDERAL_RATE_UNDERGRAD = 0.065`, `FEDERAL_RATE_GRAD = 0.081`, `PRIVATE_RATE = 0.12`, plus `federalRoomFor(state, def)` and `privateRoomFor(state)` (`4 × annual gross − existing debt service base + 0.25 × net worth`, floored at 0).
- `GameContext.tsx`: split `StudentLoanState` into `federal` and `private` sub-balances (keep the old shape readable in legacy saves by folding the existing balance into `federal`). `STUDY` with `financed` splits cost federal-first, private-remainder, and refuses if the total isn't covered; add a `prereqMet(state, def)` guard to `STUDY`. Tick accrues each balance at its own rate; federal respects grace, private accrues during study and repays on completion. `getStudentLoanPayment` sums both amortisations; `REPAY_STUDENT_LOAN` pays private first (higher rate).
- `CareerPanel.tsx`: per-program funding breakdown line and disabled-reason text; `FinancePanel.tsx`: two rows plus combined payment.
