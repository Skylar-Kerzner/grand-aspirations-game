import React, { createContext, useContext, useReducer, useEffect, useMemo } from "react";
import {
  BUSINESSES, ASSETS, assetLook, lookSwitchCost, INVESTMENTS, LOANS, CONSULTANTS, JOBS, MAJORS, getTrackMajor, EVENTS, CAREER_VARIANTS, CAREER_SALARY_RANGE, trackPayMultiplier, clampRoleDailyPay, getCareerTrack, CAREER_TRACKS, INDUSTRY_MAJOR_BONUS, INDUSTRY_YEAR_STEP, INDUSTRY_YEAR_CAP, INDUSTRY_RISK_RELIEF, TRACK_CONTINUITY_BONUS,
  TRACK_TENURE_STEP, TRACK_TENURE_CAP, TRACK_SWITCH_PENALTY, TRACK_EXPERIENCE_GATE, isAdjacentTrack,
  trackSwitchPenalty, jobHopMultiplier, INVESTOR_ACCESS, trackPerkScale, type InvestmentDef,
  TRACK_EXPERIENCE_STEP, TRACK_EXPERIENCE_CAP, TRACK_EXPERIENCE_YEARS_GATE,
  credentialLevelFrom, requiredCredentialLevel, CREDENTIAL_YEARS_PER_LEVEL, CREDENTIAL_EXPERIENCE_CAP,
  CREDENTIAL_LEVEL_CEILING, PROMOTION_MIN_DAYS, LEVELS_PER_YEAR_IN_TRACK, TRACK_TRANSFER_SHARE, TRACK_TRANSFER_ADJACENT_BONUS,
  licensedCeiling, licenceRequirementAt, roleAtLevel,
  getBusinessCost as calcBusinessCost, getBusinessIncome, getBusinessCapital, amortizedPayment,
  DAYS_PER_YEAR, TAX_RATE, LOBBYIST_TAX_RATE, WEEK_HOURS, WORKDAYS_PER_WEEK, WORKDAYS_PER_YEAR, WORK_HOURS_PER_YEAR, TRAINING_REFERENCE, BUSINESS_ATTENTION_FLOOR, BUSINESS_ATTENTION_FULL_HOURS, BUSINESS_ATTENTION_CURVE,
  BUSINESS_BASELINE_ROI, BUSINESS_CONDITION_REVERSION, BUSINESS_SHOCK_CHANCE, BUSINESS_SHOCK_TEXTS, BUSINESS_NETWORK_MILESTONES, BUSINESS_UPGRADE_REROLL, businessRerollWeight, rollBusinessFortune, getBusinessTierIndex, LOAN_EQUITY_REQUIREMENT,
  businessScaleEfficiency, BUSINESS_MAX_LEVEL, BUSINESS_SALE_DISCOUNT, BUSINESS_SALE_RECENT_DAYS, BUSINESS_SALE_RECENT_PENALTY, BUSINESS_SALE_DAYS, businessBuildDays,
  BUSINESS_FORTUNE_ANCHOR, BUSINESS_FORTUNE_DECAY_UP, BUSINESS_FORTUNE_DECAY_DOWN, BUSINESS_FORTUNE_NOISE,

  WEEKDAY_RHYTHM, BUSINESS_SEASON_REVERSION, BUSINESS_SEASON_VOL, BUSINESS_SEASON_MIN, BUSINESS_SEASON_MAX, BUSINESS_WASHOUT_CHANCE, BUSINESS_BUMPER_CHANCE,
  BUSINESS_DAILY_SWING, BUSINESS_DAILY_FLOOR,
  CC_APR, CC_MIN_PAYMENT_RATE, CC_BASE_LIMIT, EVENT_CHANCE_PER_DAY, MGMT_FEE, PERF_FEE,
  BASE_TIME_BUDGET, getAgeHoursPenalty, STUDENT_LOAN_TERM_DAYS, STUDENT_LOAN_GRACE_DAYS,
  FEDERAL_CAPS, federalCapFor, federalRateFor, federalBucketFor, FEDERAL_RATE_UNDERGRAD,
  PRIVATE_RATE, PRIVATE_TERM_DAYS, PRIVATE_INCOME_MULTIPLE, PRIVATE_NET_WORTH_SHARE, type MajorDef,
} from "./gameData";
import { formatMoney } from "./formatters";

const SAVE_KEY = "empire-tycoon-save-v5";
const LEGACY_SAVE_KEY = "empire-tycoon-save-v4";
const MAX_OFFLINE_DAYS = 240;

export interface BusinessState {
  level: number;
  condition: number;                   // the slow trading trend — this is what moves the value
  takings?: number;                    // how today's takings compared with a normal day
  season?: number;                     // slow multi-week wave in trade (good and bad runs cluster)
  fortune?: number;                    // how well this particular business is doing — it drifts
  fortunePeak?: number;                // the best it has ever run at, so cooling can be shown
  choices?: Record<string, string>;    // location / market / product chosen when opening
  buildUntil?: number;                 // day the newest expansion opens and starts earning
  buildFromLevel?: number;             // size that keeps trading while the build is under way
  lastExpandedOn?: number;             // day of the most recent expansion
  listedUntil?: number;                // day a buyer is expected, when on the market
}

export interface LoanState { drawn: number; remaining: number; dailyPayment: number; timesRepaid: number }
export interface InvestmentState { value: number; basis: number; lockedUntil?: number; drift?: number; regimeUntil?: number }
/**
 * Money borrowed to study. `balance` is federal debt — quiet while enrolled and for
 * six months after. `privateBalance` is bank debt, which accrues from day one.
 */
export interface StudentLoanState {
  balance: number;
  borrowed: number;
  repaid: number;
  dueFrom: number;
  /** Blended fixed rate on the federal balance. */
  rate?: number;
  /** Lifetime federal principal drawn in each statutory pot. */
  undergradBorrowed?: number;
  gradBorrowed?: number;
  privateBalance?: number;
  privateBorrowed?: number;
  privateRepaid?: number;
  privateDueFrom?: number;
}
export interface CareerOffer { title: string; employer: string; dailyPay: number; level?: number; note?: string }

export interface GameEvent { day: number; title: string; text: string; effect?: string; tone: "good" | "bad" | "neutral" }

export interface DailyCashFlow {
  day: number;
  salary: number;
  business: number;
  investments: number;
  costs: number;
}

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

/** Bumped when the expansion ladder changes shape, so old saves can be rescaled. */
export const BUSINESS_SCALE_VERSION = 2;

export interface GameState {
  businessScale?: number;
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
  /** Which look was chosen at each step of each lifestyle category. */
  assetLooks: Record<string, number[]>;
  investments: Record<string, InvestmentState>;
  loans: Record<string, LoanState>;
  studentLoan: StudentLoanState;
  loansRepaid: string[];
  consultants: string[];
  payMult: number; payUntil: number;
  livingMult: number; livingUntil: number;
  boostUntil: number;
  events: GameEvent[];
  /** Actual operating results, grouped by game day. Purchases, financing, and events stay out. */
  cashFlowHistory: DailyCashFlow[];
  stats: Stats;
  lastTick: number;
}

export type GameAction =
  | { type: "TICK" }
  | { type: "WORK" }
  | { type: "SET_STUDY_HOURS"; hours: number }
  | { type: "SET_BUSINESS_HOURS"; id: string; hours: number }
  | { type: "SET_TRAINING"; amount: number }
  | { type: "SET_LIFESTYLE"; id: string; tier: number; look?: number }
  | { type: "GENERATE_JOB_OFFERS" }
  | { type: "ACCEPT_JOB_OFFER"; index: number }
  | { type: "STUDY"; majorId: string; financed?: boolean }
  | { type: "REPAY_STUDENT_LOAN"; amount?: number }
  | { type: "BUY_BUSINESS"; id: string; choices?: Record<string, string> }
  | { type: "SELL_BUSINESS"; id: string }
  | { type: "CANCEL_BUSINESS_SALE"; id: string }

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
  const rawPay = Number.isFinite(cur.dailyPay) ? cur.dailyPay : base.dailyPay;
  const dailyPay = clampRoleDailyPay(cur.title || base.title, rawPay, TRAINING_OFFER_SWING);
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

