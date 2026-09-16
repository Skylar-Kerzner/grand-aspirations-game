// ============================================================
// EMPIRE — economic model
// Time: 1 real second = 1 in-game DAY. All rates below are per DAY
// unless stated otherwise. Yearly figures use 365 days.
// ============================================================

export const DAYS_PER_YEAR = 365;
export const TAX_RATE = 0.22;
export const WEEK_HOURS = 40;
// A venture only reaches its full return on the hours you personally put in.
export const BUSINESS_ATTENTION_FLOOR = 0.25;     // an unattended venture limps along at a quarter of its potential
export const BUSINESS_ATTENTION_FULL_HOURS = 15;  // hours a week in one venture for full performance
export const BUSINESS_ATTENTION_CURVE = 0.45;     // concave: the first hour jumps to half potential, the rest approaches full slowly

// ---------- Education ----------
export interface MajorDef {
  id: string;
  name: string;
  track: string; // career track this major opens up
  cost: number;
  days: number; // full-time study days (40 hrs/week) before it completes
  description: string;
}

/**
 * From this career level on, offers in a track require either that track's major
 * or enough years served inside that same industry (see TRACK_EXPERIENCE_GATE).
 */
export const MAJOR_GATE_TIER = 4;

export const MAJORS: MajorDef[] = [
  { id: "trade", name: "Trade Certificate", track: "operations", cost: 3500, days: 60, description: "A licensed skill, fast payback. Leads to careers in Operations & Industry." },
  { id: "hospitality", name: "Hospitality Management", track: "hospitality", cost: 14000, days: 120, description: "Leads to careers in Hospitality & Retail." },
  { id: "business", name: "Business Administration", track: "corporate", cost: 58000, days: 240, description: "Leads to careers in Corporate Leadership." },
  { id: "cs", name: "Computer Science", track: "tech", cost: 58000, days: 240, description: "Leads to careers in Technology." },
  { id: "finance", name: "Finance", track: "finance", cost: 190000, days: 300, description: "Leads to careers in Finance & Investing." },
];

export function getTrackMajor(trackId: string): MajorDef | undefined {
  return MAJORS.find((m) => m.track === trackId);
}

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

/**
 * Career tracks. Employers belong to a track, and each track pays differently
 * over a lifetime: hospitality and trades pay well early and flatten, finance
 * and tech start modest and climb far higher.
 */
export interface CareerTrack { id: string; name: string; curve: number; outlook: string }
export const CAREER_TRACKS: Record<string, CareerTrack> = {
  hospitality: { id: "hospitality", name: "Hospitality & Retail", curve: -0.6, outlook: "Pays well right away, but the ceiling is low." },
  operations: { id: "operations", name: "Operations & Industry", curve: -0.25, outlook: "Steady pay that rises slowly and reliably." },
  corporate: { id: "corporate", name: "Corporate Leadership", curve: 0.2, outlook: "Modest early, strong once you reach the top table." },
  tech: { id: "tech", name: "Technology", curve: 0.5, outlook: "A slow start that compounds into very high pay." },
  finance: { id: "finance", name: "Finance & Investing", curve: 0.85, outlook: "Lowest pay early, by far the highest ceiling." },
};

const EMPLOYER_TRACKS: Record<string, string> = {
  "Corner Diner": "hospitality", "The Brass Spoon": "hospitality", "Market Street Grill": "hospitality",
  "Harbour Canteen": "hospitality", "Roast House": "hospitality", "Juniper Coffee": "hospitality",
  "Daily Ritual": "hospitality", "Pennington Hall": "hospitality", "Alder Grocers": "hospitality",
  "Meridian Facilities": "operations", "Apex Systems": "operations", "Civic Works": "operations",
  "Calder Freight": "operations", "Brightline Manufacturing": "operations",
  "Northbeam Labs": "tech", "Vanta Works": "tech", "Fieldstone Tech": "tech", "Aster Group": "tech",
  "Arclight Group": "corporate", "Sterling Partners": "corporate", "Summit Advisory": "corporate",
  "Halstead Capital": "finance", "North & Finch": "finance", "Crown & Vale": "finance",
  "Ashford Mutual": "finance", "Kestrel Capital": "finance", "Vale Point Partners": "finance",
  "Ridgeline Asset Management": "finance", "Blackwater Fund": "finance", "Hollis & Co.": "finance",
  "Your own fund": "finance",
};

