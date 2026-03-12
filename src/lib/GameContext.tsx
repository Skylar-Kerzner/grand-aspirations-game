import React, { createContext, useContext, useReducer, useEffect, useMemo, useCallback } from "react";
import { BUSINESSES, ASSETS, INVESTMENTS, LOANS, CONSULTANTS, getBusinessCost as calcBusinessCost } from "./gameData";

export interface BusinessState {
  level: number;
  hasManager: boolean;
  accumulated: number;
}

export interface LoanState {
  active: boolean;
  remaining: number;
}

export interface GameState {
  cash: number;
  totalEarned: number;
  workLevel: number;
  businesses: Record<string, BusinessState>;
  assets: Record<string, number>;
  investments: Record<string, number>;
  loans: Record<string, LoanState>;
  consultants: string[];
  lastTick: number;
}

type GameAction =
  | { type: "TICK" }
  | { type: "WORK" }
  | { type: "UPGRADE_WORK" }
  | { type: "BUY_BUSINESS"; id: string }
  | { type: "COLLECT_BUSINESS"; id: string }
  | { type: "HIRE_MANAGER"; id: string }
  | { type: "BUY_ASSET"; id: string }
  | { type: "INVEST"; id: string; amount: number }
  | { type: "WITHDRAW"; id: string; amount: number }
  | { type: "TAKE_LOAN"; id: string }
  | { type: "REPAY_LOAN"; id: string }
  | { type: "HIRE_CONSULTANT"; id: string };

function getWorkIncome(state: GameState): number {
  let base = 1 + state.workLevel * 2;
  const carTier = state.assets["car"] || 0;
  if (carTier > 0) {
    base *= 1 + [0.1, 0.25, 0.5, 1.0][carTier - 1];
  }
  if (state.consultants.includes("celebrity")) base *= 1.5;
  return base;
}

function getManagedIncome(state: GameState): number {
  let total = 0;
  for (const [id, biz] of Object.entries(state.businesses)) {
    if (!biz.hasManager || biz.level === 0) continue;
    const def = BUSINESSES.find((b) => b.id === id);
    if (def) total += def.baseIncome * biz.level;
  }
  const wt = state.assets["wardrobe"] || 0;
  if (wt > 0) total *= 1 + [0.05, 0.15, 0.3, 0.6][wt - 1];
  if (state.consultants.includes("marketing")) total *= 1.25;
  return total;
}

function getExpenses(state: GameState): number {
  let total = 0.1; // food
  const ht = state.assets["house"] || 0;
  total += 0.5 * (1 - [0, 0.25, 0.5, 0.75, 1.0][ht]);
  for (const tier of Object.values(state.assets)) total += tier * 0.05;
  for (const biz of Object.values(state.businesses)) total += biz.level * 0.02;
  if (state.consultants.includes("operations")) total *= 0.7;
  return total;
}

function getLoanInterest(state: GameState): number {
  let total = 0;
  for (const [id, loan] of Object.entries(state.loans)) {
    if (!loan.active) continue;
    const def = LOANS.find((l) => l.id === id);
    if (def) total += loan.remaining * def.interestRate;
  }
  return total;
}

