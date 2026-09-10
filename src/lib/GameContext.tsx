import React, { createContext, useContext, useReducer, useEffect, useMemo } from "react";
import {
  BUSINESSES, ASSETS, INVESTMENTS, LOANS, CONSULTANTS, JOBS, EDUCATION,
  getBusinessCost as calcBusinessCost, amortizedPayment,
  DAYS_PER_YEAR, TAX_RATE, BASE_FOOD_COST, BASE_RENT, BASE_TRANSIT,
  CAR_PAY_BONUS, HOUSE_FOCUS_BONUS, WARDROBE_BUSINESS_BONUS, WATCH_INVEST_BONUS,
  UNMANAGED_CAP_DAYS, BUSINESS_VALUATION_MULTIPLE, LOAN_EQUITY_REQUIREMENT,
} from "./gameData";

const SAVE_KEY = "empire-tycoon-save-v2";
const MAX_OFFLINE_DAYS = 240;

export interface BusinessState { level: number; hasManager: boolean; accumulated: number }
export interface LoanState { active: boolean; remaining: number; dailyPayment: number }
export interface InvestmentState { value: number; deposited: number }

export interface GameState {
  cash: number;
  totalEarned: number;
  day: number;
  jobIndex: number;
  xp: number;
  education: number;          // highest completed education index
  studying: { level: number; daysLeft: number } | null;
  savingsRate: number;        // 0..1 of discretionary income banked
  lastShiftDay: number;
  businesses: Record<string, BusinessState>;
  assets: Record<string, number>;
  investments: Record<string, InvestmentState>;
  loans: Record<string, LoanState>;
  loansRepaid: string[];
  consultants: string[];
  lastTick: number;
}

type GameAction =
  | { type: "TICK" }
  | { type: "WORK" }
  | { type: "SET_SAVINGS_RATE"; rate: number }
  | { type: "PROMOTE" }
  | { type: "STUDY"; level: number }
  | { type: "BUY_BUSINESS"; id: string }
  | { type: "COLLECT_BUSINESS"; id: string }
  | { type: "HIRE_MANAGER"; id: string }
  | { type: "BUY_ASSET"; id: string }
  | { type: "INVEST"; id: string; amount: number }
  | { type: "WITHDRAW"; id: string; amount: number }
  | { type: "TAKE_LOAN"; id: string }
  | { type: "REPAY_LOAN"; id: string }
  | { type: "HIRE_CONSULTANT"; id: string }
  | { type: "FIRE_CONSULTANT"; id: string };

// ---------- pure economic helpers (all per day) ----------

export function tierBonus(tier: number, table: number[]): number {
  return tier > 0 ? table[Math.min(tier, table.length) - 1] : 0;
}

export function getJob(state: GameState) {
  return JOBS[Math.min(state.jobIndex, JOBS.length - 1)];
}

export function getGrossSalary(state: GameState): number {
  if (state.studying) return 0;
  let pay = getJob(state).dailyPay;
  pay *= 1 + tierBonus(state.assets["car"] || 0, CAR_PAY_BONUS);
  if (state.consultants.includes("celebrity")) pay *= 1.2;
  return pay;
}

export function getBusinessGross(state: GameState): number {
  let total = 0;
  for (const [id, biz] of Object.entries(state.businesses)) {
    if (!biz.hasManager || biz.level === 0) continue;
    const def = BUSINESSES.find((b) => b.id === id);
    if (def) total += def.baseIncome * biz.level;
  }
  total *= 1 + tierBonus(state.assets["wardrobe"] || 0, WARDROBE_BUSINESS_BONUS);
  if (state.consultants.includes("marketing")) total *= 1.1;
  return total;
}

export function getManagerCosts(state: GameState): number {
  let total = 0;
  for (const [id, biz] of Object.entries(state.businesses)) {
    if (!biz.hasManager || biz.level === 0) continue;
    const def = BUSINESSES.find((b) => b.id === id);
    if (def) total += def.baseIncome * biz.level * def.managerShare;
  }
  return total;
}