export function getCareerTrack(employer: string): CareerTrack {
  return CAREER_TRACKS[EMPLOYER_TRACKS[employer] || "operations"];
}

/** How a track's pay compares with the standard ladder at a given career level. */
export function trackPayMultiplier(employer: string, tierIndex: number): number {
  const track = getCareerTrack(employer);
  const progress = tierIndex / Math.max(1, CAREER_VARIANTS.length - 1);
  return Math.max(0.55, 1 + track.curve * (progress - 0.35));
}

/** Staying inside the same track carries a loyalty and experience premium. */
export const TRACK_CONTINUITY_BONUS = 0.12;

/** Each consecutive level served in the same industry adds this much pay, up to the cap. */
export const TRACK_TENURE_STEP = 0.06;
export const TRACK_TENURE_CAP = 0.3;

/** Time served in your current industry compounds too: per full year of service. */
export const TRACK_EXPERIENCE_STEP = 0.04;
export const TRACK_EXPERIENCE_CAP = 0.24;
/** Years of service in one industry that can stand in for held positions at the no-degree gate. */
export const TRACK_EXPERIENCE_YEARS_GATE = 3;

/** Moving sideways into another industry costs you: you arrive as an outsider. */
export const TRACK_SWITCH_PENALTY = 0.22;

/**
 * Which industries a sideways move makes sense into. Anything not listed here is
 * only reachable by studying that path's major.
 */
export const TRACK_ADJACENCY: Record<string, string[]> = {
  hospitality: ["operations", "corporate"],
  operations: ["hospitality", "corporate"],
  corporate: ["operations", "hospitality", "finance"],
  tech: ["corporate"],
  finance: ["corporate"],
};

export function isAdjacentTrack(from: string, to: string): boolean {
  return (TRACK_ADJACENCY[from] || []).includes(to);
}

/** Levels served in one industry that count in place of a degree on that path. */
export const TRACK_EXPERIENCE_GATE = 3;

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
  track: string; // career industry whose experience helps you run it
  description: string;
  tierNames: string[];
}

/** Knowing a venture's industry from your working life makes you run it better. */
export const INDUSTRY_MAJOR_BONUS = 0.08;
export const INDUSTRY_YEAR_STEP = 0.02;
export const INDUSTRY_YEAR_CAP = 0.16;
export const INDUSTRY_RISK_RELIEF = 0.2;

export const BUSINESS_TIER_THRESHOLDS = [1, 8, 20, 40];
export const BUSINESS_NETWORK_MILESTONES = [
  { level: 8, bonus: 0.1 },
  { level: 20, bonus: 0.2 },
  { level: 40, bonus: 0.35 },
];

