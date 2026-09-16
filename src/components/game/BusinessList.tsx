import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useGame,
  getBusinessSteadyIncomeOf,
  isBusinessUnlocked,
  businessIncomeOf,
  upgradeCostFor,
  getBusinessEffectiveROI,
  getBusinessNetworkBonus,
  getNextBusinessNetworkMilestone,
  getBusinessUpgradeIncomeGain,
  getBusinessSalePrice,
} from "@/lib/GameContext";
import { formatMoney, formatCompact, formatRate } from "@/lib/formatters";
import {
  BUSINESSES,
  getBusinessTierIndex,
  BUSINESS_TIER_THRESHOLDS,
  BUSINESS_CONCEPTS,
  BUSINESS_LOCATIONS,
  getBusinessConcept,
  getBusinessLocation,
  ventureName,
  ventureNameAtTier,
  ventureImageAtTier,
  businessFortuneLabel,
} from "@/lib/gameData";
import { getImage } from "@/lib/gameImages";

function conditionLabel(c: number) {
  if (c >= 1.15) return { text: "Booming", tone: "text-primary" };
  if (c >= 1.04) return { text: "Strong trade", tone: "text-primary" };
  if (c >= 0.96) return { text: "Steady trade", tone: "text-muted-foreground" };
  if (c >= 0.8) return { text: "Slow trade", tone: "text-muted-foreground" };
  return { text: "Struggling", tone: "text-destructive" };
}

function riskLabel(risk: number) {
  if (risk >= 0.5) return "High risk";
  if (risk >= 0.35) return "Moderate risk";
  return "Lower risk";
}