/** Weekly hours you can direct: a base week, what your lifestyle buys back, what your field allows, less what age takes. */
export function getTimeBudget(state: GameState): number {
  const lifestyle = ASSETS.reduce((sum, asset) => sum + (getLifestyleTier(state, asset.id)?.hoursBonus || 0), 0);
  const career = trackPerk(state, "hoursBonus");
  const age = START_AGE + Math.floor(state.day / 365);
  return Math.max(10, BASE_TIME_BUDGET - getAgeHoursPenalty(age) + lifestyle + career);
}

/** Hours a week age currently takes off your base week. */
export function getAgeHours(state: GameState): number {
  return getAgeHoursPenalty(START_AGE + Math.floor(state.day / 365));
}

/** Hours a week your lifestyle choices currently buy back (negative when they cost you). */
export function getLifestyleHours(state: GameState): number {
  return ASSETS.reduce((sum, asset) => sum + (getLifestyleTier(state, asset.id)?.hoursBonus || 0), 0);
}

export function getLifestyleTier(state: GameState, id: string) {
  const def = ASSETS.find((asset) => asset.id === id);
  if (!def) return undefined;
  const tier = Math.max(1, Math.min(state.assets[id] || 1, def.tiers.length));
  return def.tiers[tier - 1];
}

/** The look the player chose at a given step of a lifestyle category. */
export function getAssetLook(state: GameState, id: string, tierIdx: number) {
  const def = ASSETS.find((asset) => asset.id === id);
  if (!def || !def.tiers[tierIdx]) return undefined;
  return assetLook(def.tiers[tierIdx], Math.max(0, state.assetLooks?.[id]?.[tierIdx] ?? 0));
}

/** Whether the look at this step has already been settled — it is chosen once per game. */
export function isAssetLookChosen(state: GameState, id: string, tierIdx: number): boolean {
  return (state.assetLooks?.[id]?.[tierIdx] ?? -1) >= 0;
}

/** The look of the tier a category is currently set to. */
export function getCurrentAssetLook(state: GameState, id: string) {
  const def = ASSETS.find((asset) => asset.id === id);
  if (!def) return undefined;
  const tier = Math.max(1, Math.min(state.assets[id] || 1, def.tiers.length));
  return getAssetLook(state, id, tier - 1);
}

export function getInvestmentTotal(state: GameState): number {
  return Object.values(state.investments).reduce((s, i) => s + i.value, 0);
}

/**
 * What a career path gives you beyond pay. Every perk is weakest at the bottom
 * of the ladder and full strength at the top, so climbing one path pays off in
 * ways that are not just salary.
 */
export function trackPerk(
  state: GameState,
  key: "investBonus" | "studyBonus" | "livingDiscount" | "hoursBonus" | "ventureLuck" | "ventureCostDiscount",
): number {
  const track = getCareerTrack(state.currentJob.employer);
  const raw = (track[key] as number | undefined) || 0;
  if (!raw) return 0;
  const scaled = raw * trackPerkScale(state.jobIndex, JOBS.length - 1);
  return key === "hoursBonus" ? Math.round(scaled) : scaled;
}

function investMultiplier(state: GameState): number {
  let m = 1;
  if (state.consultants.includes("finance")) m *= 1.1;
  if (state.consultants.includes("quant")) m *= 1.2;
  // Working in a field that lives off markets helps your own money too.
  m *= 1 + trackPerk(state, "investBonus");
  return m;
}

/** The pace this particular holding is running at — published, or quietly its own. */
export function investmentDrift(def: InvestmentDef, inv?: InvestmentState): number {
  if (!def.unknownReturn) return def.annualReturn;
  return inv?.drift ?? def.annualReturn;
}

/** Draw a fresh hidden pace, pulled back toward the class average from wherever it was. */
function rollDrift(def: InvestmentDef, previous?: number): number {
  const spread = def.driftSpread ?? 0.2;
  const anchor = previous === undefined ? def.annualReturn : def.annualReturn + 0.35 * (previous - def.annualReturn);
  const drawn = anchor + gaussian() * spread;
  return Math.max(-0.35, Math.min(1.2, drawn));
}

function nextRegime(def: InvestmentDef, day: number): number {
  const base = def.regimeDays ?? 730;
  return day + Math.round(base * (0.6 + Math.random() * 0.8));
}

export function getInvestmentPerDay(state: GameState): number {
  const mult = investMultiplier(state);
  let total = 0;
  for (const [id, inv] of Object.entries(state.investments)) {
    const def = INVESTMENTS.find((i) => i.id === id);
    if (def) total += (inv.value * investmentDrift(def, inv) * mult) / DAYS_PER_YEAR;
  }
  return total;
}

/** Gross annual salary represented by a role's legacy pay value, at a chosen weekly schedule. */
export function annualSalaryAt(dailyPay: number, weeklyHours = WEEK_HOURS): number {
  return dailyPay * DAYS_PER_YEAR * (weeklyHours / WEEK_HOURS);
}

/** Monday-Friday repeat every seven game days; day zero is Monday. */
export function isCareerWorkday(day: number): boolean {
  return ((Math.floor(day) % 7) + 7) % 7 < WORKDAYS_PER_WEEK;
}

/** Current base salary, before tax, including temporary raises or cuts. */
export function getGrossAnnualSalary(state: GameState): number {
  let salary = annualSalaryAt(getJob(state).dailyPay, getWorkHours(state));
  if (state.day < state.payUntil) salary *= state.payMult;
  return salary;
}

/** Regular gross salary deposited on each of the year's 260 workdays. */
export function getGrossWorkdayPay(state: GameState): number {
  return getGrossAnnualSalary(state) / WORKDAYS_PER_YEAR;
}

/** Gross value of one optional extra hour, from the same annual salary basis. */
export function getGrossHourlyPay(state: GameState): number {
  let pay = annualSalaryAt(getJob(state).dailyPay) / WORK_HOURS_PER_YEAR;
  if (state.day < state.payUntil) pay *= state.payMult;
  return pay;
}

function getPerformancePayPerDay(state: GameState): number {
  const job = getJob(state);
  if (!job.perfFee) return 0;
  return (getInvestmentTotal(state) * MGMT_FEE) / DAYS_PER_YEAR
    + Math.max(0, getInvestmentPerDay(state)) * PERF_FEE;
}

/** Average daily career income, used for forecasts and lending capacity. */
export function getGrossSalary(state: GameState): number {
  return getGrossAnnualSalary(state) / DAYS_PER_YEAR + getPerformancePayPerDay(state);
}

export function businessMultiplier(state: GameState): number {
  let m = 1;
  if (state.consultants.includes("marketing")) m *= 1.1;
  if (state.consultants.includes("celebrity")) m *= 1.25;
  if (state.day < state.boostUntil) m *= 2;
  return m;
}

/** Flat return-on-capital points earned from network milestones (+0.02 per milestone per partner). */
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

/**
 * The rank an industry would actually hire you into: what your schooling and
 * years in that field support, plus whatever seniority elsewhere transfers.
 */
export function getEarnedLevelIn(state: GameState, trackId: string) {
  const cred = getTrackCredential(state, trackId);
  const ceiling = Math.min(
    CREDENTIAL_LEVEL_CEILING[Math.min(3, cred.effective)],
    licensedCeiling(trackId, cred.studied),
  );
  const home = getCareerTrack(state.currentJob.employer).id;

  // What you have built inside the industry itself.
  const fromCredentials = cred.studied > 0 ? CREDENTIAL_LEVEL_CEILING[cred.studied - 1] + 1 : 0;
  const fromYears = Math.floor(cred.years * LEVELS_PER_YEAR_IN_TRACK);
  const insider = Math.min(ceiling, Math.max(fromCredentials, fromYears));

  // What another industry is willing to credit from your seniority elsewhere.
  let share = TRACK_TRANSFER_SHARE[trackId] ?? 0.25;
  if (isAdjacentTrack(home, trackId)) share += TRACK_TRANSFER_ADJACENT_BONUS;
  const transfer = trackId === home ? 0 : Math.min(ceiling, Math.floor(state.jobIndex * share));

  const level = Math.max(0, Math.min(JOBS.length - 1, ceiling, Math.max(insider, transfer)));
  return { level, ceiling, cred, transfer, insider };
}

