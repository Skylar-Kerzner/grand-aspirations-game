# Remove the blank squares from the business screen

Three places on this screen draw an empty grey box. All three get artwork or a cleaner treatment instead.

## What changes

**1. Concept cards (Family Trattoria / Chef's Tasting Counter / Late-Night Ramen Bar)**

Right now each card reserves a picture area and draws nothing, because it asks for a generic concept picture that no longer exists. Every concept already has real artwork for each city and each stage, so each card will show the picture of that concept, in the city currently selected, at the stage you are about to open. Change the city and the three pictures change with it, so the choice is a visual one.

**2. The locked stage list ("?" / Level 8+ / 20 levels away)**

No more empty thumbnails for stages you have not reached. Locked rows become a clean text row with a small locked marker and a hairline, so the list reads as a ladder rather than as broken images. Stages you have reached keep their small picture, and the row keeps its name and "Reached" label.

**3. The big picture at the top of an unopened venture**

Instead of an empty 16:10 box with "Not yet purchased", it shows a dimmed preview of the concept and city currently selected, with a short caption over it. As soon as you open the venture it becomes the normal full-colour picture.

Nothing about costs, odds, income or the opening flow changes — this is purely how the screen looks.

## Technical notes

- `src/components/game/BusinessList.tsx` only; no game logic or data changes.
- Add a small helper that resolves a preview key from `{concept.image}-{locationId}-t{tier}` using the existing `pickImage` fallback chain in `gameData.ts` (`ventureImageAtTier` already does this for owned ventures — the preview path reuses it with the pending `choices` and the tier about to be opened).
- Drop the `getImage(concept?.image || "")` fallbacks; those base keys were removed when the artwork was regenerated per city and tier.
- Locked tier rows: remove the `w-10 h-10 bg-secondary` placeholder, replace with a lock glyph in a bordered circle sized to keep rows aligned with reached rows' thumbnails.
- Keep all colours on semantic tokens; no emojis.
