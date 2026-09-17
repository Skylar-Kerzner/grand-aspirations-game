// ============================================================
// EMPIRE — economic model
// Time: 1 real second = 1 in-game DAY. All rates below are per DAY
// unless stated otherwise. Yearly figures use 365 days.
// ============================================================

import { pickImage } from "./gameImages";

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
  track: string; // career track this study opens up
  level: number; // 1 short course, 2 diploma, 3 full degree
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
  // Operations & Industry
  { id: "ops-1", name: "Trade Short Course", track: "operations", level: 1, cost: 1200, days: 20, description: "A few weeks of practical training. Opens junior roles in Operations & Industry." },
  { id: "trade", name: "Bachelor of Industrial Technology", track: "operations", level: 2, cost: 26000, days: 150, description: "A four-year degree. Opens senior roles in Operations & Industry." },
  { id: "ops-3", name: "Master of Industrial Engineering", track: "operations", level: 3, cost: 62000, days: 220, description: "Graduate study. Opens the top of Operations & Industry." },
  // Hospitality & Retail
  { id: "hosp-1", name: "Service & Barista Course", track: "hospitality", level: 1, cost: 900, days: 18, description: "The basics of the floor. Opens junior roles in Hospitality & Retail." },
  { id: "hospitality", name: "Bachelor of Hospitality Management", track: "hospitality", level: 2, cost: 24000, days: 150, description: "A four-year degree. Opens senior roles in Hospitality & Retail." },
  { id: "hosp-3", name: "Master of Hotel Management", track: "hospitality", level: 3, cost: 68000, days: 220, description: "Graduate study. Opens the top of Hospitality & Retail." },
  // Corporate Leadership
  { id: "corp-1", name: "Business Fundamentals Course", track: "corporate", level: 1, cost: 2500, days: 30, description: "Accounts, contracts, people. Opens junior corporate roles." },
  { id: "business", name: "Bachelor of Business Administration", track: "corporate", level: 2, cost: 46000, days: 170, description: "A four-year degree. Opens senior corporate roles." },
  { id: "corp-3", name: "MBA", track: "corporate", level: 3, cost: 150000, days: 260, description: "Graduate study. Opens the executive table in Corporate Leadership." },
  // Technology
  { id: "tech-1", name: "Coding Bootcamp", track: "tech", level: 1, cost: 4000, days: 35, description: "Enough to ship real work. Opens junior technology roles." },
  { id: "cs", name: "BSc Computer Science", track: "tech", level: 2, cost: 52000, days: 175, description: "A four-year degree. Opens senior technology roles." },
  { id: "tech-3", name: "MSc Computer Science", track: "tech", level: 3, cost: 140000, days: 250, description: "Graduate study. Opens the top of Technology, research and architecture." },
  // Finance & Investing
  { id: "fin-1", name: "Financial Markets Course", track: "finance", level: 1, cost: 5000, days: 40, description: "Markets, instruments, risk. Opens junior finance roles." },
  { id: "finance", name: "BSc Finance", track: "finance", level: 2, cost: 60000, days: 180, description: "A four-year degree. Opens senior finance roles — analysts and traders." },
  { id: "fin-3", name: "Master of Quantitative Finance", track: "finance", level: 3, cost: 260000, days: 300, description: "Graduate study. Opens the top of Finance & Investing — quant, portfolio and fund roles." },
  // Arts & Entertainment
  { id: "arts-1", name: "Acting & Performance Workshop", track: "arts", level: 1, cost: 1500, days: 25, description: "Scene work, auditions, an agent's phone number. Opens junior roles in Arts & Entertainment." },
  { id: "arts-2", name: "Bachelor of Fine Arts", track: "arts", level: 2, cost: 38000, days: 170, description: "A four-year conservatory degree. Opens senior roles in Arts & Entertainment." },
  { id: "arts-3", name: "Master of Fine Arts", track: "arts", level: 3, cost: 95000, days: 230, description: "Graduate study. Opens leading roles and the top of Arts & Entertainment." },
  // Education & Public Service
  { id: "edu-1", name: "Teaching Assistant Certificate", track: "education", level: 1, cost: 800, days: 20, description: "Classroom basics. Opens junior roles in Education & Public Service." },
  { id: "edu-2", name: "Bachelor of Education", track: "education", level: 2, cost: 19000, days: 160, description: "A four-year degree and a teaching licence. Opens senior roles in Education & Public Service." },
  { id: "edu-3", name: "Master of Education", track: "education", level: 3, cost: 44000, days: 200, description: "Graduate study. Opens principals' offices and district leadership." },
  // Health & Medicine
  { id: "med-1", name: "Paramedic Certificate", track: "medicine", level: 1, cost: 3200, days: 45, description: "Emergency care in the field. Opens junior roles in Health & Medicine." },
  { id: "med-2", name: "Bachelor of Nursing", track: "medicine", level: 2, cost: 58000, days: 200, description: "A four-year clinical degree. Opens senior roles in Health & Medicine." },
  { id: "med-3", name: "Doctor of Medicine (MD)", track: "medicine", level: 3, cost: 320000, days: 400, description: "Medical school and residency. Opens consultants', surgeons' and chief medical roles." },
];

/** The highest-level qualification for a track (its full degree). */
export function getTrackMajor(trackId: string): MajorDef | undefined {
  return getTrackPrograms(trackId)[2];
}

export function getTrackPrograms(trackId: string): MajorDef[] {
  return MAJORS.filter((m) => m.track === trackId).sort((a, b) => a.level - b.level);
}

/** The qualification level a career level demands in its industry. */
export function requiredCredentialLevel(tier: number): number {
  if (tier < MAJOR_GATE_TIER) return 0;   // levels 0-3: anyone can walk in
  if (tier < 7) return 1;                 // levels 4-6: a short course at least
  if (tier < 10) return 2;                // levels 7-9: a diploma
  return 3;                               // levels 10+: the full degree
}

/** Years served in an industry that stand in for one level of qualification. */
export const CREDENTIAL_YEARS_PER_LEVEL = 3;
/** Experience alone can never substitute for the full degree at the very top. */
export const CREDENTIAL_EXPERIENCE_CAP = 2;

