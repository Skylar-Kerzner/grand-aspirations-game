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

export interface CareerVariant { title: string; employer: string }

export const CAREER_SALARY_RANGE = { min: 0.82, max: 1.22 };
export const CAREER_VARIANTS: CareerVariant[][] = [
  [
    { title: "Dishwasher", employer: "Corner Diner" }, { title: "Kitchen Porter", employer: "The Brass Spoon" },
    { title: "Prep Assistant", employer: "Market Street Grill" }, { title: "Stockroom Hand", employer: "Alder Grocers" },
    { title: "Night Cleaner", employer: "Pennington Hall" }, { title: "Bus Attendant", employer: "Harbour Canteen" },
  ],
  [
    { title: "Barista", employer: "Roast House" }, { title: "Counter Associate", employer: "Juniper Coffee" },
    { title: "Café Host", employer: "Daily Ritual" }, { title: "Line Cook", employer: "The Brass Spoon" },
    { title: "Sales Assistant", employer: "Alder Grocers" }, { title: "Front Desk Clerk", employer: "Pennington Hall" },
  ],
  [
    { title: "Shift Supervisor", employer: "Roast House" }, { title: "Floor Lead", employer: "Juniper Coffee" },
    { title: "Assistant Manager", employer: "Daily Ritual" }, { title: "Sous Chef", employer: "Market Street Grill" },
    { title: "Store Supervisor", employer: "Alder Grocers" }, { title: "Duty Manager", employer: "Pennington Hall" },
  ],
  [
    { title: "Service Technician", employer: "Meridian Facilities" }, { title: "Field Technician", employer: "Apex Systems" },
    { title: "Maintenance Specialist", employer: "Civic Works" }, { title: "Logistics Dispatcher", employer: "Calder Freight" },
    { title: "Quality Inspector", employer: "Brightline Manufacturing" }, { title: "Claims Assistant", employer: "Ashford Mutual" },
  ],
  [
    { title: "Operations Coordinator", employer: "Meridian Facilities" }, { title: "Project Coordinator", employer: "Apex Systems" },
    { title: "Service Operations Lead", employer: "Civic Works" }, { title: "Fleet Planner", employer: "Calder Freight" },
    { title: "Production Scheduler", employer: "Brightline Manufacturing" }, { title: "Underwriting Associate", employer: "Ashford Mutual" },
  ],
  [
    { title: "Junior Analyst", employer: "Halstead Capital" }, { title: "Research Analyst", employer: "North & Finch" },
    { title: "Financial Analyst", employer: "Summit Advisory" }, { title: "Credit Analyst", employer: "Ashford Mutual" },
    { title: "Data Analyst", employer: "Northbeam Labs" }, { title: "Pricing Analyst", employer: "Brightline Manufacturing" },
  ],
  [
    { title: "Account Manager", employer: "Halstead Capital" }, { title: "Client Strategist", employer: "North & Finch" },
    { title: "Commercial Manager", employer: "Summit Advisory" }, { title: "Business Development Manager", employer: "Vanta Works" },
    { title: "Category Manager", employer: "Alder Grocers" }, { title: "Portfolio Associate", employer: "Crown & Vale" },
  ],
  [
    { title: "Software Engineer", employer: "Northbeam Labs" }, { title: "Product Engineer", employer: "Vanta Works" },
    { title: "Platform Developer", employer: "Fieldstone Tech" }, { title: "Product Manager", employer: "Aster Group" },
    { title: "Risk Manager", employer: "Ashford Mutual" }, { title: "Quant Developer", employer: "Halstead Capital" },
  ],
  [
    { title: "Engineering Lead", employer: "Northbeam Labs" }, { title: "Staff Engineer", employer: "Vanta Works" },
    { title: "Technical Lead", employer: "Fieldstone Tech" }, { title: "Senior Product Manager", employer: "Aster Group" },
    { title: "Head of Risk", employer: "Ashford Mutual" }, { title: "Senior Quant", employer: "Crown & Vale" },
  ],
  [
    { title: "Director of Strategy", employer: "Northbeam Labs" }, { title: "Director of Operations", employer: "Aster Group" },
    { title: "Head of Growth", employer: "Vanta Works" }, { title: "Director of Engineering", employer: "Fieldstone Tech" },
    { title: "Head of Corporate Development", employer: "Summit Advisory" }, { title: "Director of Investments", employer: "North & Finch" },
  ],
  [
    { title: "Vice President", employer: "Arclight Group" }, { title: "Senior Vice President", employer: "Sterling Partners" },
    { title: "Division President", employer: "Aster Group" }, { title: "Chief Operating Officer", employer: "Fieldstone Tech" },
    { title: "Head of Capital Markets", employer: "North & Finch" }, { title: "General Manager", employer: "Brightline Manufacturing" },
  ],
  [
    { title: "Managing Partner", employer: "Arclight Group" }, { title: "Operating Partner", employer: "Sterling Partners" },
    { title: "Senior Partner", employer: "Crown & Vale" }, { title: "Managing Director", employer: "Summit Advisory" },
    { title: "Chief Executive", employer: "Brightline Manufacturing" }, { title: "Head of Private Equity", employer: "Halstead Capital" },
  ],
  [
    { title: "Portfolio Manager", employer: "Halstead Capital" }, { title: "Fund Manager", employer: "Crown & Vale" },
    { title: "Chief Investment Officer", employer: "Sterling Partners" }, { title: "Head of Macro", employer: "North & Finch" },
    { title: "Head of Credit", employer: "Arclight Group" }, { title: "Chief Investment Officer", employer: "Ashford Mutual" },
  ],
  [
    { title: "Hedge Fund Manager", employer: "Kestrel Capital" }, { title: "Founding Portfolio Manager", employer: "Vale Point Partners" },
    { title: "Chief Investment Partner", employer: "Ridgeline Asset Management" }, { title: "Managing Principal", employer: "Blackwater Fund" },
    { title: "Founder", employer: "Your own fund" }, { title: "General Partner", employer: "Hollis & Co." },
  ],
];

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

