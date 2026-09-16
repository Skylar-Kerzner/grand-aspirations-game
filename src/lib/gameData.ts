// ============================================================
// EMPIRE — economic model
// Time: 1 real second = 1 in-game DAY. All rates below are per DAY
// unless stated otherwise. Yearly figures use 365 days.
// ============================================================

export const DAYS_PER_YEAR = 365;
export const TAX_RATE = 0.22;
export const WEEK_HOURS = 40;

// ---------- Education ----------
export interface EducationDef {
  id: string;
  name: string;
  cost: number;
  days: number; // full-time study days (40 hrs/week) before it completes
  description: string;
}

export const EDUCATION: EducationDef[] = [
  { id: "hs", name: "High School Diploma", cost: 0, days: 0, description: "Where everyone starts." },
  { id: "trade", name: "Trade Certificate", cost: 3500, days: 60, description: "A licensed skill, fast payback." },
  { id: "assoc", name: "Associate Degree", cost: 14000, days: 120, description: "Two years, real credentials." },
  { id: "bachelor", name: "Bachelor's Degree", cost: 58000, days: 240, description: "The corporate entry ticket." },
  { id: "mba", name: "MBA", cost: 190000, days: 300, description: "The executive fast lane." },
  { id: "cfa", name: "CFA Charter", cost: 320000, days: 360, description: "The key to running other people's money." },
];

// ---------- Careers ----------
export interface JobDef {
  id: string;
  title: string;
  employer: string;
  education: number; // index into EDUCATION required
  dailyPay: number; // gross, per day at 40 hrs
  xpToPromote: number;
  scene: string; // background image key
  perfFee?: boolean; // earns 2 & 20 on the portfolio
}

export const JOBS: JobDef[] = [
  { id: "dish", title: "Dishwasher", employer: "Corner Diner", education: 0, dailyPay: 152, xpToPromote: 40, scene: "desk-t1" },
  { id: "barista", title: "Barista", employer: "Roast House", education: 0, dailyPay: 188, xpToPromote: 70, scene: "desk-t1" },
  { id: "shift", title: "Shift Supervisor", employer: "Roast House", education: 0, dailyPay: 245, xpToPromote: 120, scene: "desk-t1" },
  { id: "tech", title: "Service Technician", employer: "Meridian Facilities", education: 1, dailyPay: 340, xpToPromote: 180, scene: "desk-t2" },
  { id: "admin", title: "Operations Coordinator", employer: "Meridian Facilities", education: 1, dailyPay: 445, xpToPromote: 260, scene: "desk-t2" },
  { id: "analyst", title: "Junior Analyst", employer: "Halstead Capital", education: 2, dailyPay: 610, xpToPromote: 360, scene: "desk-t2" },
  { id: "account", title: "Account Manager", employer: "Halstead Capital", education: 2, dailyPay: 820, xpToPromote: 500, scene: "desk-t3" },
  { id: "eng", title: "Software Engineer", employer: "Northbeam Labs", education: 3, dailyPay: 1150, xpToPromote: 700, scene: "desk-t3" },
  { id: "lead", title: "Engineering Lead", employer: "Northbeam Labs", education: 3, dailyPay: 1580, xpToPromote: 950, scene: "desk-t3" },
  { id: "dir", title: "Director of Strategy", employer: "Northbeam Labs", education: 3, dailyPay: 2150, xpToPromote: 1300, scene: "desk-t4" },
  { id: "vp", title: "Vice President", employer: "Arclight Group", education: 4, dailyPay: 3100, xpToPromote: 1800, scene: "desk-t4" },
  { id: "partner", title: "Managing Partner", employer: "Arclight Group", education: 4, dailyPay: 4600, xpToPromote: 2600, scene: "desk-t4" },
  { id: "pm", title: "Portfolio Manager", employer: "Halstead Capital", education: 5, dailyPay: 7200, xpToPromote: 3800, scene: "desk-t5" },
  {
    id: "hedge", title: "Hedge Fund Manager", employer: "Your own fund", education: 5,
    dailyPay: 11000, xpToPromote: Infinity, scene: "desk-t5", perfFee: true,
  },
];