export function getLivingCosts(state: GameState): number {
  let total = BASE_FOOD_COST;
  const houseTier = state.assets["house"] || 0;
  if (houseTier === 0) total += BASE_RENT;
  if ((state.assets["car"] || 0) === 0) total += BASE_TRANSIT;
  for (const def of ASSETS) {
    const tier = state.assets[def.id] || 0;
    for (let i = 0; i < tier; i++) total += def.tiers[i].upkeep;
  }
  return total;
}

export function getRetainerCosts(state: GameState): number {
  let total = 0;
  for (const id of state.consultants) {
    const def = CONSULTANTS.find((c) => c.id === id);
    if (def) total += def.dailyRetainer;
  }
  return total;
}

export function getOperatingCosts(state: GameState): number {
  let total = getManagerCosts(state) + getRetainerCosts(state);
  if (state.consultants.includes("operations")) total *= 0.85;
  return total;
}

export function getLoanPayments(state: GameState): number {
  let total = 0;
  for (const loan of Object.values(state.loans)) {
    if (loan.active) total += Math.min(loan.dailyPayment, loan.remaining * 1.5);
  }
  return total;
}

export function getFocusMultiplier(state: GameState): number {
  // Spending on yourself buys energy and connections; hoarding every dollar slows you down.
  const spendRatio = 1 - state.savingsRate;
  return 0.6 + 0.8 * spendRatio + tierBonus(state.assets["house"] || 0, HOUSE_FOCUS_BONUS);
}

export function getBusinessValue(state: GameState): number {
  let total = 0;
  for (const [id, biz] of Object.entries(state.businesses)) {
    const def = BUSINESSES.find((b) => b.id === id);
    if (!def || biz.level === 0) continue;
    total += def.baseIncome * biz.level * DAYS_PER_YEAR * BUSINESS_VALUATION_MULTIPLE;
  }
  return total;
}

export function isBusinessUnlocked(state: GameState, id: string): boolean {
  const idx = BUSINESSES.findIndex((b) => b.id === id);
  if (idx <= 0) return true;
  const prev = BUSINESSES[idx - 1];
  return (state.businesses[prev.id]?.level || 0) >= BUSINESSES[idx].unlockLevelOfPrev;
}

export function isInvestmentUnlocked(state: GameState, id: string): boolean {
  const def = INVESTMENTS.find((i) => i.id === id);
  if (!def?.unlockPrev) return true;
  return (state.investments[def.unlockPrev]?.deposited || 0) >= (def.unlockAmount || 0);
}

function createInitialState(): GameState {
  const fresh: GameState = {
    cash: 400, totalEarned: 0, day: 0,
    jobIndex: 0, xp: 0, education: 0, studying: null,
    savingsRate: 0.5, lastShiftDay: -1,
    businesses: {}, assets: {}, investments: {}, loans: {},
    loansRepaid: [], consultants: [], lastTick: Date.now(),
  };
  try {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
      const parsed = { ...fresh, ...(JSON.parse(saved) as GameState) };
      const offlineDays = Math.min((Date.now() - parsed.lastTick) / 1000, MAX_OFFLINE_DAYS);
      if (offlineDays > 5) return advance(parsed, offlineDays, Date.now());
      parsed.lastTick = Date.now();
      return parsed;
    }
  } catch { /* fall through */ }
  return fresh;
}