export const BUSINESSES: BusinessDef[] = [
  {
    id: "coffee", name: "Coffee Shop", sector: "Food & Beverage",
    baseCost: 6000, annualROI: 0.3, costMultiplier: 1.16, risk: 0.55, track: "hospitality",
    description: "From humble cart to global empire.",
    tierNames: ["Coffee Cart", "Corner Café", "Coffee Chain", "Global Coffee Empire"],
  },
  {
    id: "restaurant", name: "Restaurant", sector: "Food & Beverage",
    baseCost: 25000, annualROI: 0.3, costMultiplier: 1.16, risk: 0.5, track: "hospitality",
    description: "Culinary excellence, served daily.",
    tierNames: ["Food Truck", "Neighbourhood Bistro", "Fine Dining Room", "Culinary Empire"],
  },
  {
    id: "tech", name: "Tech Startup", sector: "Technology",
    baseCost: 100000, annualROI: 0.3, costMultiplier: 1.15, risk: 0.6, track: "tech",
    description: "Disrupt. Scale. Dominate.",
    tierNames: ["Garage Startup", "Series A Office", "Tech Campus", "Tech Giant HQ"],
  },
  {
    id: "hotel", name: "Hotel", sector: "Hospitality",
    baseCost: 400000, annualROI: 0.3, costMultiplier: 1.14, risk: 0.4, track: "hospitality",
    description: "Luxury accommodations worldwide.",
    tierNames: ["Roadside Motel", "Boutique Hotel", "Luxury Resort", "Grand Hotel Empire"],
  },
  {
    id: "fashion", name: "Fashion Brand", sector: "Retail",
    baseCost: 1500000, annualROI: 0.3, costMultiplier: 1.13, risk: 0.38, track: "hospitality",
    description: "Define style itself.",
    tierNames: ["Market Stall", "Flagship Boutique", "Department Store", "Fashion House"],
  },
  {
    id: "themepark", name: "Theme Park", sector: "Entertainment",
    baseCost: 6000000, annualROI: 0.3, costMultiplier: 1.12, risk: 0.32, track: "operations",
    description: "Create worlds of wonder.",
    tierNames: ["Travelling Carnival", "Family Fun Park", "Destination Theme Park", "Entertainment Empire"],
  },
  {
    id: "media", name: "Media Network", sector: "Media",
    baseCost: 25000000, annualROI: 0.3, costMultiplier: 1.12, risk: 0.3, track: "tech",
    description: "Own the attention itself.",
    tierNames: ["Podcast Studio", "Streaming Channel", "Broadcast Network", "Global Media Conglomerate"],
  },
  {
    id: "city", name: "City Development", sector: "Infrastructure",
    baseCost: 100000000, annualROI: 0.3, costMultiplier: 1.11, risk: 0.24, track: "corporate",
    description: "Build the skyline everyone else lives in.",
    tierNames: ["City Block", "Mixed-Use District", "Waterfront Downtown", "Sovereign Metropolis"],
  },
];