// Hedge fund compensation: 2% management fee a year plus 20% of the gains.
export const MGMT_FEE = 0.02;
export const PERF_FEE = 0.2;

// ---------- Living (all per day, all adjustable) ----------
export interface LifestyleOption {
  id: string;
  name: string;
  cost: number;
  focus: number; // additive multiplier on experience gain
  note: string;
  requiresCar?: boolean;
}

export const HOUSING_OPTIONS: LifestyleOption[] = [
  { id: "car", name: "Living in your car", cost: 0, focus: -0.35, note: "Free, and it shows.", requiresCar: true },
  { id: "room", name: "Shared room", cost: 34, focus: -0.1, note: "Cheap, loud, crowded." },
  { id: "studio", name: "Rented studio", cost: 72, focus: 0, note: "Nothing special, nothing wrong." },
  { id: "apartment", name: "Nice apartment", cost: 165, focus: 0.12, note: "Quiet, bright, you sleep well." },
  { id: "penthouse", name: "Rented penthouse", cost: 520, focus: 0.25, note: "The view does something to you." },
];

export const FOOD_OPTIONS: LifestyleOption[] = [
  { id: "instant", name: "Instant noodles", cost: 9, focus: -0.2, note: "Calories, technically." },
  { id: "groceries", name: "Home cooking", cost: 24, focus: 0, note: "Sensible and steady." },
  { id: "eatout", name: "Eating out", cost: 68, focus: 0.1, note: "Time back, energy up." },
  { id: "chef", name: "Private chef", cost: 320, focus: 0.22, note: "You never think about food again." },
];

export const CLOTHING_OPTIONS: LifestyleOption[] = [
  { id: "thrift", name: "Thrifted basics", cost: 3, focus: -0.08, note: "It covers you." },
  { id: "highstreet", name: "High street", cost: 12, focus: 0, note: "Presentable anywhere." },
  { id: "tailored", name: "Tailored", cost: 55, focus: 0.1, note: "People treat you differently." },
];

export const BASE_TRANSIT = 11; // no car? you pay fares

// Training: money spent on courses, coaching and certifications converts to experience.
export const TRAINING_REFERENCE = 60; // dollars/day that yields roughly +1.0 focus

// ---------- Businesses ----------
export interface BusinessDef {
  id: string;
  name: string;
  sector: string;
  baseCost: number;
  annualROI: number; // profit per year as a share of capital invested — constant across levels
  costMultiplier: number;
  managerShare: number; // fraction of revenue paid to manager per day
  unlockLevelOfPrev: number; // levels required in the previous business
  description: string;
  tierNames: string[];
  tierImages: string[];
}

export const BUSINESS_TIER_THRESHOLDS = [1, 8, 20, 40];

