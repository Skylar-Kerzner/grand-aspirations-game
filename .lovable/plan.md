# Make the career time bonus visible and self-explanatory

## Problem
The weekly-hours equation shows an unexplained "+Xh career". The value is a career-track perk (`hoursBonus`) — Technology +3h ("remote and flexible"), Education & Public Service +5h ("term breaks"), Health & Medicine +4h ("your health is handled") — that grows with career level via `trackPerkScale` (40% at entry, 100% at max level). It is only named in the career-compare perk blurbs and never explained where the hours actually appear, so it feels like it comes from nowhere.

## Approach (user choice: keep the mechanic, show it properly)
Give each track's hours bonus a short human label, then surface that label — with the track it comes from and the current earned value — everywhere the bonus appears.

### 1. Label the perk (`src/lib/gameData.ts`)
- Add an optional `hoursBonusLabel` field to `CareerTrack`.
- Technology: "flexible hours" · Education: "term breaks" · Medicine: "staying healthy".
- Export `getHoursBonusLabel(trackId)` returning the label or empty string.

### 2. Time panel (`src/components/game/TimePanel.tsx`)
- Replace `+ Xh from your line of work` with `+ Xh flexible hours from Technology` (label + track name from the current job's track).

### 3. Lifestyle picker "Your week" (`src/components/game/AssetGallery.tsx`)
- Replace `+ Xh career` with the same cause-based wording, kept compact: `+ Xh flexible hours (Technology)`.

### 4. Career tab, current position card (`src/components/game/CareerPanel.tsx`)
- Add one line showing the earned value and the ceiling, e.g.
  `Flexible hours: +1.8h of your week now — +3h at the top of this ladder`
- Show it only when the track has an `hoursBonus` (other tracks are unaffected).
- Round the earned value to one decimal so partial scaling is legible.

## Verification
- `npx tsgo --noEmit` passes.
- Playwright on localhost:8080: Time panel and lifestyle picker show the labelled bonus; Career tab shows the earned perk line with the current scaled value.
