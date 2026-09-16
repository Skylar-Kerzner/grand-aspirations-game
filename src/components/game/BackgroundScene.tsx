import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/lib/GameContext";
import { ASSETS, BUSINESSES, getBusinessTierIndex } from "@/lib/gameData";
import { getImage } from "@/lib/gameImages";

/** A quiet montage of the life you have actually built, behind everything else. */
export default function BackgroundScene() {
  const { state, derived } = useGame();

  const houseTier = state.assets["house"] || 0;
  const houseDef = ASSETS.find((a) => a.id === "house");
  const carTier = state.assets["car"] || 0;
  const carDef = ASSETS.find((a) => a.id === "car");

  // biggest business you own
  const owned = BUSINESSES.filter((b) => (state.businesses[b.id]?.level || 0) > 0);
  const flagship = owned[owned.length - 1];
  const flagshipImg = flagship
    ? getImage(flagship.tierImages[getBusinessTierIndex(state.businesses[flagship.id].level)])
    : "";

  const scene = getImage(derived.job.scene);
  const houseImg = houseTier > 0 && houseDef ? getImage(houseDef.tiers[houseTier - 1].image) : "";
  const carImg = carTier > 0 && carDef ? getImage(carDef.tiers[carTier - 1].image) : "";

  const layers = [
    { key: "home", src: houseImg, className: "left-0 top-0 w-1/2 h-1/2" },
    { key: "work", src: scene, className: "right-0 top-0 w-1/2 h-1/2" },
    { key: "biz", src: flagshipImg, className: "left-0 bottom-0 w-1/2 h-1/2" },
    { key: "car", src: carImg, className: "right-0 bottom-0 w-1/2 h-1/2" },
  ].filter((l) => l.src);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <AnimatePresence>
        {layers.map((l) => (
          <motion.img
            key={l.key + l.src}
            src={l.src}
            alt=""
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.22 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            className={`absolute object-cover ${l.className}`}
          />
        ))}
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-b from-background/85 via-background/92 to-background" />
    </div>
  );
}