/** Plain-language reason an industry would start you where it would. */
export function earnedLevelNote(state: GameState, trackId: string): string {
  const { cred, insider, transfer, ceiling } = getEarnedLevelIn(state, trackId);
  const name = CAREER_TRACKS[trackId]?.name || "this industry";
  // Licensed work stops dead without the qualification, whatever else you have done.
  const blocking = licenceRequirementAt(trackId, ceiling + 1);
  if (blocking && blocking.level > cred.studied) {
    const role = roleAtLevel(trackId, ceiling + 1);
    return `${role?.title ?? "The next post"} in ${name} cannot be held without ${blocking.label} — years served will not stand in for it.`;
  }
  if (cred.studied >= 3) return `Your graduate degree in ${name} opens the top of this ladder.`;
  if (cred.studied === 2) return `Your bachelor's in ${name} places you mid-ladder here.`;
  if (cred.studied === 1) return `Your short course in ${name} opens the junior half of this ladder.`;
  if (cred.years >= 1) return `${cred.years.toFixed(1)} years worked in ${name} is what places you here.`;
  if (transfer > insider && transfer > 0) return `No schooling in ${name}: they credit some of your seniority elsewhere, nothing more.`;
  return `No schooling or years in ${name}: you would start near the bottom${ceiling < JOBS.length - 1 ? " and stop at level " + (ceiling + 1) + " without studying" : ""}.`;
}

/** What your career and education bring to running a venture in its industry. */
export function getIndustryKnowledge(state: GameState, id: string) {
  const def = BUSINESSES.find((business) => business.id === id);
  if (!def) return { returnBonus: 0, riskRelief: 0, hasMajor: false, years: 0, track: undefined };
  const track = CAREER_TRACKS[def.track];
  // Some working lives give you a feel for more than their own industry.
  const helpingTracks = Object.values(CAREER_TRACKS)
    .filter((t) => t.id === def.track || (t.ventureTracks || []).includes(def.track))
    .map((t) => t.id);
  const studied = Math.max(...helpingTracks.map((t) => credentialLevelFrom(state.majors, t)), 0);
  const hasMajor = studied >= 2;
  const years = helpingTracks.reduce((sum, t) => sum + getTrackYears(state, t), 0);
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
  const biz = state.businesses[id];
  if (!def || !biz || biz.level === 0) return 0;
  // Rate the return against the capital actually trading — money tied up in a
  // build-out earns nothing yet, so quoting it would make the rate sag while
  // the expansion is being built and then jump on opening day.
  const capital = getBusinessCapital(def, Math.max(1, getBusinessEarningLevel(state, id)));
  if (capital <= 0) return 0;
  // The same steady income every other screen quotes, expressed as a yearly
  // return on the money put in, so the two figures can never disagree.
  return (getBusinessSteadyIncomeAt(state, id, attention) * DAYS_PER_YEAR) / capital;
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
  return getBusinessIncomeAt(state, id, getBusinessAttentionOf(state, id));
}

/** Actual income at a chosen attention level, under the same trend and takings. */
export function getBusinessIncomeAt(state: GameState, id: string, attention: number): number {
  const biz = state.businesses[id];
  if (!biz || biz.level === 0) return 0;
  // Today's actual rate: steady income x trading trend x today's takings,
  // so the income you watch swings with the day's trade.
  return getBusinessSteadyIncomeAt(state, id, attention) * (biz.condition ?? 1) * (biz.takings ?? 1);
}

/** Typical income at a chosen attention level — the same steady rate the ROI figures quote,
 *  so the money and the percentage beside it can never disagree. Today's luck is shown separately. */
export function getBusinessTypicalIncomeAt(state: GameState, id: string, attention: number): number {
  return getBusinessSteadyIncomeAt(state, id, attention);
}

/** The size actually trading today: a build-out earns nothing until it opens. */
export function getBusinessEarningLevel(state: GameState, id: string): number {
  const biz = state.businesses[id];
  if (!biz) return 0;
  if (biz.buildUntil && state.day < biz.buildUntil) return Math.max(0, biz.buildFromLevel ?? biz.level - 1);
  return biz.level;
}

/** Days left before a build-out opens, 0 when nothing is under construction. */
export function getBuildDaysLeft(state: GameState, id: string): number {
  const biz = state.businesses[id];
  if (!biz?.buildUntil) return 0;
  return Math.max(0, Math.ceil(biz.buildUntil - state.day));
}

/** Days left before a listed business finds its buyer, 0 when not on the market. */
export function getSaleDaysLeft(state: GameState, id: string): number {
  const biz = state.businesses[id];
  if (!biz?.listedUntil) return 0;
  return Math.max(0, Math.ceil(biz.listedUntil - state.day));
}

/** Steady income at a given attention level (1 = full hours) — used for valuation and planning. */
export function getBusinessSteadyIncomeAt(state: GameState, id: string, attention: number): number {
  const def = BUSINESSES.find((b) => b.id === id);
  const biz = state.businesses[id];
  if (!def || !biz || biz.level === 0) return 0;
  // Attention-scaled trading income: the base rate x trading trend x today's
  // takings, so the income you watch swings with the day's trade.
  const base = getBusinessIncome(def, getBusinessEarningLevel(state, id)) * (1 + getIndustryKnowledge(state, id).returnBonus) * businessMultiplier(state) * (biz.fortune ?? 1)
    * attention;
  // The network bonus is a flat add to the return on capital — +2 points per
  // milestone, independent of the hours you give the business.
  const networkPoints = getBusinessNetworkBonus(state, id);
  if (networkPoints === 0) return base;
  const capital = getBusinessCapital(def, Math.max(1, getBusinessEarningLevel(state, id)));
  return base + (networkPoints * capital) / DAYS_PER_YEAR;
}

/** Income ignoring today's trading conditions. */
export function getBusinessSteadyIncomeOf(state: GameState, id: string): number {
  return getBusinessSteadyIncomeAt(state, id, getBusinessAttentionOf(state, id));
}

/** What this single business is worth before the cost of getting out of it. */
export function getBusinessValueOf(state: GameState, id: string): number {
  const def = BUSINESSES.find((b) => b.id === id);
  const biz = state.businesses[id];
  if (!def || !biz || biz.level === 0) return 0;
  // A business performing as expected is worth what has been put into it; luck
  // and the lower returns that come with size scale it in proportion.
  return getBusinessCapital(def, biz.level) * (biz.fortune ?? 1) * businessScaleEfficiency(def, biz.level);
}

/** Fees, diligence and the buyer's discount, steeper right after an expansion. */
export function getBusinessSaleDiscount(state: GameState, id: string): number {
  const biz = state.businesses[id];
  if (!biz || biz.level === 0) return BUSINESS_SALE_DISCOUNT;
  const since = state.day - (biz.lastExpandedOn ?? 0);
  const recency = Math.max(0, 1 - since / BUSINESS_SALE_RECENT_DAYS);
  return BUSINESS_SALE_DISCOUNT + BUSINESS_SALE_RECENT_PENALTY * recency;
}

