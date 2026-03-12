import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/lib/GameContext";
import { formatMoney, formatCompact } from "@/lib/formatters";
import { BUSINESSES, getBusinessCost, getBusinessTierIndex, BUSINESS_TIER_THRESHOLDS } from "@/lib/gameData";
import { getImage } from "@/lib/gameImages";

export default function BusinessList() {
  const { state, dispatch } = useGame();
  const [selected, setSelected] = useState<string | null>(null);

  const selectedDef = BUSINESSES.find((b) => b.id === selected);
  const selectedBiz = selected ? (state.businesses[selected] || { level: 0, hasManager: false, accumulated: 0 }) : null;

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        {BUSINESSES.map((def) => {
          const biz = state.businesses[def.id] || { level: 0, hasManager: false, accumulated: 0 };
          const tierIdx = getBusinessTierIndex(biz.level);
          const tierName = def.tierNames[tierIdx];
          const tierImage = getImage(def.tierImages[tierIdx]);
          const income = def.baseIncome * biz.level;

          return (
            <motion.div
              key={def.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelected(def.id)}
              className="surface-card rounded-xl overflow-hidden cursor-pointer transition-game"
            >
              <div className="aspect-[4/3] bg-secondary relative">
                {tierImage && biz.level > 0 ? (
                  <img src={tierImage} alt={tierName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                    {def.name}
                  </div>
                )}
                {biz.level > 0 && (
                  <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded px-1.5 py-0.5 text-[10px] font-medium">
                    Lv.{biz.level}
                  </div>
                )}
                {biz.hasManager && (
                  <div className="absolute top-2 left-2 bg-primary/80 backdrop-blur-sm rounded px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                    Managed
                  </div>
                )}
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-sm">{def.name}</h3>
                <p className="text-[11px] text-muted-foreground">
                  {biz.level > 0 ? tierName : def.sector}
                </p>
                {biz.level > 0 && (
                  <p className="font-mono-nums text-[11px] text-primary mt-1">
                    +{formatMoney(income)}/s
                  </p>
                )}
                {biz.level === 0 && (
                  <p className="font-mono-nums text-[11px] text-muted-foreground mt-1">
                    {formatMoney(def.baseCost)}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Fullscreen Detail Modal */}
      <AnimatePresence>
        {selected && selectedDef && selectedBiz && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-lg flex flex-col"
            onClick={() => setSelected(null)}
          >
            <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="w-full max-w-lg">
                {/* Close */}
                <button onClick={() => setSelected(null)} className="mb-4 text-muted-foreground text-sm hover:text-foreground transition-colors">
                  Close
                </button>

                {/* Business Image */}
                {(() => {
                  const tierIdx = getBusinessTierIndex(selectedBiz.level);
                  const tierImage = getImage(selectedDef.tierImages[tierIdx]);
                  const tierName = selectedDef.tierNames[tierIdx];
                  return (
                    <div className="aspect-[16/10] rounded-xl overflow-hidden bg-secondary mb-4">
                      {selectedBiz.level > 0 && tierImage ? (
                        <motion.img
                          key={tierIdx}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.5 }}
                          src={tierImage}
                          alt={tierName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          Not yet purchased
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Info */}
                <h2 className="text-xl font-bold tracking-tight">{selectedDef.name}</h2>
                <p className="text-sm text-muted-foreground mb-1">
                  {selectedBiz.level > 0
                    ? `${selectedDef.tierNames[getBusinessTierIndex(selectedBiz.level)]} · Level ${selectedBiz.level}`
                    : selectedDef.description}
                </p>
                {selectedBiz.level > 0 && (
                  <p className="text-xs text-primary mb-1">
                    +{formatMoney(selectedDef.baseIncome * selectedBiz.level)}/s
                    {selectedBiz.hasManager && <span className="text-muted-foreground ml-1">(auto-collected)</span>}
                  </p>
                )}

                {/* Tier Progress */}
                <div className="space-y-2 my-4">
                  {selectedDef.tierNames.map((name, i) => {
                    const threshold = BUSINESS_TIER_THRESHOLDS[i];
                    const reached = selectedBiz.level >= threshold;
                    const tierImg = getImage(selectedDef.tierImages[i]);
                    return (
                      <div key={i} className={`flex items-center gap-3 py-2 ${i < selectedDef.tierNames.length - 1 ? "border-b border-border" : ""}`}>
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                          {tierImg ? (
                            <img src={tierImg} alt={name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${reached ? "text-foreground" : "text-muted-foreground"}`}>
                            {name}
                          </p>
                          <p className="text-[11px] text-muted-foreground">Level {threshold}+</p>
                        </div>
                        <div className="text-right">
                          {reached ? (
                            <span className="text-xs text-primary">Reached</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              {threshold - selectedBiz.level} levels away
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Collect */}
                {selectedBiz.level > 0 && !selectedBiz.hasManager && selectedBiz.accumulated > 0.01 && (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => dispatch({ type: "COLLECT_BUSINESS", id: selectedDef.id })}
                    className="w-full h-11 rounded-lg bg-primary/10 text-primary font-semibold text-sm mb-2 transition-game"
                  >
                    Collect <span className="font-mono-nums">{formatCompact(selectedBiz.accumulated)}</span>
                  </motion.button>
                )}

                {/* Buy / Upgrade */}
                {(() => {
                  const cost = getBusinessCost(selectedDef.baseCost, selectedDef.costMultiplier, selectedBiz.level);
                  const canAfford = state.cash >= cost;
                  return (
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => dispatch({ type: "BUY_BUSINESS", id: selectedDef.id })}
                      disabled={!canAfford}
                      className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-semibold text-sm transition-game disabled:opacity-40 mb-2"
                    >
                      {selectedBiz.level === 0 ? "Buy" : "Upgrade"} · <span className="font-mono-nums">{formatCompact(cost)}</span>
                    </motion.button>
                  );
                })()}

                {/* Manager */}
                {selectedBiz.level > 0 && !selectedBiz.hasManager && (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => dispatch({ type: "HIRE_MANAGER", id: selectedDef.id })}
                    disabled={state.cash < selectedDef.managerCost}
                    className="w-full h-11 rounded-lg surface-button font-semibold text-sm transition-game disabled:opacity-40"
                  >
                    Hire Manager · <span className="font-mono-nums">{formatCompact(selectedDef.managerCost)}</span>
                  </motion.button>
                )}
                {selectedBiz.hasManager && (
                  <p className="text-center text-xs text-muted-foreground mt-1">Manager auto-collects income</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