export const BUSINESSES: BusinessDef[] = [
  {
    id: "coffee", name: "Coffee Shop", sector: "Food & Beverage",
    baseCost: 6000, annualROI: 0.34, costMultiplier: 1.16, managerShare: 0.14, unlockLevelOfPrev: 0,
    description: "From humble cart to global empire.",
    tierNames: ["Coffee Cart", "Corner Café", "Coffee Chain", "Global Coffee Empire"],
    tierImages: ["coffee-t1", "coffee-t2", "coffee-t3", "coffee-t4"],
  },
  {
    id: "restaurant", name: "Restaurant", sector: "Food & Beverage",
    baseCost: 60000, annualROI: 0.32, costMultiplier: 1.16, managerShare: 0.13, unlockLevelOfPrev: 8,
    description: "Culinary excellence, served daily.",
    tierNames: ["Food Truck", "Neighbourhood Bistro", "Fine Dining Room", "Culinary Empire"],
    tierImages: ["restaurant-t1", "restaurant-t2", "restaurant-t3", "restaurant-t4"],
  },
  {
    id: "tech", name: "Tech Startup", sector: "Technology",
    baseCost: 600000, annualROI: 0.32, costMultiplier: 1.15, managerShare: 0.12, unlockLevelOfPrev: 8,
    description: "Disrupt. Scale. Dominate.",
    tierNames: ["Garage Startup", "Series A Office", "Tech Campus", "Tech Giant HQ"],
    tierImages: ["tech-t1", "tech-t2", "tech-t3", "tech-t4"],
  },
  {
    id: "hotel", name: "Hotel", sector: "Hospitality",
    baseCost: 6000000, annualROI: 0.3, costMultiplier: 1.14, managerShare: 0.11, unlockLevelOfPrev: 8,
    description: "Luxury accommodations worldwide.",
    tierNames: ["Roadside Motel", "Boutique Hotel", "Luxury Resort", "Grand Hotel Empire"],
    tierImages: ["hotel-t1", "hotel-t2", "hotel-t3", "hotel-t4"],
  },
  {
    id: "fashion", name: "Fashion Brand", sector: "Retail",
    baseCost: 60000000, annualROI: 0.3, costMultiplier: 1.13, managerShare: 0.1, unlockLevelOfPrev: 8,
    description: "Define style itself.",
    tierNames: ["Market Stall", "Flagship Boutique", "Department Store", "Fashion House"],
    tierImages: ["fashion-t1", "fashion-t2", "fashion-t3", "fashion-t4"],
  },
  {
    id: "themepark", name: "Theme Park", sector: "Entertainment",
    baseCost: 600000000, annualROI: 0.29, costMultiplier: 1.12, managerShare: 0.09, unlockLevelOfPrev: 8,
    description: "Create worlds of wonder.",
    tierNames: ["Travelling Carnival", "Family Fun Park", "Destination Theme Park", "Entertainment Empire"],
    tierImages: ["themepark-t1", "themepark-t2", "themepark-t3", "themepark-t4"],
  },
  {
    id: "media", name: "Media Network", sector: "Media",
    baseCost: 6000000000, annualROI: 0.29, costMultiplier: 1.12, managerShare: 0.09, unlockLevelOfPrev: 8,
    description: "Own the attention itself.",
    tierNames: ["Podcast Studio", "Streaming Channel", "Broadcast Network", "Global Media Conglomerate"],
    tierImages: ["media-t1", "media-t2", "media-t3", "media-t4"],
  },
  {
    id: "city", name: "City Development", sector: "Infrastructure",
    baseCost: 60000000000, annualROI: 0.28, costMultiplier: 1.11, managerShare: 0.08, unlockLevelOfPrev: 8,
    description: "Build the skyline everyone else lives in.",
    tierNames: ["City Block", "Mixed-Use District", "Waterfront Downtown", "Sovereign Metropolis"],
    tierImages: ["city-t1", "city-t2", "city-t3", "city-t4"],
  },
];

// Uncollected revenue spoils after this many days without a manager
export const UNMANAGED_CAP_DAYS = 20;
// A business is worth this multiple of its annual profit (about 1.2x what you paid in)
export const BUSINESS_VALUATION_MULTIPLE = 4;

/** Cost of the NEXT level (levels are 0-indexed: level 0 means you own nothing yet). */
export function getBusinessCost(baseCost: number, costMultiplier: number, level: number): number {
  return baseCost * Math.pow(costMultiplier, level);
}

/** Total capital sunk into a business at a given level. */
export function getBusinessCapital(def: BusinessDef, level: number): number {
  if (level <= 0) return 0;
  const m = def.costMultiplier;
  return def.baseCost * (Math.pow(m, level) - 1) / (m - 1);
}

/** Gross profit per day. Constant ROI — tiers never reduce your return. */
export function getBusinessIncome(def: BusinessDef, level: number): number {
  return (getBusinessCapital(def, level) * def.annualROI) / DAYS_PER_YEAR;
}

// ---------- Lifestyle assets ----------
export interface AssetTierDef {
  name: string;
  cost: number;
  upkeep: number; // per day
  image: string;
  benefit: string;
}

export interface AssetDef {
  id: string;
  name: string;
  category: string;
  tiers: AssetTierDef[];
}