export function getBusinessSalePrice(state: GameState, id: string): number {
  return getBusinessValueOf(state, id) * (1 - getBusinessSaleDiscount(state, id));
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
  // Some lives come partly comped: meals, rooms, clothes, invitations.
  total *= 1 - trackPerk(state, "livingDiscount");
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

export const EMPTY_STUDENT_LOAN: StudentLoanState = {
  balance: 0, borrowed: 0, repaid: 0, dueFrom: 0, rate: FEDERAL_RATE_UNDERGRAD,
  undergradBorrowed: 0, gradBorrowed: 0,
  privateBalance: 0, privateBorrowed: 0, privateRepaid: 0, privateDueFrom: 0,
};

export function getStudentLoan(state: GameState): StudentLoanState {
  return { ...EMPTY_STUDENT_LOAN, ...(state.studentLoan || {}) };
}

/** What your federal student debt costs you a day. Quiet while enrolled or in grace. */
export function getFederalLoanPayment(state: GameState): number {
  const loan = getStudentLoan(state);
  if (loan.balance <= 0) return 0;
  if (state.studying || state.day < loan.dueFrom) return 0;
  return Math.min(loan.balance, amortizedPayment(loan.balance, loan.rate ?? FEDERAL_RATE_UNDERGRAD, STUDENT_LOAN_TERM_DAYS));
}

/** Bank debt: interest runs from day one, payments begin the day you finish. */
export function getPrivateLoanPayment(state: GameState): number {
  const loan = getStudentLoan(state);
  const balance = loan.privateBalance || 0;
  if (balance <= 0) return 0;
  if (state.studying || state.day < (loan.privateDueFrom || 0)) return 0;
  return Math.min(balance, amortizedPayment(balance, PRIVATE_RATE, PRIVATE_TERM_DAYS));
}

export function getStudentLoanPayment(state: GameState): number {
  return getFederalLoanPayment(state) + getPrivateLoanPayment(state);
}

export function getStudentDebt(state: GameState): number {
  const loan = getStudentLoan(state);
  return loan.balance + (loan.privateBalance || 0);
}

/** Government money still available for a given program, under the 2026 caps. */
export function getFederalRoomFor(state: GameState, def: MajorDef): number {
  const loan = getStudentLoan(state);
  const undergrad = loan.undergradBorrowed || 0;
  const grad = loan.gradBorrowed || 0;
  const bucket = federalBucketFor(def.kind);
  // Professional caps are combined with any earlier graduate borrowing.
  const used = bucket === "undergrad" ? undergrad : grad;
  const bucketRoom = federalCapFor(def.kind) - used;
  const lifetimeRoom = FEDERAL_CAPS.lifetime - (undergrad + grad);
  return Math.max(0, Math.min(bucketRoom, lifetimeRoom));
}

/** Everything you owe right now, used when a bank sizes a private loan. */
function getTotalDebt(state: GameState): number {
  let loanTotal = 0;
  for (const l of Object.values(state.loans)) loanTotal += l.remaining;
  return loanTotal + state.ccDebt + getStudentDebt(state);
}

/** What a private lender will put up: they look at your pay and your assets, not your degree. */
export function getPrivateLoanRoom(state: GameState): number {
  const annualPay = getGrossAnnualSalary(state) + getPerformancePayPerDay(state) * DAYS_PER_YEAR;
  const assets = state.cash + getInvestmentTotal(state) + getBusinessValue(state);
  const capacity = annualPay * PRIVATE_INCOME_MULTIPLE + assets * PRIVATE_NET_WORTH_SHARE;
  return Math.max(0, capacity - getTotalDebt(state));
}

/** How a program's fees would be funded: government first, a bank for the rest. */
export function getStudyFunding(state: GameState, def: MajorDef, cost: number) {
  const federal = Math.min(cost, getFederalRoomFor(state, def));
  const shortfall = Math.max(0, cost - federal);
  const privateRoom = getPrivateLoanRoom(state);
  return { federal, private: Math.min(shortfall, privateRoom), shortfall, privateRoom, covered: shortfall <= privateRoom + 0.5 };
}

/** You need the degree below before the one above. */
export function getStudyPrereqNote(state: GameState, def: MajorDef): string | null {
  if (def.level < 3) return null;
  const hasBachelors = state.majors.some((id) => {
    const m = MAJORS.find((x) => x.id === id);
    return !!m && m.level === 2 && (m.track === def.track || isAdjacentTrack(m.track, def.track));
  });
  if (hasBachelors) return null;
  const own = MAJORS.find((m) => m.track === def.track && m.level === 2);
  return `Needs a bachelor's first — ${own?.name || "a related degree"} or one from a related industry.`;
}

export function getCreditCardPayment(state: GameState): number {
  if (state.ccDebt <= 0) return 0;
  const balanceAfterInterest = state.ccDebt * (1 + CC_APR / DAYS_PER_YEAR);
  return Math.min(balanceAfterInterest, balanceAfterInterest * CC_MIN_PAYMENT_RATE);
}

// Steady interview preparation — a fixed retainer for coaching, mock interviews and
// certifications. It heats up over about a month and cools off if you stop.
// Unprepared candidates land below the going rate for the role and well-prepared ones
// above it: the swing runs from -17.5% to +17.5% around the US median for that job.
export const TRAINING_OFFER_SWING = 0.175;
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
  return TRAINING_OFFER_SWING * (getInterviewReadiness(state) * 2 - 1);
}


export function getBusinessValue(state: GameState): number {
  let total = 0;
  for (const id of Object.keys(state.businesses)) {
    total += getBusinessValueOf(state, id);
  }
  return total;
}

export function getCreditLimit(state: GameState): number {
  const positive = state.cash + getInvestmentTotal(state) + getBusinessValue(state);
  return Math.max(CC_BASE_LIMIT, positive * 0.08, getGrossAnnualSalary(state) / 6);
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
  let raw = calcBusinessCost(def.baseCost, def.costMultiplier, level);
  // Some working lives make building things cheaper.
  raw *= 1 - trackPerk(state, "ventureCostDiscount");
  return state.consultants.includes("banker") ? raw * 0.8 : raw;
}

function createFresh(): GameState {
  const firstJob = JOBS[0];
  return {
    cash: 400, ccDebt: 0, day: 0, businessScale: BUSINESS_SCALE_VERSION,
    jobIndex: 0,
    currentJob: { title: firstJob.title, employer: firstJob.employer, dailyPay: firstJob.dailyPay },
    careerOffers: [],
    jobHistory: [{ title: firstJob.title, employer: firstJob.employer, dailyPay: firstJob.dailyPay, startDay: 0 }],
    majors: [], studying: null,
    studyHours: 0, businessHours: {}, trainingBudget: 0, trainingMomentum: 0,
    lastShiftDay: -1,
    businesses: {}, assets: { house: 1, food: 1, wardrobe: 1, car: 1, health: 1, watch: 1 },
    assetLooks: Object.fromEntries(ASSETS.map((a) => [a.id, a.tiers.map(() => -1)])),
    investments: {}, loans: {},
    studentLoan: { balance: 0, borrowed: 0, repaid: 0, dueFrom: 0 },
    loansRepaid: [], consultants: [],
    payMult: 1, payUntil: 0, livingMult: 1, livingUntil: 0, boostUntil: 0,
    events: [], cashFlowHistory: [], stats: emptyStats(), lastTick: Date.now(),
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
        careerOffers: (parsed.careerOffers || []).map((offer) => ({
          ...offer,
          dailyPay: clampRoleDailyPay(offer.title, offer.dailyPay, TRAINING_OFFER_SWING),
        })),
        jobHistory: parsed.jobHistory && parsed.jobHistory.length
          ? parsed.jobHistory.map((job) => ({
              ...job,
              dailyPay: clampRoleDailyPay(job.title, job.dailyPay, TRAINING_OFFER_SWING),
            }))
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
          health: legacyAssets.health || 1,
          watch: legacyAssets.watch || 1,
        },
        assetLooks: Object.fromEntries(
          ASSETS.map((a) => {
            const currentTier = Math.max(1, (parsed.assets?.[a.id] ?? 1));
            return [a.id, a.tiers.map((_, i) => {
              const stored = parsed.assetLooks?.[a.id]?.[i];
              // Older saves stored 0 as the default for every tier, which made
              // never-chosen looks at tiers above home look "chosen". Only a
              // non-zero stored look can be a real pick up there.
              if (i + 1 > currentTier && (stored ?? 0) === 0) return -1;
              return stored ?? -1;
            })];
          }),
        ),
        // Older saves carried a single balance — treat it as federal debt.
        studentLoan: parsed.studentLoan && typeof parsed.studentLoan === "object"
          ? {
              ...EMPTY_STUDENT_LOAN,
              ...parsed.studentLoan,
              undergradBorrowed: parsed.studentLoan.undergradBorrowed
                ?? (parsed.studentLoan.gradBorrowed !== undefined ? 0 : parsed.studentLoan.borrowed || 0),
            }
          : { ...EMPTY_STUDENT_LOAN },
        businessScale: BUSINESS_SCALE_VERSION,
        businesses: Object.fromEntries(
          Object.entries(parsed.businesses || {}).map(([id, biz]) => {
            // Expansions used to be forty small steps; they are now sixteen large
            // ones. Old saves keep their place on the ladder, rescaled.
            const rawLevel = biz.level || 0;
            const level = parsed.businessScale === BUSINESS_SCALE_VERSION
              ? Math.min(BUSINESS_MAX_LEVEL, rawLevel)
              : rawLevel > 0
                ? Math.max(1, Math.min(BUSINESS_MAX_LEVEL, Math.round((rawLevel * BUSINESS_MAX_LEVEL) / 40)))
                : 0;
            return [id, {
              level,
              condition: biz.condition ?? 1,
              fortune: biz.fortune,
              fortunePeak: biz.fortunePeak ?? biz.fortune,
              choices: biz.choices,
              buildUntil: biz.buildUntil,
              buildFromLevel: biz.buildFromLevel,
              lastExpandedOn: biz.lastExpandedOn,
              listedUntil: biz.listedUntil,
            }];
          }),
        ),

        businessHours: parsed.businessHours && typeof parsed.businessHours === "object" ? parsed.businessHours : {},
        cashFlowHistory: Array.isArray(parsed.cashFlowHistory) ? parsed.cashFlowHistory.slice(-8) : [],
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
    && (!e.gateAsset || (state.assets[e.gateAsset] ?? 0) > 0)
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
  // Bonuses and penalties measured in days of pay follow your career upward.
  if (def.cashDaysOfPay) delta += getGrossWorkdayPay(s) * def.cashDaysOfPay;
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
    // A consolidation demotes you inside your own industry — it never moves
    // you into a different field.
    const trackId = getCareerTrack(s.currentJob.employer).id;
    let level = s.jobIndex - 1;
    let role = roleAtLevel(trackId, level);
    while (!role && level > 0) {
      level -= 1;
      role = roleAtLevel(trackId, level);
    }
    const fallback = role ?? JOBS[level];
    s.jobIndex = level;
    s.currentJob = {
      title: fallback.title,
      employer: fallback.employer,
      dailyPay: clampRoleDailyPay(fallback.title, JOBS[level].dailyPay, TRAINING_OFFER_SWING),
    };
    s.jobHistory = [...s.jobHistory, { ...s.currentJob, startDay: Math.floor(s.day) }];
    s.careerOffers = [];
  }

  const parts: string[] = [];
  if (delta !== 0) parts.push(`${delta > 0 ? "+" : "-"}${formatMoney(Math.abs(delta))} cash`);
  
  if (def.businessBoostDays) parts.push(`Business profits doubled for ${def.businessBoostDays} days`);
  if (def.livingCostShift && def.livingCostShiftDays) parts.push(`Living costs ${def.livingCostShift >= 1 ? "+" : ""}${Math.round((def.livingCostShift - 1) * 100)}% for ${def.livingCostShiftDays} days`);
  if (def.payShift && def.payShiftDays) parts.push(`Pay ${def.payShift >= 1 ? "+" : ""}${Math.round((def.payShift - 1) * 100)}% for ${def.payShiftDays} days`);
  if (def.jobLoss && state.jobIndex > 0) parts.push(`Your new position pays ${formatMoney(annualSalaryAt(s.currentJob.dailyPay))} a year`);

  s.events = [{ day: Math.floor(s.day), title: def.title, text: def.text, effect: parts.join(" · "), tone: def.tone }, ...s.events].slice(0, 30);
  return s;
}

