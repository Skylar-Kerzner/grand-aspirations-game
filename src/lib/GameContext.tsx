import React, { createContext, useContext, useReducer, useEffect, useMemo } from "react";
import {
  BUSINESSES, ASSETS, INVESTMENTS, LOANS, CONSULTANTS, JOBS, MAJORS, getTrackMajor, EVENTS, CAREER_VARIANTS, CAREER_SALARY_RANGE, trackPayMultiplier, getCareerTrack, CAREER_TRACKS, INDUSTRY_MAJOR_BONUS, INDUSTRY_YEAR_STEP, INDUSTRY_YEAR_CAP, INDUSTRY_RISK_RELIEF, TRACK_CONTINUITY_BONUS,
  TRACK_TENURE_STEP, TRACK_TENURE_CAP, TRACK_SWITCH_PENALTY, TRACK_EXPERIENCE_GATE, isAdjacentTrack,
  trackSwitchPenalty, jobHopMultiplier, INVESTOR_ACCESS,
  TRACK_EXPERIENCE_STEP, TRACK_EXPERIENCE_CAP, TRACK_EXPERIENCE_YEARS_GATE,
  credentialLevelFrom, requiredCredentialLevel, CREDENTIAL_YEARS_PER_LEVEL, CREDENTIAL_EXPERIENCE_CAP,
  getBusinessCost as calcBusinessCost, getBusinessIncome, getBusinessCapital, amortizedPayment,
  DAYS_PER_YEAR, TAX_RATE, LOBBYIST_TAX_RATE, WEEK_HOURS, TRAINING_REFERENCE, BUSINESS_ATTENTION_FLOOR, BUSINESS_ATTENTION_FULL_HOURS, BUSINESS_ATTENTION_CURVE,
  BUSINESS_VALUATION_MULTIPLE, BUSINESS_CONDITION_REVERSION, BUSINESS_SHOCK_CHANCE, BUSINESS_SHOCK_TEXTS, BUSINESS_NETWORK_MILESTONES, BUSINESS_SALE_DISCOUNT, BUSINESS_UPGRADE_REROLL, businessRerollWeight, rollBusinessFortune, getBusinessTierIndex, LOAN_EQUITY_REQUIREMENT,
  CC_APR, CC_MIN_PAYMENT_RATE, CC_BASE_LIMIT, EVENT_CHANCE_PER_DAY, MGMT_FEE, PERF_FEE,
} from "./gameData";
import { formatMoney } from "./formatters";

const SAVE_KEY = "empire-tycoon-save-v4";
const LEGACY_SAVE_KEY = "empire-tycoon-save-v3";
const MAX_OFFLINE_DAYS = 240;

export interface BusinessState {
  level: number;
  condition: number;
  fortune?: number;                    // lasting quality of this particular venture
  choices?: Record<string, string>;    // location / market / product chosen when opening
}
export interface LoanState { drawn: number; remaining: number; dailyPayment: number; timesRepaid: number }
export interface InvestmentState { value: number; basis: number; lockedUntil?: number }
export interface CareerOffer { title: string; employer: string; dailyPay: number }

export interface GameEvent { day: number; title: string; text: string; effect?: string; tone: "good" | "bad" | "neutral" }

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
  businessSold: number;
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
  jobHistory: (CareerOffer & { startDay: number })[];
  
  majors: string[]; // completed major ids — each opens a career track
  studying: { majorId: string; daysLeft: number } | null;
  studyHours: number;     // of the 40 weekly hours, how many go to school
  businessHours: Record<string, number>; // hours a week personally spent in each venture
  trainingBudget: number; // dollars per day spent on courses and coaching
  trainingMomentum: number; // rolling average of recent training spend — builds over ~30 days
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

export type GameAction =
  | { type: "TICK" }
  | { type: "WORK" }
  | { type: "SET_STUDY_HOURS"; hours: number }
  | { type: "SET_BUSINESS_HOURS"; id: string; hours: number }
  | { type: "SET_TRAINING"; amount: number }
  | { type: "SET_LIFESTYLE"; id: string; tier: number }
  | { type: "GENERATE_JOB_OFFERS" }
  | { type: "ACCEPT_JOB_OFFER"; index: number }
  | { type: "STUDY"; majorId: string }
  | { type: "BUY_BUSINESS"; id: string; choices?: Record<string, string> }
  | { type: "SELL_BUSINESS"; id: string }
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
    loanInterestPaid: 0, ccInterestPaid: 0, assetSpent: 0, businessSpent: 0, businessSold: 0,
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
  const base = JOBS[Math.min(state.jobIndex, JOBS.length - 1)];
  const cur = state.currentJob || base;
  // Older saves and offers can carry a missing pay figure — never let it poison the maths.
  const dailyPay = Number.isFinite(cur.dailyPay) ? cur.dailyPay : base.dailyPay;
  return { ...base, ...cur, dailyPay };
}

