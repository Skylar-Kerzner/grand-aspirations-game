export interface BusinessDef {
  id: string;
  name: string;
  sector: string;
  baseCost: number;
  baseIncome: number;
  costMultiplier: number;
  managerCost: number;
  description: string;
  tierNames: string[];
  tierImages: string[];
}

export interface AssetTierDef {
  name: string;
  cost: number;
  image: string;
  benefit: string;
}

export interface AssetDef {
  id: string;
  name: string;
  category: string;
  tiers: AssetTierDef[];
}

export interface InvestmentDef {
  id: string;
  name: string;
  description: string;
  minInvestment: number;
  baseReturn: number;
  volatility: number;
  risk: string;
}

export interface LoanDef {
  id: string;
  name: string;
  amount: number;
  interestRate: number;
  description: string;
}

export interface ConsultantDef {
  id: string;
  name: string;
  cost: number;
  effect: string;
  target: "income" | "expenses" | "investments" | "work";
}

export const BUSINESS_TIER_THRESHOLDS = [1, 10, 25, 50];

export const BUSINESSES: BusinessDef[] = [
  {
    id: "coffee",
    name: "Coffee Shop",
    sector: "Food & Beverage",
    baseCost: 50,
    baseIncome: 0.5,
    costMultiplier: 1.15,
    managerCost: 500,
    description: "From humble cart to global empire.",
    tierNames: ["Coffee Cart", "Corner Café", "Coffee Chain", "Global Coffee Empire"],
    tierImages: ["coffee-t1", "coffee-t1", "coffee-t4", "coffee-t4"],
  },
  {
    id: "restaurant",
    name: "Restaurant",
    sector: "Food & Beverage",
    baseCost: 500,
    baseIncome: 3,
    costMultiplier: 1.15,
    managerCost: 5000,
    description: "Culinary excellence, served daily.",
    tierNames: ["Food Truck", "Bistro", "Fine Dining", "Culinary Empire"],
    tierImages: ["restaurant-t1", "restaurant-t1", "restaurant-t4", "restaurant-t4"],
  },
  {
    id: "tech",
    name: "Tech Startup",
    sector: "Technology",
    baseCost: 5000,
    baseIncome: 20,
    costMultiplier: 1.14,
    managerCost: 50000,
    description: "Disrupt. Scale. Dominate.",
    tierNames: ["Garage Startup", "Small Office", "Tech Campus", "Tech Giant HQ"],
    tierImages: ["tech-t1", "tech-t1", "tech-t4", "tech-t4"],
  },
  {
    id: "hotel",
    name: "Hotel",
    sector: "Hospitality",
    baseCost: 50000,
    baseIncome: 150,
    costMultiplier: 1.13,
    managerCost: 500000,
    description: "Luxury accommodations worldwide.",
    tierNames: ["Roadside Motel", "Boutique Hotel", "Luxury Resort", "Grand Hotel Empire"],
    tierImages: ["hotel-t1", "hotel-t1", "hotel-t4", "hotel-t4"],
  },
  {
    id: "fashion",
    name: "Fashion Brand",
    sector: "Retail",
    baseCost: 500000,
    baseIncome: 1200,
    costMultiplier: 1.12,
    managerCost: 5000000,
    description: "Define style itself.",
    tierNames: ["Market Stall", "Boutique", "Department Store", "Fashion House"],
    tierImages: ["fashion-t1", "fashion-t1", "fashion-t4", "fashion-t4"],
  },
  {
    id: "themepark",
    name: "Theme Park",
    sector: "Entertainment",
    baseCost: 5000000,
    baseIncome: 10000,
    costMultiplier: 1.11,
    managerCost: 50000000,
    description: "Create worlds of wonder.",
    tierNames: ["Carnival Rides", "Fun Park", "Theme Park", "Entertainment Empire"],
    tierImages: ["themepark-t1", "themepark-t2", "themepark-t3", "themepark-t4"],
  },
];

