// ============================================================
// EMPIRE — economic model
// Time: 1 real second = 1 in-game DAY. All rates below are per DAY
// unless stated otherwise. Yearly figures use 365 days.
// ============================================================

export const DAYS_PER_YEAR = 365;
export const TAX_RATE = 0.22;

// ---------- Education ----------
export interface EducationDef {
  id: string;
  name: string;
  cost: number;
  days: number; // study days before it completes
  description: string;
}

export const EDUCATION: EducationDef[] = [
  { id: "hs", name: "High School Diploma", cost: 0, days: 0, description: "Where everyone starts." },
  { id: "trade", name: "Trade Certificate", cost: 3500, days: 60, description: "A licensed skill, fast payback." },
  { id: "assoc", name: "Associate Degree", cost: 14000, days: 120, description: "Two years, real credentials." },
  { id: "bachelor", name: "Bachelor's Degree", cost: 58000, days: 240, description: "The corporate entry ticket." },
  { id: "mba", name: "MBA", cost: 190000, days: 300, description: "The executive fast lane." },
];

// ---------- Careers ----------
export interface JobDef {
  id: string;
  title: string;
  employer: string;
  education: number; // index into EDUCATION required
  dailyPay: number; // gross, per day
  xpToPromote: number;
}

export const JOBS: JobDef[] = [
  { id: "dish", title: "Dishwasher", employer: "Corner Diner", education: 0, dailyPay: 152, xpToPromote: 40 },
  { id: "barista", title: "Barista", employer: "Roast House", education: 0, dailyPay: 188, xpToPromote: 70 },
  { id: "shift", title: "Shift Supervisor", employer: "Roast House", education: 0, dailyPay: 245, xpToPromote: 120 },
  { id: "tech", title: "Service Technician", employer: "Meridian Facilities", education: 1, dailyPay: 340, xpToPromote: 180 },
  { id: "admin", title: "Operations Coordinator", employer: "Meridian Facilities", education: 1, dailyPay: 445, xpToPromote: 260 },
  { id: "analyst", title: "Junior Analyst", employer: "Halstead Capital", education: 2, dailyPay: 610, xpToPromote: 360 },
  { id: "account", title: "Account Manager", employer: "Halstead Capital", education: 2, dailyPay: 820, xpToPromote: 500 },
  { id: "eng", title: "Software Engineer", employer: "Northbeam Labs", education: 3, dailyPay: 1150, xpToPromote: 700 },
  { id: "lead", title: "Engineering Lead", employer: "Northbeam Labs", education: 3, dailyPay: 1580, xpToPromote: 950 },
  { id: "dir", title: "Director of Strategy", employer: "Northbeam Labs", education: 3, dailyPay: 2150, xpToPromote: 1300 },
  { id: "vp", title: "Vice President", employer: "Arclight Group", education: 4, dailyPay: 3100, xpToPromote: 1800 },
  { id: "partner", title: "Managing Partner", employer: "Arclight Group", education: 4, dailyPay: 4600, xpToPromote: Infinity },
];

// ---------- Living costs (per day) ----------
export const BASE_FOOD_COST = 26;
export const BASE_RENT = 58;
export const BASE_TRANSIT = 11;

