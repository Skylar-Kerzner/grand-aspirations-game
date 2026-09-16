import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGame } from "@/lib/GameContext";
import { Button } from "@/components/ui/button";

export default function EventModal() {
  const { state } = useGame();
  const latest = state.events[0];
  const seen = useRef<string | null>(latest ? `${latest.day}-${latest.title}` : null);
  const [openEvent, setOpenEvent] = useState<typeof latest | null>(null);

  useEffect(() => {
    if (!latest) return;
    const key = `${latest.day}-${latest.title}`;
    if (seen.current === key) return;
    seen.current = key;
    setOpenEvent(latest);
  }, [latest]);

  return (
    <AnimatePresence>
      {openEvent && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-background/80 px-5 backdrop-blur-md"
          onClick={() => setOpenEvent(null)}
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            className="surface-card w-full max-w-sm rounded-lg border p-5 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">Surprise event · Day {openEvent.day}</p>
            <h2 className={`mb-2 text-xl font-semibold ${openEvent.tone === "good" ? "text-primary" : openEvent.tone === "bad" ? "text-destructive" : "text-foreground"}`}>
              {openEvent.title}
            </h2>
            <p className="mb-5 text-sm leading-relaxed text-muted-foreground">{openEvent.text}</p>
            <Button className="w-full" onClick={() => setOpenEvent(null)}>Continue</Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}