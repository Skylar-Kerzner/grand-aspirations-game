import { motion } from "framer-motion";
import { useGame } from "@/lib/GameContext";
import { formatMoney } from "@/lib/formatters";
import { JOBS } from "@/lib/gameData";

export default function WorkButton() {
  const { state, derived, dispatch } = useGame();


  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur-md border-t border-border px-4 py-3">
      <div className="max-w-md mx-auto">
        <motion.button
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.1 }}
          onClick={() => dispatch({ type: "WORK" })}
          className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-semibold text-sm tracking-wide transition-game disabled:opacity-40"
        >
          {`Work one extra hour — ${formatMoney(derived.shiftPay)}`}
        </motion.button>
        <p className="text-center text-[10px] text-muted-foreground mt-1.5">
          Level {state.jobIndex + 1} of {JOBS.length} · {derived.job.title} · {derived.job.employer}
        </p>
      </div>
    </div>
  );
}