export function credentialLevelFrom(majors: string[], trackId: string): number {
  return MAJORS.filter((m) => m.track === trackId && majors.includes(m.id))
    .reduce((best, m) => Math.max(best, m.level), 0);
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
export interface CareerTrack {
  id: string;
  name: string;
  curve: number;
  outlook: string;
  /** How the middle of the ladder feels: a short phrase for the comparison screen. */
  middle: string;
  /** Plain-language advantages beyond pay. */
  perks: string[];
  /** Venture industries this working life also gives you a feel for. */
  ventureTracks?: string[];
  /** Extra return on everything you have invested while you work in this field. */
  investBonus?: number;
  /** Study runs this much faster, and programs cost this much less. */
  studyBonus?: number;
  /** Share off your daily lifestyle costs — comped, sponsored or subsidised. */
  livingDiscount?: number;
  /** Extra hours in your week from the way this life is organised. */
  hoursBonus?: number;
  /** Share added to the luck of a venture you open or tier up. */
  ventureLuck?: number;
  /** Share off what it costs to open or grow a venture. */
  ventureCostDiscount?: number;
}

/**
 * Every perk gets stronger the further you climb that path: 40% of it at the
 * bottom, all of it at the top. Keeps low-paying paths worth staying in.
 */
export function trackPerkScale(level: number, maxLevel: number): number {
  if (maxLevel <= 0) return 1;
  return 0.4 + 0.6 * Math.min(1, Math.max(0, level / maxLevel));
}

export const CAREER_TRACKS: Record<string, CareerTrack> = {
  hospitality: {
    id: "hospitality", name: "Hospitality & Retail", curve: -0.6,
    outlook: "Pays well right away, but the ceiling is low.",
    middle: "Rises quickly at first, then flattens out by the middle.",
    perks: ["Runs coffee shops, restaurants, hotels and fashion labels better", "Meals and rooms comped: 10% off your lifestyle", "You read a site before you sign: businesses open luckier"],
    ventureTracks: ["hospitality"], livingDiscount: 0.1, ventureLuck: 0.12,
  },
  operations: {
    id: "operations", name: "Operations & Industry", curve: -0.25,
    outlook: "Steady pay that rises slowly and reliably.",
    middle: "Even, predictable steps the whole way up.",
    perks: ["Runs theme parks and large sites better", "Cheapest schooling of the hands-on paths", "You know the trades: 14% off opening and growing businesses"],
    ventureTracks: ["operations"], ventureCostDiscount: 0.14,
  },
  corporate: {
    id: "corporate", name: "Corporate Leadership", curve: 0.2,
    outlook: "Modest early, strong once you reach the top table.",
    middle: "Slow through the middle, then jumps at director level.",
    perks: ["Runs city developments better", "Boardroom contacts: +4% on everything invested", "Deals come to you first: businesses open luckier"],
    ventureTracks: ["corporate"], investBonus: 0.04, ventureLuck: 0.1,
  },
  tech: {
    id: "tech", name: "Technology", curve: 0.5,
    outlook: "A slow start that compounds into very high pay.",
    middle: "Climbs fast through the middle once you can build.",
    perks: ["Runs tech companies and media networks better", "Remote and flexible: +3h of your week", "You build the systems yourself: 7% off business costs"],
    ventureTracks: ["tech"], hoursBonus: 3, ventureCostDiscount: 0.07,
  },
  finance: {
    id: "finance", name: "Finance & Investing", curve: 0.85,
    outlook: "Lowest pay early, by far the highest ceiling.",
    middle: "Grinding middle years, then compensation runs away.",
    perks: ["+10% on everything you have invested", "The only path to running your own fund"],
    ventureTracks: ["corporate"], investBonus: 0.1,
  },
  arts: {
    id: "arts", name: "Arts & Entertainment", curve: 1.1,
    outlook: "Almost nothing for years, then fame pays enormously.",
    middle: "A brutal middle — many years at little pay.",
    perks: ["Runs fashion labels, theme parks and media better", "Sponsorships and invitations: 20% off your lifestyle", "Your name on the door: businesses open a little luckier"],
    ventureTracks: ["hospitality", "tech", "operations"], livingDiscount: 0.2, ventureLuck: 0.06,
  },
  education: {
    id: "education", name: "Education & Public Service", curve: -0.7,
    outlook: "Low pay throughout, but nothing ever goes backwards.",
    middle: "Gentle, certain steps and long holidays.",
    perks: ["Study runs 30% faster and costs 25% less", "Term breaks: +5h of your week", "Public rates: 8% off your lifestyle"],
    studyBonus: 0.3, hoursBonus: 5, livingDiscount: 0.08,
  },
  medicine: {
    id: "medicine", name: "Health & Medicine", curve: 0.6,
    outlook: "The longest, costliest schooling, then very high steady pay.",
    middle: "Nothing much until you qualify, then a steep, safe climb.",
    perks: ["Your own health is handled: +4h of your week", "Pay barely moves with the economy", "Everything looked after: 8% off your lifestyle"],
    hoursBonus: 4, livingDiscount: 0.08,
  },
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
  "Beacon Retail Group": "hospitality", "Larkspur Hotels": "hospitality", "Maison Grove": "hospitality",
  "Ironvale Industrial": "operations",
  "Helix Systems": "tech", "Orbit Cloud": "tech",
  "Hartwell Group": "corporate", "Devon & Rowe": "corporate",
  // Arts & Entertainment
  "Lyric Playhouse": "arts", "Silver Reel Studios": "arts", "Marquee Talent": "arts",
  "Vantage Pictures": "arts", "Nightfall Records": "arts",
  // Education & Public Service
  "Hillcrest Public School": "education", "Wren Academy": "education", "City Education Board": "education",
  "Alderman College": "education", "State Department of Learning": "education",
  // Health & Medicine
  "Riverside Clinic": "medicine", "St. Alder Hospital": "medicine", "Meadowbrook Health": "medicine",
  "Kingsley Medical Group": "medicine", "National Health Institute": "medicine",
};

export function getCareerTrack(employer: string): CareerTrack {
  return CAREER_TRACKS[EMPLOYER_TRACKS[employer] || "operations"];
}

/** The room you actually work in: one per industry, at seven stages of seniority. */
export const WORKPLACE_STAGES = 7;

export function workplaceImage(employer: string, level: number): string {
  const track = getCareerTrack(employer).id;
  const stage = Math.max(1, Math.min(WORKPLACE_STAGES, Math.ceil((level + 1) / 2)));
  // Nearest available stage, so a missing room never leaves a blank frame.
  const order = [stage];
  for (let step = 1; step < WORKPLACE_STAGES; step++) {
    if (stage - step >= 1) order.push(stage - step);
    if (stage + step <= WORKPLACE_STAGES) order.push(stage + step);
  }
  return pickImage(...order.map((s) => `work-${track}-s${s}`));
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

/**
 * Moving sideways into another industry costs you: you arrive as an outsider.
 * Most of that cost is now paid in rank — you start at the level you have earned
 * in that field — so the pay penalty on top of it is small.
 */
export const TRACK_SWITCH_PENALTY = 0.08;
/** Jumping into an unrelated industry costs more still. */
export const TRACK_FAR_SWITCH_PENALTY = 0.15;
/** A degree in the industry you are moving into softens the landing. */
export const TRACK_SWITCH_DEGREE_RELIEF = 0.06;

/**
 * The highest career level each qualification level opens in its own industry,
 * mirroring requiredCredentialLevel: no schooling stops at level 3, a short
 * course at 6, a bachelor's at 9, and only a graduate degree reaches the top.
 */
export const CREDENTIAL_LEVEL_CEILING = [3, 6, 9, 13];

/** Career levels earned per year worked inside an industry. */
export const LEVELS_PER_YEAR_IN_TRACK = 0.5;

/**
 * How much of your seniority elsewhere an industry is willing to credit.
 * General leadership takes outsiders seriously; clinical and technical
 * fields barely count it at all.
 */
export const TRACK_TRANSFER_SHARE: Record<string, number> = {
  corporate: 0.6,
  operations: 0.4,
  hospitality: 0.4,
  finance: 0.3,
  education: 0.3,
  arts: 0.25,
  tech: 0.25,
  medicine: 0.1,
};
/** A related industry credits a little more of what you already are. */
export const TRACK_TRANSFER_ADJACENT_BONUS = 0.15;

/** Leaving a job before this many days served is treated as job hopping. */
export const JOB_HOP_SETTLED_DAYS = 365;
/** The most pay a restless record can cost you on a new offer. */
export const JOB_HOP_PENALTY = 0.2;

/** How much pay a move into another industry costs, before the hopping penalty. */
export function trackSwitchPenalty(from: string, to: string, hasMajor: boolean): number {
  const base = isAdjacentTrack(from, to) ? TRACK_SWITCH_PENALTY : TRACK_FAR_SWITCH_PENALTY;
  return Math.max(0, base - (hasMajor ? TRACK_SWITCH_DEGREE_RELIEF : 0));
}

/** Offers are worth less while your record looks restless. */
export function jobHopMultiplier(daysInCurrentJob: number): number {
  const settled = Math.min(1, Math.max(0, daysInCurrentJob) / JOB_HOP_SETTLED_DAYS);
  return 1 - JOB_HOP_PENALTY * (1 - settled);
}

/**
 * Which industries a sideways move makes sense into. Anything not listed here is
 * only reachable by studying that path's major.
 */
export const TRACK_ADJACENCY: Record<string, string[]> = {
  hospitality: ["operations", "corporate", "arts"],
  operations: ["hospitality", "corporate", "medicine"],
  corporate: ["operations", "hospitality", "finance", "education"],
  tech: ["corporate", "education"],
  finance: ["corporate"],
  arts: ["hospitality", "education"],
  education: ["arts", "corporate", "medicine"],
  medicine: ["education", "operations"],
};

export function isAdjacentTrack(from: string, to: string): boolean {
  return (TRACK_ADJACENCY[from] || []).includes(to);
}

/** Levels served in one industry that count in place of a degree on that path. */
export const TRACK_EXPERIENCE_GATE = 3;

export const CAREER_SALARY_RANGE = { min: 0.82, max: 1.22 };
// Every level offers a role in each of the five industries, so a search always
// spreads across paths. What differs between them is the pay curve, not availability.
export const CAREER_VARIANTS: CareerVariant[][] = [
  [
    { title: "Dishwasher", employer: "Corner Diner" },
    { title: "Warehouse Hand", employer: "Calder Freight" },
    { title: "Office Runner", employer: "Hartwell Group" },
    { title: "IT Support Trainee", employer: "Helix Systems" },
    { title: "Filing Clerk", employer: "Ashford Mutual" },
    { title: "Background Extra", employer: "Silver Reel Studios" },
    { title: "Playground Monitor", employer: "Hillcrest Public School" },
    { title: "Hospital Porter", employer: "Riverside Clinic" },
  ],
  [
    { title: "Barista", employer: "Roast House" },
    { title: "Machine Operator", employer: "Brightline Manufacturing" },
    { title: "Receptionist", employer: "Arclight Group" },
    { title: "Helpdesk Technician", employer: "Orbit Cloud" },
    { title: "Mail Room Clerk", employer: "Halstead Capital" },
    { title: "Stagehand", employer: "Lyric Playhouse" },
    { title: "Teaching Assistant", employer: "Hillcrest Public School" },
    { title: "Care Assistant", employer: "Meadowbrook Health" },
  ],
  [
    { title: "Shift Supervisor", employer: "Juniper Coffee" },
    { title: "Line Supervisor", employer: "Brightline Manufacturing" },
    { title: "Office Administrator", employer: "Hartwell Group" },
    { title: "Desktop Support Analyst", employer: "Helix Systems" },
    { title: "Bank Teller", employer: "Ashford Mutual" },
    { title: "Production Assistant", employer: "Silver Reel Studios" },
    { title: "Substitute Teacher", employer: "Wren Academy" },
    { title: "Phlebotomist", employer: "Riverside Clinic" },
  ],
  [
    { title: "Assistant Manager", employer: "Daily Ritual" },
    { title: "Service Technician", employer: "Meridian Facilities" },
    { title: "Executive Assistant", employer: "Sterling Partners" },
    { title: "Junior Developer", employer: "Fieldstone Tech" },
    { title: "Claims Assistant", employer: "Ashford Mutual" },
    { title: "Repertory Actor", employer: "Lyric Playhouse" },
    { title: "Classroom Teacher", employer: "Hillcrest Public School" },
    { title: "Paramedic", employer: "Meadowbrook Health" },
  ],
  [
    { title: "Store Manager", employer: "Alder Grocers" },
    { title: "Operations Coordinator", employer: "Meridian Facilities" },
    { title: "Business Analyst", employer: "Hartwell Group" },
    { title: "Software Developer", employer: "Northbeam Labs" },
    { title: "Underwriting Associate", employer: "Ashford Mutual" },
    { title: "Supporting Screen Actor", employer: "Vantage Pictures" },
    { title: "Senior Teacher", employer: "Wren Academy" },
    { title: "Registered Nurse", employer: "St. Alder Hospital" },
  ],
  [
    { title: "General Manager", employer: "Pennington Hall" },
    { title: "Production Scheduler", employer: "Brightline Manufacturing" },
    { title: "Commercial Analyst", employer: "Summit Advisory" },
    { title: "Software Engineer", employer: "Vanta Works" },
    { title: "Junior Analyst", employer: "Halstead Capital" },
    { title: "Series Regular", employer: "Silver Reel Studios" },
    { title: "Head of Department", employer: "Wren Academy" },
    { title: "Nurse Practitioner", employer: "St. Alder Hospital" },
  ],
  [
    { title: "Area Manager", employer: "Beacon Retail Group" },
    { title: "Plant Supervisor", employer: "Civic Works" },
    { title: "Category Manager", employer: "Devon & Rowe" },
    { title: "Product Engineer", employer: "Fieldstone Tech" },
    { title: "Research Analyst", employer: "North & Finch" },
    { title: "Recording Artist", employer: "Nightfall Records" },
    { title: "Deputy Principal", employer: "Hillcrest Public School" },
    { title: "Resident Physician", employer: "Kingsley Medical Group" },
  ],
  [
    { title: "Regional Manager", employer: "Beacon Retail Group" },
    { title: "Logistics Manager", employer: "Calder Freight" },
    { title: "Commercial Manager", employer: "Summit Advisory" },
    { title: "Senior Software Engineer", employer: "Northbeam Labs" },
    { title: "Portfolio Associate", employer: "Crown & Vale" },
    { title: "Lead Actor", employer: "Vantage Pictures" },
    { title: "Principal", employer: "Wren Academy" },
    { title: "Attending Physician", employer: "St. Alder Hospital" },
  ],
  [
    { title: "Group Operations Manager", employer: "Larkspur Hotels" },
    { title: "Plant Manager", employer: "Brightline Manufacturing" },
    { title: "Strategy Manager", employer: "Arclight Group" },
    { title: "Engineering Lead", employer: "Vanta Works" },
    { title: "Risk Manager", employer: "Ashford Mutual" },
    { title: "Headline Performer", employer: "Nightfall Records" },
    { title: "District Superintendent", employer: "City Education Board" },
    { title: "Specialist Surgeon", employer: "Kingsley Medical Group" },
  ],
  [
    { title: "Head of Retail Operations", employer: "Maison Grove" },
    { title: "Head of Manufacturing", employer: "Ironvale Industrial" },
    { title: "Head of Corporate Development", employer: "Summit Advisory" },
    { title: "Director of Engineering", employer: "Fieldstone Tech" },
    { title: "Senior Quant", employer: "Crown & Vale" },
    { title: "Leading Film Actor", employer: "Silver Reel Studios" },
    { title: "College Dean", employer: "Alderman College" },
    { title: "Head of Surgery", employer: "St. Alder Hospital" },
  ],
  [
    { title: "Retail Director", employer: "Beacon Retail Group" },
    { title: "Operations Director", employer: "Meridian Facilities" },
    { title: "Vice President", employer: "Arclight Group" },
    { title: "Vice President of Product", employer: "Aster Group" },
    { title: "Director of Investments", employer: "North & Finch" },
    { title: "Box-Office Star", employer: "Vantage Pictures" },
    { title: "University Provost", employer: "Alderman College" },
    { title: "Chief of Medicine", employer: "Kingsley Medical Group" },
  ],
  [
    { title: "Managing Director of Hotels", employer: "Larkspur Hotels" },
    { title: "Division President", employer: "Ironvale Industrial" },
    { title: "Senior Vice President", employer: "Sterling Partners" },
    { title: "Chief Technology Officer", employer: "Fieldstone Tech" },
    { title: "Head of Capital Markets", employer: "North & Finch" },
    { title: "Actor-Producer", employer: "Marquee Talent" },
    { title: "University President", employer: "Alderman College" },
    { title: "Hospital Chief Executive", employer: "St. Alder Hospital" },
  ],
  [
    { title: "Chief Commercial Officer", employer: "Maison Grove" },
    { title: "Chief Operating Officer", employer: "Brightline Manufacturing" },
    { title: "Managing Partner", employer: "Arclight Group" },
    { title: "President", employer: "Aster Group" },
    { title: "Head of Private Equity", employer: "Halstead Capital" },
    { title: "Studio Headliner", employer: "Silver Reel Studios" },
    { title: "State Education Commissioner", employer: "State Department of Learning" },
    { title: "Director of Medical Research", employer: "National Health Institute" },
  ],
  [
    { title: "Chief Executive Officer", employer: "Larkspur Hotels" },
    { title: "Chairman & Chief Executive", employer: "Ironvale Industrial" },
    { title: "Chairman of the Board", employer: "Sterling Partners" },
    { title: "Founding Chief Executive", employer: "Orbit Cloud" },
    { title: "Chief Investment Officer", employer: "Kestrel Capital" },
    { title: "Studio Chief Executive", employer: "Vantage Pictures" },
    { title: "National Education Secretary", employer: "State Department of Learning" },
    { title: "Surgeon General", employer: "National Health Institute" },
    { title: "Founder", employer: "Your own fund" },
  ],
];

// Daily pay is what a standard 40-hour week works out to per day. The ladder
// runs from roughly $35k a year at the bottom to C-suite money at the top,
// compressed at the bottom and steepening near the very top, as real pay does.
export const JOBS: JobDef[] = [
  { id: "dish", title: "Dishwasher", employer: "Corner Diner", education: 0, dailyPay: 95, xpToPromote: 40, scene: "desk-t1" },
  { id: "barista", title: "Barista", employer: "Roast House", education: 0, dailyPay: 120, xpToPromote: 70, scene: "desk-t1" },
  { id: "shift", title: "Shift Supervisor", employer: "Roast House", education: 0, dailyPay: 150, xpToPromote: 120, scene: "desk-t1" },
  { id: "tech", title: "Service Technician", employer: "Meridian Facilities", education: 1, dailyPay: 195, xpToPromote: 180, scene: "desk-t2" },
  { id: "admin", title: "Operations Coordinator", employer: "Meridian Facilities", education: 1, dailyPay: 255, xpToPromote: 260, scene: "desk-t2" },
  { id: "analyst", title: "Junior Analyst", employer: "Halstead Capital", education: 2, dailyPay: 340, xpToPromote: 360, scene: "desk-t2" },
  { id: "account", title: "Account Manager", employer: "Halstead Capital", education: 2, dailyPay: 460, xpToPromote: 500, scene: "desk-t3" },
  { id: "eng", title: "Software Engineer", employer: "Northbeam Labs", education: 3, dailyPay: 640, xpToPromote: 700, scene: "desk-t3" },
  { id: "lead", title: "Engineering Lead", employer: "Northbeam Labs", education: 3, dailyPay: 890, xpToPromote: 950, scene: "desk-t3" },
  { id: "dir", title: "Director of Strategy", employer: "Northbeam Labs", education: 3, dailyPay: 1280, xpToPromote: 1300, scene: "desk-t4" },
  { id: "vp", title: "Vice President", employer: "Arclight Group", education: 4, dailyPay: 1900, xpToPromote: 1800, scene: "desk-t4" },
  { id: "partner", title: "Managing Partner", employer: "Arclight Group", education: 4, dailyPay: 2950, xpToPromote: 2600, scene: "desk-t4" },
  { id: "pm", title: "Chief Executive Officer", employer: "Halstead Capital", education: 5, dailyPay: 5000, xpToPromote: 3800, scene: "desk-t5" },
  {
    id: "hedge", title: "Hedge Fund Manager", employer: "Your own fund", education: 5,
    dailyPay: 9000, xpToPromote: Infinity, scene: "desk-t5", perfFee: true,
  },
];

/**
 * Days you must serve in a post before another employer will move you up a rank.
 * Below this, the market only offers sideways moves — you cannot climb daily.
 */
export const PROMOTION_MIN_DAYS = 240;

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
  risk: number; // annual volatility of the slow trading trend — this is what moves the venture's value
  dailyNoise: number; // how much a single day's takings swing around normal (does not move the value)
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
    baseCost: 6000, annualROI: 0.3, costMultiplier: 1.16, risk: 0.3, dailyNoise: 0.38, track: "hospitality",
    description: "From humble cart to global empire.",
    tierNames: ["Coffee Cart", "Corner Café", "Coffee Chain", "Global Coffee Empire"],
  },
  {
    id: "restaurant", name: "Restaurant", sector: "Food & Beverage",
    baseCost: 25000, annualROI: 0.3, costMultiplier: 1.16, risk: 0.28, dailyNoise: 0.34, track: "hospitality",
    description: "Culinary excellence, served daily.",
    tierNames: ["Food Truck", "Neighbourhood Bistro", "Fine Dining Room", "Culinary Empire"],
  },
  {
    id: "tech", name: "Tech Startup", sector: "Technology",
    baseCost: 100000, annualROI: 0.3, costMultiplier: 1.15, risk: 0.45, dailyNoise: 0.3, track: "tech",
    description: "Disrupt. Scale. Dominate.",
    tierNames: ["Garage Startup", "Series A Office", "Tech Campus", "Tech Giant HQ"],
  },
  {
    id: "hotel", name: "Hotel", sector: "Hospitality",
    baseCost: 400000, annualROI: 0.3, costMultiplier: 1.14, risk: 0.24, dailyNoise: 0.24, track: "hospitality",
    description: "Luxury accommodations worldwide.",
    tierNames: ["Roadside Motel", "Boutique Hotel", "Luxury Resort", "Grand Hotel Empire"],
  },
  {
    id: "fashion", name: "Fashion Brand", sector: "Retail",
    baseCost: 1500000, annualROI: 0.3, costMultiplier: 1.13, risk: 0.26, dailyNoise: 0.28, track: "hospitality",
    description: "Define style itself.",
    tierNames: ["Market Stall", "Flagship Boutique", "Department Store", "Fashion House"],
  },
  {
    id: "themepark", name: "Theme Park", sector: "Entertainment",
    baseCost: 6000000, annualROI: 0.3, costMultiplier: 1.12, risk: 0.22, dailyNoise: 0.32, track: "operations",
    description: "Create worlds of wonder.",
    tierNames: ["Travelling Carnival", "Family Fun Park", "Destination Theme Park", "Entertainment Empire"],
  },
  {
    id: "media", name: "Media Network", sector: "Media",
    baseCost: 25000000, annualROI: 0.3, costMultiplier: 1.12, risk: 0.2, dailyNoise: 0.16, track: "tech",
    description: "Own the attention itself.",
    tierNames: ["Podcast Studio", "Streaming Channel", "Broadcast Network", "Global Media Conglomerate"],
  },
  {
    id: "city", name: "City Development", sector: "Infrastructure",
    baseCost: 100000000, annualROI: 0.3, costMultiplier: 1.11, risk: 0.16, dailyNoise: 0.1, track: "corporate",
    description: "Build the skyline everyone else lives in.",
    tierNames: ["City Block", "Mixed-Use District", "Waterfront Downtown", "Sovereign Metropolis"],
  },
];

