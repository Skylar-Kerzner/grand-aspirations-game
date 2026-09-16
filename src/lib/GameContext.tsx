import React, { createContext, useContext, useReducer, useEffect, useMemo } from "react";
import {
  BUSINESSES, ASSETS, INVESTMENTS, LOANS, CONSULTANTS, JOBS, EDUCATION, EVENTS, CAREER_VARIANTS, CAREER_SALARY_RANGE,
  getBusinessCost as calcBusinessCost, getBusinessIncome, getBusinessCapital, amortizedPayment,
  DAYS_PER_YEAR, TAX_RATE, LOBBYIST_TAX_RATE, WEEK_HOURS, TRAINING_REFERENCE,
  UNMANAGED_CAP_DAYS, BUSINESS_VALUATION_MULTIPLE, BUSINESS_NETWORK_MILESTONES, LOAN_EQUITY_REQUIREMENT,
  CC_APR, CC_MIN_PAYMENT_RATE, CC_BASE_LIMIT, EVENT_CHANCE_PER_DAY, MGMT_FEE, PERF_FEE,
} from "./gameData";

const SAVE_KEY = "empire-tycoon-save-v4";
const LEGACY_SAVE_KEY = "empire-tycoon-save-v3";
const MAX_OFFLINE_DAYS = 240;

export interface BusinessState { level: number; hasManager: boolean; accumulated: number }
export interface LoanState { drawn: number; remaining: number; dailyPayment: number; timesRepaid: number }
export interface InvestmentState { value: number; basis: number }
export interface CareerOffer { title: string; employer: string; dailyPay: number }

export interface GameEvent { day: number; title: string; text: string; tone: "good" | "bad" | "neutral" }

export interface Stats {
  salaryEarned: number;
  shiftEarned: number;
  businessEarned: number;
  investmentGains: number;
  eventGains: number;
  eventLosses: number;
  taxesPaid: number;
  livingSpent: number;
  trainingSpent: number;
  loanInterestPaid: number;
  ccInterestPaid: number;
  assetSpent: number;
  businessSpent: number;
  educationSpent: number;
  consultantSpent: number;
  retainerSpent: number;
  managerSpent: number;
  investDeposited: number;
  investWithdrawn: number;
  jobEarned: Record<string, number>;
  jobDays: Record<string, number>;
  shifts: Record<string, number>;
  investEarnedById: Record<string, number>;
  businessEarnedById: Record<string, number>;
}

export interface GameState {
  cash: number;
  ccDebt: number;
  day: number;
  jobIndex: number;
  currentJob: CareerOffer;
  careerOffers: CareerOffer[];
  xp: number;
  education: number;
  studying: { level: number; daysLeft: number } | null;
  studyHours: number;     // of the 40 weekly hours, how many go to school
  trainingBudget: number; // dollars per day spent on courses and coaching
  lastShiftDay: number;
  businesses: Record<string, BusinessState>;
  assets: Record<string, number>;
  investments: Record<string, InvestmentState>;
  loans: Record<string, LoanState>;
  loansRepaid: string[];
  consultants: string[];
  payMult: number; payUntil: number;
  livingMult: number; livingUntil: number;
  boostUntil: number;
  events: GameEvent[];
  stats: Stats;
  lastTick: number;
}

type GameAction =
  | { type: "TICK" }
  | { type: "WORK" }
  | { type: "SET_STUDY_HOURS"; hours: number }
  | { type: "SET_TRAINING"; amount: number }
  | { type: "SET_LIFESTYLE"; id: string; tier: number }
  | { type: "GENERATE_JOB_OFFERS" }
  | { type: "ACCEPT_JOB_OFFER"; index: number }
  | { type: "STUDY"; level: number }
  | { type: "BUY_BUSINESS"; id: string }
  | { type: "COLLECT_BUSINESS"; id: string }
  | { type: "HIRE_MANAGER"; id: string }
  | { type: "INVEST"; id: string; amount: number }
  | { type: "WITHDRAW"; id: string; amount: number }
  | { type: "TAKE_LOAN"; id: string; amount: number }
  | { type: "REPAY_LOAN"; id: string }
  | { type: "PAY_CC" }
  | { type: "HIRE_CONSULTANT"; id: string }
  | { type: "FIRE_CONSULTANT"; id: string }
  | { type: "RESET" };