// ---------- the daily simulation ----------
function advance(state: GameState, days: number, now: number): GameState {
  let cash = state.cash;
  let earned = 0;

  // Education in progress
  let studying = state.studying;
  let education = state.education;
  if (studying) {
    const left = studying.daysLeft - days;
    if (left <= 0) { education = Math.max(education, studying.level); studying = null; }
    else studying = { ...studying, daysLeft: left };
  }

  // Salary, taxed, then living costs, then the savings split
  const gross = getGrossSalary({ ...state, studying, education }) * days;
  const living = getLivingCosts(state) * days;
  const netSalary = gross * (1 - TAX_RATE);
  const discretionary = netSalary - living;
  if (discretionary >= 0) {
    cash += discretionary * state.savingsRate; // the rest is spent on living well
  } else {
    cash += discretionary; // shortfall comes out of savings
  }
  earned += Math.max(0, discretionary * state.savingsRate);

  // Businesses
  const businesses: Record<string, BusinessState> = {};
  let managedGross = 0;
  for (const [id, biz] of Object.entries(state.businesses)) {
    const def = BUSINESSES.find((b) => b.id === id);
    if (!def || biz.level === 0) { businesses[id] = biz; continue; }
    const perDay = def.baseIncome * biz.level;
    if (biz.hasManager) {
      managedGross += perDay * days;
      businesses[id] = biz;
    } else {
      const cap = perDay * UNMANAGED_CAP_DAYS;
      businesses[id] = { ...biz, accumulated: Math.min(cap, (biz.accumulated || 0) + perDay * days) };
    }
  }
  const bizMult = (1 + tierBonus(state.assets["wardrobe"] || 0, WARDROBE_BUSINESS_BONUS))
    * (state.consultants.includes("marketing") ? 1.1 : 1);
  const businessNet = managedGross * bizMult * (1 - TAX_RATE);
  cash += businessNet;
  earned += businessNet;

  // Operating costs (managers, retainers)
  cash -= getOperatingCosts(state) * days;

  // Investments — annual figures converted to daily
  const investments: Record<string, InvestmentState> = {};
  const investMult = (1 + tierBonus(state.assets["watch"] || 0, WATCH_INVEST_BONUS))
    * (state.consultants.includes("finance") ? 1.1 : 1);
  for (const [id, inv] of Object.entries(state.investments)) {
    const def = INVESTMENTS.find((i) => i.id === id);
    if (!def || inv.value <= 0) { investments[id] = inv; continue; }
    const drift = (def.annualReturn * investMult) / DAYS_PER_YEAR;
    const shock = def.annualVolatility > 0
      ? (Math.random() * 2 - 1) * (def.annualVolatility / Math.sqrt(DAYS_PER_YEAR)) * 1.7
      : 0;
    const growth = inv.value * (drift + shock / Math.sqrt(Math.max(1, days))) * days;
    investments[id] = { ...inv, value: Math.max(0, inv.value + growth) };
  }

  // Loan servicing — fixed amortized payments
  const loans: Record<string, LoanState> = {};
  const loansRepaid = [...state.loansRepaid];
  for (const [id, loan] of Object.entries(state.loans)) {
    if (!loan.active) { loans[id] = loan; continue; }
    const def = LOANS.find((l) => l.id === id);
    if (!def) { loans[id] = loan; continue; }
    const dailyRate = def.annualRate / DAYS_PER_YEAR;
    let remaining = loan.remaining * Math.pow(1 + dailyRate, days);
    const due = Math.min(loan.dailyPayment * days, remaining);
    const paid = Math.min(Math.max(cash, 0), due);
    cash -= paid;
    remaining -= paid;
    if (remaining <= 0.5) {
      if (!loansRepaid.includes(id)) loansRepaid.push(id);
      loans[id] = { active: false, remaining: 0, dailyPayment: 0 };
    } else {
      loans[id] = { ...loan, remaining };
    }
  }

  // Experience toward the next promotion
  const xp = state.xp + (studying ? 0 : days * getFocusMultiplier(state));

  return {
    ...state,
    cash: Math.max(0, cash),
    totalEarned: state.totalEarned + earned,
    day: state.day + days,
    xp, education, studying,
    businesses, investments, loans, loansRepaid,
    lastTick: now,
  };
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "TICK": {
      const now = Date.now();
      const days = Math.min((now - state.lastTick) / 1000, 30);
      if (days < 0.05) return state;
      return advance(state, days, now);
    }

    case "WORK": {
      // One extra shift per day: a quarter-day of pay, plus experience.
      const today = Math.floor(state.day);
      if (state.studying || state.lastShiftDay === today) return state;
      const pay = getGrossSalary(state) * 0.25 * (1 - TAX_RATE);
      return {
        ...state,
        cash: state.cash + pay,
        totalEarned: state.totalEarned + pay,
        xp: state.xp + 2 * getFocusMultiplier(state),
        lastShiftDay: today,
      };
    }

    case "SET_SAVINGS_RATE":
      return { ...state, savingsRate: Math.max(0, Math.min(1, action.rate)) };

    case "PROMOTE": {
      const next = JOBS[state.jobIndex + 1];
      if (!next) return state;
      if (state.xp < getJob(state).xpToPromote) return state;
      if (state.education < next.education) return state;
      return { ...state, jobIndex: state.jobIndex + 1, xp: 0 };
    }

    case "STUDY": {
      const def = EDUCATION[action.level];
      if (!def || state.studying) return state;
      if (action.level !== state.education + 1) return state;
      if (state.cash < def.cost) return state;
      return { ...state, cash: state.cash - def.cost, studying: { level: action.level, daysLeft: def.days } };
    }

    case "BUY_BUSINESS": {
      const def = BUSINESSES.find((b) => b.id === action.id);
      if (!def || !isBusinessUnlocked(state, action.id)) return state;
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
      const net = biz.accumulated * (1 - TAX_RATE);
      return {
        ...state, cash: state.cash + net,
        totalEarned: state.totalEarned + net,
        businesses: { ...state.businesses, [action.id]: { ...biz, accumulated: 0 } },
      };
    }

    case "HIRE_MANAGER": {
      const def = BUSINESSES.find((b) => b.id === action.id);
      const biz = state.businesses[action.id];
      if (!def || !biz || biz.hasManager || biz.level < 3) return state;
      return {
        ...state,
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
      if (!isInvestmentUnlocked(state, action.id)) return state;
      const cur = state.investments[action.id] || { value: 0, deposited: 0 };
      if (cur.value === 0 && action.amount < def.minInvestment) return state;
      return {
        ...state, cash: state.cash - action.amount,
        investments: {
          ...state.investments,
          [action.id]: { value: cur.value + action.amount, deposited: cur.deposited + action.amount },
        },
      };
    }

    case "WITHDRAW": {
      const cur = state.investments[action.id];
      if (!cur) return state;
      const amt = Math.min(action.amount, cur.value);
      if (amt <= 0) return state;
      return {
        ...state, cash: state.cash + amt,
        investments: { ...state.investments, [action.id]: { ...cur, value: cur.value - amt } },
      };
    }

    case "TAKE_LOAN": {
      const def = LOANS.find((l) => l.id === action.id);
      if (!def || state.loans[action.id]?.active) return state;
      if (state.loansRepaid.length < def.requiresCredit) return state;
      const derived = calculateDerived(state);
      if (derived.netWorth < def.amount * LOAN_EQUITY_REQUIREMENT) return state;
      return {
        ...state, cash: state.cash + def.amount,
        loans: {
          ...state.loans,
          [action.id]: {
            active: true,
            remaining: def.amount,
            dailyPayment: amortizedPayment(def.amount, def.annualRate, def.termDays),
          },
        },
      };
    }

    case "REPAY_LOAN": {
      const loan = state.loans[action.id];
      if (!loan?.active) return state;
      const pay = Math.min(state.cash, loan.remaining);
      if (pay <= 0) return state;
      const rem = loan.remaining - pay;
      const done = rem <= 0.5;
      return {
        ...state, cash: state.cash - pay,
        loansRepaid: done && !state.loansRepaid.includes(action.id)
          ? [...state.loansRepaid, action.id] : state.loansRepaid,
        loans: {
          ...state.loans,
          [action.id]: done ? { active: false, remaining: 0, dailyPayment: 0 } : { ...loan, remaining: rem },
        },
      };
    }

    case "HIRE_CONSULTANT": {
      const def = CONSULTANTS.find((c) => c.id === action.id);
      if (!def || state.consultants.includes(action.id) || state.cash < def.hireCost) return state;
      const levels = Object.values(state.businesses).reduce((s, b) => s + b.level, 0);
      if (levels < def.requiresBusinessLevels) return state;
      return { ...state, cash: state.cash - def.hireCost, consultants: [...state.consultants, action.id] };
    }

    case "FIRE_CONSULTANT":
      return { ...state, consultants: state.consultants.filter((c) => c !== action.id) };

    default:
      return state;
  }
}