// Trading conditions drift day to day and revert toward normal at this rate.
export const BUSINESS_CONDITION_REVERSION = 0.04;

// Weekly trading rhythm, Monday-first, each normalised to average 1. Hospitality
// and entertainment ventures boom on weekends; trade-facing ventures peak midweek.
const normaliseWeek = (a: number[]) => {
  const m = a.reduce((x, y) => x + y, 0) / a.length;
  return a.map((v) => v / m);
};
export const WEEKDAY_RHYTHM = {
  weekend: normaliseWeek([0.75, 0.8, 0.9, 1.0, 1.15, 1.6, 1.3]),
  weekday: normaliseWeek([1.05, 1.1, 1.15, 1.1, 1.0, 0.75, 0.6]),
};

// Each venture rides a slow season: good and bad trade cluster into multi-week
// runs. Slow reversion and wide range so the runs are actually felt.
export const BUSINESS_SEASON_REVERSION = 0.015;
export const BUSINESS_SEASON_VOL = 0.05;
export const BUSINESS_SEASON_MIN = 0.65;
export const BUSINESS_SEASON_MAX = 1.5;

// Rare standout days: a washout (weather, closure) or a bumper day (event, rush).
export const BUSINESS_WASHOUT_CHANCE = 0.02;
export const BUSINESS_BUMPER_CHANCE = 0.02;
// Chance per day, scaled by a business's risk, of a serious setback.
export const BUSINESS_SHOCK_CHANCE = 0.002;
export const BUSINESS_SHOCK_TEXTS = [
  "a burst pipe closed the doors",
  "a key supplier collapsed",
  "a bad review cycle emptied the place",
  "a licensing dispute halted trade",
  "a competitor opened across the street",
];
/** The baseline return on capital every sector is built around. A venture running
 *  at exactly this success sells for 100% of the money invested in it. */
