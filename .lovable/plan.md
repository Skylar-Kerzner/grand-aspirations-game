# "Business" everywhere, a livelier collage, and lifestyle looks that differ each run

## 1. One word: business

Every line of text you read in the game says "business" instead of "venture" — the Time tab ("Time in your businesses", the attention explanation), the Money tab's reset warning, the hours note in the lifestyle header, career perk wording ("businesses open luckier", "14% off opening and growing businesses"), event messages ("Business profits doubled"), and business screen copy.

Two things keep the word on purpose, because it is the real name of the thing: the **Venture Capital** investment and the **Venture Debt** loan.

Internal code names stay as they are.

## 2. Businesses and work at the top of the collage

The background collage currently starts with your home and car, so the first thing on screen every game is the same apartment. It gets reordered: your workplace and each business you own fill the top of both side columns, and the lifestyle pictures follow underneath. Open a coffee shop in Seattle and the screen changes character immediately; change jobs and the top of the screen changes with it.

## 3. Each lifestyle step has more than one look

Every tier of Housing, Food, Clothing, Car, Health & Fitness and Watch gets **three variants** at the same price and the same hours — purely how it looks and what it is called. For example the third housing step could be a Modern Loft, a Warehouse Conversion or a Garden Terrace; the fourth food step a Private Chef, a Personal Kitchen or a Standing Table.

When you move up a tier you choose between the three by name only — you do not see the picture until you commit, so the reveal is part of the upgrade. Each save keeps its own choices, so two playthroughs look genuinely different from the first apartment to the last.

Cost, hours bought back and every other number stay identical across the three, so this never becomes a hidden optimisation.

New artwork needed: 72 pictures (6 categories x 6 tiers x 2 extra looks). I generate them as part of the build, same cinematic style as the rest.

## Technical notes

- Copy sweep across `TimePanel.tsx`, `FinancePanel.tsx`, `AssetGallery.tsx`, `BusinessList.tsx`, `CareerPanel.tsx`, and the string fields in `gameData.ts` / `GameContext.tsx` (career perk lines, event descriptions, business flavour). Identifiers (`ventureName`, `ventureImageAtTier`, `ventureLuck`, `ventureCostDiscount`, `ventureTracks`) are left alone; only string literals change. `INVESTMENTS.vc` and `LOANS.venture` names are untouched.
- `BackgroundScene.tsx`: build the tile list as `[workplace, ...businessTiles, ...lifestyleTiles]` before the two-column split, so both columns lead with work and businesses.
- `AssetDef.tiers[n]` gains `variants: { name, image, }[]` (3 each; tier `name`/`image` become variant 0 for save compatibility). `dailyCost`, `hoursBonus` and `benefit` stay on the tier, shared by all variants.
- New save field `assetVariants: Record<string, number[]>` (category -> chosen variant index per tier), defaulted empty so existing saves fall back to variant 0. Save key bumps to `empire-tycoon-save-v6` only if the fallback proves messy; prefer a migration-free default.
- Upgrade flow in `AssetGallery.tsx`: the tier picker shows the three names and the shared cost/hours, with no image; after purchase the gallery, modals and collage all read the chosen variant's image.
- Artwork keys: `{category}-t{n}{a|b|c}.jpg` with existing files serving as the `a` variant. Generated at 1024x640, cinematic 16:10, dark moody, no people or text.
