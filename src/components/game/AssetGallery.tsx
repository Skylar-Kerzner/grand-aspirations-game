import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGame, getTimeBudget, getLifestyleHours, getAssetLook, isAssetLookChosen } from "@/lib/GameContext";
import { formatMoney, periodLabel } from "@/lib/formatters";
import { ASSETS, BASE_TIME_BUDGET, assetLooks } from "@/lib/gameData";
import { getImage } from "@/lib/gameImages";

function hoursLabel(hours: number): string {
  if (hours > 0) return `+${hours}h a week`;
  if (hours < 0) return `${hours}h a week`;
  return "No change to your week";
}

export default function AssetGallery() {
  const { state, derived, dispatch } = useGame();
  const [selected, setSelected] = useState<string | null>(null);
  /** Which tier row is showing its choice of looks. */
  const [choosing, setChoosing] = useState<number | null>(null);

  const selectedDef = ASSETS.find((a) => a.id === selected);
  const selectedTier = selected ? Math.max(1, state.assets[selected] || 1) : 0;
  const budget = getTimeBudget(state);
  const lifestyleHours = getLifestyleHours(state);
  const period = periodLabel(derived.recentCashFlowDays);

  return (
    <>
      {/* Your week, at a glance */}
      <div className="surface-card rounded-xl p-4 mb-3">
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Your week</h3>
        <p className="font-mono-nums text-lg">
          {BASE_TIME_BUDGET}h base {lifestyleHours >= 0 ? "+" : "−"} {Math.abs(lifestyleHours)}h lifestyle = {budget}h
        </p>
        <p className="text-[11px] text-muted-foreground mt-1">
          Every lifestyle choice is a standing daily cost that either costs you hours or buys them back.
          Those hours are what you spend on your job, school and your businesses.
        </p>
        <p className="text-[11px] text-muted-foreground font-mono-nums mt-1">
          Lifestyle costs {formatMoney(derived.livingCosts)}/day in total
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {ASSETS.map((def) => {
          const tier = Math.max(1, state.assets[def.id] || 1);
          const currentTier = def.tiers[tier - 1];
          const look = getAssetLook(state, def.id, tier - 1);
          const img = getImage(look?.image || currentTier.image);

          return (
            <motion.div
              key={def.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => { setSelected(def.id); setChoosing(null); }}
              className="surface-card rounded-xl overflow-hidden cursor-pointer transition-game"
            >
              <div className="aspect-[4/3] bg-secondary relative">
                {img ? (
                  <img src={img} alt={currentTier?.name} loading="lazy" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                    Not chosen
                  </div>
                )}
                <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded px-1.5 py-0.5 text-[10px] font-medium">
                  Tier {tier}
                </div>
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-sm">{def.name}</h3>
                <p className="text-[11px] text-muted-foreground">{currentTier.name}</p>
                <p className={`text-[11px] font-medium mt-1 ${currentTier.hoursBonus >= 0 ? "text-primary" : "text-destructive"}`}>
                  {hoursLabel(currentTier.hoursBonus)}
                </p>
                <p className="font-mono-nums text-[11px] text-muted-foreground">{formatMoney(currentTier.dailyCost)}/day</p>
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
            {/* Counters stay visible while you choose */}
            <div
              className="shrink-0 border-b border-border bg-background/80 backdrop-blur-sm px-6 py-3"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="max-w-lg mx-auto grid grid-cols-4 gap-2 text-center">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Income</p>
                  <p className="font-mono-nums text-sm text-primary">{formatMoney(derived.incomePerDay)}/day</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Costs</p>
                  <p className="font-mono-nums text-sm">
                    {formatMoney(derived.livingCosts + derived.trainingCost + derived.operatingCosts + derived.loanPayments + derived.ccPaymentPerDay + derived.studentLoanPayment)}/day
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Net · {period}</p>
                  <p className={`font-mono-nums text-sm ${derived.recentNet >= 0 ? "text-primary" : "text-destructive"}`}>
                    {derived.recentNet >= 0 ? "+" : ""}{formatMoney(derived.recentNet)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Week</p>
                  <p className="font-mono-nums text-sm">{budget}h</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto flex items-start justify-center p-6" onClick={(e) => e.stopPropagation()}>
              <div className="w-full max-w-lg">
                {/* Close */}
                <button onClick={() => setSelected(null)} className="mb-4 text-muted-foreground text-sm hover:text-foreground transition-colors">
                  Close
                </button>

                {/* Lifestyle image — the look you chose at this step */}
                {(() => {
                  const currentLook = getAssetLook(state, selectedDef.id, selectedTier - 1);
                  const currentImg = getImage(currentLook?.image || "");
                  return (
                    <>
                      <div className="aspect-[16/10] rounded-xl overflow-hidden bg-secondary mb-4">
                        {currentImg ? (
                          <motion.img
                            key={currentLook?.image}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5 }}
                            src={currentImg}
                            alt={currentLook?.name}
                            width={1024}
                            height={640}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            No picture yet
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <h2 className="text-xl font-bold tracking-tight">{selectedDef.name}</h2>
                      <p className="text-sm text-muted-foreground mb-1">{currentLook?.name}</p>
                      <p className="text-xs text-primary mb-4">{selectedDef.tiers[selectedTier - 1].benefit}</p>
                    </>
                  );
                })()}

                {/* Tiers — tap a row to choose it */}
                <div className="space-y-2">
                  {selectedDef.tiers.map((tier, i) => {
                    const isCurrent = i + 1 === selectedTier;
                    const hourDelta = tier.hoursBonus - selectedDef.tiers[selectedTier - 1].hoursBonus;
                    const costDelta = tier.dailyCost - selectedDef.tiers[selectedTier - 1].dailyCost;
                    const looks = assetLooks(tier);
                    const chosenLook = getAssetLook(state, selectedDef.id, i);
                    const settled = isAssetLookChosen(state, selectedDef.id, i);
                    const open = choosing === i && !settled;
                    return (
                      <div key={tier.name} className="space-y-2">
                        <motion.button
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            if (settled) {
                              dispatch({ type: "SET_LIFESTYLE", id: selectedDef.id, tier: i + 1 });
                              setChoosing(null);
                            } else {
                              setChoosing(open ? null : i);
                            }
                          }}
                          disabled={isCurrent}
                          className={`w-full flex items-center gap-3 rounded-lg p-3 text-left transition-game ${isCurrent ? "bg-primary/15 ring-1 ring-primary/40" : "surface-button"}`}
                        >
                          <span className="flex-1 min-w-0">
                            <span className={`block text-sm font-medium ${isCurrent ? "text-primary" : "text-foreground"}`}>
                              {isCurrent || settled ? chosenLook?.name : tier.name}
                            </span>
                            <span className={`block text-[11px] font-medium ${tier.hoursBonus >= 0 ? "text-primary" : "text-destructive"}`}>
                              {hoursLabel(tier.hoursBonus)}
                            </span>
                            <span className="block text-[11px] text-muted-foreground">{tier.benefit}</span>
                          </span>
                          <span className="text-right shrink-0">
                            <span className={`block font-mono-nums text-xs ${isCurrent ? "text-primary" : "text-foreground"}`}>
                              {formatMoney(tier.dailyCost)}/day
                            </span>
                            <span className="block text-[10px] text-muted-foreground">
                              {isCurrent
                                ? "Current"
                                : `${hourDelta >= 0 ? "+" : ""}${hourDelta}h · ${costDelta >= 0 ? "+" : "−"}${formatMoney(Math.abs(costDelta))}/day`}
                            </span>
                          </span>
                        </motion.button>

                        {open && !isCurrent && (
                          <div className="rounded-lg border border-border p-3">
                            <p className="text-[11px] text-muted-foreground mb-2">
                              Same price, same hours — pick the one you want to live with. You only see it once you
                              move in, and this step keeps that look for the rest of the game.
                            </p>
                            <div className="grid grid-cols-3 gap-2">
                              {looks.map((look, li) => (
                                <button
                                  key={look.image}
                                  onClick={() => {
                                    dispatch({ type: "SET_LIFESTYLE", id: selectedDef.id, tier: i + 1, look: li });
                                    setChoosing(null);
                                  }}
                                  className="surface-button rounded-md px-2 py-2 text-[11px] leading-tight text-center transition-game"
                                >
                                  {look.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
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