function emptyStats(): Stats {
  return {
    salaryEarned: 0, shiftEarned: 0, businessEarned: 0, investmentGains: 0,
    eventGains: 0, eventLosses: 0, taxesPaid: 0, livingSpent: 0, trainingSpent: 0,
    loanInterestPaid: 0, ccInterestPaid: 0, assetSpent: 0, businessSpent: 0,
    educationSpent: 0, consultantSpent: 0, retainerSpent: 0, managerSpent: 0,
    investDeposited: 0, investWithdrawn: 0,
    jobEarned: {}, jobDays: {}, shifts: {}, investEarnedById: {}, businessEarnedById: {},
  };
}

// ---------- pure economic helpers (all per day) ----------

export function tierBonus(tier: number, table: number[]): number {
  return tier > 0 ? table[Math.min(tier, table.length) - 1] : 0;
}

export function getJob(state: GameState) {
  return { ...JOBS[Math.min(state.jobIndex, JOBS.length - 1)], ...state.currentJob };
}

export function getTaxRate(state: GameState): number {
  return state.consultants.includes("lobbyist") ? LOBBYIST_TAX_RATE : TAX_RATE;
}

export function getWorkHours(state: GameState): number {
  return Math.max(0, WEEK_HOURS - state.studyHours);
}

export function getLifestyleTier(state: GameState, id: string) {
  const def = ASSETS.find((asset) => asset.id === id);
  if (!def) return undefined;
  const tier = Math.max(1, Math.min(state.assets[id] || 1, def.tiers.length));
  return def.tiers[tier - 1];
}

export function getInvestmentTotal(state: GameState): number {
  return Object.values(state.investments).reduce((s, i) => s + i.value, 0);
}

function investMultiplier(state: GameState): number {
  let m = 1;
  if (state.consultants.includes("finance")) m *= 1.1;
  if (state.consultants.includes("quant")) m *= 1.2;
  return m;
}

export function getInvestmentPerDay(state: GameState): number {
  const mult = investMultiplier(state);
  let total = 0;
  for (const [id, inv] of Object.entries(state.investments)) {
    const def = INVESTMENTS.find((i) => i.id === id);
    if (def) total += (inv.value * def.annualReturn * mult) / DAYS_PER_YEAR;
  }
  return total;
}

export function getGrossSalary(state: GameState): number {
  const job = getJob(state);
  let pay = job.dailyPay * (getWorkHours(state) / WEEK_HOURS);
  if (state.day < state.payUntil) pay *= state.payMult;
  if (job.perfFee) {
    // 2 and 20 on the money you run
    pay += (getInvestmentTotal(state) * MGMT_FEE) / DAYS_PER_YEAR;
    pay += Math.max(0, getInvestmentPerDay(state)) * PERF_FEE;
  }
  return pay;
}

export function businessMultiplier(state: GameState): number {
  let m = 1;
  if (state.consultants.includes("marketing")) m *= 1.1;
  if (state.consultants.includes("celebrity")) m *= 1.25;
  if (state.day < state.boostUntil) m *= 2;
  return m;
}

export function getBusinessNetworkBonus(state: GameState, id: string): number {
  const index = BUSINESSES.findIndex((business) => business.id === id);
  if (index < 0) return 0;

  let bonus = 0;
  for (const partnerIndex of [index - 1, index + 1]) {
    const partner = BUSINESSES[partnerIndex];
    if (!partner) continue;
    const ownLevel = state.businesses[id]?.level || 0;
    const partnerLevel = state.businesses[partner.id]?.level || 0;
    const reached = [...BUSINESS_NETWORK_MILESTONES]
      .reverse()
      .find((milestone) => ownLevel >= milestone.level && partnerLevel >= milestone.level);
    bonus += reached?.bonus || 0;
  }
  return bonus;
}

export function getBusinessEffectiveROI(state: GameState, id: string): number {
  const def = BUSINESSES.find((business) => business.id === id);
  return def ? def.annualROI * (1 + getBusinessNetworkBonus(state, id)) : 0;
}

export function getNextBusinessNetworkMilestone(state: GameState, id: string) {
  const index = BUSINESSES.findIndex((business) => business.id === id);
  if (index < 0) return undefined;
  const ownLevel = state.businesses[id]?.level || 0;
  const candidates = [index - 1, index + 1].flatMap((partnerIndex) => {
    const partner = BUSINESSES[partnerIndex];
    if (!partner) return [];
    const partnerLevel = state.businesses[partner.id]?.level || 0;
    const milestone = BUSINESS_NETWORK_MILESTONES.find(
      (item) => ownLevel < item.level || partnerLevel < item.level,
    );
    if (!milestone) return [];
    return [{
      partner,
      level: milestone.level,
      bonus: milestone.bonus,
      ownLevelsNeeded: Math.max(0, milestone.level - ownLevel),
      partnerLevelsNeeded: Math.max(0, milestone.level - partnerLevel),
    }];
  });
  return candidates.sort(
    (a, b) => Math.max(a.ownLevelsNeeded, a.partnerLevelsNeeded) - Math.max(b.ownLevelsNeeded, b.partnerLevelsNeeded),
  )[0];
}