/** How many consecutive positions you have held in your current industry. */
export function getTrackTenure(state: GameState): number {
  const home = getCareerTrack(state.currentJob.employer).id;
  let count = 0;
  for (let i = state.jobHistory.length - 1; i >= 0; i--) {
    if (getCareerTrack(state.jobHistory[i].employer).id !== home) break;
    count++;
  }
  return count;
}

/** How many days you have continuously served your current industry. */
export function getTrackExperienceDays(state: GameState): number {
  const home = getCareerTrack(state.currentJob.employer).id;
  let first = state.jobHistory.length - 1;
  for (let i = state.jobHistory.length - 1; i >= 0; i--) {
    if (getCareerTrack(state.jobHistory[i].employer).id !== home) break;
    first = i;
  }
  return Math.max(0, Math.floor(state.day) - state.jobHistory[first].startDay);
}

/** Pay premium on same-industry offers earned through years of service. */
export function getTrackExperienceBonus(state: GameState): number {
  return Math.min(TRACK_EXPERIENCE_CAP, (getTrackExperienceDays(state) / DAYS_PER_YEAR) * TRACK_EXPERIENCE_STEP);
}

export function getTaxRate(state: GameState): number {
  return state.consultants.includes("lobbyist") ? LOBBYIST_TAX_RATE : TAX_RATE;
}

/** Total hours a week currently committed to your ventures. */
export function getTotalBusinessHours(state: GameState): number {
  return Math.min(getTimeBudget(state), Object.values(state.businessHours).reduce((s, h) => s + (h || 0), 0));
}

export function getWorkHours(state: GameState): number {
  const study = state.studying ? state.studyHours : 0;
  return Math.max(0, getTimeBudget(state) - study - getTotalBusinessHours(state));
}

/** How close to full performance this venture runs, from the hours you give it.
 *  Concave: the first hours buy most of the performance, so even a little time
 *  on a side venture is worth something. */
export function getBusinessAttentionFor(state: GameState, id: string, hours: number): number {
  const share = Math.min(1, hours / BUSINESS_ATTENTION_FULL_HOURS);
  return BUSINESS_ATTENTION_FLOOR + (1 - BUSINESS_ATTENTION_FLOOR) * Math.pow(share, BUSINESS_ATTENTION_CURVE);
}

export function getBusinessAttentionOf(state: GameState, id: string): number {
  return getBusinessAttentionFor(state, id, state.businessHours[id] || 0);
}