export const BUSINESS_BASELINE_ROI = 0.3;

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
/** One look at a tier. Same cost, same hours — only the name and the picture differ. */
export interface AssetLookDef {
  name: string;
  image: string;
}

export interface AssetTierDef {
  name: string;
  dailyCost: number;
  hoursBonus: number; // extra weekly hours this tier buys back (staff, services, convenience)
  image: string;
  benefit: string;
  /** Alternative looks at the same step. The tier's own name/image is look 0. */
  looks?: AssetLookDef[];
}

export interface AssetDef {
  id: string;
  name: string;
  category: string;
  tiers: AssetTierDef[];
}

/** Every look available at a step, the tier's own first. */
export function assetLooks(tier: AssetTierDef): AssetLookDef[] {
  return [{ name: tier.name, image: tier.image }, ...(tier.looks || [])];
}

/** The look chosen at a step, falling back to the first. */
export function assetLook(tier: AssetTierDef, lookIdx = 0): AssetLookDef {
  const all = assetLooks(tier);
  return all[lookIdx] || all[0];
}

export const ASSETS: AssetDef[] = [
  {
    id: "house", name: "Housing", category: "Home",
    tiers: [
      { name: "Shared Room", dailyCost: 34, hoursBonus: -3, image: "house-t1", benefit: "Costs you 3h a week — long commute, chores, queues for the bathroom",
        looks: [{ name: "Bunk in a Hostel", image: "house-t1b" }, { name: "Converted Garage", image: "house-t1c" }] },
      { name: "Studio Apartment", dailyCost: 72, hoursBonus: 2, image: "house-t2", benefit: "Buys back 2h a week — close in, building handles the basics",
        looks: [{ name: "Canal Houseboat", image: "house-t2b" }, { name: "Terrace Cottage", image: "house-t2c" }] },
      { name: "Modern Loft", dailyCost: 165, hoursBonus: 5, image: "house-t3", benefit: "Buys back 5h a week — doorman, cleaning and concierge",
        looks: [{ name: "Warehouse Conversion", image: "house-t3b" }, { name: "Garden Townhouse", image: "house-t3c" }] },
      { name: "Penthouse", dailyCost: 520, hoursBonus: 9, image: "house-t4", benefit: "Buys back 9h a week — a full household staff runs it all",
        looks: [{ name: "Cliffside Villa", image: "house-t4b" }, { name: "Historic Mansion", image: "house-t4c" }] },
      { name: "Country Estate", dailyCost: 2100, hoursBonus: 12, image: "house-t5", benefit: "Buys back 12h a week — an estate manager runs the whole household",
        looks: [{ name: "Alpine Chalet Estate", image: "house-t5b" }, { name: "Vineyard Château", image: "house-t5c" }] },
      { name: "Private Island Compound", dailyCost: 9400, hoursBonus: 15, image: "house-t6", benefit: "Buys back 15h a week — every errand, journey and chore is handled for you",
        looks: [{ name: "Desert Sky Residence", image: "house-t6b" }, { name: "Lakeside Palace", image: "house-t6c" }] },
    ],
  },
  {
    id: "food", name: "Food", category: "Daily life",
    tiers: [
      { name: "Simple Groceries", dailyCost: 12, hoursBonus: -2, image: "food-t1", benefit: "Costs you 2h a week — shopping, cooking and washing up",
        looks: [{ name: "Instant Noodles", image: "food-t1b" }, { name: "Canteen Trays", image: "food-t1c" }] },
      { name: "Fresh Home Cooking", dailyCost: 28, hoursBonus: 1, image: "food-t2", benefit: "Buys back 1h a week — deliveries and prepped ingredients",
        looks: [{ name: "Market Box Deliveries", image: "food-t2b" }, { name: "Street Food Circuit", image: "food-t2c" }] },
      { name: "Restaurant Dining", dailyCost: 82, hoursBonus: 3, image: "food-t3", benefit: "Buys back 3h a week — every meal handled elsewhere",
        looks: [{ name: "Neighbourhood Bistro Tab", image: "food-t3b" }, { name: "Sushi Counter Standing", image: "food-t3c" }] },
      { name: "Private Chef", dailyCost: 320, hoursBonus: 6, image: "food-t4", benefit: "Buys back 6h a week — a chef runs your kitchen",
        looks: [{ name: "Standing Chef's Table", image: "food-t4b" }, { name: "Household Cook", image: "food-t4c" }] },
      { name: "Private Dining Brigade", dailyCost: 1250, hoursBonus: 8, image: "food-t5", benefit: "Buys back 8h a week — a kitchen team plans, shops and cooks every meal",
        looks: [{ name: "Cellar & Tasting Room", image: "food-t5b" }, { name: "Coastal Catch Kitchen", image: "food-t5c" }] },
      { name: "Estate Culinary Team", dailyCost: 4800, hoursBonus: 10, image: "food-t6", benefit: "Buys back 10h a week — kitchen garden, cellar and chefs on call around the clock",
        looks: [{ name: "Kitchen Garden Estate", image: "food-t6b" }, { name: "Travelling Brigade", image: "food-t6c" }] },
    ],
  },
  {
    id: "wardrobe", name: "Clothing", category: "Presentation",
    tiers: [
      { name: "Thrifted Basics", dailyCost: 3, hoursBonus: -1, image: "wardrobe-t1", benefit: "Costs you 1h a week — laundry, repairs, nothing quite fits",
        looks: [{ name: "Work Uniform", image: "wardrobe-t1b" }, { name: "Hand-Me-Downs", image: "wardrobe-t1c" }] },
      { name: "High Street", dailyCost: 12, hoursBonus: 1, image: "wardrobe-t2", benefit: "Buys back 1h a week — easy wardrobe, little upkeep",
        looks: [{ name: "Workwear Denim", image: "wardrobe-t2b" }, { name: "Clean Minimal Basics", image: "wardrobe-t2c" }] },
      { name: "Tailored Wardrobe", dailyCost: 55, hoursBonus: 2, image: "wardrobe-t3", benefit: "Buys back 2h a week — a tailor keeps it all ready",
        looks: [{ name: "Vintage Collector", image: "wardrobe-t3b" }, { name: "Designer Streetwear", image: "wardrobe-t3c" }] },
      { name: "Bespoke Atelier", dailyCost: 180, hoursBonus: 4, image: "wardrobe-t4", benefit: "Buys back 4h a week — a stylist and valet service",
        looks: [{ name: "Savile Row House", image: "wardrobe-t4b" }, { name: "Avant-Garde Label", image: "wardrobe-t4c" }] },
      { name: "Couture Fittings", dailyCost: 720, hoursBonus: 5, image: "wardrobe-t5", benefit: "Buys back 5h a week — a house keeps your wardrobe fitted and ready",
        looks: [{ name: "Archive Couture", image: "wardrobe-t5b" }, { name: "Private Milliner & Cobbler", image: "wardrobe-t5c" }] },
      { name: "Private Wardrobe Hall", dailyCost: 2600, hoursBonus: 7, image: "wardrobe-t6", benefit: "Buys back 7h a week — a dressing team packs, styles and travels with you",
        looks: [{ name: "Costume Archive", image: "wardrobe-t6b" }, { name: "House Commission", image: "wardrobe-t6c" }] },
    ],
  },
  {
    id: "car", name: "Car", category: "Transport",
    tiers: [
      { name: "Used Sedan", dailyCost: 19, hoursBonus: -2, image: "car-t1", benefit: "Costs you 2h a week — breakdowns, repairs, slow going",
        looks: [{ name: "Rust-Belt Pickup", image: "car-t1b" }, { name: "City Scooter", image: "car-t1c" }] },
      { name: "Luxury Sedan", dailyCost: 48, hoursBonus: 2, image: "car-t2", benefit: "Buys back 2h a week — reliable, driver service on tap",
        looks: [{ name: "Electric Crossover", image: "car-t2b" }, { name: "Restored Classic", image: "car-t2c" }] },
      { name: "Sports Car", dailyCost: 165, hoursBonus: 5, image: "car-t3", benefit: "Buys back 5h a week — a driver handles the road",
        looks: [{ name: "Grand Tourer", image: "car-t3b" }, { name: "Off-Road Expedition Rig", image: "car-t3c" }] },
      { name: "Hypercar", dailyCost: 880, hoursBonus: 9, image: "car-t4", benefit: "Buys back 9h a week — chauffeur and fleet care included",
        looks: [{ name: "Armoured Limousine", image: "car-t4b" }, { name: "Le Mans Homologation", image: "car-t4c" }] },
      { name: "Collector's Garage", dailyCost: 3400, hoursBonus: 12, image: "car-t5", benefit: "Buys back 12h a week — a fleet and drivers on standby wherever you are",
        looks: [{ name: "Concours Vault", image: "car-t5b" }, { name: "Motor Yacht & Tender", image: "car-t5c" }] },
      { name: "Private Aviation", dailyCost: 14000, hoursBonus: 15, image: "car-t6", benefit: "Buys back 15h a week — jet, helicopter and cars waiting at both ends",
        looks: [{ name: "Long-Range Fleet", image: "car-t6b" }, { name: "Helipad & Hangar", image: "car-t6c" }] },
    ],
  },
  {
    id: "health", name: "Health & Fitness", category: "Wellbeing",
    tiers: [
      { name: "No Routine", dailyCost: 0, hoursBonus: -4, image: "health-t1", benefit: "Costs you 4h a week — low energy and days lost to illness",
        looks: [{ name: "Late Nights", image: "health-t1b" }, { name: "Desk-Bound", image: "health-t1c" }] },
      { name: "Gym Membership", dailyCost: 9, hoursBonus: 1, image: "health-t2", benefit: "Buys back 1h a week — steadier energy through the day",
        looks: [{ name: "Running Club", image: "health-t2b" }, { name: "Boxing Gym", image: "health-t2c" }] },
      { name: "Personal Trainer", dailyCost: 95, hoursBonus: 4, image: "health-t3", benefit: "Buys back 4h a week — training, physio and check-ups handled",
        looks: [{ name: "Climbing & Swim Coach", image: "health-t3b" }, { name: "Yoga & Physio Studio", image: "health-t3c" }] },
      { name: "Full Wellness Team", dailyCost: 420, hoursBonus: 8, image: "health-t4", benefit: "Buys back 8h a week — doctor, chef and recovery team on call",
        looks: [{ name: "Performance Lab", image: "health-t4b" }, { name: "Alpine Retreat Programme", image: "health-t4c" }] },
      { name: "Home Recovery Suite", dailyCost: 1600, hoursBonus: 10, image: "health-t5", benefit: "Buys back 10h a week — gym, pool and therapists all under your own roof",
        looks: [{ name: "Private Bathhouse", image: "health-t5b" }, { name: "Cryo & Altitude Wing", image: "health-t5c" }] },
      { name: "Longevity Programme", dailyCost: 6200, hoursBonus: 13, image: "health-t6", benefit: "Buys back 13h a week — a medical team keeps you at full energy every day",
        looks: [{ name: "Private Clinic", image: "health-t6b" }, { name: "Research Protocol", image: "health-t6c" }] },
    ],
  },
  {
    id: "watch", name: "Watch", category: "Accessories",
    tiers: [
      { name: "Digital Watch", dailyCost: 1, hoursBonus: 0, image: "watch-t1", benefit: "No time bought back — it tells the time, that is all",
        looks: [{ name: "Field Quartz", image: "watch-t1b" }, { name: "Plastic Diver", image: "watch-t1c" }] },
      { name: "Automatic Movement", dailyCost: 6, hoursBonus: 1, image: "watch-t2", benefit: "Buys back 1h a week — club and concierge access",
        looks: [{ name: "Pilot's Automatic", image: "watch-t2b" }, { name: "Dress Automatic", image: "watch-t2c" }] },
      { name: "Luxury Chronograph", dailyCost: 28, hoursBonus: 2, image: "watch-t3", benefit: "Buys back 2h a week — a concierge runs your errands",
        looks: [{ name: "Steel Sports Icon", image: "watch-t3b" }, { name: "Gold Dress Watch", image: "watch-t3c" }] },
      { name: "Haute Horlogerie", dailyCost: 140, hoursBonus: 4, image: "watch-t4", benefit: "Buys back 4h a week — a personal assistant on call",
        looks: [{ name: "Skeleton Tourbillon", image: "watch-t4b" }, { name: "Platinum Perpetual", image: "watch-t4c" }] },
      { name: "Grand Complication", dailyCost: 620, hoursBonus: 5, image: "watch-t5", benefit: "Buys back 5h a week — doors open and an assistant clears your diary",
        looks: [{ name: "Minute Repeater", image: "watch-t5b" }, { name: "Astronomical Calendar", image: "watch-t5c" }] },
      { name: "Private Collection", dailyCost: 2400, hoursBonus: 7, image: "watch-t6", benefit: "Buys back 7h a week — a chief of staff runs your calendar",
        looks: [{ name: "Auction Vault", image: "watch-t6b" }, { name: "Commissioned Unique Piece", image: "watch-t6c" }] },
    ],
  },
];

