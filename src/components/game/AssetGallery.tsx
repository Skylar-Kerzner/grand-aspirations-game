import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/lib/GameContext";
import { formatMoney } from "@/lib/formatters";
import { ASSETS } from "@/lib/gameData";
import { getImage } from "@/lib/gameImages";

export default function AssetGallery() {
  const { state, dispatch } = useGame();
  const [selected, setSelected] = useState<string | null>(null);

  const selectedDef = ASSETS.find((a) => a.id === selected);
  const selectedTier = selected ? (state.assets[selected] || 0) : 0;

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        {ASSETS.map((def) => {
          const tier = state.assets[def.id] || 0;
          const currentTier = tier > 0 ? def.tiers[tier - 1] : null;
          const nextTier = tier < def.tiers.length ? def.tiers[tier] : null;
          const img = currentTier ? getImage(currentTier.image) : "";

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
                {tier > 0 && (
                  <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded px-1.5 py-0.5 text-[10px] font-medium">
                    Tier {tier}
                  </div>
                )}
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-sm">{def.name}</h3>
                <p className="text-[11px] text-muted-foreground">
                  {currentTier ? currentTier.name : "Not acquired"}
                </p>
                {nextTier && (
                  <p className="font-mono-nums text-[11px] text-primary mt-1">
                    Next: {formatMoney(nextTier.cost)}
                  </p>
                )}
                {!nextTier && tier > 0 && (
                  <p className="text-[11px] text-primary mt-1">Max tier</p>
                )}
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
                  {selectedTier > 0 && getImage(selectedDef.tiers[selectedTier - 1].image) ? (
                    <motion.img
                      key={selectedTier}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                      src={getImage(selectedDef.tiers[selectedTier - 1].image)}
                      alt={selectedDef.tiers[selectedTier - 1].name}
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
                  {selectedTier > 0 ? selectedDef.tiers[selectedTier - 1].name : "Not owned"}
                </p>
                {selectedTier > 0 && (
                  <p className="text-xs text-primary mb-4">{selectedDef.tiers[selectedTier - 1].benefit}</p>
                )}

                {/* Tiers */}
                <div className="space-y-2 mb-4">
                  {selectedDef.tiers.map((tier, i) => (
                    <div key={i} className={`flex items-center justify-between py-2 ${i < selectedDef.tiers.length - 1 ? "border-b border-border" : ""}`}>
                      <div>
                        <p className={`text-sm ${i < selectedTier ? "text-foreground" : "text-muted-foreground"}`}>
                          {tier.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground">{tier.benefit}</p>
                      </div>
                      <div className="text-right">
                        {i < selectedTier ? (
                          <span className="text-xs text-primary">Owned</span>
                        ) : (
                          <span className="font-mono-nums text-xs text-muted-foreground">{formatMoney(tier.cost)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Buy Next */}
                {selectedTier < selectedDef.tiers.length && (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => dispatch({ type: "BUY_ASSET", id: selectedDef.id })}
                    disabled={state.cash < selectedDef.tiers[selectedTier].cost}
                    className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-semibold text-sm transition-game disabled:opacity-40"
                  >
                    Upgrade to {selectedDef.tiers[selectedTier].name} · {formatMoney(selectedDef.tiers[selectedTier].cost)}
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
