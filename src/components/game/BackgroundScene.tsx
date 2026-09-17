import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { useGame, getAssetLook } from "@/lib/GameContext";
import { ASSETS, BUSINESSES, getBusinessTierIndex, ventureImageAtTier, workplaceImage } from "@/lib/gameData";
import { getImage } from "@/lib/gameImages";

interface Tile {
  key: string;
  src: string;
  /** Relative height of the tile inside its column. */
  span: number;
}

/** A cinematic collage of the life the player has actually built, flanking the content. */
export default function BackgroundScene() {
  const { state, derived } = useGame();

  // The two columns drift at their own pace as the page scrolls.
  const { scrollY } = useScroll();
  const spring = { stiffness: 60, damping: 26, mass: 0.7 };
  const driftA = useSpring(useTransform(scrollY, [0, 1600], [0, -200]), spring);
  const driftB = useSpring(useTransform(scrollY, [0, 1600], [0, -360]), spring);
  const drift = [driftA, driftB];

  const assetImage = (id: string) => {
    const definition = ASSETS.find((asset) => asset.id === id);
    const ownedTier = state.assets[id] || 0;
    if (!definition || ownedTier < 1) return "";
    const look = getAssetLook(state, id, Math.min(ownedTier, definition.tiers.length) - 1);
    return look ? getImage(look.image) : "";
  };

  // Every company the player owns.
  const businessTiles: Tile[] = BUSINESSES.filter((b) => (state.businesses[b.id]?.level || 0) > 0).map((b) => ({
    key: `business-${b.id}`,
    span: 1,
    src: getImage(
      ventureImageAtTier(b.id, getBusinessTierIndex(state.businesses[b.id].level), state.businesses[b.id].choices),
    ),
  }));

  const workImg = getImage(workplaceImage(derived.job.employer, state.jobIndex));

  // Work and the businesses lead, so the top of the screen is whatever this life
  // has actually built. The lifestyle pictures fill in beneath them.
  const tiles: Tile[] = [
    { key: "work", src: workImg, span: 1.05 },
    ...businessTiles,
    { key: "house", src: assetImage("house"), span: 1.1 },
    { key: "car", src: assetImage("car"), span: 0.95 },
    { key: "food", src: assetImage("food"), span: 0.9 },
    { key: "wardrobe", src: assetImage("wardrobe"), span: 1 },
    { key: "watch", src: assetImage("watch"), span: 0.85 },
    { key: "health", src: assetImage("health"), span: 1 },
  ].filter((tile) => tile.src);

  // Left and right columns only — the middle of the screen belongs to the game.
  const columns: Tile[][] = [[], []];
  tiles.forEach((tile, index) => columns[index % 2].push(tile));

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-background" aria-hidden>
      <div className="absolute inset-x-0 -top-[30%] h-[190%] flex justify-between gap-3 px-2">
        {columns.map((column, index) => (
          <motion.div key={index} style={{ y: drift[index] }} className="w-[26%] max-w-md flex flex-col gap-2">
            {(column.length > 0 ? [...column, ...column, ...column] : []).map((tile, repeat) => (
              <motion.div
                key={`${tile.key}-${repeat}`}
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 0.72, scale: 1 }}
                transition={{ duration: 0.9, delay: Math.min(repeat, 6) * 0.05 }}
                className="overflow-hidden rounded-md shrink-0"
                style={{ height: `${tile.span * 22}vh` }}
              >
                <img
                  src={tile.src}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover saturate-[1.35] contrast-105"
                  style={{ objectPosition: ["50% 30%", "50% 70%", "50% 50%"][repeat % 3] }}
                />
              </motion.div>
            ))}
          </motion.div>
        ))}
      </div>
      <div className="absolute inset-0 bg-background/15" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/35 via-background/50 to-background/80" />
      <div className="absolute inset-y-0 left-1/2 w-full max-w-2xl -translate-x-1/2 bg-background/55" />
    </div>
  );
}