export function businessIncomeOf(state: GameState, id: string): number {
  const def = BUSINESSES.find((b) => b.id === id);
  const biz = state.businesses[id];
  if (!def || !biz || biz.level === 0) return 0;
  return getBusinessIncome(def, biz.level) * (1 + getBusinessNetworkBonus(state, id)) * businessMultiplier(state);
}

export function getBusinessUpgradeIncomeGain(state: GameState, id: string): number {
  const biz = state.businesses[id] || { level: 0, hasManager: false, accumulated: 0 };
  const upgraded = {
    ...state,
    businesses: { ...state.businesses, [id]: { ...biz, level: biz.level + 1 } },
  };
  const portfolioIncome = (snapshot: GameState) => BUSINESSES.reduce(
    (total, business) => total + businessIncomeOf(snapshot, business.id),
    0,
  );
  return portfolioIncome(upgraded) - portfolioIncome(state);
}

export function getBusinessGross(state: GameState): number {
  let total = 0;
  for (const [id, biz] of Object.entries(state.businesses)) {
    if (!biz.hasManager || biz.level === 0) continue;
    total += businessIncomeOf(state, id);
  }
  return total;
}

export function getManagerCosts(state: GameState): number {
  let total = 0;
  for (const [id, biz] of Object.entries(state.businesses)) {
    if (!biz.hasManager || biz.level === 0) continue;
    const def = BUSINESSES.find((b) => b.id === id);
    if (def) total += businessIncomeOf(state, id) * def.managerShare;
  }
  return total;
}

export function getLivingCosts(state: GameState): number {
  let total = 0;
  for (const def of ASSETS) total += getLifestyleTier(state, def.id)?.dailyCost || 0;
  if (state.day < state.livingUntil) total *= state.livingMult;
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
    if (loan.remaining > 0) total += Math.min(loan.dailyPayment, loan.remaining * 1.5);
  }
  return total;
}

export function getCreditCardPayment(state: GameState): number {
  if (state.ccDebt <= 0) return 0;
  const balanceAfterInterest = state.ccDebt * (1 + CC_APR / DAYS_PER_YEAR);
  return Math.min(balanceAfterInterest, balanceAfterInterest * CC_MIN_PAYMENT_RATE);
}

export function getCareerProgressMultiplier(state: GameState): number {
  const training = Math.sqrt(Math.max(0, state.trainingBudget) / TRAINING_REFERENCE);
  const lifestyle = ASSETS.reduce((sum, def) => sum + (getLifestyleTier(state, def.id)?.careerBonus || 0), 0);
  return 1 + lifestyle + training;
}

export function getSchoolProgressMultiplier(state: GameState): number {
  return 1 + ASSETS.reduce((sum, def) => sum + (getLifestyleTier(state, def.id)?.schoolBonus || 0), 0);
}

export function getBusinessValue(state: GameState): number {
  let total = 0;
  for (const [id, biz] of Object.entries(state.businesses)) {
    const def = BUSINESSES.find((b) => b.id === id);
    if (!def || biz.level === 0) continue;
    total += getBusinessIncome(def, biz.level) * (1 + getBusinessNetworkBonus(state, id)) * DAYS_PER_YEAR * BUSINESS_VALUATION_MULTIPLE;
  }
  return total;
}

export function getCreditLimit(state: GameState): number {
  const positive = state.cash + getInvestmentTotal(state) + getBusinessValue(state);
  return Math.max(CC_BASE_LIMIT, positive * 0.08, getGrossSalary(state) * 60);
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
  const prev = state.investments[def.unlockPrev];
  const everDeposited = (prev?.basis || 0) + (state.stats.investEarnedById[def.unlockPrev] || 0);
  return Math.max(prev?.value || 0, everDeposited) >= (def.unlockAmount || 0);
}

export function upgradeCostFor(state: GameState, id: string): number {
  const def = BUSINESSES.find((b) => b.id === id);
  if (!def) return Infinity;
  const level = state.businesses[id]?.level || 0;
  const raw = calcBusinessCost(def.baseCost, def.costMultiplier, level);
  return state.consultants.includes("banker") ? raw * 0.8 : raw;
}