// Trading conditions drift day to day and revert toward normal at this rate.
export const BUSINESS_CONDITION_REVERSION = 0.04;
// Chance per day, scaled by a business's risk, of a serious setback.
export const BUSINESS_SHOCK_CHANCE = 0.002;
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
  hoursBonus: number; // extra weekly hours this tier buys back (staff, services, convenience)
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
      { name: "Shared Room", dailyCost: 34, hoursBonus: 0, image: "house-t1", benefit: "No time bought back yet" },
      { name: "Studio Apartment", dailyCost: 72, hoursBonus: 2, image: "house-t2", benefit: "+2h of your week back — no commute, building services" },
      { name: "Modern Loft", dailyCost: 165, hoursBonus: 4, image: "house-t3", benefit: "+4h of your week back — doorman, cleaning, concierge" },
      { name: "Penthouse", dailyCost: 520, hoursBonus: 7, image: "house-t4", benefit: "+7h of your week back — full household staff" },
    ],
  },
  {
    id: "food", name: "Food", category: "Daily life",
    tiers: [
      { name: "Simple Groceries", dailyCost: 12, hoursBonus: 0, image: "food-t1", benefit: "No time bought back yet" },
      { name: "Fresh Home Cooking", dailyCost: 28, hoursBonus: 2, image: "food-t2", benefit: "+2h of your week back — delivery and meal prep" },
      { name: "Restaurant Dining", dailyCost: 82, hoursBonus: 3, image: "food-t3", benefit: "+3h of your week back — every meal handled" },
      { name: "Private Chef", dailyCost: 320, hoursBonus: 5, image: "food-t4", benefit: "+5h of your week back — a chef runs your kitchen" },
    ],
  },
  {
    id: "wardrobe", name: "Clothing", category: "Presentation",
    tiers: [
      { name: "Thrifted Basics", dailyCost: 3, hoursBonus: 0, image: "wardrobe-t1", benefit: "No time bought back yet" },
      { name: "High Street", dailyCost: 12, hoursBonus: 1, image: "wardrobe-t2", benefit: "+1h of your week back — easy wardrobe, less upkeep" },
      { name: "Tailored Wardrobe", dailyCost: 55, hoursBonus: 2, image: "wardrobe-t3", benefit: "+2h of your week back — a tailor keeps it all ready" },
      { name: "Bespoke Atelier", dailyCost: 180, hoursBonus: 4, image: "wardrobe-t4", benefit: "+4h of your week back — a stylist and valet service" },
    ],
  },
  {
    id: "car", name: "Car", category: "Transport",
    tiers: [
      { name: "Used Sedan", dailyCost: 19, hoursBonus: 0, image: "car-t1", benefit: "No time bought back yet" },
      { name: "Luxury Sedan", dailyCost: 48, hoursBonus: 2, image: "car-t2", benefit: "+2h of your week back — driver service on tap" },
      { name: "Sports Car", dailyCost: 165, hoursBonus: 4, image: "car-t3", benefit: "+4h of your week back — a driver handles the road" },
      { name: "Hypercar", dailyCost: 880, hoursBonus: 8, image: "car-t4", benefit: "+8h of your week back — chauffeur and fleet care included" },
    ],
  },
  {
    id: "watch", name: "Watch", category: "Accessories",
    tiers: [
      { name: "Digital Watch", dailyCost: 1, hoursBonus: 0, image: "watch-t1", benefit: "No time bought back yet" },
      { name: "Automatic Movement", dailyCost: 6, hoursBonus: 1, image: "watch-t2", benefit: "+1h of your week back — club and concierge access" },
      { name: "Luxury Chronograph", dailyCost: 28, hoursBonus: 2, image: "watch-t3", benefit: "+2h of your week back — a concierge runs your errands" },
      { name: "Haute Horlogerie", dailyCost: 140, hoursBonus: 3, image: "watch-t4", benefit: "+3h of your week back — a personal assistant on call" },
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
  // soft unlocks — an event only enters the pool once these hold true
  gateBusiness?: boolean;   // you own at least one venture
  gateInvested?: number;    // you have at least this much invested
  gateNetWorth?: number;
  gateJobIndex?: number;    // you hold at least this career level
  gatePerfFee?: boolean;    // you run a fund with a performance fee
  gateMajor?: boolean;      // you hold at least one degree
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
  { id: "boom", title: "Boom week", text: "A viral moment sends customers flooding in.", tone: "good", weight: 8, gateBusiness: true, businessBoostDays: 14 },
  { id: "headhunt", title: "Headhunted", text: "A recruiter's pitch teaches you more than the job does.", tone: "good", weight: 6, xpFlat: 80 },
  { id: "rentspike", title: "Rent spike", text: "The whole neighbourhood repriced overnight.", tone: "bad", weight: 8, livingCostShift: 1.3, livingCostShiftDays: 180 },
  { id: "rentdrop", title: "Cost of living relief", text: "Prices cooled off for a while.", tone: "good", weight: 5, livingCostShift: 0.8, livingCostShiftDays: 150 },
  { id: "medical", title: "Medical bill", text: "Nothing serious. Still expensive.", tone: "bad", weight: 7, cashFlat: -1200, cashPctOfNetWorth: -0.02 },
  { id: "repair", title: "Emergency repair", text: "Something important broke at the worst moment.", tone: "bad", weight: 7, cashFlat: -700, cashPctOfNetWorth: -0.01 },
  { id: "paycut", title: "Pay cut", text: "Restructuring. Everyone takes a trim.", tone: "bad", weight: 4, payShift: 0.85, payShiftDays: 120, minDay: 60 },
  { id: "layoff", title: "Laid off", text: "Your position was eliminated. You start one rung lower.", tone: "bad", weight: 2, minDay: 200, jobLoss: true },
  { id: "audit", title: "Tax audit", text: "They found a discrepancy. You paid it.", tone: "bad", weight: 4, minDay: 150, cashPctOfNetWorth: -0.04 },
  { id: "award", title: "Industry award", text: "An award nobody outside the trade has heard of. It works.", tone: "good", weight: 5, minDay: 150, gateBusiness: true, businessBoostDays: 21, xpFlat: 40 },
  { id: "lawsuit", title: "Nuisance lawsuit", text: "Settled quietly, as these things are.", tone: "bad", weight: 3, minDay: 250, cashPctOfNetWorth: -0.05 },
  { id: "refund", title: "Overpayment refunded", text: "A billing error, finally caught, in your favour.", tone: "good", weight: 7, cashFlat: 600, cashPctOfNetWorth: 0.01 },
  { id: "mentor", title: "A mentor takes an interest", text: "Someone senior starts telling you how things actually work.", tone: "good", weight: 6, xpFlat: 60 },
  { id: "referral", title: "Word of mouth", text: "A regular brought everyone they know.", tone: "good", weight: 7, gateBusiness: true, businessBoostDays: 10 },
  { id: "windfall", title: "Old position pays off", text: "Something you forgot you owned was bought out.", tone: "good", weight: 4, minDay: 180, cashPctOfNetWorth: 0.08, cashFlat: 2500 },
  { id: "press", title: "Flattering write-up", text: "A journalist needed a story and you were it.", tone: "good", weight: 5, minDay: 120, gateBusiness: true, businessBoostDays: 18, xpFlat: 30 },
  { id: "equity", title: "Vesting cliff", text: "Equity from an old contract finally vested.", tone: "good", weight: 4, minDay: 220, gateJobIndex: 10, cashPctOfNetWorth: 0.06, cashFlat: 3000 },
  { id: "spacedividend", title: "Space dividend", text: "The space company you hold paid a huge special dividend ahead of its first orbital run.", tone: "good", weight: 6, minDay: 300, gateInvested: 50000, cashPctOfNetWorth: 0.08 },
  { id: "patent", title: "Patent licensed", text: "A larger company licensed the method behind your flagship product.", tone: "good", weight: 5, minDay: 240, gateBusiness: true, cashPctOfNetWorth: 0.06, xpFlat: 60 },
  { id: "supplier", title: "Supplier locked in", text: "You signed supplies at last year's prices the week before they jumped.", tone: "good", weight: 5, minDay: 120, gateBusiness: true, businessBoostDays: 21 },
  { id: "vip", title: "A very regular guest", text: "Someone famous keeps booking the whole place and brings an entourage.", tone: "good", weight: 4, minDay: 200, gateBusiness: true, businessBoostDays: 14, xpFlat: 30 },
  { id: "speaking", title: "Keynote invitation", text: "A conference pays handsomely just for telling your story.", tone: "good", weight: 4, minDay: 300, gateJobIndex: 8, cashPctOfNetWorth: 0.02, xpFlat: 80 },
  { id: "alumni", title: "Alumni network", text: "A classmate steers a client your way and vouches for you.", tone: "good", weight: 5, minDay: 240, gateMajor: true, xpFlat: 100 },
  { id: "margin", title: "Margin call", text: "Your broker wants cash you had other plans for.", tone: "bad", weight: 4, minDay: 300, gateInvested: 100000, cashPctOfNetWorth: -0.05 },
  { id: "fundcollapse", title: "A fund goes under", text: "One of your holdings filed for protection. Your slice of it is gone.", tone: "bad", weight: 3, minDay: 360, gateInvested: 500000, cashPctOfNetWorth: -0.07 },
];

export const EVENT_CHANCE_PER_DAY = 0.012;

// ---------- Opening a business: concept and location (pure flavor) ----------
export interface BusinessConcept {
  id: string;
  name: string;        // the venture's name when opened
  description: string;
  image: string;       // artwork key for this concept
  tierNames: [string, string, string, string]; // stage names in this concept's own words
}
export interface BusinessLocation {
  id: string;
  name: string;
}

/** Fun identity choices per business. Every concept carries the same odds — the dice roll is identical. */
export const BUSINESS_CONCEPTS: Record<string, BusinessConcept[]> = {
  coffee: [
    { id: "espresso", name: "Corner Espresso Bar", description: "Sharp pulls, regulars who never leave.", image: "coffee-espresso",
      tierNames: ["Espresso Cart", "Corner Espresso Bar", "Espresso Bar Chain", "Global Espresso Empire"] },
    { id: "matcha", name: "Matcha House", description: "Whisked to order, photogenic by design.", image: "coffee-matcha",
      tierNames: ["Matcha Stand", "Matcha House", "Matcha House Chain", "Global Matcha Empire"] },
    { id: "nitro", name: "Nitro Brew Lab", description: "Cold, creamy, poured from the tap.", image: "coffee-nitro",
      tierNames: ["Nitro Tap Cart", "Nitro Brew Lab", "Nitro Brew Chain", "Global Nitro Empire"] },
  ],
  restaurant: [
    { id: "trattoria", name: "Family Trattoria", description: "Red sauce, checked cloths, loud tables.", image: "restaurant-trattoria",
      tierNames: ["Pasta Stall", "Family Trattoria", "Grand Trattoria", "Trattoria Empire"] },
    { id: "tasting", name: "Chef's Tasting Counter", description: "Twelve seats, one menu, no substitutions.", image: "restaurant-tasting",
      tierNames: ["Supper Club Pop-Up", "Chef's Tasting Counter", "Michelin Tasting Room", "Global Tasting Group"] },
    { id: "ramen", name: "Late-Night Ramen Bar", description: "Steam, stools and a 2am crowd.", image: "restaurant-ramen",
      tierNames: ["Ramen Cart", "Late-Night Ramen Bar", "Ramen Hall", "Ramen Empire"] },
  ],
  tech: [
    { id: "app", name: "Campus App Startup", description: "Built by dropouts, pitched in hoodies.", image: "tech-app",
      tierNames: ["Dorm-Room App", "Campus App Startup", "App Campus", "Global App Giant"] },
    { id: "ai", name: "AI Tooling Studio", description: "Sells the shovels for the gold rush.", image: "tech-ai",
      tierNames: ["Two-Person AI Bench", "AI Tooling Studio", "AI Research Campus", "Global AI Giant"] },
    { id: "security", name: "Cybersecurity Firm", description: "Quiet work, paranoid clients, big contracts.", image: "tech-security",
      tierNames: ["Freelance Security Desk", "Cybersecurity Firm", "Security Operations Campus", "Global Security Giant"] },
  ],
  hotel: [
    { id: "boutique", name: "Boutique Inn", description: "Twelve rooms, one very opinionated host.", image: "hotel-boutique",
      tierNames: ["Guest House", "Boutique Inn", "Boutique Hotel Collection", "Global Boutique Empire"] },
    { id: "resort", name: "Beach Resort", description: "Pools, umbrellas, all-inclusive everything.", image: "hotel-resort",
      tierNames: ["Beach Motel", "Beach Resort", "Flagship Mega Resort", "Global Resort Empire"] },
    { id: "design", name: "Design Hotel", description: "Concrete, brass and a rooftop bar.", image: "hotel-design",
      tierNames: ["Design Loft Rooms", "Design Hotel", "Design Hotel Collection", "Global Design Empire"] },
  ],
  fashion: [
    { id: "streetwear", name: "Streetwear Label", description: "Drops that sell out in minutes.", image: "fashion-streetwear",
      tierNames: ["Market Drop Stall", "Streetwear Label", "Streetwear Flagship", "Global Streetwear House"] },
    { id: "vintage", name: "Vintage Boutique", description: "One-of-one pieces with a past.", image: "fashion-vintage",
      tierNames: ["Vintage Stall", "Vintage Boutique", "Vintage Department Store", "Global Vintage House"] },
    { id: "atelier", name: "Haute Atelier", description: "Made to measure, priced accordingly.", image: "fashion-atelier",
      tierNames: ["Tailor's Room", "Haute Atelier", "Couture Maison", "Global Couture House"] },
  ],
  themepark: [
    { id: "boardwalk", name: "Boardwalk Park", description: "Ferris wheel, fried dough, sea air.", image: "themepark-boardwalk",
      tierNames: ["Boardwalk Rides", "Boardwalk Park", "Boardwalk Resort Park", "Boardwalk Entertainment Empire"] },
    { id: "water", name: "Water Park", description: "Slides, wave pools and lifeguards everywhere.", image: "themepark-water",
      tierNames: ["Splash Pad", "Water Park", "Destination Water Resort", "Global Water Park Empire"] },
    { id: "adventure", name: "Adventure Park", description: "Coasters over the treeline.", image: "themepark-adventure",
      tierNames: ["Zipline Course", "Adventure Park", "Destination Adventure Park", "Global Adventure Empire"] },
  ],
  media: [
    { id: "podcast", name: "Podcast Studio", description: "Two mics and an interview that goes viral.", image: "media-podcast",
      tierNames: ["Closet Podcast Booth", "Podcast Studio", "Podcast Network", "Global Audio Empire"] },
    { id: "streaming", name: "Streaming Network", description: "Bingeable series, global audience.", image: "media-streaming",
      tierNames: ["Web Series Channel", "Streaming Network", "Streaming Studio Lot", "Global Streaming Empire"] },
    { id: "news", name: "News Channel", description: "Live coverage, breaking everything.", image: "media-news",
      tierNames: ["Local News Desk", "News Channel", "National News Network", "Global News Empire"] },
  ],
  city: [
    { id: "blocks", name: "Mixed-Use Blocks", description: "Shops below, apartments above.", image: "city-blocks",
      tierNames: ["Single City Block", "Mixed-Use Blocks", "Mixed-Use District", "Metropolis of Blocks"] },
    { id: "waterfront", name: "Waterfront District", description: "Boardwalks, marinas, sunset crowds.", image: "city-waterfront",
      tierNames: ["Marina Strip", "Waterfront District", "Waterfront Downtown", "Sovereign Waterfront Metropolis"] },
    { id: "green", name: "Green Suburb", description: "Lawns, lanes and good schools.", image: "city-green",
      tierNames: ["Garden Lane", "Green Suburb", "Green Township", "Sovereign Green City"] },
  ],
};

/** Where each kind of venture can open. Purely flavor — it names the business, nothing else. */
export const BUSINESS_LOCATIONS: Record<string, BusinessLocation[]> = {
  coffee: [{ id: "manhattan", name: "Manhattan" }, { id: "chicago", name: "Chicago" }, { id: "seattle", name: "Seattle" }],
  restaurant: [{ id: "manhattan", name: "Manhattan" }, { id: "neworleans", name: "New Orleans" }, { id: "losangeles", name: "Los Angeles" }],
  tech: [{ id: "sanfrancisco", name: "San Francisco" }, { id: "austin", name: "Austin" }, { id: "seattle", name: "Seattle" }],
  hotel: [{ id: "miami", name: "Miami" }, { id: "lasvegas", name: "Las Vegas" }, { id: "kyoto", name: "Kyoto" }],
  fashion: [{ id: "paris", name: "Paris" }, { id: "milan", name: "Milan" }, { id: "newyork", name: "New York" }],
  themepark: [{ id: "orlando", name: "Orlando" }, { id: "losangeles", name: "Los Angeles" }, { id: "tokyo", name: "Tokyo" }],
  media: [{ id: "losangeles", name: "Los Angeles" }, { id: "newyork", name: "New York" }, { id: "london", name: "London" }],
  city: [{ id: "denver", name: "Denver" }, { id: "phoenix", name: "Phoenix" }, { id: "toronto", name: "Toronto" }],
};

export function getBusinessConcept(businessId: string, conceptId: string) {
  return BUSINESS_CONCEPTS[businessId]?.find((c) => c.id === conceptId);
}
export function getBusinessLocation(businessId: string, locationId: string) {
  return BUSINESS_LOCATIONS[businessId]?.find((l) => l.id === locationId);
}
/** The full flavor name of a venture, e.g. "Matcha House in Manhattan". */
export function ventureName(businessId: string, choices?: Record<string, string>): string {
  const concept = getBusinessConcept(businessId, choices?.concept || "");
  const location = getBusinessLocation(businessId, choices?.location || "");
  if (!concept) return BUSINESSES.find((b) => b.id === businessId)?.name || "";
  return location ? `${concept.name} in ${location.name}` : concept.name;
}

/** The venture's name at a given stage, e.g. "Matcha House Chain in Manhattan". */
export function ventureNameAtTier(businessId: string, tierIdx: number, choices?: Record<string, string>): string {
  const concept = getBusinessConcept(businessId, choices?.concept || "");
  const def = BUSINESSES.find((b) => b.id === businessId);
  if (!concept) return def?.tierNames[tierIdx] || def?.name || "";
  const location = getBusinessLocation(businessId, choices?.location || "");
  const stage = concept.tierNames[tierIdx] || concept.name;
  return location ? `${stage} in ${location.name}` : stage;
}

/** Artwork key for a venture at a given stage. */
export function ventureImageAtTier(businessId: string, tierIdx: number, choices?: Record<string, string>): string {
  const concept = getBusinessConcept(businessId, choices?.concept || "");
  if (!concept) return "";
  return tierIdx === 1 ? concept.image : `${concept.image}-t${tierIdx + 1}`;
}

/** How much of the sale price you actually walk away with. */
export const BUSINESS_SALE_DISCOUNT = 0.9;

/** How much of a venture's fortune is put back on the table with each expansion. */
/** How much of a venture's luck goes back on the table at a tier step. */
export function businessRerollWeight(changedChoices: number): number {
  return BUSINESS_UPGRADE_REROLL + 0.2 * (changedChoices - 1);
}

export const BUSINESS_UPGRADE_REROLL = 0.4;

/** Every venture rolls the same dice, whatever identity you give it. */
export function rollBusinessFortune(): number {
  // Lognormal draw: most ventures land near typical, a few flop hard and a
  // rare one runs away completely. Roughly 15% to 600% of a typical venture.
  const u = Math.max(1e-9, Math.random());
  const v = Math.random();
  const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  return Math.min(6, Math.max(0.15, 0.78 * Math.exp(z * 0.8)));
}

export function businessFortuneLabel(f: number): string {
  if (f >= 3) return "A once-in-a-lifetime hit";
  if (f >= 2) return "A runaway success";
  if (f >= 1.4) return "Doing very well";
  if (f >= 1.05) return "Above expectations";
  if (f >= 0.8) return "About as expected";
  if (f >= 0.5) return "Underperforming";
  if (f >= 0.3) return "A bad bet";
  return "A disaster";
}

// ---------- helpers ----------
export function getBusinessTierIndex(level: number): number {
  if (level >= 40) return 3;
  if (level >= 20) return 2;
  if (level >= 8) return 1;
  return 0;
}