function createInitialState(): GameState {
  try {
    const saved = localStorage.getItem("empire-tycoon-save");
    if (saved) {
      const parsed = JSON.parse(saved) as GameState;
      const offlineSec = Math.min((Date.now() - parsed.lastTick) / 1000, 86400);
      if (offlineSec > 5) {
        const rate = getManagedIncome(parsed) - getExpenses(parsed) - getLoanInterest(parsed);
        const earned = rate * offlineSec;
        parsed.cash = Math.max(0, parsed.cash + earned);
        parsed.totalEarned += Math.max(0, earned);
      }
      parsed.lastTick = Date.now();
      return parsed;
    }
  } catch { /* use default */ }
  return {
    cash: 0, totalEarned: 0, workLevel: 0,
    businesses: {}, assets: {}, investments: {}, loans: {},
    consultants: [], lastTick: Date.now(),
  };
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "TICK": {
      const now = Date.now();
      const elapsed = Math.min((now - state.lastTick) / 1000, 10);
      if (elapsed < 0.05) return state;

      let income = 0;
      const newBiz = { ...state.businesses };
      for (const [id, biz] of Object.entries(newBiz)) {
        const def = BUSINESSES.find((b) => b.id === id);
        if (!def || biz.level === 0) continue;
        const bi = def.baseIncome * biz.level * elapsed;
        if (biz.hasManager) {
          income += bi;
        } else {
          newBiz[id] = { ...biz, accumulated: (biz.accumulated || 0) + bi };
        }
      }
      const wt = state.assets["wardrobe"] || 0;
      if (wt > 0) income *= 1 + [0.05, 0.15, 0.3, 0.6][wt - 1];
      if (state.consultants.includes("marketing")) income *= 1.25;

      const expenses = getExpenses(state) * elapsed;
      const loanInt = getLoanInterest(state) * elapsed;

      const newInv = { ...state.investments };
      let invReturn = 0;
      for (const [id, amount] of Object.entries(newInv)) {
        if (amount <= 0) continue;
        const def = INVESTMENTS.find((i) => i.id === id);
        if (!def) continue;
        const r = def.baseReturn + (Math.random() - 0.5) * 2 * def.volatility;
        const ret = amount * r * elapsed;
        newInv[id] = Math.max(0, amount + ret);
        invReturn += ret;
      }
      const watchT = state.assets["watch"] || 0;
      if (watchT > 0) invReturn *= 1 + [0.05, 0.1, 0.2, 0.4][watchT - 1];
      if (state.consultants.includes("finance")) invReturn *= 1.2;

      const net = income + invReturn - expenses - loanInt;
      return {
        ...state,
        cash: Math.max(0, state.cash + net),
        totalEarned: state.totalEarned + Math.max(0, income + invReturn),
        businesses: newBiz, investments: newInv, lastTick: now,
      };
    }

    case "WORK": {
      const inc = getWorkIncome(state);
      return { ...state, cash: state.cash + inc, totalEarned: state.totalEarned + inc };
    }

    case "UPGRADE_WORK": {
      const cost = 50 * Math.pow(3, state.workLevel);
      if (state.cash < cost) return state;
      return { ...state, cash: state.cash - cost, workLevel: state.workLevel + 1 };
    }

    case "BUY_BUSINESS": {
      const def = BUSINESSES.find((b) => b.id === action.id);
      if (!def) return state;
      const cur = state.businesses[action.id] || { level: 0, hasManager: false, accumulated: 0 };
      const cost = calcBusinessCost(def.baseCost, def.costMultiplier, cur.level);
      if (state.cash < cost) return state;
      return {
        ...state, cash: state.cash - cost,
        businesses: { ...state.businesses, [action.id]: { ...cur, level: cur.level + 1 } },
      };
    }

    case "COLLECT_BUSINESS": {
      const biz = state.businesses[action.id];
      if (!biz || biz.accumulated <= 0) return state;
      return {
        ...state, cash: state.cash + biz.accumulated,
        totalEarned: state.totalEarned + biz.accumulated,
        businesses: { ...state.businesses, [action.id]: { ...biz, accumulated: 0 } },
      };
    }

    case "HIRE_MANAGER": {
      const def = BUSINESSES.find((b) => b.id === action.id);
      const biz = state.businesses[action.id];
      if (!def || !biz || biz.hasManager || state.cash < def.managerCost) return state;
      return {
        ...state, cash: state.cash - def.managerCost,
        businesses: { ...state.businesses, [action.id]: { ...biz, hasManager: true } },
      };
    }

    case "BUY_ASSET": {
      const def = ASSETS.find((a) => a.id === action.id);
      if (!def) return state;
      const cur = state.assets[action.id] || 0;
      if (cur >= def.tiers.length) return state;
      const cost = def.tiers[cur].cost;
      if (state.cash < cost) return state;
      return { ...state, cash: state.cash - cost, assets: { ...state.assets, [action.id]: cur + 1 } };
    }

    case "INVEST": {
      const def = INVESTMENTS.find((i) => i.id === action.id);
      if (!def || action.amount <= 0 || state.cash < action.amount) return state;
      const cur = state.investments[action.id] || 0;
      if (cur === 0 && action.amount < def.minInvestment) return state;
      return {
        ...state, cash: state.cash - action.amount,
        investments: { ...state.investments, [action.id]: cur + action.amount },
      };
    }

    case "WITHDRAW": {
      const cur = state.investments[action.id] || 0;
      const amt = Math.min(action.amount, cur);
      if (amt <= 0) return state;
      return {
        ...state, cash: state.cash + amt,
        investments: { ...state.investments, [action.id]: cur - amt },
      };
    }

    case "TAKE_LOAN": {
      const def = LOANS.find((l) => l.id === action.id);
      if (!def) return state;
      if (state.loans[action.id]?.active) return state;
      return {
        ...state, cash: state.cash + def.amount,
        loans: { ...state.loans, [action.id]: { active: true, remaining: def.amount } },
      };
    }

    case "REPAY_LOAN": {
      const loan = state.loans[action.id];
      if (!loan?.active) return state;
      const pay = Math.min(state.cash, loan.remaining);
      if (pay <= 0) return state;
      const rem = loan.remaining - pay;
      return {
        ...state, cash: state.cash - pay,
        loans: { ...state.loans, [action.id]: rem <= 0.01 ? { active: false, remaining: 0 } : { active: true, remaining: rem } },
      };
    }

    case "HIRE_CONSULTANT": {
      const def = CONSULTANTS.find((c) => c.id === action.id);
      if (!def || state.consultants.includes(action.id) || state.cash < def.cost) return state;
      return { ...state, cash: state.cash - def.cost, consultants: [...state.consultants, action.id] };
    }

    default:
      return state;
  }
}