export const WARDROBE_BUSINESS_BONUS = [0, 0.04, 0.09, 0.16, 0.22, 0.3];
export const WATCH_INVEST_BONUS = [0, 0.04, 0.09, 0.16, 0.22, 0.3];

// ---------- Investments ----------
/** Who a fund will take money from. */
export type InvestorAccess = "open" | "accredited" | "qualified" | "institutional";

export const INVESTOR_ACCESS: Record<InvestorAccess, { label: string; netWorth: number; note: string }> = {
  open: { label: "Open to anyone", netWorth: 0, note: "Anyone can put money in." },
  accredited: { label: "Accredited investors", netWorth: 1000000, note: "Requires a net worth of $1M." },
  qualified: { label: "Qualified purchasers", netWorth: 5000000, note: "Requires a net worth of $5M." },
  institutional: { label: "Institutional only", netWorth: 100000000, note: "Requires a net worth of $100M." },
};

export interface InvestmentDef {
  id: string;
  name: string;
  description: string;
  minInvestment: number;
  annualReturn: number;
  annualVolatility: number;
  /** No published return: each holding quietly finds its own pace. */
  unknownReturn?: boolean;
  /** Spread of that hidden pace around the class average. */
  driftSpread?: number;
  /** Roughly how long a hidden pace holds before the market turns. */
  regimeDays?: number;
  /** Cost of getting in and out, as a share — stops buying and selling to fish for a good run. */
  tradeSpread?: number;
  risk: string;
  access: InvestorAccess;
  lockupDays?: number; // money put in cannot come out until this many days have passed
}