interface DerivedState {
  netWorth: number;
  salaryPerDay: number;         // after tax
  businessPerDay: number;       // after tax, managed only
  investmentPerDay: number;     // expected
  incomePerDay: number;
  livingCosts: number;
  operatingCosts: number;
  loanPayments: number;
  netPerDay: number;
  savedPerDay: number;
  investmentTotal: number;
  loanTotal: number;
  assetValue: number;
  businessValue: number;
  shiftPay: number;
  job: (typeof JOBS)[number];
  nextJob: (typeof JOBS)[number] | null;
  xpNeeded: number;
  focus: number;
  creditTier: number;
}

function calculateDerived(state: GameState): DerivedState {
  const salaryPerDay = getGrossSalary(state) * (1 - TAX_RATE);
  const businessPerDay = getBusinessGross(state) * (1 - TAX_RATE);
  let investmentTotal = 0;
  let investmentPerDay = 0;
  const investMult = (1 + tierBonus(state.assets["watch"] || 0, WATCH_INVEST_BONUS))
    * (state.consultants.includes("finance") ? 1.1 : 1);
  for (const [id, inv] of Object.entries(state.investments)) {
    investmentTotal += inv.value;
    const def = INVESTMENTS.find((i) => i.id === id);
    if (def) investmentPerDay += (inv.value * def.annualReturn * investMult) / DAYS_PER_YEAR;
  }

  const livingCosts = getLivingCosts(state);
  const operatingCosts = getOperatingCosts(state);
  const loanPayments = getLoanPayments(state);

  let loanTotal = 0;
  for (const l of Object.values(state.loans)) if (l.active) loanTotal += l.remaining;

  let assetValue = 0;
  for (const [id, tier] of Object.entries(state.assets)) {
    const def = ASSETS.find((a) => a.id === id);
    if (def) for (let i = 0; i < tier; i++) assetValue += def.tiers[i].cost * 0.8; // resale
  }

  const businessValue = getBusinessValue(state);
  const incomePerDay = salaryPerDay + businessPerDay + investmentPerDay;
  const netPerDay = incomePerDay - livingCosts - operatingCosts - loanPayments;

  const discretionary = salaryPerDay - livingCosts;
  const savedPerDay = (discretionary >= 0 ? discretionary * state.savingsRate : discretionary)
    + businessPerDay - operatingCosts - loanPayments;

  const job = getJob(state);
  return {
    netWorth: state.cash + investmentTotal + assetValue + businessValue - loanTotal,
    salaryPerDay, businessPerDay, investmentPerDay, incomePerDay,
    livingCosts, operatingCosts, loanPayments, netPerDay, savedPerDay,
    investmentTotal, loanTotal, assetValue, businessValue,
    shiftPay: getGrossSalary(state) * 0.25 * (1 - TAX_RATE),
    job,
    nextJob: JOBS[state.jobIndex + 1] || null,
    xpNeeded: job.xpToPromote,
    focus: getFocusMultiplier(state),
    creditTier: state.loansRepaid.length,
  };
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
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
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