function createFresh(): GameState {
  const firstJob = JOBS[0];
  return {
    cash: 400, ccDebt: 0, day: 0,
    jobIndex: 0,
    currentJob: { title: firstJob.title, employer: firstJob.employer, dailyPay: firstJob.dailyPay },
    careerOffers: [],
    xp: 0, education: 0, studying: null,
    studyHours: 0, trainingBudget: 0,
    lastShiftDay: -1,
    businesses: {}, assets: { house: 1, food: 1, wardrobe: 1, car: 1, watch: 1 }, investments: {}, loans: {},
    loansRepaid: [], consultants: [],
    payMult: 1, payUntil: 0, livingMult: 1, livingUntil: 0, boostUntil: 0,
    events: [], stats: emptyStats(), lastTick: Date.now(),
  };
}

function createInitialState(): GameState {
  const fresh = createFresh();
  try {
    const saved = localStorage.getItem(SAVE_KEY) || localStorage.getItem(LEGACY_SAVE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<GameState> & { food?: string; clothing?: string };
      const legacyAssets = parsed.assets || {};
      const savedJob = JOBS[Math.min(parsed.jobIndex || 0, JOBS.length - 1)];
      const merged: GameState = {
        ...fresh, ...parsed,
        currentJob: parsed.currentJob || { title: savedJob.title, employer: savedJob.employer, dailyPay: savedJob.dailyPay },
        careerOffers: parsed.careerOffers || [],
        assets: {
          house: legacyAssets.house || 1,
          food: legacyAssets.food || (parsed.food === "chef" ? 4 : parsed.food === "eatout" ? 3 : parsed.food === "groceries" ? 2 : 1),
          wardrobe: legacyAssets.wardrobe || (parsed.clothing === "tailored" ? 3 : parsed.clothing === "highstreet" ? 2 : 1),
          car: legacyAssets.car || 1,
          watch: legacyAssets.watch || 1,
        },
        stats: { ...emptyStats(), ...(parsed.stats || {}) },
      };
      const offlineDays = Math.min((Date.now() - merged.lastTick) / 1000, MAX_OFFLINE_DAYS);
      if (offlineDays > 5) return advance(merged, offlineDays, Date.now());
      merged.lastTick = Date.now();
      return merged;
    }
  } catch { /* fall through */ }
  return fresh;
}

// ---------- random events ----------
function rollEvent(state: GameState, days: number): GameState {
  const chance = 1 - Math.pow(1 - EVENT_CHANCE_PER_DAY, days);
  if (Math.random() > chance) return state;
  const pool = EVENTS.filter((e) => !e.minDay || state.day >= e.minDay);
  const totalWeight = pool.reduce((s, e) => s + e.weight, 0);
  let r = Math.random() * totalWeight;
  const def = pool.find((e) => (r -= e.weight) <= 0) || pool[0];
  if (!def) return state;

  const s: GameState = { ...state, stats: { ...state.stats } };
  const netWorthish = Math.max(0, s.cash + getInvestmentTotal(s) + getBusinessValue(s));
  const era = Math.max(1, Math.pow(1.0, 1)); // flat amounts stay small; % of net worth carries scale
  let delta = 0;
  if (def.cashFlat) delta += def.cashFlat * era;
  if (def.cashPctOfNetWorth) delta += netWorthish * def.cashPctOfNetWorth;
  if (delta !== 0) {
    s.cash += delta;
    if (delta > 0) s.stats.eventGains += delta; else s.stats.eventLosses += -delta;
  }
  if (def.xpFlat) s.xp += def.xpFlat;
  if (def.businessBoostDays) s.boostUntil = s.day + def.businessBoostDays;
  if (def.livingCostShift && def.livingCostShiftDays) {
    s.livingMult = def.livingCostShift;
    s.livingUntil = s.day + def.livingCostShiftDays;
  }
  if (def.payShift && def.payShiftDays) {
    s.payMult = def.payShift;
    s.payUntil = s.day + def.payShiftDays;
  }
  if (def.jobLoss && s.jobIndex > 0) {
    s.jobIndex -= 1;
    const fallback = JOBS[s.jobIndex];
    s.currentJob = { title: fallback.title, employer: fallback.employer, dailyPay: fallback.dailyPay };
    s.careerOffers = [];
    s.xp = 0;
  }

  s.events = [{ day: Math.floor(s.day), title: def.title, text: def.text, tone: def.tone }, ...s.events].slice(0, 30);
  return s;
}