export const INVESTMENTS: InvestmentDef[] = [
  { id: "savings", name: "Savings Account", description: "FDIC-safe. 2.0% a year, never moves.", minInvestment: 250, annualReturn: 0.02, annualVolatility: 0, risk: "None", access: "open" },
  { id: "bonds", name: "Treasury Bonds", description: "4.5% a year, barely wobbles.", minInvestment: 5000, annualReturn: 0.045, annualVolatility: 0.02, risk: "Low", access: "open" },
  { id: "index", name: "Index Fund", description: "9% in a typical year. It will dip.", minInvestment: 2500, annualReturn: 0.09, annualVolatility: 0.16, risk: "Moderate", access: "open" },
  { id: "crypto", name: "Digital Assets", description: "Nobody will tell you what it returns. Your holding finds its own pace, and the market turns every few years.", minInvestment: 1000, annualReturn: 0.24, annualVolatility: 0.42, risk: "Very High", access: "open", unknownReturn: true, driftSpread: 0.3, regimeDays: 730, tradeSpread: 0.02 },
  { id: "realestate", name: "Real Estate Fund", description: "12% a year. Your money sits for half a year.", minInvestment: 150000, annualReturn: 0.12, annualVolatility: 0.2, risk: "Moderate-High", access: "accredited", lockupDays: 180 },
  { id: "art", name: "Art & Collectibles", description: "14% a year, and it sells when it sells.", minInvestment: 2000000, annualReturn: 0.14, annualVolatility: 0.25, risk: "Moderate-High", access: "accredited", lockupDays: 365 },
  { id: "pe", name: "Private Equity", description: "22% a year. Locked up, leveraged.", minInvestment: 20000000, annualReturn: 0.22, annualVolatility: 0.3, risk: "High", access: "qualified", lockupDays: 1095 },
  { id: "vc", name: "Venture Capital", description: "35% in a typical year. Mostly zeros and one rocket.", minInvestment: 100000000, annualReturn: 0.35, annualVolatility: 0.38, risk: "Extreme", access: "qualified", lockupDays: 1460 },
  { id: "sovereign", name: "Sovereign Wealth Portfolio", description: "11% a year on an enormous base. Calm at scale.", minInvestment: 1000000000, annualReturn: 0.11, annualVolatility: 0.09, risk: "Low", access: "institutional", lockupDays: 730 },
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
  gateAsset?: string;       // you own this lifestyle category
  // effects
  cashPctOfNetWorth?: number; // + or -
  cashFlat?: number;          // scaled by era via multiplier below
  businessBoostDays?: number; // days of doubled business profit
  livingCostShiftDays?: number;
  livingCostShift?: number;   // multiplier on living costs while active
  payShift?: number;          // multiplier on salary while active
  payShiftDays?: number;
  jobLoss?: boolean;
}