export const ASSETS: AssetDef[] = [
  {
    id: "car", name: "Vehicle", category: "Transport",
    tiers: [
      { name: "Used Sedan", cost: 7500, upkeep: 19, image: "car-t1", benefit: "No transit fares · +4% pay" },
      { name: "Luxury Sedan", cost: 46000, upkeep: 48, image: "car-t2", benefit: "+10% pay" },
      { name: "Sports Car", cost: 240000, upkeep: 165, image: "car-t3", benefit: "+20% pay" },
      { name: "Hypercar", cost: 2600000, upkeep: 880, image: "car-t4", benefit: "+35% pay" },
    ],
  },
  {
    id: "house", name: "Residence", category: "Property",
    tiers: [
      { name: "Studio Apartment", cost: 185000, upkeep: 31, image: "house-t1", benefit: "Rent free · +10% focus" },
      { name: "Modern Loft", cost: 620000, upkeep: 74, image: "house-t2", benefit: "Rent free · +20% focus" },
      { name: "Hillside Villa", cost: 4200000, upkeep: 310, image: "house-t3", benefit: "Rent free · +32% focus" },
      { name: "Oceanfront Compound", cost: 26000000, upkeep: 1550, image: "house-t4", benefit: "Rent free · +45% focus" },
    ],
  },
  {
    id: "wardrobe", name: "Wardrobe", category: "Fashion",
    tiers: [
      { name: "Casual Wear", cost: 1400, upkeep: 2, image: "wardrobe-t1", benefit: "+4% business income" },
      { name: "Designer Collection", cost: 12500, upkeep: 6, image: "wardrobe-t2", benefit: "+9% business income" },
      { name: "Haute Couture", cost: 95000, upkeep: 24, image: "wardrobe-t3", benefit: "+16% business income" },
      { name: "Bespoke Atelier", cost: 640000, upkeep: 130, image: "wardrobe-t4", benefit: "+25% business income" },
    ],
  },
  {
    id: "watch", name: "Timepiece", category: "Accessories",
    tiers: [
      { name: "Digital Watch", cost: 700, upkeep: 0, image: "watch-t1", benefit: "+4% investment returns" },
      { name: "Automatic Movement", cost: 8500, upkeep: 2, image: "watch-t2", benefit: "+9% investment returns" },
      { name: "Luxury Chronograph", cost: 115000, upkeep: 14, image: "watch-t3", benefit: "+16% investment returns" },
      { name: "Haute Horlogerie", cost: 880000, upkeep: 90, image: "watch-t4", benefit: "+25% investment returns" },
    ],
  },
];

export const CAR_PAY_BONUS = [0.04, 0.1, 0.2, 0.35];
export const HOUSE_FOCUS_BONUS = [0.1, 0.2, 0.32, 0.45];
export const WARDROBE_BUSINESS_BONUS = [0.04, 0.09, 0.16, 0.25];
export const WATCH_INVEST_BONUS = [0.04, 0.09, 0.16, 0.25];

// ---------- Investments ----------
export interface InvestmentDef {
  id: string;
  name: string;
  description: string;
  minInvestment: number;
  annualReturn: number;
  annualVolatility: number;
  risk: string;
  unlockPrev?: string; // must have deposited unlockAmount into this one first
  unlockAmount?: number;
}

export const INVESTMENTS: InvestmentDef[] = [
  { id: "savings", name: "Savings Account", description: "FDIC-safe. 2.0% a year, never moves.", minInvestment: 250, annualReturn: 0.02, annualVolatility: 0, risk: "None" },
  { id: "bonds", name: "Treasury Bonds", description: "4.5% a year, barely wobbles.", minInvestment: 5000, annualReturn: 0.045, annualVolatility: 0.02, risk: "Low", unlockPrev: "savings", unlockAmount: 5000 },
  { id: "index", name: "Index Fund", description: "9% a year on average. It will dip.", minInvestment: 25000, annualReturn: 0.09, annualVolatility: 0.16, risk: "Moderate", unlockPrev: "bonds", unlockAmount: 25000 },
  { id: "realestate", name: "Real Estate Fund", description: "12% a year, illiquid and slow.", minInvestment: 150000, annualReturn: 0.12, annualVolatility: 0.2, risk: "Moderate-High", unlockPrev: "index", unlockAmount: 150000 },
  { id: "crypto", name: "Digital Assets", description: "30% a year in the long run. Wild ride.", minInvestment: 250000, annualReturn: 0.3, annualVolatility: 0.7, risk: "Very High", unlockPrev: "realestate", unlockAmount: 300000 },
  { id: "art", name: "Art & Collectibles", description: "14% a year, moves on its own schedule.", minInvestment: 2000000, annualReturn: 0.14, annualVolatility: 0.25, risk: "Moderate-High", unlockPrev: "crypto", unlockAmount: 2000000 },
  { id: "pe", name: "Private Equity", description: "22% a year. Locked up, leveraged.", minInvestment: 20000000, annualReturn: 0.22, annualVolatility: 0.3, risk: "High", unlockPrev: "art", unlockAmount: 10000000 },
  { id: "vc", name: "Venture Capital", description: "35% a year in theory. Mostly zeros and one rocket.", minInvestment: 100000000, annualReturn: 0.35, annualVolatility: 0.6, risk: "Extreme", unlockPrev: "pe", unlockAmount: 80000000 },
  { id: "sovereign", name: "Sovereign Wealth Portfolio", description: "11% a year on an enormous base. Calm at scale.", minInvestment: 1000000000, annualReturn: 0.11, annualVolatility: 0.09, risk: "Low", unlockPrev: "vc", unlockAmount: 500000000 },
];