export default function BusinessList() {
  const { state, dispatch } = useGame();
  const [selected, setSelected] = useState<string | null>(null);
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [confirmSell, setConfirmSell] = useState(false);

  const openBusiness = (id: string) => {
    const cur = state.businesses[id];
    setSelected(id);
    setConfirmSell(false);
    setChoices({
      concept: cur?.choices?.concept || BUSINESS_CONCEPTS[id]?.[0].id || "",
      location: cur?.choices?.location || BUSINESS_LOCATIONS[id]?.[0].id || "",
    });
  };


  const selectedDef = BUSINESSES.find((b) => b.id === selected);
  const selectedBiz = selected
    ? state.businesses[selected] || { level: 0, condition: 1 }
    : null;
  const ventureTitle = selected && selectedBiz && selectedBiz.level > 0 && selectedBiz.choices
    ? ventureNameAtTier(selected, getBusinessTierIndex(selectedBiz.level), selectedBiz.choices)
    : selectedDef?.name || "";

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        {BUSINESSES.map((def, idx) => {
          const biz = state.businesses[def.id] || { level: 0, condition: 1 };
          const unlocked = isBusinessUnlocked(state, def.id);
          const tierIdx = getBusinessTierIndex(biz.level);
          const owned = biz.level > 0 && !!biz.choices;
          const concept = owned ? getBusinessConcept(def.id, biz.choices?.concept || "") : undefined;
          const tierName = concept?.tierNames[tierIdx] || def.tierNames[tierIdx];
          const tierImage = owned
            ? getImage(ventureImageAtTier(def.id, tierIdx, biz.choices)) || getImage(concept?.image || "") || getImage(def.tierImages[tierIdx])
            : getImage(def.tierImages[tierIdx]);
          const displayName = owned ? ventureNameAtTier(def.id, tierIdx, biz.choices) : def.name;
          const income = businessIncomeOf(state, def.id);
          const networkBonus = getBusinessNetworkBonus(state, def.id);
          const condition = conditionLabel(biz.condition ?? 1);

          return (
            <motion.div
              key={def.id}
              whileTap={unlocked ? { scale: 0.98 } : undefined}
              onClick={() => unlocked && openBusiness(def.id)}
              className={`surface-card rounded-xl overflow-hidden transition-game ${
                unlocked ? "cursor-pointer" : "opacity-50"
              }`}
            >
              <div className="aspect-[4/3] bg-secondary relative">
                    {tierImage && (biz.level > 0 || unlocked) ? (
                  <img
                    src={tierImage}
                    alt={biz.level > 0 ? displayName : def.name}
                    loading="lazy"
                    className={`w-full h-full object-cover ${biz.level > 0 ? "" : "opacity-40 grayscale"}`}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs px-2 text-center">
                    {def.name}
                  </div>
                )}

                {biz.level > 0 && (
                  <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded px-1.5 py-0.5 text-[10px] font-medium">
                    Lv.{biz.level}
                  </div>
                )}
                {biz.level > 0 && (
                  <div className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm rounded px-1.5 py-0.5 text-[10px] font-medium">
                    {condition.text}
                  </div>
                )}
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-sm leading-tight">{displayName}</h3>
                <p className="text-[11px] text-muted-foreground">
                  {!unlocked
                    ? `Needs ${BUSINESSES[idx - 1]?.name} at level ${def.unlockLevelOfPrev}`
                    : biz.level > 0
                      ? tierName
                      : def.sector}
                </p>
                {unlocked && biz.level > 0 && (
                  <div className="mt-1">
                    <p className="font-mono-nums text-[11px] text-primary">{formatRate(income)}</p>
                    {networkBonus > 0 && (
                      <p className="text-[10px] text-primary">+{(networkBonus * 100).toFixed(0)}% network</p>
                    )}
                    <p className={`text-[10px] ${condition.tone}`}>{condition.text}</p>
                  </div>
                )}
                {unlocked && biz.level === 0 && (
                  <>
                    <p className="font-mono-nums text-[11px] text-muted-foreground mt-1">
                      {formatCompact(def.baseCost)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{riskLabel(def.risk)}</p>
                  </>
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
            <div
              className="flex items-center justify-between px-5 py-4 border-b border-border"
              onClick={(e) => e.stopPropagation()}
            >
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Cash</p>
                <p className="font-mono-nums text-lg font-bold">{formatMoney(state.cash)}</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-muted-foreground text-sm hover:text-foreground transition-colors"
              >
                Close
              </button>
            </div>

            <div
              className="flex-1 flex items-start justify-center p-6 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-full max-w-lg">
                {(() => {
                  const tierIdx = getBusinessTierIndex(selectedBiz.level);
                  const ownedHere = selectedBiz.level > 0 && !!selectedBiz.choices;
                  const conceptHere = ownedHere
                    ? getBusinessConcept(selectedDef.id, selectedBiz.choices?.concept || "")
                    : undefined;
                  const tierImage = ownedHere
                    ? getImage(ventureImageAtTier(selectedDef.id, tierIdx, selectedBiz.choices)) ||
                      getImage(conceptHere?.image || "") ||
                      getImage(selectedDef.tierImages[tierIdx])
                    : getImage(selectedDef.tierImages[tierIdx]);
                  const tierName = conceptHere?.tierNames[tierIdx] || selectedDef.tierNames[tierIdx];
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

                <h2 className="text-xl font-bold tracking-tight leading-tight">{ventureTitle}</h2>
                <p className="text-sm text-muted-foreground mb-1">
                  {selectedBiz.level > 0
                    ? `${selectedDef.name} · Level ${selectedBiz.level}`
                    : selectedDef.description}
                </p>
                <p className="text-[11px] text-muted-foreground mb-1">
                  {(getBusinessEffectiveROI(state, selectedDef.id) * 100).toFixed(0)}% effective annual return
                  {getBusinessNetworkBonus(state, selectedDef.id) > 0
                    ? ` · +${(getBusinessNetworkBonus(state, selectedDef.id) * 100).toFixed(0)}% network bonus`
                    : " · 30% base return"}
                </p>
                <p className="text-[11px] text-muted-foreground mb-1">
                  {riskLabel(selectedDef.risk)} · profits swing about {(selectedDef.risk * 100).toFixed(0)}% a year and setbacks can hit trade for a while. Income is paid to you automatically every day.
                </p>
                {selectedBiz.level > 0 && (
                  <p className={`text-xs mb-1 ${conditionLabel(selectedBiz.condition ?? 1).tone}`}>
                    {conditionLabel(selectedBiz.condition ?? 1).text} — {((selectedBiz.condition ?? 1) * 100).toFixed(0)}% of normal takings
                  </p>
                )}
                {selectedBiz.level > 0 && (
                  <p className="text-xs text-primary mb-1">
                    {formatRate(businessIncomeOf(state, selectedDef.id))} today
                    <span className="text-muted-foreground ml-1">
                      (normal trade {formatRate(getBusinessSteadyIncomeOf(state, selectedDef.id))})
                    </span>
                  </p>
                )}

                {(() => {
                  const next = getNextBusinessNetworkMilestone(state, selectedDef.id);
                  if (!next) {
                    return (
                      <div className="surface-card rounded-lg p-3 my-4 text-xs text-primary">
                        Every neighboring business network is fully developed.
                      </div>
                    );
                  }
                  return (
                    <div className="surface-card rounded-lg p-3 my-4">
                      <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Next network milestone</p>
                      <p className="text-sm font-semibold mt-1">{selectedDef.name} + {next.partner.name}</p>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Reach level {next.level} in both for +{(next.bonus * 100).toFixed(0)}% income on each.
                      </p>
                      <p className="text-[11px] text-primary mt-1">
                        {next.ownLevelsNeeded > 0 ? `${selectedDef.name}: ${next.ownLevelsNeeded} levels` : `${selectedDef.name}: ready`}
                        {" · "}
                        {next.partnerLevelsNeeded > 0 ? `${next.partner.name}: ${next.partnerLevelsNeeded} levels` : `${next.partner.name}: ready`}
                      </p>
                    </div>
                  );
                })()}

                {/* Tier progress — nothing revealed before you get there */}
                <div className="space-y-2 my-4">
                  {selectedDef.tierNames.map((name, i) => {
                    const threshold = BUSINESS_TIER_THRESHOLDS[i];
                    const reached = selectedBiz.level >= threshold;
                    const tierImg = getImage(selectedDef.tierImages[i]);
                    return (
                      <div
                        key={i}
                        className={`flex items-center gap-3 py-2 ${
                          i < selectedDef.tierNames.length - 1 ? "border-b border-border" : ""
                        }`}
                      >
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                          {reached && tierImg ? (
                            <img src={tierImg} alt={name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${reached ? "text-foreground" : "text-muted-foreground"}`}>
                            {reached ? name : "?"}
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

                {(selectedBiz.level === 0 ||
                  getBusinessTierIndex(selectedBiz.level + 1) !== getBusinessTierIndex(selectedBiz.level)) && (
                  <div className="surface-card rounded-lg p-3 my-4 space-y-4">
                    <p className="text-[11px] text-muted-foreground">
                      {selectedBiz.level > 0
                        ? "Stepping up a tier is a chance to rebrand — pick a new concept or city before you expand."
                        : "Give the venture an identity. You find out how it went once the doors open."}
                    </p>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-2">Concept</p>
                      <div className="grid grid-cols-3 gap-2">
                        {(BUSINESS_CONCEPTS[selectedDef.id] || []).map((option) => {
                          const active = choices.concept === option.id;
                          const img = getImage(option.image);
                          return (
                            <button
                              key={option.id}
                              onClick={() => setChoices((c) => ({ ...c, concept: option.id }))}
                              className={`text-left rounded-lg overflow-hidden border transition-game ${
                                active ? "border-primary" : "border-border"
                              }`}
                            >
                              <div className="aspect-[4/3] bg-secondary">
                                {img && <img src={img} alt={option.name} loading="lazy" className="w-full h-full object-cover" />}
                              </div>
                              <div className="p-1.5">
                                <p className={`text-[11px] leading-tight ${active ? "text-primary" : ""}`}>{option.name}</p>
                                <p className="text-[9px] text-muted-foreground leading-tight mt-0.5">{option.description}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-2">Location</p>
                      <div className="flex gap-2">
                        {(BUSINESS_LOCATIONS[selectedDef.id] || []).map((loc) => {
                          const active = choices.location === loc.id;
                          return (
                            <button
                              key={loc.id}
                              onClick={() => setChoices((c) => ({ ...c, location: loc.id }))}
                              className={`px-3 py-1.5 rounded-lg border text-xs transition-game ${
                                active ? "border-primary bg-primary/10 text-primary" : "border-border"
                              }`}
                            >
                              {loc.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {selectedBiz.level > 0 ? "You'd run it as:" : "You'd open:"}{" "}
                      <span className="text-foreground font-medium">
                        {ventureNameAtTier(selectedDef.id, getBusinessTierIndex(selectedBiz.level + 1), choices)}
                      </span>
                    </p>
                  </div>
                )}

                {selectedBiz.level > 0 && selectedBiz.choices && (
                  <div className="surface-card rounded-lg p-3 my-4">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Overall business success</p>
                    <p className="text-sm font-semibold mt-1">
                      {businessFortuneLabel(selectedBiz.fortune ?? 1)} —{" "}
                      {((selectedBiz.fortune ?? 1) * selectedDef.annualROI * 100).toFixed(0)}% return on capital
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1">{ventureName(selectedDef.id, selectedBiz.choices)}</p>

                  </div>
                )}

                {(() => {
                  const cost = upgradeCostFor(state, selectedDef.id);
                  const canAfford = state.cash >= cost;
                  const addedIncome = getBusinessUpgradeIncomeGain(state, selectedDef.id);
                  const salePrice = getBusinessSalePrice(state, selectedDef.id);
                  return (
                    <>
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() =>
                          dispatch({
                            type: "BUY_BUSINESS",
                            id: selectedDef.id,
                            choices,
                          })
                        }
                        disabled={!canAfford}
                        className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-semibold text-sm transition-game disabled:opacity-40 mb-1"
                      >
                        {selectedBiz.level === 0 ? "Open" : "Upgrade"} ·{" "}
                        <span className="font-mono-nums">{formatCompact(cost)}</span>
                      </motion.button>
                      <p className="text-center text-[11px] text-muted-foreground mb-2">
                        {selectedBiz.level === 0
                          ? "Adds income once you see how it trades"
                          : `Adds ${formatRate(addedIncome)} across your businesses`}
                      </p>
                      {selectedBiz.level > 0 &&
                        getBusinessTierIndex(selectedBiz.level + 1) !== getBusinessTierIndex(selectedBiz.level) && (
                        <p className="text-center text-[11px] text-muted-foreground mb-2">
                          Moving up a tier puts part of its luck back on the table — a great venture can come
                          back to earth, and a poor one can turn around.
                        </p>
                      )}

                      {selectedBiz.level > 0 && (
                        <>
                          <button
                            onClick={() => {
                              if (!confirmSell) { setConfirmSell(true); return; }
                              dispatch({ type: "SELL_BUSINESS", id: selectedDef.id });
                              setConfirmSell(false);
                            }}
                            className="w-full h-10 rounded-lg border border-border text-sm transition-game"
                          >
                            {confirmSell ? "Confirm sale" : "Sell"} ·{" "}
                            <span className="font-mono-nums">{formatCompact(salePrice)}</span>
                          </button>
                          <p className="text-center text-[11px] text-muted-foreground mt-1 mb-2">
                            {confirmSell
                              ? "You keep the cash and give up every level. Opening again starts fresh."
                              : "The price reflects how well it has actually done. Open it again to try different choices."}
                          </p>
                        </>
                      )}
                    </>
                  );
                })()}

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
