import { createContext } from "react";
import type { GameState, DerivedState, GameAction } from "./GameContext";

export interface GameContextType {
  state: GameState;
  derived: DerivedState;
  dispatch: React.Dispatch<GameAction>;
}

export const GameContext = createContext<GameContextType | null>(null);