interface DerivedState {
  netWorth: number;
  incomePerSecond: number;
  expensesPerSecond: number;
  loanInterestPerSecond: number;
  netPerSecond: number;
  investmentTotal: number;
  loanTotal: number;
  assetValue: number;
  workIncome: number;
  workUpgradeCost: number;
}

function calculateDerived(state: GameState): DerivedState {
  const incomePerSecond = getManagedIncome(state);
  const expensesPerSecond = getExpenses(state);
  const loanInterestPerSecond = getLoanInterest(state);
  const netPerSecond = incomePerSecond - expensesPerSecond - loanInterestPerSecond;
  let investmentTotal = 0;
  for (const a of Object.values(state.investments)) investmentTotal += a;
  let loanTotal = 0;
  for (const l of Object.values(state.loans)) if (l.active) loanTotal += l.remaining;
  let assetValue = 0;
  for (const [id, tier] of Object.entries(state.assets)) {
    const def = ASSETS.find((a) => a.id === id);
    if (def) for (let i = 0; i < tier; i++) assetValue += def.tiers[i].cost;
  }
  const netWorth = state.cash + investmentTotal + assetValue - loanTotal;
  const workIncome = getWorkIncome(state);
  const workUpgradeCost = 50 * Math.pow(3, state.workLevel);
  return { netWorth, incomePerSecond, expensesPerSecond, loanInterestPerSecond, netPerSecond, investmentTotal, loanTotal, assetValue, workIncome, workUpgradeCost };
}

interface GameContextType {
  state: GameState;
  derived: DerivedState;
  dispatch: React.Dispatch<GameAction>;
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, null, createInitialState);

  useEffect(() => {
    const id = setInterval(() => dispatch({ type: "TICK" }), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      localStorage.setItem("empire-tycoon-save", JSON.stringify(state));
    }, 500);
    return () => clearTimeout(t);
  }, [state]);

  const derived = useMemo(() => calculateDerived(state), [state]);

  return (
    <GameContext.Provider value={{ state, derived, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be within GameProvider");
  return ctx;
}