// Training: money spent on courses, coaching and certifications converts to experience.
export const TRAINING_REFERENCE = 60; // dollars/day that meaningfully accelerates career progress

// ---------- Businesses ----------
export interface BusinessDef {
  id: string;
  name: string;
  sector: string;
  baseCost: number;
  annualROI: number; // baseline profit per year as a share of capital invested
  costMultiplier: number;
  risk: number; // annual volatility of profit; higher means bigger swings and more shocks
  unlockLevelOfPrev: number; // levels required in the previous business
  description: string;
  tierNames: string[];
  tierImages: string[];
}

export const BUSINESS_TIER_THRESHOLDS = [1, 8, 20, 40];
export const BUSINESS_NETWORK_MILESTONES = [
  { level: 8, bonus: 0.1 },
  { level: 20, bonus: 0.2 },
  { level: 40, bonus: 0.35 },
];

export const BUSINESSES: BusinessDef[] = [
  {
    id: "coffee", name: "Coffee Shop", sector: "Food & Beverage",
    baseCost: 6000, annualROI: 0.3, costMultiplier: 1.16, risk: 0.55, unlockLevelOfPrev: 0,
    description: "From humble cart to global empire.",
    tierNames: ["Coffee Cart", "Corner Café", "Coffee Chain", "Global Coffee Empire"],
    tierImages: ["coffee-t1", "coffee-t2", "coffee-t3", "coffee-t4"],
  },
  {
    id: "restaurant", name: "Restaurant", sector: "Food & Beverage",
    baseCost: 60000, annualROI: 0.3, costMultiplier: 1.16, risk: 0.5, unlockLevelOfPrev: 8,
    description: "Culinary excellence, served daily.",
    tierNames: ["Food Truck", "Neighbourhood Bistro", "Fine Dining Room", "Culinary Empire"],
    tierImages: ["restaurant-t1", "restaurant-t2", "restaurant-t3", "restaurant-t4"],
  },
  {
    id: "tech", name: "Tech Startup", sector: "Technology",
    baseCost: 600000, annualROI: 0.3, costMultiplier: 1.15, risk: 0.6, unlockLevelOfPrev: 8,
    description: "Disrupt. Scale. Dominate.",
    tierNames: ["Garage Startup", "Series A Office", "Tech Campus", "Tech Giant HQ"],
    tierImages: ["tech-t1", "tech-t2", "tech-t3", "tech-t4"],
  },
  {
    id: "hotel", name: "Hotel", sector: "Hospitality",
    baseCost: 6000000, annualROI: 0.3, costMultiplier: 1.14, risk: 0.4, unlockLevelOfPrev: 8,
    description: "Luxury accommodations worldwide.",
    tierNames: ["Roadside Motel", "Boutique Hotel", "Luxury Resort", "Grand Hotel Empire"],
    tierImages: ["hotel-t1", "hotel-t2", "hotel-t3", "hotel-t4"],
  },
  {
    id: "fashion", name: "Fashion Brand", sector: "Retail",
    baseCost: 60000000, annualROI: 0.3, costMultiplier: 1.13, risk: 0.38, unlockLevelOfPrev: 8,
    description: "Define style itself.",
    tierNames: ["Market Stall", "Flagship Boutique", "Department Store", "Fashion House"],
    tierImages: ["fashion-t1", "fashion-t2", "fashion-t3", "fashion-t4"],
  },
  {
    id: "themepark", name: "Theme Park", sector: "Entertainment",
    baseCost: 600000000, annualROI: 0.3, costMultiplier: 1.12, risk: 0.32, unlockLevelOfPrev: 8,
    description: "Create worlds of wonder.",
    tierNames: ["Travelling Carnival", "Family Fun Park", "Destination Theme Park", "Entertainment Empire"],
    tierImages: ["themepark-t1", "themepark-t2", "themepark-t3", "themepark-t4"],
  },
  {
    id: "media", name: "Media Network", sector: "Media",
    baseCost: 6000000000, annualROI: 0.3, costMultiplier: 1.12, risk: 0.3, unlockLevelOfPrev: 8,
    description: "Own the attention itself.",
    tierNames: ["Podcast Studio", "Streaming Channel", "Broadcast Network", "Global Media Conglomerate"],
    tierImages: ["media-t1", "media-t2", "media-t3", "media-t4"],
  },
  {
    id: "city", name: "City Development", sector: "Infrastructure",
    baseCost: 60000000000, annualROI: 0.3, costMultiplier: 1.11, risk: 0.24, unlockLevelOfPrev: 8,
    description: "Build the skyline everyone else lives in.",
    tierNames: ["City Block", "Mixed-Use District", "Waterfront Downtown", "Sovereign Metropolis"],
    tierImages: ["city-t1", "city-t2", "city-t3", "city-t4"],
  },
];