// ---------- the daily simulation ----------
function appendCashFlow(history: DailyCashFlow[], entry: DailyCashFlow): DailyCashFlow[] {
  const next = history.map((item) => ({ ...item }));
  const existing = next.find((item) => item.day === entry.day);
  if (existing) {
    existing.salary += entry.salary;
    existing.business += entry.business;
    existing.investments += entry.investments;
    existing.costs += entry.costs;
  } else {
    next.push({ ...entry });
  }
  // keep eight: seven finished days plus the day in progress
  return next.sort((a, b) => a.day - b.day).slice(-8);
}

/** Advance in calendar-day pieces so offline progress produces a real seven-day history. */
function advance(state: GameState, days: number, now: number): GameState {
  let next = state;
  let remaining = days;
  while (remaining > 0.0001) {
    const toBoundary = Math.max(0.0001, Math.floor(next.day) + 1 - next.day);
    const chunk = Math.min(remaining, 1, toBoundary);
    const elapsed = days - remaining + chunk;
    next = advanceChunk(next, chunk, now - Math.max(0, days - elapsed) * 1000);
    remaining -= chunk;
  }
  return { ...next, lastTick: now };
}

function advanceChunk(state: GameState, days: number, now: number): GameState {
  let s: GameState = { ...state, stats: { ...state.stats, jobEarned: { ...state.stats.jobEarned }, jobDays: { ...state.stats.jobDays }, shifts: { ...state.stats.shifts }, investEarnedById: { ...state.stats.investEarnedById }, businessEarnedById: { ...state.stats.businessEarnedById } } };
  const stats = s.stats;
  let cash = s.cash;
  const flowDay = Math.floor(s.day);
  const taxRate = getTaxRate(s);

  // Education in progress — study speed follows the hours you allocate
  let studying = s.studying;
  let majors = s.majors;
  if (studying) {
    // Teaching lives run alongside study: the same hours go further.
    const rate = (s.studyHours / 40) * (1 + trackPerk(s, "studyBonus"));
    const left = studying.daysLeft - days * rate;
    if (rate > 0 && left <= 0) { majors = [...new Set([...majors, studying.majorId])]; studying = null; }
    else studying = { ...studying, daysLeft: left };
  }
  // No enrollment, no school hours — the time goes back to your week.
  s = { ...s, studying, majors, studyHours: studying ? s.studyHours : 0 };

  // Regular salary lands Monday-Friday. Performance compensation continues daily.
  const job = getJob(s);
  const regularGross = isCareerWorkday(flowDay) ? getGrossWorkdayPay(s) * days : 0;
  const gross = regularGross + getPerformancePayPerDay(s) * days;
  const tax = gross * taxRate;
  const netSalary = gross - tax;
  cash += netSalary;
  stats.salaryEarned += netSalary;
  stats.taxesPaid += tax;
  stats.jobEarned[job.id] = (stats.jobEarned[job.id] || 0) + netSalary;
  if (isCareerWorkday(flowDay)) stats.jobDays[job.id] = (stats.jobDays[job.id] || 0) + days;

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

  // Businesses — a day's takings swing a lot; the slow trading trend moves the value
  const businesses: Record<string, BusinessState> = {};
  const shockEvents: GameEvent[] = [];
  let bizGross = 0;
  for (const [id, biz] of Object.entries(s.businesses)) {
    const def = BUSINESSES.find((b) => b.id === id);
    if (!def || biz.level === 0) { businesses[id] = biz; continue; }
    const steady = getBusinessSteadyIncomeOf(s, id);
    let condition = biz.condition ?? 1;
    let gain = 0;
    let lastTakings = biz.takings ?? 1;
    let fortune = biz.fortune ?? 1;

    const relief = 1 - getIndustryKnowledge(s, id).riskRelief;
    // The slow trend: months-long swings in how the venture is doing.
    const trendVol = ((def.risk * relief) / Math.sqrt(DAYS_PER_YEAR)) * getBusinessAttentionOf(s, id);
    // Day-to-day takings: weekly rhythm x season x luck. Big, but it averages out.
    const noiseScale = def.dailyNoise * relief;
    const rhythm = WEEKDAY_RHYTHM[def.track === "hospitality" || def.id === "themepark" ? "weekend" : "weekday"];
    let season = Math.min(BUSINESS_SEASON_MAX, Math.max(BUSINESS_SEASON_MIN, biz.season ?? 1));
    for (let d = 0; d < days; d++) {
      const weekday = Math.floor(s.day + d) % 7;
      const r = Math.random();
      // standout days hit small ventures hard; a city district barely notices one
      const standoutScale = Math.min(1, noiseScale / 0.3);
      const luck = r < BUSINESS_WASHOUT_CHANCE
        ? 1 - (0.65 + Math.random() * 0.2) * standoutScale
        : r > 1 - BUSINESS_BUMPER_CHANCE
          ? 1 + (1 + Math.random()) * standoutScale
          : 1 + (Math.random() + Math.random() + Math.random() - 1.5) * 1.15 * noiseScale;
      // widen the day's swing around normal; a poor day can run at a loss
      const rawDay = rhythm[weekday] * season * luck;
      lastTakings = Math.max(BUSINESS_DAILY_FLOOR, 1 + (rawDay - 1) * BUSINESS_DAILY_SWING);
      gain += steady * condition * lastTakings;
      // the season drifts slowly and reverts toward normal over about a month
      season = 1 + (season - 1) * (1 - BUSINESS_SEASON_REVERSION) + (Math.random() + Math.random() - 1) * BUSINESS_SEASON_VOL;
      season = Math.min(BUSINESS_SEASON_MAX, Math.max(BUSINESS_SEASON_MIN, season));
      // mean-reverting drift around normal trading conditions — slow, but big
      // enough that a venture's trend visibly moves over a month
      const drift = (Math.random() + Math.random() + Math.random() - 1.5) * 5 * trendVol;
      condition = 1 + (condition - 1) * (1 - BUSINESS_CONDITION_REVERSION) + drift;
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
      // How well the business is doing is not a permanent verdict: competition
      // pulls a winner back toward normal faster than a struggler recovers.
      const pull = fortune > BUSINESS_FORTUNE_ANCHOR ? BUSINESS_FORTUNE_DECAY_UP : BUSINESS_FORTUNE_DECAY_DOWN;
      fortune = BUSINESS_FORTUNE_ANCHOR + (fortune - BUSINESS_FORTUNE_ANCHOR) * (1 - pull)
        + (Math.random() - 0.5) * BUSINESS_FORTUNE_NOISE * fortune;
      fortune = Math.min(6, Math.max(0.1, fortune));
    }
    bizGross += gain;
    stats.businessEarnedById[id] = (stats.businessEarnedById[id] || 0) + gain * (1 - taxRate);
    let updated: BusinessState = {
      ...biz, condition, takings: lastTakings, season,
      fortune,
      fortunePeak: Math.max(biz.fortunePeak ?? biz.fortune ?? 1, fortune),
    };
    const endDay = s.day + days;
    // A build-out finishes and the new capacity starts trading.
    if (updated.buildUntil && endDay >= updated.buildUntil) {
      if (shockEvents.length < 4) {
        shockEvents.push({
          day: Math.floor(updated.buildUntil),
          title: `${def.name} reopens`,
          text: `The building work at your ${def.name.toLowerCase()} is finished and the new space is trading.`,
          effect: "The money put in is now earning.",
          tone: "good",
        });
      }
      updated = { ...updated, buildUntil: undefined, buildFromLevel: undefined };
    }
    // A buyer turns up for a business that was put on the market.
    if (updated.listedUntil && endDay >= updated.listedUntil) {
      const proceeds = getBusinessSalePrice(s, id);
      cash += proceeds;
      stats.businessSold += proceeds;
      if (shockEvents.length < 4) {
        shockEvents.push({
          day: Math.floor(updated.listedUntil),
          title: `${def.name} sold`,
          text: `A buyer completed on your ${def.name.toLowerCase()}.`,
          effect: `+${Math.round(proceeds).toLocaleString()} after fees and the buyer's discount.`,
          tone: "good",
        });
      }
      updated = { level: 0, condition: 1 };
    }
    businesses[id] = updated;
  }

  const bizTax = bizGross * taxRate;
  const netBusiness = bizGross - bizTax;
  cash += netBusiness;
  stats.businessEarned += netBusiness;
  stats.taxesPaid += bizTax;

  // Operating costs
  const ret = getRetainerCosts(s) * days;
  const operating = getOperatingCosts(s) * days;
  cash -= operating;
  stats.retainerSpent += ret;


  // Investments — lognormal so the long-run average matches the stated return
  const investments: Record<string, InvestmentState> = {};
  let investmentGain = 0;
  const mult = investMultiplier(s);
  const volDamp = s.consultants.includes("quant") ? 0.5 : 1;
  for (const [id, inv] of Object.entries(s.investments)) {
    const def = INVESTMENTS.find((i) => i.id === id);
    if (!def || inv.value <= 0) { investments[id] = inv; continue; }
    let holding = inv;
    if (def.unknownReturn) {
      // A hidden pace, drawn when you bought in and quietly redrawn when the
      // market turns — so a good run is real, but never something you can count on.
      if (holding.drift === undefined) {
        holding = { ...holding, drift: rollDrift(def), regimeUntil: nextRegime(def, s.day + days) };
      } else if ((holding.regimeUntil ?? 0) <= s.day) {
        holding = { ...holding, drift: rollDrift(def, holding.drift), regimeUntil: nextRegime(def, s.day + days) };
      }
    }
    const mu = investmentDrift(def, holding) * mult;
    const sigma = def.annualVolatility * volDamp;
    const t = days / DAYS_PER_YEAR;
    const z = gaussian();
    // No variance drag: the stated return is what a typical year actually gives,
    // with good years above it and bad years below.
    const factor = Math.exp(Math.log(1 + mu) * t + sigma * Math.sqrt(t) * z);
    const newValue = Math.max(0, holding.value * factor);
    const gain = newValue - holding.value;
    investmentGain += gain;
    stats.investmentGains += gain;
    stats.investEarnedById[id] = (stats.investEarnedById[id] || 0) + gain;
    investments[id] = { ...holding, value: newValue };
  }

  // Loan servicing — interest accrues on the remaining balance only
  const loans: Record<string, LoanState> = {};
  const loansRepaid = [...s.loansRepaid];
  let loanPaymentsActual = 0;
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
    loanPaymentsActual += due;
    remaining -= due;
    if (remaining <= 0.5) {
      if (!loansRepaid.includes(id)) loansRepaid.push(id);
      loans[id] = { drawn: 0, remaining: 0, dailyPayment: 0, timesRepaid: loan.timesRepaid + 1 };
    } else {
      loans[id] = { ...loan, remaining };
    }
  }

  // Student debt — interest always accrues. Federal payments wait out the grace
  // period; private payments start the day you finish studying.
  let studentLoan = getStudentLoan(s);
  let studentPaymentActual = 0;
  if (studentLoan.balance > 0) {
    const rate = studentLoan.rate ?? FEDERAL_RATE_UNDERGRAD;
    const grown = studentLoan.balance * Math.pow(1 + rate / DAYS_PER_YEAR, days);
    stats.loanInterestPaid += grown - studentLoan.balance;
    let balance = grown;
    if (!s.studying && s.day >= studentLoan.dueFrom) {
      const due = Math.min(getFederalLoanPayment({ ...s, studentLoan: { ...studentLoan, balance } }) * days, balance);
      cash -= due;
      studentPaymentActual += due;
      balance -= due;
      studentLoan = { ...studentLoan, balance: Math.max(0, balance), repaid: studentLoan.repaid + due };
    } else {
      studentLoan = { ...studentLoan, balance };
    }
  }
  if ((studentLoan.privateBalance || 0) > 0) {
    const start = studentLoan.privateBalance || 0;
    const grown = start * Math.pow(1 + PRIVATE_RATE / DAYS_PER_YEAR, days);
    stats.loanInterestPaid += grown - start;
    let balance = grown;
    if (!s.studying && s.day >= (studentLoan.privateDueFrom || 0)) {
      const due = Math.min(getPrivateLoanPayment({ ...s, studentLoan: { ...studentLoan, privateBalance: balance } }) * days, balance);
      cash -= due;
      studentPaymentActual += due;
      balance -= due;
      studentLoan = { ...studentLoan, privateBalance: Math.max(0, balance), privateRepaid: (studentLoan.privateRepaid || 0) + due };
    } else {
      studentLoan = { ...studentLoan, privateBalance: balance };
    }
  }

  // Credit card: anything you cannot cover becomes revolving debt
  let ccDebt = s.ccDebt;
  let ccPaymentActual = 0;
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
    ccPaymentActual = pay;
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
    businesses, investments, loans, loansRepaid, studentLoan,
    trainingMomentum,
    trainingBudget: prepRate,
    cashFlowHistory: appendCashFlow(s.cashFlowHistory || [], {
      day: flowDay,
      salary: netSalary,
      business: netBusiness,
      investments: investmentGain,
      costs: living + training + operating + loanPaymentsActual + studentPaymentActual + ccPaymentActual,
    }),
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
      const job = getJob(state);
      const pay = getGrossHourlyPay(state) * (1 - getTaxRate(state));
      const stats = { ...state.stats, shifts: { ...state.stats.shifts }, jobEarned: { ...state.stats.jobEarned } };
      stats.shiftEarned += pay;
      stats.shifts[job.id] = (stats.shifts[job.id] || 0) + 1;
      stats.jobEarned[job.id] = (stats.jobEarned[job.id] || 0) + pay;
      return {
        ...state,
        cash: state.cash + pay,
        lastShiftDay: today,
        cashFlowHistory: appendCashFlow(state.cashFlowHistory || [], {
          day: today, salary: pay, business: 0, investments: 0, costs: 0,
        }),
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
      const looksHere = [...(state.assetLooks[action.id] || def.tiers.map(() => -1))];
      // Every move-in costs the moving fee — the first pick at a step too.
      // Paid up front, or the switch does not happen.
      let cash = state.cash;
      if (action.look !== undefined) {
        const current = looksHere[action.tier - 1] ?? -1;
        if (current !== action.look) {
          const fee = lookSwitchCost(def.tiers[action.tier - 1]);
          if (cash < fee) return state;
          cash -= fee;
          looksHere[action.tier - 1] = action.look;
        }
      }
      const next = {
        ...state,
        cash,
        assets: { ...state.assets, [action.id]: action.tier },
        assetLooks: { ...state.assetLooks, [action.id]: looksHere },
      };
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
      const maxLevel = JOBS.length - 1;
      const homeTrack = getCareerTrack(state.currentJob.employer).id;
      const tenure = getTrackTenure(state);
      const majorTracks = state.majors
        .map((m) => MAJORS.find((d) => d.id === m)?.track)
        .filter((t): t is string => !!t);

      // Time served in the post you hold — nobody is promoted every morning.
      const lastStartDay = state.jobHistory.length > 0
        ? state.jobHistory[state.jobHistory.length - 1].startDay
        : 0;
      const daysInPost = Math.floor(state.day) - lastStartDay;
      const seasoned = daysInPost >= PROMOTION_MIN_DAYS;

      // Which rank each industry would hire you into today.
      const targetLevelFor = (trackId: string): number => {
        const cred = getTrackCredential(state, trackId);
        // Schooling and years in the field set a hard ceiling on the rank
        // anybody will hire you into — in your own industry too.
        const ceiling = Math.min(
          CREDENTIAL_LEVEL_CEILING[Math.min(3, cred.effective)],
          licensedCeiling(trackId, cred.studied),
        );
        if (trackId === homeTrack) {
          // Without enough time in the post, the market only offers you moves
          // at the rank you already hold.
          if (!seasoned) return state.jobIndex;
          const stepOk = cred.effective >= requiredCredentialLevel(state.jobIndex + 1);
          const doubleOk =
            state.jobIndex + 2 <= maxLevel &&
            cred.effective >= requiredCredentialLevel(state.jobIndex + 2) &&
            cred.years >= 2 &&
            daysInPost >= PROMOTION_MIN_DAYS * 2 &&
            getInterviewReadiness(state) >= 0.6;
          const roll = Math.random();
          let target = state.jobIndex;
          if (doubleOk && roll > 0.82) target = state.jobIndex + 2;
          else if (stepOk && roll >= 0.15) target = state.jobIndex + 1;
          return Math.max(0, Math.min(maxLevel, ceiling, target));
        }
        // Another industry starts you where your standing there puts you, and
        // never higher than staying put would have taken you.
        const earned = getEarnedLevelIn(state, trackId).level;
        const cap = seasoned ? state.jobIndex + 1 : state.jobIndex;
        return Math.max(0, Math.min(earned, cap, ceiling, maxLevel));
      };

      // Order industries: your own, then ones you have studied, then the rest.
      const tracks = Object.keys(CAREER_TRACKS)
        .sort(() => Math.random() - 0.5)
        .sort((a, b) => {
          const rank = (t: string) => (t === homeTrack ? 0 : majorTracks.includes(t) ? 1 : 2);
          return rank(a) - rank(b);
        });

      const chosen: { title: string; employer: string; level: number; track: string }[] = [];
      for (const trackId of tracks) {
        if (chosen.length >= 3) break;
        const level = targetLevelFor(trackId);
        const roles = (CAREER_VARIANTS[level] || []).filter(
          (v) => getCareerTrack(v.employer).id === trackId,
        );
        if (roles.length === 0) continue;
        const role = roles[Math.floor(Math.random() * roles.length)];
        if (chosen.some((c) => c.title === role.title || c.employer === role.employer)) continue;
        // A sideways move inside your own industry to the job you already hold is no offer.
        if (role.title === state.currentJob.title && role.employer === state.currentJob.employer) continue;
        chosen.push({ ...role, level, track: trackId });
      }
      if (chosen.length === 0) return { ...state, careerOffers: [] };

      // Restless records are paid less wherever they land.
      const lastStart = state.jobHistory.length > 0 ? state.jobHistory[state.jobHistory.length - 1].startDay : 0;
      const hop = jobHopMultiplier(Math.floor(state.day) - lastStart);
      // Coaching moves an offer around the going rate for the role: unprepared lands below it,
      // fully warmed up lands above it.
      const training = 1 + getOfferTrainingBonus(state);
      const careerOffers: CareerOffer[] = chosen.map((variant) => {
        const base = JOBS[Math.min(variant.level, maxLevel)].dailyPay;
        const factor = CAREER_SALARY_RANGE.min + Math.random() * (CAREER_SALARY_RANGE.max - CAREER_SALARY_RANGE.min);
        const track = trackPayMultiplier(variant.employer, variant.level);
        const sameTrack = variant.track === homeTrack;
        const hasMajor = state.majors.includes(getTrackMajor(variant.track)?.id || "");
        // Staying put compounds: loyalty, positions held and years served in the industry.
        const loyalty = sameTrack
          ? 1 + TRACK_CONTINUITY_BONUS + Math.min(TRACK_TENURE_CAP, tenure * TRACK_TENURE_STEP) + getTrackExperienceBonus(state)
          : 1 - trackSwitchPenalty(homeTrack, variant.track, hasMajor);
        // Clamp to the real-world band for the role first, then let preparation swing it
        // symmetrically around that figure.
        const pay = clampRoleDailyPay(variant.title, Math.round(base * factor * track * loyalty * hop)) * training;

        return {
          title: variant.title,
          employer: variant.employer,
          level: variant.level,
          note: sameTrack
            ? variant.level > state.jobIndex + 1
              ? "A double step up — your record makes the case for it."
              : variant.level === state.jobIndex + 1
                ? "The next rung in your own industry."
                : "A sideways move at your current rank."
            : earnedLevelNote(state, variant.track),
          dailyPay: Number.isFinite(pay) && pay > 0 ? pay : Math.round(base),
        };
      }).sort(() => Math.random() - 0.5);
      return { ...state, careerOffers };
    }

    case "ACCEPT_JOB_OFFER": {
      const offer = state.careerOffers[action.index];
      if (!offer) return state;
      const level = Math.max(0, Math.min(JOBS.length - 1, offer.level ?? state.jobIndex + 1));
      return {
        ...state, jobIndex: level, currentJob: { ...offer, level }, careerOffers: [],
        jobHistory: [...state.jobHistory, { ...offer, level, startDay: Math.floor(state.day) }],
      };
    }

    case "STUDY": {
      const def = MAJORS.find((m) => m.id === action.majorId);
      if (!def || state.studying) return state;
      if (state.majors.includes(def.id)) return state;
      if (getStudyPrereqNote(state, def)) return state;
      // Teaching lives get their fees subsidised.
      const discount = getCareerTrack(state.currentJob.employer).studyBonus ? 0.25 : 0;
      const cost = Math.round(def.cost * (1 - discount));
      const loan = getStudentLoan(state);
      if (action.financed) {
        const funding = getStudyFunding(state, def, cost);
        if (!funding.covered) return state;
        const fedRate = federalRateFor(def.kind);
        const newFederal = loan.balance + funding.federal;
        const blended = newFederal > 0
          ? (loan.balance * (loan.rate ?? FEDERAL_RATE_UNDERGRAD) + funding.federal * fedRate) / newFederal
          : fedRate;
        const bucket = federalBucketFor(def.kind);
        const finishDay = state.day + def.days;
        return {
          ...state,
          studyHours: 20,
          studying: { majorId: def.id, daysLeft: def.days },
          studentLoan: {
            ...loan,
            balance: newFederal,
            borrowed: loan.borrowed + funding.federal,
            rate: blended,
            undergradBorrowed: (loan.undergradBorrowed || 0) + (bucket === "undergrad" ? funding.federal : 0),
            gradBorrowed: (loan.gradBorrowed || 0) + (bucket === "graduate" ? funding.federal : 0),
            privateBalance: (loan.privateBalance || 0) + funding.private,
            privateBorrowed: (loan.privateBorrowed || 0) + funding.private,
            dueFrom: finishDay + STUDENT_LOAN_GRACE_DAYS,
            privateDueFrom: finishDay,
          },
          stats: { ...state.stats, educationSpent: state.stats.educationSpent + cost },
        };
      }
      if (state.cash < cost) return state;
      return {
        ...state, cash: state.cash - cost,
        studyHours: 20,
        studying: { majorId: def.id, daysLeft: def.days },
        stats: { ...state.stats, educationSpent: state.stats.educationSpent + cost },
      };
    }

    case "REPAY_STUDENT_LOAN": {
      const loan = getStudentLoan(state);
      const total = loan.balance + (loan.privateBalance || 0);
      if (total <= 0) return state;
      let pay = Math.min(state.cash, action.amount ?? total, total);
      if (pay <= 0) return state;
      // Clear the expensive bank debt first.
      const toPrivate = Math.min(pay, loan.privateBalance || 0);
      pay -= toPrivate;
      const toFederal = Math.min(pay, loan.balance);
      return {
        ...state, cash: state.cash - (toPrivate + toFederal),
        studentLoan: {
          ...loan,
          balance: loan.balance - toFederal,
          repaid: loan.repaid + toFederal,
          privateBalance: (loan.privateBalance || 0) - toPrivate,
          privateRepaid: (loan.privateRepaid || 0) + toPrivate,
        },
      };
    }

    case "BUY_BUSINESS": {
      const def = BUSINESSES.find((b) => b.id === action.id);
      if (!def || !isBusinessUnlocked(state, action.id)) return state;
      const cur = state.businesses[action.id] || { level: 0, condition: 1 };
      if (cur.level >= BUSINESS_MAX_LEVEL) return state;
      // A business on the market, or still being built, cannot be expanded.
      if (cur.listedUntil || cur.buildUntil) return state;
      const cost = upgradeCostFor(state, action.id);
      if (state.cash < cost) return state;
      const opening = cur.level === 0;
      if (opening && !action.choices) return state;
      const build = businessBuildDays(cur.level + 1);
      const next: BusinessState = opening
        ? {
            level: 1,
            condition: 1,
            choices: action.choices,
            fortune: rollBusinessFortune() * (1 + trackPerk(state, "ventureLuck")),
            buildUntil: state.day + build,
            buildFromLevel: 0,
            lastExpandedOn: state.day,
          }
        : (() => {
            // Only a tier step puts part of the business's fortune back on the
            // table, and only then can it be rebranded.
            const tierUp =
              getBusinessTierIndex(cur.level + 1) !== getBusinessTierIndex(cur.level);
            const nextChoices = tierUp ? action.choices || cur.choices : cur.choices;
            // Keeping the product and the city carries more of what you built over;
            // changing both starts far closer to a fresh business.
            const changed =
              (nextChoices?.concept !== cur.choices?.concept ? 1 : 0) +
              (nextChoices?.location !== cur.choices?.location ? 1 : 0);
            const rerollWeight = businessRerollWeight(changed);
            return {
              ...cur,
              level: cur.level + 1,
              choices: nextChoices,
              buildUntil: state.day + build,
              buildFromLevel: cur.level,
              lastExpandedOn: state.day,
              fortune: Math.min(
                6,
                Math.max(
                  0.15,
                  (tierUp
                    ? (cur.fortune ?? 1) * (1 - rerollWeight) +
                      rollBusinessFortune() * (1 + trackPerk(state, "ventureLuck")) * rerollWeight
                    : (cur.fortune ?? 1)) *
                    // every expansion nudges success a little, up or down
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
      if (!biz || biz.level === 0 || biz.listedUntil) return state;
      // Businesses are not liquid: you put it on the market and wait for a buyer.
      return {
        ...state,
        businesses: {
          ...state.businesses,
          [action.id]: { ...biz, listedUntil: state.day + BUSINESS_SALE_DAYS },
        },
      };
    }

    case "CANCEL_BUSINESS_SALE": {
      const biz = state.businesses[action.id];
      if (!biz || !biz.listedUntil) return state;
      return {
        ...state,
        businesses: { ...state.businesses, [action.id]: { ...biz, listedUntil: undefined } },
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
      // Getting in costs a spread on assets that trade, so buying and selling
      // repeatedly to fish for a good run loses money.
      const credited = action.amount * (1 - (def.tradeSpread || 0));
      const fresh = cur.value <= 0 || cur.drift === undefined;
      const drift = def.unknownReturn ? (fresh ? rollDrift(def, cur.drift) : cur.drift) : undefined;
      const regimeUntil = def.unknownReturn ? (fresh ? nextRegime(def, state.day) : cur.regimeUntil) : undefined;
      return {
        ...state, cash: state.cash - action.amount,
        investments: {
          ...state.investments,
          [action.id]: { value: cur.value + credited, basis: cur.basis + action.amount, lockedUntil, drift, regimeUntil },
        },
        stats: { ...state.stats, investDeposited: state.stats.investDeposited + action.amount },
      };
    }

    case "WITHDRAW": {
      const cur = state.investments[action.id];
      if (!cur) return state;
      if ((cur.lockedUntil || 0) > state.day) return state;
      const def = INVESTMENTS.find((i) => i.id === action.id);
      const amt = Math.min(action.amount, cur.value);
      if (amt <= 0) return state;
      const proceeds = amt * (1 - (def?.tradeSpread || 0));
      // basis comes out in the same proportion, so the gain figure stays honest
      const share = amt / cur.value;
      const left = cur.value - amt;
      return {
        ...state, cash: state.cash + proceeds,
        investments: {
          ...state.investments,
          [action.id]: {
            value: left,
            basis: cur.basis * (1 - share),
            // Sell out entirely and the next holding starts from a fresh, unknown pace.
            drift: left > 0 ? cur.drift : undefined,
            regimeUntil: left > 0 ? cur.regimeUntil : undefined,
          },
        },
        stats: { ...state.stats, investWithdrawn: state.stats.investWithdrawn + proceeds },
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
  recentCashFlowDays: number;
  recentSalary: number;
  recentBusiness: number;
  recentInvestments: number;
  recentCosts: number;
  recentNet: number;
  investmentTotal: number;
  loanTotal: number;
  studentDebt: number;
  studentLoanPayment: number;
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
  annualSalary: number;
  grossWorkdayPay: number;
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
  const studentDebt = getStudentDebt(state);
  const studentLoanPayment = getStudentLoanPayment(state);

  const assetValue = 0; // lifestyle choices are recurring services, not owned assets

  let businessCapital = 0;
  for (const [id, biz] of Object.entries(state.businesses)) {
    const def = BUSINESSES.find((b) => b.id === id);
    if (def) businessCapital += getBusinessCapital(def, biz.level);
  }

  const businessValue = getBusinessValue(state);
  const incomePerDay = salaryPerDay + businessPerDay + investmentPerDay;
  const netPerDay = incomePerDay - livingCosts - trainingCost - operatingCosts - loanPayments - ccPaymentPerDay - studentLoanPayment;
  // Only finished days count, so the figure does not dip every time a new day starts.
  const today = Math.floor(state.day);
  const recent = (state.cashFlowHistory || []).filter((item) => item.day < today).slice(-7);
  const recentSalary = recent.reduce((sum, item) => sum + item.salary, 0);
  const recentBusiness = recent.reduce((sum, item) => sum + item.business, 0);
  const recentInvestments = recent.reduce((sum, item) => sum + item.investments, 0);
  const recentCosts = recent.reduce((sum, item) => sum + item.costs, 0);
  // What you earn by working: passive investment movement is reported separately.
  const recentNet = recentSalary + recentBusiness - recentCosts;

  const job = getJob(state);
  return {
    // you owe the principal, not the future interest
    netWorth: state.cash + investmentTotal + assetValue + businessValue - loanTotal - state.ccDebt - studentDebt,
    salaryPerDay, businessPerDay, investmentPerDay, incomePerDay,
    livingCosts, trainingCost, operatingCosts, loanPayments, ccInterestPerDay, ccPaymentPerDay, netPerDay,
    recentCashFlowDays: recent.length, recentSalary, recentBusiness, recentInvestments, recentCosts, recentNet,
    investmentTotal, loanTotal, studentDebt, studentLoanPayment, assetValue, businessValue, businessCapital,
    shiftPay: getGrossHourlyPay(state) * (1 - taxRate),
    job,
    nextJob: JOBS[state.jobIndex + 1] || null,
    offerTrainingBonus: getOfferTrainingBonus(state),
    interviewReadiness: getInterviewReadiness(state),
    interviewPrepRate: getInterviewPrepRate(state),
    creditTier: state.loansRepaid.length,
    creditLimit: getCreditLimit(state),
    taxRate,
    workHours: getWorkHours(state),
    annualSalary: getGrossAnnualSalary(state),
    grossWorkdayPay: getGrossWorkdayPay(state),
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