// ---------- Businesses ----------
export interface BusinessDef {
  id: string;
  name: string;
  sector: string;
  baseCost: number;
  baseIncome: number; // gross profit per day per level
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
    id: "coffee",
    name: "Coffee Shop",
    sector: "Food & Beverage",
    baseCost: 6000,
    baseIncome: 7.4, // ~45%/yr on invested capital
    costMultiplier: 1.16,
    managerShare: 0.14,
    unlockLevelOfPrev: 0,
    description: "From humble cart to global empire.",
    tierNames: ["Coffee Cart", "Corner Café", "Coffee Chain", "Global Coffee Empire"],
    tierImages: ["coffee-t1", "coffee-t1", "coffee-t4", "coffee-t4"],
  },
  {
    id: "restaurant",
    name: "Restaurant",
    sector: "Food & Beverage",
    baseCost: 60000,
    baseIncome: 66, // ~40%/yr
    costMultiplier: 1.16,
    managerShare: 0.13,
    unlockLevelOfPrev: 8,
    description: "Culinary excellence, served daily.",
    tierNames: ["Food Truck", "Bistro", "Fine Dining", "Culinary Empire"],
    tierImages: ["restaurant-t1", "restaurant-t1", "restaurant-t4", "restaurant-t4"],
  },
  {
    id: "tech",
    name: "Tech Startup",
    sector: "Technology",
    baseCost: 600000,
    baseIncome: 592, // ~36%/yr
    costMultiplier: 1.15,
    managerShare: 0.12,
    unlockLevelOfPrev: 8,
    description: "Disrupt. Scale. Dominate.",
    tierNames: ["Garage Startup", "Small Office", "Tech Campus", "Tech Giant HQ"],
    tierImages: ["tech-t1", "tech-t1", "tech-t4", "tech-t4"],
  },
  {
    id: "hotel",
    name: "Hotel",
    sector: "Hospitality",
    baseCost: 6000000,
    baseIncome: 5260, // ~32%/yr
    costMultiplier: 1.14,
    managerShare: 0.11,
    unlockLevelOfPrev: 8,
    description: "Luxury accommodations worldwide.",
    tierNames: ["Roadside Motel", "Boutique Hotel", "Luxury Resort", "Grand Hotel Empire"],
    tierImages: ["hotel-t1", "hotel-t1", "hotel-t4", "hotel-t4"],
  },
  {
    id: "fashion",
    name: "Fashion Brand",
    sector: "Retail",
    baseCost: 60000000,
    baseIncome: 46000, // ~28%/yr
    costMultiplier: 1.13,
    managerShare: 0.1,
    unlockLevelOfPrev: 8,
    description: "Define style itself.",
    tierNames: ["Market Stall", "Boutique", "Department Store", "Fashion House"],
    tierImages: ["fashion-t1", "fashion-t1", "fashion-t4", "fashion-t4"],
  },
  {
    id: "themepark",
    name: "Theme Park",
    sector: "Entertainment",
    baseCost: 600000000,
    baseIncome: 411000, // ~25%/yr
    costMultiplier: 1.12,
    managerShare: 0.09,
    unlockLevelOfPrev: 8,
    description: "Create worlds of wonder.",
    tierNames: ["Carnival Rides", "Fun Park", "Theme Park", "Entertainment Empire"],
    tierImages: ["themepark-t1", "themepark-t1", "themepark-t4", "themepark-t4"],
  },
];

// Uncollected revenue spoils after this many days without a manager
export const UNMANAGED_CAP_DAYS = 20;
// A business is worth this multiple of its annual profit
export const BUSINESS_VALUATION_MULTIPLE = 2.5;

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
    id: "car",
    name: "Vehicle",
    category: "Transport",
    tiers: [
      { name: "Used Sedan", cost: 7500, upkeep: 19, image: "car-t1", benefit: "No transit fare · +3% pay" },
      { name: "Luxury Sedan", cost: 46000, upkeep: 48, image: "car-t2", benefit: "+8% pay" },
      { name: "Sports Car", cost: 240000, upkeep: 165, image: "car-t3", benefit: "+15% pay" },
      { name: "Hypercar", cost: 2600000, upkeep: 880, image: "car-t4", benefit: "+25% pay" },
    ],
  },
  {
    id: "house",
    name: "Residence",
    category: "Property",
    tiers: [
      { name: "Studio Apartment", cost: 185000, upkeep: 31, image: "house-t1", benefit: "No rent · +5% focus" },
      { name: "Modern Loft", cost: 620000, upkeep: 74, image: "house-t2", benefit: "No rent · +10% focus" },
      { name: "Hillside Villa", cost: 4200000, upkeep: 310, image: "house-t3", benefit: "No rent · +15% focus" },
      { name: "Oceanfront Compound", cost: 26000000, upkeep: 1550, image: "house-t4", benefit: "No rent · +20% focus" },
    ],
  },
  {
    id: "wardrobe",
    name: "Wardrobe",
    category: "Fashion",
    tiers: [
      { name: "Casual Wear", cost: 1400, upkeep: 2, image: "wardrobe-t1", benefit: "+2% business income" },
      { name: "Designer Collection", cost: 12500, upkeep: 6, image: "wardrobe-t2", benefit: "+4% business income" },
      { name: "Haute Couture", cost: 95000, upkeep: 24, image: "wardrobe-t3", benefit: "+7% business income" },
      { name: "Bespoke Atelier", cost: 640000, upkeep: 130, image: "wardrobe-t4", benefit: "+12% business income" },
    ],
  },
  {
    id: "watch",
    name: "Timepiece",
    category: "Accessories",
    tiers: [
      { name: "Digital Watch", cost: 700, upkeep: 0, image: "watch-t1", benefit: "+2% investment returns" },
      { name: "Automatic Movement", cost: 8500, upkeep: 2, image: "watch-t2", benefit: "+4% investment returns" },
      { name: "Luxury Chronograph", cost: 115000, upkeep: 14, image: "watch-t3", benefit: "+7% investment returns" },
      { name: "Haute Horlogerie", cost: 880000, upkeep: 90, image: "watch-t4", benefit: "+12% investment returns" },
    ],
  },
];