// Trading conditions drift day to day and revert toward normal at this rate.
export const BUSINESS_CONDITION_REVERSION = 0.04;
// Chance per day, scaled by a business's risk, of a serious setback.
export const BUSINESS_SHOCK_CHANCE = 0.006;
export const BUSINESS_SHOCK_TEXTS = [
  "a burst pipe closed the doors",
  "a key supplier collapsed",
  "a bad review cycle emptied the place",
  "a licensing dispute halted trade",
  "a competitor opened across the street",
];
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

// ---------- Lifestyle (all costs recur daily) ----------
export interface AssetTierDef {
  name: string;
  dailyCost: number;
  careerBonus: number;
  schoolBonus: number;
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
    id: "house", name: "Housing", category: "Home",
    tiers: [
      { name: "Shared Room", dailyCost: 34, careerBonus: 0, schoolBonus: 0, image: "house-t1", benefit: "Baseline career and school progress" },
      { name: "Studio Apartment", dailyCost: 72, careerBonus: 0.04, schoolBonus: 0.08, image: "house-t2", benefit: "+4% career · +8% school progress" },
      { name: "Modern Loft", dailyCost: 165, careerBonus: 0.1, schoolBonus: 0.16, image: "house-t3", benefit: "+10% career · +16% school progress" },
      { name: "Penthouse", dailyCost: 520, careerBonus: 0.18, schoolBonus: 0.28, image: "house-t4", benefit: "+18% career · +28% school progress" },
    ],
  },
  {
    id: "food", name: "Food", category: "Daily life",
    tiers: [
      { name: "Simple Groceries", dailyCost: 12, careerBonus: 0, schoolBonus: 0, image: "food-t1", benefit: "Baseline career and school progress" },
      { name: "Fresh Home Cooking", dailyCost: 28, careerBonus: 0.04, schoolBonus: 0.06, image: "food-t2", benefit: "+4% career · +6% school progress" },
      { name: "Restaurant Dining", dailyCost: 82, careerBonus: 0.09, schoolBonus: 0.12, image: "food-t3", benefit: "+9% career · +12% school progress" },
      { name: "Private Chef", dailyCost: 320, careerBonus: 0.16, schoolBonus: 0.22, image: "food-t4", benefit: "+16% career · +22% school progress" },
    ],
  },
  {
    id: "wardrobe", name: "Clothing", category: "Presentation",
    tiers: [
      { name: "Thrifted Basics", dailyCost: 3, careerBonus: 0, schoolBonus: 0, image: "wardrobe-t1", benefit: "Baseline career and school progress" },
      { name: "High Street", dailyCost: 12, careerBonus: 0.05, schoolBonus: 0.02, image: "wardrobe-t2", benefit: "+5% career · +2% school progress" },
      { name: "Tailored Wardrobe", dailyCost: 55, careerBonus: 0.12, schoolBonus: 0.05, image: "wardrobe-t3", benefit: "+12% career · +5% school progress" },
      { name: "Bespoke Atelier", dailyCost: 180, careerBonus: 0.22, schoolBonus: 0.08, image: "wardrobe-t4", benefit: "+22% career · +8% school progress" },
    ],
  },
  {
    id: "car", name: "Car", category: "Transport",
    tiers: [
      { name: "Used Sedan", dailyCost: 19, careerBonus: 0.04, schoolBonus: 0.02, image: "car-t1", benefit: "+4% career · +2% school progress" },
      { name: "Luxury Sedan", dailyCost: 48, careerBonus: 0.1, schoolBonus: 0.04, image: "car-t2", benefit: "+10% career · +4% school progress" },
      { name: "Sports Car", dailyCost: 165, careerBonus: 0.18, schoolBonus: 0.07, image: "car-t3", benefit: "+18% career · +7% school progress" },
      { name: "Hypercar", dailyCost: 880, careerBonus: 0.3, schoolBonus: 0.1, image: "car-t4", benefit: "+30% career · +10% school progress" },
    ],
  },
  {
    id: "watch", name: "Watch", category: "Accessories",
    tiers: [
      { name: "Digital Watch", dailyCost: 1, careerBonus: 0, schoolBonus: 0, image: "watch-t1", benefit: "Baseline career and school progress" },
      { name: "Automatic Movement", dailyCost: 6, careerBonus: 0.03, schoolBonus: 0.03, image: "watch-t2", benefit: "+3% career · +3% school progress" },
      { name: "Luxury Chronograph", dailyCost: 28, careerBonus: 0.08, schoolBonus: 0.06, image: "watch-t3", benefit: "+8% career · +6% school progress" },
      { name: "Haute Horlogerie", dailyCost: 140, careerBonus: 0.15, schoolBonus: 0.1, image: "watch-t4", benefit: "+15% career · +10% school progress" },
    ],
  },
];