// ---------- Loans ----------
export interface LoanDef {
  id: string;
  name: string;
  amount: number; // maximum you can have drawn at once
  annualRate: number;
  termDays: number;
  requiresCredit: number; // number of distinct loan facilities fully repaid
  description: string;
}

// Underwriting: you must also own equity worth at least this share of the loan
export const LOAN_EQUITY_REQUIREMENT = 0.25;

export const LOANS: LoanDef[] = [
  { id: "micro", name: "Micro Loan", amount: 5000, annualRate: 0.22, termDays: 180, requiresCredit: 0, description: "Small, expensive, available to anyone." },
  { id: "personal", name: "Personal Loan", amount: 25000, annualRate: 0.15, termDays: 365, requiresCredit: 1, description: "Needs one clean repayment on file." },
  { id: "sba", name: "Small Business Loan", amount: 150000, annualRate: 0.1, termDays: 730, requiresCredit: 2, description: "For an operator with a track record." },
  { id: "commercial", name: "Commercial Loan", amount: 1000000, annualRate: 0.075, termDays: 1095, requiresCredit: 3, description: "Bank financing for real operations." },
  { id: "venture", name: "Venture Debt", amount: 10000000, annualRate: 0.06, termDays: 1460, requiresCredit: 4, description: "Cheap money for proven empires." },
  { id: "syndicate", name: "Syndicated Facility", amount: 250000000, annualRate: 0.055, termDays: 1825, requiresCredit: 5, description: "A club of banks, one signature." },
  { id: "bond", name: "Corporate Bond Issue", amount: 5000000000, annualRate: 0.045, termDays: 2555, requiresCredit: 6, description: "You are the credit rating now." },
];

export function amortizedPayment(principal: number, annualRate: number, termDays: number): number {
  const r = annualRate / DAYS_PER_YEAR;
  if (r <= 0) return principal / termDays;
  return (principal * r) / (1 - Math.pow(1 + r, -termDays));
}

// ---------- Credit card ----------
export const CC_APR = 0.29;
export const CC_MIN_PAYMENT_RATE = 0.02; // of the balance, per day, taken automatically
export const CC_BASE_LIMIT = 2000;

// ---------- Consultants (retainer based) ----------
export interface ConsultantDef {
  id: string;
  name: string;
  hireCost: number;
  dailyRetainer: number;
  effect: string;
  requiresBusinessLevels: number; // total business levels owned
}

export const CONSULTANTS: ConsultantDef[] = [
  { id: "marketing", name: "Marketing Expert", hireCost: 40000, dailyRetainer: 120, effect: "+10% business income", requiresBusinessLevels: 10 },
  { id: "operations", name: "Operations Director", hireCost: 160000, dailyRetainer: 420, effect: "-15% operating costs", requiresBusinessLevels: 25 },
  { id: "finance", name: "Financial Advisor", hireCost: 400000, dailyRetainer: 900, effect: "+10% investment returns", requiresBusinessLevels: 40 },
  { id: "celebrity", name: "Celebrity Endorsement", hireCost: 1800000, dailyRetainer: 4200, effect: "+25% business income", requiresBusinessLevels: 55 },
  { id: "banker", name: "M&A Banker", hireCost: 12000000, dailyRetainer: 26000, effect: "-20% business upgrade cost", requiresBusinessLevels: 80 },
  { id: "quant", name: "Quant Desk", hireCost: 60000000, dailyRetainer: 140000, effect: "+20% investment returns, half the swings", requiresBusinessLevels: 110 },
  { id: "lobbyist", name: "Lobbyist", hireCost: 250000000, dailyRetainer: 600000, effect: "Tax rate cut to 14%", requiresBusinessLevels: 150 },
];