export const EVENTS: EventDef[] = [
  { id: "inherit", title: "An uncle's estate closes", text: "The executor found your name in the will and transferred your share of the estate.", tone: "good", weight: 3, minDay: 120, cashPctOfNetWorth: 0.12, cashFlat: 4000 },
  { id: "bonus", title: "Quarterly bonus", text: "Your team beat its quarterly target, and payroll added a one-time performance bonus.", tone: "good", weight: 8, cashFlat: 900 },
  { id: "raise", title: "Retention raise", text: "A senior colleague resigned, so your employer raised your pay to keep you from following.", tone: "good", weight: 6, payShift: 1.15, payShiftDays: 120 },
  { id: "boom", title: "A review goes viral", text: "A customer video takes off overnight, and your business spends two weeks handling the rush.", tone: "good", weight: 8, gateBusiness: true, businessBoostDays: 14 },
  { id: "headhunt", title: "Recruiter calls your boss", text: "A recruiter asks for a reference. Your employer counters with a temporary retention package.", tone: "good", weight: 6, payShift: 1.1, payShiftDays: 90 },
  { id: "rentspike", title: "Lease renewal lands", text: "Your landlord renews at a sharply higher rate after property taxes rise in the neighbourhood.", tone: "bad", weight: 8, livingCostShift: 1.3, livingCostShiftDays: 180 },
  { id: "rentdrop", title: "Insurance premium drops", text: "A clean claims record and lower local rates reduce your household costs for the next few months.", tone: "good", weight: 5, livingCostShift: 0.8, livingCostShiftDays: 150 },
  { id: "medical", title: "Emergency appendectomy", text: "A late-night trip to the emergency room ends in surgery and a hospital invoice.", tone: "bad", weight: 5, cashFlat: -1200, cashPctOfNetWorth: -0.02 },
  { id: "dental", title: "Cracked molar", text: "A cracked tooth needs a crown before it becomes a root canal.", tone: "bad", weight: 3, cashFlat: -650, cashPctOfNetWorth: -0.006 },
  { id: "caraccident", title: "Car accident", text: "A driver runs a red light. Nobody is hurt, but you owe the insurance deductible and towing bill.", tone: "bad", weight: 4, gateAsset: "car", cashFlat: -900, cashPctOfNetWorth: -0.008 },
  { id: "hvac", title: "HVAC compressor fails", text: "The air conditioning dies during a heat wave. The compressor and emergency callout are on you.", tone: "bad", weight: 4, gateAsset: "house", cashFlat: -850, cashPctOfNetWorth: -0.008 },
  { id: "pipe", title: "Pipe bursts upstairs", text: "A supply line splits overnight, damaging the ceiling before the shutoff valve is found.", tone: "bad", weight: 3, gateAsset: "house", cashFlat: -1100, cashPctOfNetWorth: -0.01 },
  { id: "paycut", title: "Department budget cut", text: "A major contract is cancelled, and your department takes a temporary salary reduction.", tone: "bad", weight: 4, payShift: 0.85, payShiftDays: 120, minDay: 60 },
  { id: "layoff", title: "Office consolidation", text: "Two departments merge and your position is eliminated. Your next role starts one rung lower.", tone: "bad", weight: 2, minDay: 200, jobLoss: true },
  { id: "audit", title: "Tax audit adjustment", text: "An expense deduction is disallowed, leaving back tax, interest and an accountant's invoice.", tone: "bad", weight: 4, minDay: 150, cashPctOfNetWorth: -0.04 },
  { id: "award", title: "Trade association award", text: "Your business wins operator of the year, and the local press sends customers your way.", tone: "good", weight: 5, minDay: 150, gateBusiness: true, businessBoostDays: 21 },
  { id: "lawsuit", title: "Slip-and-fall settlement", text: "A customer injury claim settles after your insurer applies the policy deductible.", tone: "bad", weight: 3, minDay: 250, gateBusiness: true, cashPctOfNetWorth: -0.05 },
  { id: "refund", title: "Utility billing refund", text: "A faulty meter overcharged you for months. The utility returns the difference with interest.", tone: "good", weight: 7, cashFlat: 600, cashPctOfNetWorth: 0.01 },
  { id: "mentor", title: "A mentor takes an interest", text: "Someone senior starts telling you how things actually work — and makes sure you're paid for it.", tone: "good", weight: 6, payShift: 1.08, payShiftDays: 150 },
  { id: "referral", title: "Word of mouth", text: "A regular brought everyone they know.", tone: "good", weight: 7, gateBusiness: true, businessBoostDays: 10 },
  { id: "windfall", title: "Former employer is acquired", text: "A forgotten employee share grant is cashed out when your old employer is bought.", tone: "good", weight: 4, minDay: 180, cashPctOfNetWorth: 0.08, cashFlat: 2500 },
  { id: "press", title: "Flattering write-up", text: "A journalist needed a story and you were it.", tone: "good", weight: 5, minDay: 120, gateBusiness: true, businessBoostDays: 18 },
  { id: "equity", title: "Vesting cliff", text: "Equity from an old contract finally vested.", tone: "good", weight: 4, minDay: 220, gateJobIndex: 10, cashPctOfNetWorth: 0.06, cashFlat: 3000 },
  { id: "spacedividend", title: "Space dividend", text: "The space company you hold paid a huge special dividend ahead of its first orbital run.", tone: "good", weight: 6, minDay: 300, gateInvested: 50000, cashPctOfNetWorth: 0.08 },
  { id: "patent", title: "Patent licensed", text: "A larger company licensed the method behind your flagship product.", tone: "good", weight: 5, minDay: 240, gateBusiness: true, cashPctOfNetWorth: 0.06 },
  { id: "supplier", title: "Supplier locked in", text: "You signed supplies at last year's prices the week before they jumped.", tone: "good", weight: 5, minDay: 120, gateBusiness: true, businessBoostDays: 21 },
  { id: "vip", title: "A very regular guest", text: "Someone famous keeps booking the whole place and brings an entourage.", tone: "good", weight: 4, minDay: 200, gateBusiness: true, businessBoostDays: 14 },
  { id: "speaking", title: "Keynote invitation", text: "A conference pays handsomely just for telling your story.", tone: "good", weight: 4, minDay: 300, gateJobIndex: 8, cashPctOfNetWorth: 0.02 },
  { id: "alumni", title: "Alumni network", text: "A classmate steers a client your way and vouches for you.", tone: "good", weight: 5, minDay: 240, gateMajor: true, cashPctOfNetWorth: 0.03 },
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

/** Artwork key for a venture at a given stage, in the city it trades in. */
export function ventureImageAtTier(businessId: string, tierIdx: number, choices?: Record<string, string>): string {
  const concept = getBusinessConcept(businessId, choices?.concept || "");
  if (!concept) return "";
  const stage = `t${tierIdx + 1}`;
  const location = getBusinessLocation(businessId, choices?.location || "");
  const others = (BUSINESS_LOCATIONS[businessId] || []).map((l) => `${concept.image}-${l.id}-${stage}`);
  return pickImage(
    location ? `${concept.image}-${location.id}-${stage}` : "",
    ...others,
    `${concept.image}-${stage}`,
    concept.image,
  );
}

/** How much of the sale price you actually walk away with. */


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

// ---------- Time ----------
/**
 * Waking hours you can actually direct in a week before lifestyle and career are
 * taken into account. A bare-bones life spends a chunk of it on chores and commuting.
 */
export const BASE_TIME_BUDGET = 52;

// ---------- Student loans ----------
export const STUDENT_LOAN_RATE = 0.06;          // annual interest
export const STUDENT_LOAN_TERM_DAYS = 3650;     // repaid over ten years
export const STUDENT_LOAN_GRACE_DAYS = 180;     // nothing due until six months after you finish
/** The most you can owe in student debt, by the highest level of study you have reached. */
export const STUDENT_LOAN_CAPS = [30000, 120000, 400000];
export function studentLoanCap(highestLevel: number): number {
  return STUDENT_LOAN_CAPS[Math.max(0, Math.min(2, highestLevel - 1))] ?? STUDENT_LOAN_CAPS[0];
}