/** Weekly hours available: 40, plus whatever your lifestyle buys back. */
export function getTimeBudget(state: GameState): number {
  return WEEK_HOURS + ASSETS.reduce((sum, asset) => sum + (getLifestyleTier(state, asset.id)?.hoursBonus || 0), 0);
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

/** Total days worked in a given industry across your whole career. */
export function getTrackYears(state: GameState, trackId: string): number {
  let days = 0;
  const today = Math.floor(state.day);
  state.jobHistory.forEach((job, i) => {
    if (getCareerTrack(job.employer).id !== trackId) return;
    const end = i + 1 < state.jobHistory.length ? state.jobHistory[i + 1].startDay : today;
    days += Math.max(0, end - job.startDay);
  });
  return days / DAYS_PER_YEAR;
}

/** How far you have studied an industry, counting years served as partial credit. */
export function getTrackCredential(state: GameState, trackId: string) {
  const studied = credentialLevelFrom(state.majors, trackId);
  const years = getTrackYears(state, trackId);
  const fromExperience = Math.min(CREDENTIAL_EXPERIENCE_CAP, Math.floor(years / CREDENTIAL_YEARS_PER_LEVEL));
  return { studied, years, effective: Math.max(studied, fromExperience) };
}

/** What your career and education bring to running a venture in its industry. */
export function getIndustryKnowledge(state: GameState, id: string) {
  const def = BUSINESSES.find((business) => business.id === id);
  if (!def) return { returnBonus: 0, riskRelief: 0, hasMajor: false, years: 0, track: undefined };
  const track = CAREER_TRACKS[def.track];
  const studied = credentialLevelFrom(state.majors, def.track);
  const hasMajor = studied >= 2;
  const years = getTrackYears(state, def.track);
  const yearBonus = Math.min(INDUSTRY_YEAR_CAP, years * INDUSTRY_YEAR_STEP);
  const returnBonus = INDUSTRY_MAJOR_BONUS * (studied / 3) + yearBonus;
  const maxBonus = INDUSTRY_MAJOR_BONUS + INDUSTRY_YEAR_CAP;
  return {
    returnBonus,
    riskRelief: INDUSTRY_RISK_RELIEF * (returnBonus / maxBonus),
    hasMajor,
    years,
    track,
  };
}

/** Annual return on capital at a given attention level (1 = full hours). */
export function getBusinessROIAt(state: GameState, id: string, attention: number): number {
  const def = BUSINESSES.find((business) => business.id === id);
  if (!def) return 0;
  const fortune = state.businesses[id]?.fortune ?? 1;
  return def.annualROI * fortune * attention
    * (1 + getBusinessNetworkBonus(state, id) + getIndustryKnowledge(state, id).returnBonus);
}

export function getBusinessEffectiveROI(state: GameState, id: string): number {
  return getBusinessROIAt(state, id, getBusinessAttentionOf(state, id));
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
  return getBusinessSteadyIncomeOf(state, id) * (biz.condition ?? 1);
}

/** Steady income at a given attention level (1 = full hours) — used for valuation and planning. */
export function getBusinessSteadyIncomeAt(state: GameState, id: string, attention: number): number {
  const def = BUSINESSES.find((b) => b.id === id);
  const biz = state.businesses[id];
  if (!def || !biz || biz.level === 0) return 0;
  return getBusinessIncome(def, biz.level) * (1 + getBusinessNetworkBonus(state, id) + getIndustryKnowledge(state, id).returnBonus) * businessMultiplier(state) * (biz.fortune ?? 1)
    * attention;
}

/** Income ignoring today's trading conditions. */
export function getBusinessSteadyIncomeOf(state: GameState, id: string): number {
  return getBusinessSteadyIncomeAt(state, id, getBusinessAttentionOf(state, id));
}

/** What this single venture would fetch if sold today. */
export function getBusinessValueOf(state: GameState, id: string): number {
  const def = BUSINESSES.find((b) => b.id === id);
  const biz = state.businesses[id];
  if (!def || !biz || biz.level === 0) return 0;
  return getBusinessIncome(def, biz.level) * (1 + getBusinessNetworkBonus(state, id) + getIndustryKnowledge(state, id).returnBonus) * (biz.fortune ?? 1)
    * getBusinessAttentionOf(state, id)
    * DAYS_PER_YEAR * BUSINESS_VALUATION_MULTIPLE;
}

export function getBusinessSalePrice(state: GameState, id: string): number {
  return getBusinessValueOf(state, id) * BUSINESS_SALE_DISCOUNT;
}

export function getBusinessUpgradeIncomeGain(state: GameState, id: string): number {
  const biz = state.businesses[id] || { level: 0, condition: 1 };
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
    if (biz.level === 0) continue;
    total += businessIncomeOf(state, id);
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
  let total = getRetainerCosts(state);
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

// Steady interview preparation — a fixed retainer for coaching, mock interviews and
// certifications. It heats up over about a month and cools off if you stop.
export const TRAINING_OFFER_CAP = 0.35;
export const TRAINING_MOMENTUM_DAYS = 30; // time constant for readiness to build (and fade)
export function getInterviewPrepRate(state: GameState): number {
  return Math.max(20, Math.round(getJob(state).dailyPay * 0.15));
}
export function getInterviewReadiness(state: GameState): number {
  const rate = getInterviewPrepRate(state);
  const momentum = Number.isFinite(state.trainingMomentum) ? state.trainingMomentum : 0;
  return Math.max(0, Math.min(1, momentum / Math.max(1, rate)));
}
export function getOfferTrainingBonus(state: GameState): number {
  return TRAINING_OFFER_CAP * getInterviewReadiness(state);
}

export function getBusinessValue(state: GameState): number {
  let total = 0;
  for (const [id, biz] of Object.entries(state.businesses)) {
    const def = BUSINESSES.find((b) => b.id === id);
    if (!def || biz.level === 0) continue;
    total += getBusinessIncome(def, biz.level) * (1 + getBusinessNetworkBonus(state, id)) * (biz.fortune ?? 1)
      * getBusinessAttentionOf(state, id) * DAYS_PER_YEAR * BUSINESS_VALUATION_MULTIPLE;
  }
  return total;
}

export function getCreditLimit(state: GameState): number {
  const positive = state.cash + getInvestmentTotal(state) + getBusinessValue(state);
  return Math.max(CC_BASE_LIMIT, positive * 0.08, getGrossSalary(state) * 60);
}

/** Every venture is open to anyone who can pay for it. */
export function isBusinessUnlocked(_state: GameState, _id: string): boolean {
  return true;
}

/** Net worth as the funds measure it, without needing the full derived state. */
export function getInvestorNetWorth(state: GameState): number {
  const loanTotal = Object.values(state.loans).reduce((s, l) => s + (l.remaining || 0), 0);
  return state.cash + getInvestmentTotal(state) + getBusinessValue(state) - loanTotal - state.ccDebt;
}

/** Whether this fund will take your money at all, on wealth grounds. */
export function isInvestmentUnlocked(state: GameState, id: string): boolean {
  const def = INVESTMENTS.find((i) => i.id === id);
  if (!def) return false;
  return getInvestorNetWorth(state) >= INVESTOR_ACCESS[def.access].netWorth;
}

/** Days before money in this fund can be taken out again. 0 when free to withdraw. */
export function getLockDaysLeft(state: GameState, id: string): number {
  const until = state.investments[id]?.lockedUntil || 0;
  return Math.max(0, Math.ceil(until - state.day));
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
    jobHistory: [{ title: firstJob.title, employer: firstJob.employer, dailyPay: firstJob.dailyPay, startDay: 0 }],
    majors: [], studying: null,
    studyHours: 0, businessHours: {}, trainingBudget: 0, trainingMomentum: 0,
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
      const parsed = JSON.parse(saved) as Partial<GameState> & {
        food?: string; clothing?: string; education?: number; studying?: { level?: number; majorId?: string; daysLeft: number } | null;
      };
      // Legacy saves: an education ladder index maps to a set of majors.
      const LEGACY_MAJOR_MAP = ["trade", "hospitality", "business", "cs", "finance"];
      const legacyEdu = Math.max(0, Math.min(5, parsed.education || 0));
      const legacyStudying = parsed.studying && !parsed.studying.majorId
        ? { majorId: LEGACY_MAJOR_MAP[Math.max(0, (parsed.studying.level || 1) - 1)], daysLeft: parsed.studying.daysLeft }
        : parsed.studying || null;
      const legacyAssets = parsed.assets || {};
      const savedJob = JOBS[Math.min(parsed.jobIndex || 0, JOBS.length - 1)];
      const merged: GameState = {
        ...fresh, ...parsed,
        majors: parsed.majors || LEGACY_MAJOR_MAP.slice(0, legacyEdu),
        studying: legacyStudying as GameState["studying"],
        currentJob: parsed.currentJob || { title: savedJob.title, employer: savedJob.employer, dailyPay: savedJob.dailyPay },
        careerOffers: parsed.careerOffers || [],
        jobHistory: parsed.jobHistory && parsed.jobHistory.length
          ? parsed.jobHistory
          : [{
              title: (parsed.currentJob || savedJob).title,
              employer: (parsed.currentJob || savedJob).employer,
              dailyPay: (parsed.currentJob || savedJob).dailyPay,
              startDay: 0,
            }],
        assets: {
          house: legacyAssets.house || 1,
          food: legacyAssets.food || (parsed.food === "chef" ? 4 : parsed.food === "eatout" ? 3 : parsed.food === "groceries" ? 2 : 1),
          wardrobe: legacyAssets.wardrobe || (parsed.clothing === "tailored" ? 3 : parsed.clothing === "highstreet" ? 2 : 1),
          car: legacyAssets.car || 1,
          watch: legacyAssets.watch || 1,
        },
        businesses: Object.fromEntries(
          Object.entries(parsed.businesses || {}).map(([id, biz]) => [
            id,
            { level: biz.level || 0, condition: biz.condition ?? 1, fortune: biz.fortune, choices: biz.choices },
          ]),
        ),
        businessHours: parsed.businessHours && typeof parsed.businessHours === "object" ? parsed.businessHours : {},
        stats: { ...emptyStats(), ...(parsed.stats || {}) },
        // Older saves never tracked momentum — assume they sustained their current budget.
        trainingMomentum: typeof parsed.trainingMomentum === "number" ? parsed.trainingMomentum : (parsed.trainingBudget || 0),
      };
      // Retired mechanic: old saves may still carry experience points.
      delete (merged as unknown as Record<string, unknown>).xp;
      // A broken number in a save would spread through every figure on screen.
      if (!Number.isFinite(merged.cash)) merged.cash = fresh.cash;
      if (!Number.isFinite(merged.trainingMomentum)) merged.trainingMomentum = 0;
      if (!Number.isFinite(merged.trainingBudget)) merged.trainingBudget = 0;
      if (!Number.isFinite(merged.ccDebt)) merged.ccDebt = 0;
      merged.careerOffers = merged.careerOffers.filter((o) => Number.isFinite(o.dailyPay) && o.dailyPay > 0);
      // Not enrolled means no school hours, whatever the save says.
      if (!merged.studying) merged.studyHours = 0;
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
  const invested = getInvestmentTotal(state);
  const ownedVentures = Object.values(state.businesses).filter((b) => b.level > 0).length;
  const pool = EVENTS.filter((e) =>
    (!e.minDay || state.day >= e.minDay)
    && (!e.gateBusiness || ownedVentures > 0)
    && (!e.gateInvested || invested >= e.gateInvested)
    && (!e.gateNetWorth || state.cash + invested >= e.gateNetWorth)
    && (!e.gateJobIndex || state.jobIndex >= e.gateJobIndex)
    && (!e.gatePerfFee || !!getJob(state).perfFee)
    && (!e.gateMajor || state.majors.length > 0)
  );
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
    s.jobHistory = [...s.jobHistory, { ...s.currentJob, startDay: Math.floor(s.day) }];
    s.careerOffers = [];
  }

  const parts: string[] = [];
  if (delta !== 0) parts.push(`${delta > 0 ? "+" : "-"}${formatMoney(Math.abs(delta))} cash`);
  
  if (def.businessBoostDays) parts.push(`Venture profits doubled for ${def.businessBoostDays} days`);
  if (def.livingCostShift && def.livingCostShiftDays) parts.push(`Living costs ${def.livingCostShift >= 1 ? "+" : ""}${Math.round((def.livingCostShift - 1) * 100)}% for ${def.livingCostShiftDays} days`);
  if (def.payShift && def.payShiftDays) parts.push(`Pay ${def.payShift >= 1 ? "+" : ""}${Math.round((def.payShift - 1) * 100)}% for ${def.payShiftDays} days`);
  if (def.jobLoss && state.jobIndex > 0) parts.push(`Your new position pays ${formatMoney(s.currentJob.dailyPay)} a day`);

  s.events = [{ day: Math.floor(s.day), title: def.title, text: def.text, effect: parts.join(" · "), tone: def.tone }, ...s.events].slice(0, 30);
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
  let majors = s.majors;
  if (studying) {
    const rate = s.studyHours / 40;
    const left = studying.daysLeft - days * rate;
    if (rate > 0 && left <= 0) { majors = [...new Set([...majors, studying.majorId])]; studying = null; }
    else studying = { ...studying, daysLeft: left };
  }
  // No enrollment, no school hours — the time goes back to your week.
  s = { ...s, studying, majors, studyHours: studying ? s.studyHours : 0 };

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

  // Living and interview prep (a steady retainer while it is switched on)
  const living = getLivingCosts(s) * days;
  const prepRate = s.trainingBudget > 0 ? getInterviewPrepRate(s) : 0;
  const training = prepRate * days;
  cash -= living + training;
  // Readiness only counts if it is sustained — it heats up and cools over about a month.
  const trainingKeep = Math.exp(-days / TRAINING_MOMENTUM_DAYS);
  const trainingMomentum = s.trainingMomentum * trainingKeep + prepRate * (1 - trainingKeep);
  stats.livingSpent += living;
  stats.trainingSpent += training;

  // Businesses — profit swings with trading conditions and the odd setback
  const businesses: Record<string, BusinessState> = {};
  const shockEvents: GameEvent[] = [];
  let bizGross = 0;
  for (const [id, biz] of Object.entries(s.businesses)) {
    const def = BUSINESSES.find((b) => b.id === id);
    if (!def || biz.level === 0) { businesses[id] = biz; continue; }
    const steady = getBusinessSteadyIncomeOf(s, id);
    let condition = biz.condition ?? 1;
    let gain = 0;
    const relief = 1 - getIndustryKnowledge(s, id).riskRelief;
    const dailyVol = ((def.risk * relief) / Math.sqrt(DAYS_PER_YEAR)) * getBusinessAttentionOf(s, id);
    for (let d = 0; d < days; d++) {
      gain += steady * condition;
      // mean-reverting drift around normal conditions
      const noise = (Math.random() + Math.random() + Math.random() - 1.5) * 2 * dailyVol;
      condition = 1 + (condition - 1) * (1 - BUSINESS_CONDITION_REVERSION) + noise;
      if (condition > 0.9 && Math.random() < BUSINESS_SHOCK_CHANCE * def.risk * relief) {
        const shock = 0.35 + Math.random() * 0.25;
        condition *= shock;
        if (shockEvents.length < 3) {
          shockEvents.push({
            day: Math.floor(s.day) + d,
            title: `Setback at ${def.name}`,
            text: `At your ${def.name.toLowerCase()}, ${BUSINESS_SHOCK_TEXTS[Math.floor(Math.random() * BUSINESS_SHOCK_TEXTS.length)]}.`,
            effect: `Takings drop ${Math.round((1 - shock) * 100)}% until trade recovers.`,
            tone: "bad",
          });
        }
      }
      condition = Math.min(1.8, Math.max(0.15, condition));
    }
    bizGross += gain;
    stats.businessEarnedById[id] = (stats.businessEarnedById[id] || 0) + gain * (1 - taxRate);
    businesses[id] = { ...biz, condition };
  }
  const bizTax = bizGross * taxRate;
  cash += bizGross - bizTax;
  stats.businessEarned += bizGross - bizTax;
  stats.taxesPaid += bizTax;

  // Operating costs
  const ret = getRetainerCosts(s) * days;
  const operating = getOperatingCosts(s) * days;
  cash -= operating;
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
  let events = shockEvents.length ? [...shockEvents.reverse(), ...s.events].slice(0, 30) : s.events;
  if (ccDebt > getCreditLimit(s) && Object.values(assets).some((tier) => tier > 1)) {
    assets = Object.fromEntries(ASSETS.map((def) => [def.id, 1]));
    const cutoff: GameEvent = { day: Math.floor(s.day), title: "Cut off", text: "Your card was declined. You have moved down to the cheapest possible life until the balance clears.", tone: "bad" };
    events = [cutoff, ...events].slice(0, 30);
  }

  let next: GameState = {
    ...s,
    cash: Math.max(0, cash), ccDebt,
    assets, events,
    day: s.day + days,
    businesses, investments, loans, loansRepaid,
    trainingMomentum,
    trainingBudget: prepRate,
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
        lastShiftDay: today,
        stats,
      };
    }

    case "SET_STUDY_HOURS": {
      if (!state.studying) return state;
      const bizTotal = getTotalBusinessHours(state);
      const hours = Math.max(0, Math.min(getTimeBudget(state) - bizTotal, Math.round(action.hours)));
      return { ...state, studyHours: hours };
    }

    case "SET_BUSINESS_HOURS": {
      const others = getTotalBusinessHours(state) - (state.businessHours[action.id] || 0);
      const hours = Math.max(
        0,
        Math.min(getTimeBudget(state) - state.studyHours - others, BUSINESS_ATTENTION_FULL_HOURS, Math.round(action.hours))
      );
      return { ...state, businessHours: { ...state.businessHours, [action.id]: hours } };
    }

    case "SET_TRAINING":
      return { ...state, trainingBudget: Math.max(0, action.amount) };

    case "SET_LIFESTYLE": {
      const def = ASSETS.find((asset) => asset.id === action.id);
      if (!def || action.tier < 1 || action.tier > def.tiers.length) return state;
      const next = { ...state, assets: { ...state.assets, [action.id]: action.tier } };
      // A humbler lifestyle means fewer bought-back hours — trim commitments to fit.
      const budget = getTimeBudget(next);
      const bizEntries = Object.entries(next.businessHours);
      let bizTotal = bizEntries.reduce((s, [, h]) => s + (h || 0), 0);
      const trimmed = { ...next.businessHours };
      for (const [id, h] of bizEntries) {
        if (bizTotal > budget - next.studyHours) {
          const cut = Math.min(h || 0, bizTotal - (budget - next.studyHours));
          trimmed[id] = (h || 0) - cut;
          bizTotal -= cut;
        }
      }
      next.businessHours = trimmed;
      if (next.studyHours + bizTotal > budget) next.studyHours = Math.max(0, budget - bizTotal);
      return next;
    }

    case "GENERATE_JOB_OFFERS": {
      const next = JOBS[state.jobIndex + 1];
      if (!next) return state;
      const tier = state.jobIndex + 1;
      const homeTrack = getCareerTrack(state.currentJob.employer).id;
      const tenure = getTrackTenure(state);
      // Every path stays open — what changes is the pay you are offered.
      const allVariants = CAREER_VARIANTS[tier] || [{ title: next.title, employer: next.employer }];
      // A step up in an industry is only offered to people qualified for it:
      // study in that industry, or years served in it up to the diploma level.
      const needed = requiredCredentialLevel(tier);
      const qualified = (employer: string) => {
        const t = getCareerTrack(employer).id;
        const studied = credentialLevelFrom(state.majors, t);
        const fromYears = Math.min(CREDENTIAL_EXPERIENCE_CAP, Math.floor(getTrackYears(state, t) / CREDENTIAL_YEARS_PER_LEVEL));
        return Math.max(studied, fromYears) >= needed;
      };
      const variants = allVariants.filter((v) => qualified(v.employer));
      if (variants.length === 0) return { ...state, careerOffers: [] };
      const pool = [...variants].sort(() => Math.random() - 0.5);
      // Spread the choice across industries: take at most one offer per track first,
      // starting with your own industry and any industry you hold a degree in.
      const majorTracks = state.majors
        .map((m) => MAJORS.find((d) => d.id === m)?.track)
        .filter((t): t is string => !!t);
      const rank = (v: { employer: string }) => {
        const t = getCareerTrack(v.employer).id;
        if (t === homeTrack) return 0;
        if (majorTracks.includes(t)) return 1;
        return 2;
      };
      const ordered = [...pool].sort((a, b) => rank(a) - rank(b));
      const picked: typeof variants = [];
      const usedTracks = new Set<string>();
      for (const v of ordered) {
        if (picked.length >= 3) break;
        const t = getCareerTrack(v.employer).id;
        if (usedTracks.has(t)) continue;
        if (picked.some((p) => p.title === v.title || p.employer === v.employer)) continue;
        usedTracks.add(t);
        picked.push(v);
      }
      for (const v of pool) {
        if (picked.length >= 3) break;
        if (picked.some((p) => p.title === v.title || p.employer === v.employer)) continue;
        picked.push(v);
      }
      // Restless records are paid less wherever they land.
      const lastStart = state.jobHistory.length > 0 ? state.jobHistory[state.jobHistory.length - 1].startDay : 0;
      const hop = jobHopMultiplier(Math.floor(state.day) - lastStart);
      // Courses and coaching sharpen every offer you seek out.
      const training = 1 + getOfferTrainingBonus(state);
      const careerOffers = picked.map((variant) => {
        const factor = CAREER_SALARY_RANGE.min + Math.random() * (CAREER_SALARY_RANGE.max - CAREER_SALARY_RANGE.min);
        const track = trackPayMultiplier(variant.employer, state.jobIndex + 1);
        const offerTrack = getCareerTrack(variant.employer).id;
        const sameTrack = offerTrack === homeTrack;
        const hasMajor = state.majors.includes(getTrackMajor(offerTrack)?.id || "");
        // Staying put compounds: loyalty, positions held and years served in the industry.
        const loyalty = sameTrack
          ? 1 + TRACK_CONTINUITY_BONUS + Math.min(TRACK_TENURE_CAP, tenure * TRACK_TENURE_STEP) + getTrackExperienceBonus(state)
          : 1 - trackSwitchPenalty(homeTrack, offerTrack, hasMajor);
        const pay = Math.round(next.dailyPay * factor * track * loyalty * hop * training);
        return { ...variant, dailyPay: Number.isFinite(pay) && pay > 0 ? pay : Math.round(next.dailyPay) };
      }).sort(() => Math.random() - 0.5);
      return { ...state, careerOffers };
    }

    case "ACCEPT_JOB_OFFER": {
      const offer = state.careerOffers[action.index];
      const next = JOBS[state.jobIndex + 1];
      if (!offer || !next) return state;
      return {
        ...state, jobIndex: state.jobIndex + 1, currentJob: offer, careerOffers: [],
        jobHistory: [...state.jobHistory, { ...offer, startDay: Math.floor(state.day) }],
      };
    }

    case "STUDY": {
      const def = MAJORS.find((m) => m.id === action.majorId);
      if (!def || state.studying) return state;
      if (state.majors.includes(def.id)) return state;
      if (state.cash < def.cost) return state;
      return {
        ...state, cash: state.cash - def.cost,
        studyHours: 20,
        studying: { majorId: def.id, daysLeft: def.days },
        stats: { ...state.stats, educationSpent: state.stats.educationSpent + def.cost },
      };
    }

    case "BUY_BUSINESS": {
      const def = BUSINESSES.find((b) => b.id === action.id);
      if (!def || !isBusinessUnlocked(state, action.id)) return state;
      const cur = state.businesses[action.id] || { level: 0, condition: 1 };
      const cost = upgradeCostFor(state, action.id);
      if (state.cash < cost) return state;
      const opening = cur.level === 0;
      if (opening && !action.choices) return state;
      const next: BusinessState = opening
        ? {
            level: 1,
            condition: 1,
            choices: action.choices,
            fortune: rollBusinessFortune(),
          }
        : (() => {
            // Only a tier step puts part of the venture's fortune back on the table,
            // and only then can it be rebranded.
            const tierUp =
              getBusinessTierIndex(cur.level + 1) !== getBusinessTierIndex(cur.level);
            const nextChoices = tierUp ? action.choices || cur.choices : cur.choices;
            // Keeping the product and the city carries more of what you built over;
            // changing both starts far closer to a fresh venture.
            const changed =
              (nextChoices?.concept !== cur.choices?.concept ? 1 : 0) +
              (nextChoices?.location !== cur.choices?.location ? 1 : 0);
            const rerollWeight = businessRerollWeight(changed);
            return {
              ...cur,
              level: cur.level + 1,
              choices: nextChoices,
              fortune: Math.min(
                6,
                Math.max(
                  0.15,
                  (tierUp
                    ? (cur.fortune ?? 1) * (1 - rerollWeight) +
                      rollBusinessFortune() * rerollWeight
                    : (cur.fortune ?? 1)) *
                    // every level nudges success a little, up or down
                    (0.9 + Math.random() * 0.2),
                ),
              ),
            };
          })();
      return {
        ...state, cash: state.cash - cost,
        businesses: { ...state.businesses, [action.id]: next },
        stats: { ...state.stats, businessSpent: state.stats.businessSpent + cost },
      };
    }

    case "SELL_BUSINESS": {
      const biz = state.businesses[action.id];
      if (!biz || biz.level === 0) return state;
      const proceeds = getBusinessSalePrice(state, action.id);
      return {
        ...state, cash: state.cash + proceeds,
        businesses: { ...state.businesses, [action.id]: { level: 0, condition: 1 } },
        stats: { ...state.stats, businessSold: state.stats.businessSold + proceeds },
      };
    }

    case "INVEST": {
      const def = INVESTMENTS.find((i) => i.id === action.id);
      if (!def || action.amount <= 0 || state.cash < action.amount) return state;
      if (!isInvestmentUnlocked(state, action.id)) return state;
      const cur = state.investments[action.id] || { value: 0, basis: 0 };
      // The minimum applies to every fresh commitment, not only the first one.
      if (action.amount < def.minInvestment) return state;
      const lockedUntil = def.lockupDays ? state.day + def.lockupDays : undefined;
      return {
        ...state, cash: state.cash - action.amount,
        investments: {
          ...state.investments,
          [action.id]: { value: cur.value + action.amount, basis: cur.basis + action.amount, lockedUntil },
        },
        stats: { ...state.stats, investDeposited: state.stats.investDeposited + action.amount },
      };
    }

    case "WITHDRAW": {
      const cur = state.investments[action.id];
      if (!cur) return state;
      if ((cur.lockedUntil || 0) > state.day) return state;
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
  offerTrainingBonus: number;
  interviewReadiness: number;
  interviewPrepRate: number;
  
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
    offerTrainingBonus: getOfferTrainingBonus(state),
    interviewReadiness: getInterviewReadiness(state),
    interviewPrepRate: getInterviewPrepRate(state),
    creditTier: state.loansRepaid.length,
    creditLimit: getCreditLimit(state),
    taxRate,
    workHours: getWorkHours(state),
  };
}

import { GameContext } from "./gameContextObject";

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
