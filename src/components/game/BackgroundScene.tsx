import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/lib/GameContext";
import { ASSETS, BUSINESSES, getBusinessTierIndex } from "@/lib/gameData";
import { getImage } from "@/lib/gameImages";

interface SceneLayer {
  key: string;
  src: string;
  className: string;
}

/** A cinematic portrait of the life the player has actually built. */
export default function BackgroundScene() {
  const { state, derived } = useGame();

  const assetImage = (id: string) => {
    const definition = ASSETS.find((asset) => asset.id === id);
    const ownedTier = state.assets[id] || 0;
    if (!definition || ownedTier < 1) return "";
    const tier = definition.tiers[Math.min(ownedTier, definition.tiers.length) - 1];
    return tier ? getImage(tier.image) : "";
  };

  // The last unlocked company is the player's current flagship.
  const owned = BUSINESSES.filter((b) => (state.businesses[b.id]?.level || 0) > 0);
  const flagship = owned[owned.length - 1];
  const flagshipImg = flagship
    ? getImage(
        ventureImageAtTier(
          flagship.id,
          getBusinessTierIndex(state.businesses[flagship.id].level),
          state.businesses[flagship.id].choices,
        ),
      )
    : "";

  const workImg = getImage(derived.job.scene);
  const lifestyleLayers: SceneLayer[] = [
    { key: "home", src: assetImage("house"), className: "left-0 top-0 w-1/2 h-1/2" },
    { key: "business", src: flagshipImg, className: "right-0 top-0 w-1/4 h-1/2" },
    { key: "car", src: assetImage("car"), className: "left-0 bottom-0 w-1/2 h-1/2" },
    { key: "food", src: assetImage("food"), className: "right-1/4 top-0 w-1/4 h-1/2" },
    { key: "wardrobe", src: assetImage("wardrobe"), className: "right-0 bottom-0 w-1/6 h-1/2" },
    { key: "watch", src: assetImage("watch"), className: "right-1/6 bottom-0 w-1/3 h-1/2" },
  ].filter((layer) => layer.src);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-background" aria-hidden>
      <AnimatePresence>
        {workImg && (
          <motion.img
            key={workImg}
            src={workImg}
            alt=""
            initial={{ opacity: 0 }}
            animate={{ opacity: lifestyleLayers.length > 0 ? 0.24 : 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9 }}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}

        {lifestyleLayers.map((layer) => (
          <motion.div
            key={layer.key + layer.src}
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 0.52, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9 }}
            className={`absolute overflow-hidden border-border/40 ${layer.className}`}
          >
            <img src={layer.src} alt="" className="h-full w-full object-cover" />
          </motion.div>
        ))}
      </AnimatePresence>
      <div className="absolute inset-0 bg-background/25" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/35 via-background/55 to-background/90" />
      <div className="absolute inset-y-0 left-1/2 w-full max-w-xl -translate-x-1/2 bg-background/35" />
    </div>
  );
}
