import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { useGame } from "@/lib/GameContext";
import { ASSETS, BUSINESSES, getBusinessTierIndex, ventureImageAtTier, workplaceImage } from "@/lib/gameData";
import { getImage } from "@/lib/gameImages";

interface Tile {
  key: string;
  src: string;
  /** Relative height of the tile inside its column. */
  span: number;
}

/** A cinematic collage of the life the player has actually built. */
export default function BackgroundScene() {
  const { state, derived } = useGame();

  // Three columns drift at their own pace as the page scrolls.
  const { scrollY } = useScroll();
  const spring = { stiffness: 60, damping: 26, mass: 0.7 };
  const driftA = useSpring(useTransform(scrollY, [0, 1600], [0, -190]), spring);
  const driftB = useSpring(useTransform(scrollY, [0, 1600], [0, -360]), spring);
  const driftC = useSpring(useTransform(scrollY, [0, 1600], [0, -90]), spring);
  const drift = [driftA, driftB, driftC];

  const assetImage = (id: string) => {
    const definition = ASSETS.find((asset) => asset.id === id);
    const ownedTier = state.assets[id] || 0;
    if (!definition || ownedTier < 1) return "";
    const tier = definition.tiers[Math.min(ownedTier, definition.tiers.length) - 1];
    return tier ? getImage(tier.image) : "";
  };

  // Every company the player owns.
  const ventureTiles: Tile[] = BUSINESSES.filter((b) => (state.businesses[b.id]?.level || 0) > 0).map((b) => ({
    key: `venture-${b.id}`,
    span: 1.15,
    src: getImage(
      ventureImageAtTier(b.id, getBusinessTierIndex(state.businesses[b.id].level), state.businesses[b.id].choices),
    ),
  }));

  const workImg = getImage(workplaceImage(derived.job.employer, state.jobIndex));

  const tiles: Tile[] = [
    { key: "work", src: workImg, span: 1.3 },
    { key: "house", src: assetImage("house"), span: 1.25 },
    { key: "car", src: assetImage("car"), span: 0.95 },
    ...ventureTiles,
    { key: "food", src: assetImage("food"), span: 0.9 },
    { key: "wardrobe", src: assetImage("wardrobe"), span: 1 },
    { key: "watch", src: assetImage("watch"), span: 0.8 },
    { key: "health", src: assetImage("health"), span: 1.05 },
  ].filter((tile) => tile.src);

  const columns: Tile[][] = [[], [], []];
  tiles.forEach((tile, index) => columns[index % 3].push(tile));

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-background" aria-hidden>
      <div className="absolute inset-x-0 -top-[30%] h-[190%] flex gap-1.5 px-1.5">
        {columns.map((column, index) => (
          <motion.div key={index} style={{ y: drift[index] }} className="flex-1 flex flex-col gap-1.5">
            {(column.length > 0 ? [...column, ...column, ...column] : []).map((tile, repeat) => (
              <motion.div
                key={`${tile.key}-${repeat}`}
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 0.5, scale: 1 }}
                transition={{ duration: 0.9, delay: Math.min(repeat, 6) * 0.05 }}
                className="overflow-hidden rounded-sm shrink-0"
                style={{ height: `${tile.span * 24}vh` }}
              >
                <img src={tile.src} alt="" loading="lazy" className="h-full w-full object-cover" />
              </motion.div>
            ))}
          </motion.div>
        ))}
      </div>
      <div className="absolute inset-0 bg-background/30" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/45 via-background/65 to-background/92" />
      <div className="absolute inset-y-0 left-1/2 w-full max-w-xl -translate-x-1/2 bg-background/40" />
    </div>
  );
}