export const WARDROBE_BUSINESS_BONUS = [0, 0.04, 0.09, 0.16];
export const WATCH_INVEST_BONUS = [0, 0.04, 0.09, 0.16];

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
  { id: "lawsuit", title: "Nuisance lawsuit", text: "Settled quietly, as these things are.", tone: "bad", weight: 3, minDay: 250, cashPctOfNetWorth: -0.05 },
  { id: "refund", title: "Overpayment refunded", text: "A billing error, finally caught, in your favour.", tone: "good", weight: 7, cashFlat: 600, cashPctOfNetWorth: 0.01 },
  { id: "mentor", title: "A mentor takes an interest", text: "Someone senior starts telling you how things actually work.", tone: "good", weight: 6, xpFlat: 60 },
  { id: "referral", title: "Word of mouth", text: "A regular brought everyone they know.", tone: "good", weight: 7, businessBoostDays: 10 },
  { id: "windfall", title: "Old position pays off", text: "Something you forgot you owned was bought out.", tone: "good", weight: 4, minDay: 180, cashPctOfNetWorth: 0.08, cashFlat: 2500 },
  { id: "press", title: "Flattering write-up", text: "A journalist needed a story and you were it.", tone: "good", weight: 5, minDay: 120, businessBoostDays: 18, xpFlat: 30 },
  { id: "equity", title: "Vesting cliff", text: "Equity from an old contract finally vested.", tone: "good", weight: 4, minDay: 220, cashPctOfNetWorth: 0.06, cashFlat: 3000 },
];

export const EVENT_CHANCE_PER_DAY = 0.012;

// ---------- helpers ----------
export function getBusinessTierIndex(level: number): number {
  if (level >= 40) return 3;
  if (level >= 20) return 2;
  if (level >= 8) return 1;
  return 0;
}
