# Consistent five-day career pay

## Goal
Make career time and pay use one understandable model: allocated hours are weekly, regular salary is earned Monday through Friday, and career comparisons lead with annual salary.

## Changes
- Treat each seven-day game cycle as five workdays followed by two weekend days.
- Preserve the current intended annual salary curve rather than cutting career earnings by moving to five paid days.
  - The existing role rate becomes its annual salary basis.
  - Each weekday pays one of 260 equal workday payments.
  - Saturday and Sunday pay no regular salary.
- Scale annual salary by the weekly hours left for the job. For example, 20 job hours pays half the 40-hour annual salary.
- Calculate “Work one extra hour” from the same annual salary basis divided by 2,080 working hours, after tax. Keep it available once per game day, including weekends, as optional extra work.
- Centralize annual salary, workday pay, hourly pay, and whether today is a workday so every screen and transaction uses identical calculations.

## Career presentation
- Replace “Gross pay at 40h” daily figures with:
  - annual salary at 40 hours/week;
  - annual salary at the player’s currently allocated job hours, when different;
  - the corresponding gross amount per workday as secondary context.
- Show job offers in the same order and units, with the comparison delta expressed as annual salary at 40 hours/week.
- Update career-history pay labels to annual salary so old and current positions remain comparable.
- Clearly state that regular salary is paid over five workdays per week.

## Money history and related calculations
- Record regular salary only on workdays; weekends contribute zero regular salary while businesses and costs continue daily.
- A complete rolling seven-day result will therefore contain exactly five regular workdays, plus any extra-hour button earnings actually collected.
- Keep the existing seven-day labels and aggregation rules; passive investments remain excluded from top-line earned and net figures.
- Update salary-dependent calculations such as bonuses, borrowing capacity, and credit limits to use the appropriate annual or average-daily figure, avoiding accidental five-day spikes or reductions.
- Keep taxes and career performance compensation consistent with the new schedule.

## Validation
- Verify a full seven-day cycle pays exactly the displayed annual salary divided by 52 at 40 job hours.
- Verify reducing job allocation scales both displayed annual salary and actual weekday deposits proportionally.
- Verify seven extra-hour presses add exactly seven hourly payments to the rolling result.
- Verify weekend regular salary is zero, while daily costs and passive business activity still run.
- Check current-job, offer, history, dashboard, Time, and Money displays for consistent wording and totals.