export const CAR_PAY_BONUS = [0.03, 0.08, 0.15, 0.25];
export const HOUSE_FOCUS_BONUS = [0.05, 0.1, 0.15, 0.2];
export const WARDROBE_BUSINESS_BONUS = [0.02, 0.04, 0.07, 0.12];
export const WATCH_INVEST_BONUS = [0.02, 0.04, 0.07, 0.12];

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
  {
    id: "savings", name: "Savings Account", description: "FDIC-safe. 2.0% a year, never moves.",
    minInvestment: 250, annualReturn: 0.02, annualVolatility: 0, risk: "None",
  },
  {
    id: "bonds", name: "Treasury Bonds", description: "4.5% a year, barely wobbles.",
    minInvestment: 5000, annualReturn: 0.045, annualVolatility: 0.02, risk: "Low",
    unlockPrev: "savings", unlockAmount: 5000,
  },
  {
    id: "index", name: "Index Fund", description: "9% a year on average. It will dip.",
    minInvestment: 25000, annualReturn: 0.09, annualVolatility: 0.16, risk: "Moderate",
    unlockPrev: "bonds", unlockAmount: 25000,
  },
  {
    id: "realestate", name: "Real Estate Fund", description: "12% a year, illiquid and slow.",
    minInvestment: 150000, annualReturn: 0.12, annualVolatility: 0.22, risk: "Moderate-High",
    unlockPrev: "index", unlockAmount: 150000,
  },
  {
    id: "crypto", name: "Digital Assets", description: "30% a year in theory. Can halve.",
    minInvestment: 250000, annualReturn: 0.3, annualVolatility: 0.85, risk: "Very High",
    unlockPrev: "realestate", unlockAmount: 300000,
  },
];

// ---------- Loans ----------
export interface LoanDef {
  id: string;
  name: string;
  amount: number;
  annualRate: number;
  termDays: number;
  requiresCredit: number; // number of loans fully repaid
  description: string;
}

// Underwriting: you must also own equity worth at least this share of the loan
export const LOAN_EQUITY_REQUIREMENT = 0.25;

export const LOANS: LoanDef[] = [
  { id: "micro", name: "Micro Loan", amount: 5000, annualRate: 0.22, termDays: 180, requiresCredit: 0, description: "Small, expensive, and available to anyone." },
  { id: "personal", name: "Personal Loan", amount: 25000, annualRate: 0.15, termDays: 365, requiresCredit: 1, description: "Needs one clean repayment on file." },
  { id: "sba", name: "Small Business Loan", amount: 150000, annualRate: 0.1, termDays: 730, requiresCredit: 2, description: "For an operator with a track record." },
  { id: "commercial", name: "Commercial Loan", amount: 1000000, annualRate: 0.075, termDays: 1095, requiresCredit: 3, description: "Bank financing for real operations." },
  { id: "venture", name: "Venture Debt", amount: 10000000, annualRate: 0.06, termDays: 1460, requiresCredit: 4, description: "Cheap money for proven empires." },
];

export function amortizedPayment(principal: number, annualRate: number, termDays: number): number {
  const r = annualRate / DAYS_PER_YEAR;
  if (r <= 0) return principal / termDays;
  return (principal * r) / (1 - Math.pow(1 + r, -termDays));
}

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
  { id: "celebrity", name: "Celebrity Endorser", hireCost: 1800000, dailyRetainer: 4200, effect: "+20% salary", requiresBusinessLevels: 60 },
];

// ---------- helpers ----------
export function getBusinessTierIndex(level: number): number {
  if (level >= 40) return 3;
  if (level >= 20) return 2;
  if (level >= 8) return 1;
  return 0;
}

export function getBusinessCost(baseCost: number, costMultiplier: number, level: number): number {
  return baseCost * Math.pow(costMultiplier, level);
}
