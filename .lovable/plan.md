# Every industry at every career level

## What's happening now

Technology and retail roles aren't hidden behind a certificate — they simply don't exist at your current rung of the ladder.

Each career level has a fixed set of six roles, and those sets are clustered by industry:

- Levels 1-3: all hospitality and retail
- Levels 4-5: all operations and industry (plus one insurance role)
- Level 6: mostly finance, one tech, one manufacturing
- Levels 8-10: mostly technology
- Levels 11-14: corporate and finance

So once you pass level 3, hospitality vanishes entirely, and technology can't appear until level 6. The "spread offers across industries" logic works correctly, but it can only spread across the industries that exist at your level.

Qualifications are a second, separate filter on top of that (from level 4: a short course; 7-9: a diploma; 10+: the full degree, with years served standing in for the first two).

## The fix

Rebuild the role ladder so all five industries — Hospitality & Retail, Operations & Industry, Corporate Leadership, Technology, Finance & Investing — have a role at every level, from dishwasher to hedge fund manager.

- Each level gets at least one role per industry, with believable titles and employers for that industry at that seniority (retail keeps climbing into store manager, regional manager, retail director, chief merchant; technology starts at support desk and helpdesk roles rather than beginning at software engineer).
- New employers are added to the industry map so nothing silently falls back to "operations".
- Pay differences stay where they belong: the industry's pay curve, so retail still pays well early and flattens, technology and finance start modest and climb.
- Offers keep spreading one per industry, starting with your own and any you hold study in, so a search shows a genuine mix.
- Qualification gates stay as they are. With every industry present at every level, those gates become the real reason an industry is missing from your offers — so the career screen will name which industries you currently qualify for and which need study.

## Technical notes

- `CAREER_VARIANTS` in `src/lib/gameData.ts` is rewritten: 14 levels x 5 industries (one or two roles each), replacing the current industry-clustered sets of six.
- `EMPLOYER_TRACKS` gains the new employers; verify no employer relies on the "operations" default.
- No change to `GENERATE_JOB_OFFERS` selection logic, `trackPayMultiplier`, the switch penalties, or credential gating.
- `CareerPanel` copy already lists qualified industries; confirm it reads correctly now that unqualified industries are the only ones missing.