// ---------- the daily simulation ----------
function advance(state: GameState, days: number, now: number): GameState {
  let s: GameState = { ...state, stats: { ...state.stats, jobEarned: { ...state.stats.jobEarned }, jobDays: { ...state.stats.jobDays }, shifts: { ...state.stats.shifts }, investEarnedById: { ...state.stats.investEarnedById }, businessEarnedById: { ...state.stats.businessEarnedById } } };
  const stats = s.stats;
  let cash = s.cash;
  const taxRate = getTaxRate(s);

  // Education in progress — study speed follows the hours you allocate
  let studying = s.studying;
  let education = s.education;
  if (studying) {
    const rate = (s.studyHours / 40) * getSchoolProgressMultiplier(s);
    const left = studying.daysLeft - days * rate;
    if (rate > 0 && left <= 0) { education = Math.max(education, studying.level); studying = null; }
    else studying = { ...studying, daysLeft: left };
  }
  s = { ...s, studying, education };

  // Salary
  const job = getJob(s);
  const gross = getGrossSalary(s) * days;
  const tax = gross * taxRate;
  const netSalary = gross - tax;
  cash += netSalary;
  stats.salaryEarned += netSalary;
  stats.taxesPaid += tax;
  stats.jobEarned[job.id] = (stats.jobEarned[job.id] || 0) + netSalary;
  stats.jobDays[job.id] = (stats.jobDays[job.id] || 0) + days;

  // Living and training
  const living = getLivingCosts(s) * days;
  const training = Math.max(0, s.trainingBudget) * days;
  cash -= living + training;
  stats.livingSpent += living;
  stats.trainingSpent += training;

  // Businesses
  const businesses: Record<string, BusinessState> = {};
  let managedGross = 0;
  for (const [id, biz] of Object.entries(s.businesses)) {
    const def = BUSINESSES.find((b) => b.id === id);
    if (!def || biz.level === 0) { businesses[id] = biz; continue; }
    const perDay = businessIncomeOf(s, id);
    if (biz.hasManager) {
      const gain = perDay * days;
      managedGross += gain;
      stats.businessEarnedById[id] = (stats.businessEarnedById[id] || 0) + gain * (1 - taxRate);
      businesses[id] = biz;
    } else {
      const cap = perDay * UNMANAGED_CAP_DAYS;
      businesses[id] = { ...biz, accumulated: Math.min(cap, (biz.accumulated || 0) + perDay * days) };
    }
  }
  const bizTax = managedGross * taxRate;
  cash += managedGross - bizTax;
  stats.businessEarned += managedGross - bizTax;
  stats.taxesPaid += bizTax;

  // Operating costs
  const mgr = getManagerCosts(s) * days;
  const ret = getRetainerCosts(s) * days;
  const operating = getOperatingCosts(s) * days;
  cash -= operating;
  stats.managerSpent += mgr;
  stats.retainerSpent += ret;

  // Investments — lognormal so the long-run average matches the stated return
  const investments: Record<string, InvestmentState> = {};
  const mult = investMultiplier(s);
  const volDamp = s.consultants.includes("quant") ? 0.5 : 1;
  for (const [id, inv] of Object.entries(s.investments)) {
    const def = INVESTMENTS.find((i) => i.id === id);
    if (!def || inv.value <= 0) { investments[id] = inv; continue; }
    const mu = def.annualReturn * mult;
    const sigma = def.annualVolatility * volDamp;
    const t = days / DAYS_PER_YEAR;
    const z = gaussian();
    const factor = Math.exp((Math.log(1 + mu) - (sigma * sigma) / 2) * t + sigma * Math.sqrt(t) * z);
    const newValue = Math.max(0, inv.value * factor);
    const gain = newValue - inv.value;
    stats.investmentGains += gain;
    stats.investEarnedById[id] = (stats.investEarnedById[id] || 0) + gain;
    investments[id] = { ...inv, value: newValue };
  }

  // Loan servicing — interest accrues on the remaining balance only
  const loans: Record<string, LoanState> = {};
  const loansRepaid = [...s.loansRepaid];
  for (const [id, loan] of Object.entries(s.loans)) {
    if (loan.remaining <= 0) { loans[id] = loan; continue; }
    const def = LOANS.find((l) => l.id === id);
    if (!def) { loans[id] = loan; continue; }
    const dailyRate = def.annualRate / DAYS_PER_YEAR;
    const grown = loan.remaining * Math.pow(1 + dailyRate, days);
    stats.loanInterestPaid += grown - loan.remaining;
    let remaining = grown;
    const due = Math.min(loan.dailyPayment * days, remaining);
    cash -= due;
    remaining -= due;
    if (remaining <= 0.5) {
      if (!loansRepaid.includes(id)) loansRepaid.push(id);
      loans[id] = { drawn: 0, remaining: 0, dailyPayment: 0, timesRepaid: loan.timesRepaid + 1 };
    } else {
      loans[id] = { ...loan, remaining };
    }
  }

  // Credit card: anything you cannot cover becomes revolving debt
  let ccDebt = s.ccDebt;
  if (ccDebt > 0) {
    const interest = ccDebt * (Math.pow(1 + CC_APR / DAYS_PER_YEAR, days) - 1);
    ccDebt += interest;
    stats.ccInterestPaid += interest;
  }
  if (cash < 0) { ccDebt += -cash; cash = 0; }
  else if (ccDebt > 0) {
    const pay = Math.min(cash, Math.max(ccDebt * CC_MIN_PAYMENT_RATE * days, Math.min(ccDebt, cash * 0.5)));
    cash -= pay;
    ccDebt -= pay;
  }

  // Over the limit: you get cut off and forced down to the cheapest life
  let assets = s.assets;
  let events = s.events;
  if (ccDebt > getCreditLimit(s) && Object.values(assets).some((tier) => tier > 1)) {
    assets = Object.fromEntries(ASSETS.map((def) => [def.id, 1]));
    const cutoff: GameEvent = { day: Math.floor(s.day), title: "Cut off", text: "Your card was declined. You have moved down to the cheapest possible life until the balance clears.", tone: "bad" };
    events = [cutoff, ...events].slice(0, 30);
  }

  // Experience
  const workShare = getWorkHours(s) / WEEK_HOURS;
  const xp = s.xp + days * getCareerProgressMultiplier(s) * (0.4 + 0.6 * workShare);

  let next: GameState = {
    ...s,
    cash: Math.max(0, cash), ccDebt,
    assets, events,
    day: s.day + days,
    xp, businesses, investments, loans, loansRepaid,
    stats, lastTick: now,
  };
  next = rollEvent(next, days);
  return next;
}

