import { motion } from "framer-motion";
import { useGame } from "@/lib/GameContext";
import { formatMoney, formatCompact } from "@/lib/formatters";

export default function WorkButton() {
  const { state, derived, dispatch } = useGame();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur-md border-t border-border px-4 py-3">
      <div className="max-w-md mx-auto flex gap-3">
        <motion.button
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.1 }}
          onClick={() => dispatch({ type: "WORK" })}
          className="flex-1 h-12 rounded-lg bg-primary text-primary-foreground font-semibold text-sm tracking-wide transition-game"
        >
          WORK — {formatMoney(derived.workIncome)}
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.1 }}
          onClick={() => dispatch({ type: "UPGRADE_WORK" })}
          disabled={state.cash < derived.workUpgradeCost}
          className="h-12 px-4 rounded-lg surface-button text-foreground text-xs font-medium transition-game disabled:opacity-40"
        >
          Upgrade<br />
          <span className="font-mono-nums text-muted-foreground">{formatCompact(derived.workUpgradeCost)}</span>
        </motion.button>
      </div>
    </div>
  );
}