export const LOBBYIST_TAX_RATE = 0.14;

// ---------- Random events ----------
export interface EventDef {
  id: string;
  title: string;
  text: string;
  tone: "good" | "bad" | "neutral";
  weight: number;
  minDay?: number;
  // effects
  cashPctOfNetWorth?: number; // + or -
  cashFlat?: number;          // scaled by era via multiplier below
  xpFlat?: number;
  businessBoostDays?: number; // days of doubled business profit
  livingCostShiftDays?: number;
  livingCostShift?: number;   // multiplier on living costs while active
  payShift?: number;          // multiplier on salary while active
  payShiftDays?: number;
  jobLoss?: boolean;
}

export const EVENTS: EventDef[] = [
  { id: "inherit", title: "Inheritance", text: "A relative you barely knew left you something.", tone: "good", weight: 3, minDay: 120, cashPctOfNetWorth: 0.12, cashFlat: 4000 },
  { id: "bonus", title: "Surprise bonus", text: "Your employer had a good quarter and remembered you.", tone: "good", weight: 8, cashFlat: 900 },
  { id: "raise", title: "Off-cycle raise", text: "Someone finally noticed how much you do.", tone: "good", weight: 6, payShift: 1.15, payShiftDays: 120 },
  { id: "boom", title: "Boom week", text: "A viral moment sends customers flooding in.", tone: "good", weight: 8, businessBoostDays: 14 },
  { id: "headhunt", title: "Headhunted", text: "A recruiter's pitch teaches you more than the job does.", tone: "good", weight: 6, xpFlat: 80 },
  { id: "rentspike", title: "Rent spike", text: "The whole neighbourhood repriced overnight.", tone: "bad", weight: 8, livingCostShift: 1.3, livingCostShiftDays: 180 },
  { id: "rentdrop", title: "Cost of living relief", text: "Prices cooled off for a while.", tone: "good", weight: 5, livingCostShift: 0.8, livingCostShiftDays: 150 },
  { id: "medical", title: "Medical bill", text: "Nothing serious. Still expensive.", tone: "bad", weight: 7, cashFlat: -1200, cashPctOfNetWorth: -0.02 },
  { id: "repair", title: "Emergency repair", text: "Something important broke at the worst moment.", tone: "bad", weight: 7, cashFlat: -700, cashPctOfNetWorth: -0.01 },
  { id: "paycut", title: "Pay cut", text: "Restructuring. Everyone takes a trim.", tone: "bad", weight: 4, payShift: 0.85, payShiftDays: 120, minDay: 60 },
  { id: "layoff", title: "Laid off", text: "Your position was eliminated. You start one rung lower.", tone: "bad", weight: 2, minDay: 200, jobLoss: true },
  { id: "audit", title: "Tax audit", text: "They found a discrepancy. You paid it.", tone: "bad", weight: 4, minDay: 150, cashPctOfNetWorth: -0.04 },
  { id: "award", title: "Industry award", text: "An award nobody outside the trade has heard of. It works.", tone: "good", weight: 5, minDay: 150, businessBoostDays: 21, xpFlat: 40 },
  { id: "lawsuit", title: "Nuisance lawsuit", text: "Settled quietly, as these things are.", tone: "bad", weight: 4, minDay: 250, cashPctOfNetWorth: -0.05 },
];

export const EVENT_CHANCE_PER_DAY = 0.012;

// ---------- helpers ----------
export function getBusinessTierIndex(level: number): number {
  if (level >= 40) return 3;
  if (level >= 20) return 2;
  if (level >= 8) return 1;
  return 0;
}