function gaussian(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "TICK": {
      const now = Date.now();
      const days = Math.min((now - state.lastTick) / 1000, 30);
      if (days < 0.05) return state;
      return advance(state, days, now);
    }

    case "RESET": {
      localStorage.removeItem(SAVE_KEY);
      return createFresh();
    }

    case "WORK": {
      const today = Math.floor(state.day);
      if (state.lastShiftDay === today) return state;
      const job = getJob(state);
      const pay = getJob(state).dailyPay * 0.25 * (1 - getTaxRate(state));
      const stats = { ...state.stats, shifts: { ...state.stats.shifts }, jobEarned: { ...state.stats.jobEarned } };
      stats.shiftEarned += pay;
      stats.shifts[job.id] = (stats.shifts[job.id] || 0) + 1;
      stats.jobEarned[job.id] = (stats.jobEarned[job.id] || 0) + pay;
      return {
        ...state,
        cash: state.cash + pay,
        xp: state.xp + 2 * getCareerProgressMultiplier(state),
        lastShiftDay: today,
        stats,
      };
    }

    case "SET_STUDY_HOURS":
      return { ...state, studyHours: Math.max(0, Math.min(WEEK_HOURS, Math.round(action.hours))) };

    case "SET_TRAINING":
      return { ...state, trainingBudget: Math.max(0, action.amount) };

    case "SET_LIFESTYLE": {
      const def = ASSETS.find((asset) => asset.id === action.id);
      if (!def || action.tier < 1 || action.tier > def.tiers.length) return state;
      return { ...state, assets: { ...state.assets, [action.id]: action.tier } };
    }

    case "GENERATE_JOB_OFFERS": {
      const next = JOBS[state.jobIndex + 1];
      if (!next) return state;
      if (state.xp < getJob(state).xpToPromote) return state;
      if (state.education < next.education) return state;
      const variants = CAREER_VARIANTS[state.jobIndex + 1] || [{ title: next.title, employer: next.employer }];
      const careerOffers = [0, 1, 2].map((slot) => {
        const variant = variants[(slot + Math.floor(Math.random() * variants.length)) % variants.length];
        const factor = CAREER_SALARY_RANGE.min + Math.random() * (CAREER_SALARY_RANGE.max - CAREER_SALARY_RANGE.min);
        return { ...variant, dailyPay: Math.round(next.dailyPay * factor) };
      }).sort((a, b) => a.dailyPay - b.dailyPay);
      return { ...state, careerOffers, xp: Math.max(0, state.xp - getJob(state).xpToPromote) };
    }

    case "ACCEPT_JOB_OFFER": {
      const offer = state.careerOffers[action.index];
      const next = JOBS[state.jobIndex + 1];
      if (!offer || !next || state.education < next.education) return state;
      return { ...state, jobIndex: state.jobIndex + 1, currentJob: offer, careerOffers: [], xp: 0 };
    }

    case "STUDY": {
      const def = EDUCATION[action.level];
      if (!def || state.studying) return state;
      if (action.level !== state.education + 1) return state;
      if (state.cash < def.cost) return state;
      return {
        ...state, cash: state.cash - def.cost,
        studyHours: state.studyHours === 0 ? 20 : state.studyHours,
        studying: { level: action.level, daysLeft: def.days },
        stats: { ...state.stats, educationSpent: state.stats.educationSpent + def.cost },
      };
    }

    case "BUY_BUSINESS": {
      const def = BUSINESSES.find((b) => b.id === action.id);
      if (!def || !isBusinessUnlocked(state, action.id)) return state;
      const cur = state.businesses[action.id] || { level: 0, hasManager: false, accumulated: 0 };
      const cost = upgradeCostFor(state, action.id);
      if (state.cash < cost) return state;
      return {
        ...state, cash: state.cash - cost,
        businesses: { ...state.businesses, [action.id]: { ...cur, level: cur.level + 1 } },
        stats: { ...state.stats, businessSpent: state.stats.businessSpent + cost },
      };
    }

    case "COLLECT_BUSINESS": {
      const biz = state.businesses[action.id];
      if (!biz || biz.accumulated <= 0) return state;
      const taxRate = getTaxRate(state);
      const net = biz.accumulated * (1 - taxRate);
      const stats = { ...state.stats, businessEarnedById: { ...state.stats.businessEarnedById } };
      stats.businessEarned += net;
      stats.taxesPaid += biz.accumulated - net;
      stats.businessEarnedById[action.id] = (stats.businessEarnedById[action.id] || 0) + net;
      return {
        ...state, cash: state.cash + net,
        businesses: { ...state.businesses, [action.id]: { ...biz, accumulated: 0 } },
        stats,
      };
    }

    case "HIRE_MANAGER": {
      const def = BUSINESSES.find((b) => b.id === action.id);
      const biz = state.businesses[action.id];
      if (!def || !biz || biz.hasManager || biz.level < 3) return state;
      return { ...state, businesses: { ...state.businesses, [action.id]: { ...biz, hasManager: true } } };
    }

    case "INVEST": {
      const def = INVESTMENTS.find((i) => i.id === action.id);
      if (!def || action.amount <= 0 || state.cash < action.amount) return state;
      if (!isInvestmentUnlocked(state, action.id)) return state;
      const cur = state.investments[action.id] || { value: 0, basis: 0 };
      if (cur.value === 0 && action.amount < def.minInvestment) return state;
      return {
        ...state, cash: state.cash - action.amount,
        investments: {
          ...state.investments,
          [action.id]: { value: cur.value + action.amount, basis: cur.basis + action.amount },
        },
        stats: { ...state.stats, investDeposited: state.stats.investDeposited + action.amount },
      };
    }

    case "WITHDRAW": {
      const cur = state.investments[action.id];
      if (!cur) return state;
      const amt = Math.min(action.amount, cur.value);
      if (amt <= 0) return state;
      // basis comes out in the same proportion, so the gain figure stays honest
      const share = amt / cur.value;
      return {
        ...state, cash: state.cash + amt,
        investments: {
          ...state.investments,
          [action.id]: { value: cur.value - amt, basis: cur.basis * (1 - share) },
        },
        stats: { ...state.stats, investWithdrawn: state.stats.investWithdrawn + amt },
      };
    }

    case "TAKE_LOAN": {
      const def = LOANS.find((l) => l.id === action.id);
      if (!def) return state;
      if (state.loansRepaid.length < def.requiresCredit) return state;
      const cur = state.loans[action.id] || { drawn: 0, remaining: 0, dailyPayment: 0, timesRepaid: 0 };
      const available = def.amount - cur.drawn;
      const amount = Math.min(action.amount, available);
      if (amount <= 0) return state;
      const derived = calculateDerived(state);
      if (derived.netWorth < def.amount * LOAN_EQUITY_REQUIREMENT) return state;
      const remaining = cur.remaining + amount;
      return {
        ...state, cash: state.cash + amount,
        loans: {
          ...state.loans,
          [action.id]: {
            drawn: cur.drawn + amount,
            remaining,
            dailyPayment: amortizedPayment(remaining, def.annualRate, def.termDays),
            timesRepaid: cur.timesRepaid,
          },
        },
      };
    }

    case "REPAY_LOAN": {
      const loan = state.loans[action.id];
      const def = LOANS.find((l) => l.id === action.id);
      if (!loan || loan.remaining <= 0 || !def) return state;
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
          [action.id]: done
            ? { drawn: 0, remaining: 0, dailyPayment: 0, timesRepaid: loan.timesRepaid + 1 }
            : { ...loan, remaining: rem, dailyPayment: amortizedPayment(rem, def.annualRate, def.termDays) },
        },
      };
    }

    case "PAY_CC": {
      if (state.ccDebt <= 0) return state;
      const pay = Math.min(state.cash, state.ccDebt);
      if (pay <= 0) return state;
      return { ...state, cash: state.cash - pay, ccDebt: state.ccDebt - pay };
    }

    case "HIRE_CONSULTANT": {
      const def = CONSULTANTS.find((c) => c.id === action.id);
      if (!def || state.consultants.includes(action.id) || state.cash < def.hireCost) return state;
      const levels = Object.values(state.businesses).reduce((s, b) => s + b.level, 0);
      if (levels < def.requiresBusinessLevels) return state;
      return {
        ...state, cash: state.cash - def.hireCost,
        consultants: [...state.consultants, action.id],
        stats: { ...state.stats, consultantSpent: state.stats.consultantSpent + def.hireCost },
      };
    }

    case "FIRE_CONSULTANT":
      return { ...state, consultants: state.consultants.filter((c) => c !== action.id) };

    default:
      return state;
  }
}

