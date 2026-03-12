import { motion } from "framer-motion";
import { useGame } from "@/lib/GameContext";
import { formatMoney, formatCompact } from "@/lib/formatters";
import { BUSINESSES, getBusinessCost, getBusinessTierIndex } from "@/lib/gameData";
import { getImage } from "@/lib/gameImages";

export default function BusinessList() {
  const { state, dispatch } = useGame();

  return (
    <div className="space-y-3">
      {BUSINESSES.map((def) => {
        const biz = state.businesses[def.id] || { level: 0, hasManager: false, accumulated: 0 };
        const cost = getBusinessCost(def.baseCost, def.costMultiplier, biz.level);
        const canAfford = state.cash >= cost;
        const tierIdx = getBusinessTierIndex(biz.level);
        const tierName = def.tierNames[tierIdx];
        const tierImage = getImage(def.tierImages[tierIdx]);
        const income = def.baseIncome * biz.level;

        return (
          <div key={def.id} className="surface-card rounded-xl p-4 animate-fade-up">
            <div className="flex gap-3">
              {/* Thumbnail */}
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                {tierImage ? (
                  <img src={tierImage} alt={tierName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-[10px] uppercase tracking-wider text-center px-1">
                    {def.name}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-semibold text-sm truncate">{def.name}</h3>
                  {biz.level > 0 && (
                    <span className="text-[10px] text-muted-foreground ml-2">Lv.{biz.level}</span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">{biz.level > 0 ? tierName : def.description}</p>
                {biz.level > 0 && (
                  <p className="font-mono-nums text-xs text-primary mt-0.5">
                    +{formatMoney(income)}/s
                    {biz.hasManager && <span className="text-muted-foreground ml-1">(managed)</span>}
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-3">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => dispatch({ type: "BUY_BUSINESS", id: def.id })}
                disabled={!canAfford}
                className="flex-1 h-9 rounded-lg surface-button text-xs font-medium transition-game disabled:opacity-40"
              >
                {biz.level === 0 ? "Buy" : "Upgrade"} · <span className="font-mono-nums">{formatCompact(cost)}</span>
              </motion.button>

              {biz.level > 0 && !biz.hasManager && biz.accumulated > 0.01 && (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => dispatch({ type: "COLLECT_BUSINESS", id: def.id })}
                  className="h-9 px-3 rounded-lg bg-primary/10 text-primary text-xs font-medium transition-game"
                >
                  Collect <span className="font-mono-nums">{formatCompact(biz.accumulated)}</span>
                </motion.button>
              )}

              {biz.level > 0 && !biz.hasManager && (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => dispatch({ type: "HIRE_MANAGER", id: def.id })}
                  disabled={state.cash < def.managerCost}
                  className="h-9 px-3 rounded-lg surface-button text-xs font-medium transition-game disabled:opacity-40"
                >
                  Manager · <span className="font-mono-nums">{formatCompact(def.managerCost)}</span>
                </motion.button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
