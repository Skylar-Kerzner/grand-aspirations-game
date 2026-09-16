import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/lib/GameContext";
import { formatMoney } from "@/lib/formatters";
import { ASSETS } from "@/lib/gameData";
import { getImage } from "@/lib/gameImages";

export default function AssetGallery() {
  const { state, derived, dispatch } = useGame();
  const [selected, setSelected] = useState<string | null>(null);

  const selectedDef = ASSETS.find((a) => a.id === selected);
  const selectedTier = selected ? (state.assets[selected] || 0) : 0;

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        {ASSETS.map((def) => {
          const tier = Math.max(1, state.assets[def.id] || 1);
          const currentTier = def.tiers[tier - 1];
          const img = getImage(currentTier.image);

          return (
            <motion.div
              key={def.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelected(def.id)}
              className="surface-card rounded-xl overflow-hidden cursor-pointer transition-game"
            >
              <div className="aspect-[4/3] bg-secondary relative">
                {img ? (
                  <img src={img} alt={currentTier?.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                    Not owned
                  </div>
                )}
                <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded px-1.5 py-0.5 text-[10px] font-medium">
                  Tier {tier}
                </div>
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-sm">{def.name}</h3>
                <p className="text-[11px] text-muted-foreground">
                  {currentTier.name}
                </p>
                <p className="font-mono-nums text-[11px] text-primary mt-1">{formatMoney(currentTier.dailyCost)}/day</p>
                <p className="text-[10px] text-muted-foreground mt-1">{currentTier.benefit}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Showcase Modal */}
      <AnimatePresence>
        {selected && selectedDef && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-lg flex flex-col"
            onClick={() => setSelected(null)}
          >
            <div className="flex-1 flex items-center justify-center p-6" onClick={(e) => e.stopPropagation()}>
              <div className="w-full max-w-lg">
                {/* Close */}
                <button onClick={() => setSelected(null)} className="mb-4 text-muted-foreground text-sm hover:text-foreground transition-colors">
                  Close
                </button>

                {/* Asset Image */}
                <div className="aspect-[16/10] rounded-xl overflow-hidden bg-secondary mb-4">
                   {getImage(selectedDef.tiers[Math.max(1, selectedTier) - 1].image) ? (
                    <motion.img
                      key={selectedTier}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                       src={getImage(selectedDef.tiers[Math.max(1, selectedTier) - 1].image)}
                       alt={selectedDef.tiers[Math.max(1, selectedTier) - 1].name}
                       width={1024}
                       height={640}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      Not yet acquired
                    </div>
                  )}
                </div>

                {/* Info */}
                <h2 className="text-xl font-bold tracking-tight">{selectedDef.name}</h2>
                <p className="text-sm text-muted-foreground mb-1">
                  {selectedDef.tiers[Math.max(1, selectedTier) - 1].name}
                </p>
                <p className="text-xs text-primary mb-1">{selectedDef.tiers[Math.max(1, selectedTier) - 1].benefit}</p>
                <p className="text-[11px] text-muted-foreground mb-4">
                  Lifestyle costs {formatMoney(derived.livingCosts)}/day total. Better choices accelerate promotions and school.
                </p>

                {/* Tiers — tap a row to choose it */}
                <div className="space-y-2">
                  {selectedDef.tiers.map((tier, i) => {
                    const isCurrent = i + 1 === selectedTier;
                    return (
                      <motion.button
                        key={tier.name}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => dispatch({ type: "SET_LIFESTYLE", id: selectedDef.id, tier: i + 1 })}
                        disabled={isCurrent}
                        className={`w-full flex items-center gap-3 rounded-lg p-3 text-left transition-game ${isCurrent ? "bg-primary/15 ring-1 ring-primary/40" : "surface-button"}`}
                      >
                        <div className="w-16 h-12 rounded-md overflow-hidden bg-secondary shrink-0">
                          {getImage(tier.image) && (
                            <img src={getImage(tier.image)} alt={tier.name} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <span className="flex-1 min-w-0">
                          <span className={`block text-sm font-medium ${isCurrent ? "text-primary" : "text-foreground"}`}>
                            {tier.name}
                          </span>
                          <span className="block text-[11px] text-muted-foreground">{tier.benefit}</span>
                        </span>
                        <span className="text-right shrink-0">
                          <span className={`block font-mono-nums text-xs ${isCurrent ? "text-primary" : "text-foreground"}`}>
                            {formatMoney(tier.dailyCost)}/day
                          </span>
                          <span className="block text-[10px] text-muted-foreground">
                            {isCurrent ? "Current" : "Tap to choose"}
                          </span>
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