export interface DerivedState {
  netWorth: number;
  salaryPerDay: number;
  businessPerDay: number;
  investmentPerDay: number;
  incomePerDay: number;
  livingCosts: number;
  trainingCost: number;
  operatingCosts: number;
  loanPayments: number;
  ccInterestPerDay: number;
  ccPaymentPerDay: number;
  netPerDay: number;
  investmentTotal: number;
  loanTotal: number;
  assetValue: number;
  businessValue: number;
  businessCapital: number;
  shiftPay: number;
  job: (typeof JOBS)[number];
  nextJob: (typeof JOBS)[number] | null;
  xpNeeded: number;
  focus: number;
  schoolProgress: number;
  creditTier: number;
  creditLimit: number;
  taxRate: number;
  workHours: number;
}

function calculateDerived(state: GameState): DerivedState {
  const taxRate = getTaxRate(state);
  const salaryPerDay = getGrossSalary(state) * (1 - taxRate);
  const businessPerDay = getBusinessGross(state) * (1 - taxRate);
  const investmentTotal = getInvestmentTotal(state);
  const investmentPerDay = getInvestmentPerDay(state);

  const livingCosts = getLivingCosts(state);
  const operatingCosts = getOperatingCosts(state);
  const loanPayments = getLoanPayments(state);
  const trainingCost = Math.max(0, state.trainingBudget);
  const ccInterestPerDay = (state.ccDebt * CC_APR) / DAYS_PER_YEAR;
  const ccPaymentPerDay = getCreditCardPayment(state);

  let loanTotal = 0;
  for (const l of Object.values(state.loans)) loanTotal += l.remaining;

  const assetValue = 0; // lifestyle choices are recurring services, not owned assets

  let businessCapital = 0;
  for (const [id, biz] of Object.entries(state.businesses)) {
    const def = BUSINESSES.find((b) => b.id === id);
    if (def) businessCapital += getBusinessCapital(def, biz.level);
  }

  const businessValue = getBusinessValue(state);
  const incomePerDay = salaryPerDay + businessPerDay + investmentPerDay;
  const netPerDay = incomePerDay - livingCosts - trainingCost - operatingCosts - loanPayments - ccPaymentPerDay;

  const job = getJob(state);
  return {
    // you owe the principal, not the future interest
    netWorth: state.cash + investmentTotal + assetValue + businessValue - loanTotal - state.ccDebt,
    salaryPerDay, businessPerDay, investmentPerDay, incomePerDay,
    livingCosts, trainingCost, operatingCosts, loanPayments, ccInterestPerDay, ccPaymentPerDay, netPerDay,
    investmentTotal, loanTotal, assetValue, businessValue, businessCapital,
    shiftPay: job.dailyPay * 0.25 * (1 - taxRate),
    job,
    nextJob: JOBS[state.jobIndex + 1] || null,
    xpNeeded: job.xpToPromote,
    focus: getCareerProgressMultiplier(state),
    schoolProgress: getSchoolProgressMultiplier(state),
    creditTier: state.loansRepaid.length,
    creditLimit: getCreditLimit(state),
    taxRate,
    workHours: getWorkHours(state),
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