export const ASSETS: AssetDef[] = [
  {
    id: "car",
    name: "Vehicle",
    category: "Transport",
    tiers: [
      { name: "Used Sedan", cost: 500, image: "car-t1", benefit: "+10% work income" },
      { name: "Luxury Sedan", cost: 25000, image: "car-t2", benefit: "+25% work income" },
      { name: "Sports Car", cost: 500000, image: "car-t3", benefit: "+50% work income" },
      { name: "Hypercar", cost: 5000000, image: "car-t4", benefit: "+100% work income" },
    ],
  },
  {
    id: "house",
    name: "Residence",
    category: "Property",
    tiers: [
      { name: "Studio Apartment", cost: 2000, image: "house-t1", benefit: "-25% rent" },
      { name: "Modern Loft", cost: 100000, image: "house-t2", benefit: "-50% rent" },
      { name: "Hillside Villa", cost: 5000000, image: "house-t3", benefit: "-75% rent" },
      { name: "Oceanfront Compound", cost: 50000000, image: "house-t4", benefit: "No rent" },
    ],
  },
  {
    id: "wardrobe",
    name: "Wardrobe",
    category: "Fashion",
    tiers: [
      { name: "Casual Wear", cost: 200, image: "wardrobe-t1", benefit: "+5% business income" },
      { name: "Designer Collection", cost: 10000, image: "wardrobe-t2", benefit: "+15% business income" },
      { name: "Haute Couture", cost: 250000, image: "wardrobe-t3", benefit: "+30% business income" },
      { name: "Bespoke Atelier", cost: 3000000, image: "wardrobe-t4", benefit: "+60% business income" },
    ],
  },
  {
    id: "watch",
    name: "Timepiece",
    category: "Accessories",
    tiers: [
      { name: "Digital Watch", cost: 100, image: "watch-t1", benefit: "+5% investment returns" },
      { name: "Automatic Movement", cost: 5000, image: "watch-t2", benefit: "+10% investment returns" },
      { name: "Luxury Chronograph", cost: 150000, image: "watch-t3", benefit: "+20% investment returns" },
      { name: "Haute Horlogerie", cost: 5000000, image: "watch-t4", benefit: "+40% investment returns" },
    ],
  },
];

export const INVESTMENTS: InvestmentDef[] = [
  { id: "savings", name: "Savings Account", description: "Safe and predictable.", minInvestment: 100, baseReturn: 0.000005, volatility: 0, risk: "None" },
  { id: "bonds", name: "Government Bonds", description: "Stable, modest returns.", minInvestment: 1000, baseReturn: 0.00001, volatility: 0.000002, risk: "Low" },
  { id: "index", name: "Index Fund", description: "Diversified market exposure.", minInvestment: 5000, baseReturn: 0.00003, volatility: 0.00001, risk: "Moderate" },
  { id: "realestate", name: "Real Estate Fund", description: "Property market exposure.", minInvestment: 25000, baseReturn: 0.00005, volatility: 0.00003, risk: "Moderate-High" },
  { id: "crypto", name: "Cryptocurrency", description: "Volatile. Can depreciate.", minInvestment: 500, baseReturn: 0.0001, volatility: 0.0005, risk: "Very High" },
];

export const LOANS: LoanDef[] = [
  { id: "micro", name: "Micro Loan", amount: 1000, interestRate: 0.0001, description: "Quick cash, manageable terms." },
  { id: "small", name: "Small Business Loan", amount: 25000, interestRate: 0.00008, description: "Fuel your next venture." },
  { id: "commercial", name: "Commercial Loan", amount: 500000, interestRate: 0.00005, description: "Scale your operations." },
  { id: "venture", name: "Venture Debt", amount: 5000000, interestRate: 0.00003, description: "For ambitious expansion." },
];

export const CONSULTANTS: ConsultantDef[] = [
  { id: "marketing", name: "Marketing Expert", cost: 50000, effect: "+25% business income", target: "income" },
  { id: "operations", name: "Operations Director", cost: 200000, effect: "-30% expenses", target: "expenses" },
  { id: "finance", name: "Financial Advisor", cost: 500000, effect: "+20% investment returns", target: "investments" },
  { id: "celebrity", name: "Celebrity Endorser", cost: 2000000, effect: "+50% work income", target: "work" },
];

export function getBusinessTierIndex(level: number): number {
  if (level >= 50) return 3;
  if (level >= 25) return 2;
  if (level >= 10) return 1;
  return 0;
}

export function getBusinessCost(baseCost: number, costMultiplier: number, level: number): number {
  return baseCost * Math.pow(costMultiplier, level);
}
