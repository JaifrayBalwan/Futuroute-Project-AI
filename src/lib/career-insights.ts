import type { Career, Industry } from "./career-types";

export type CurrencyCode = "INR" | "USD" | "GBP" | "EUR";

export const CURRENCY_META: Record<
  CurrencyCode,
  { symbol: string; label: string; rateFromInr: number }
> = {
  INR: { symbol: "₹", label: "INR (₹)", rateFromInr: 1 },
  USD: { symbol: "$", label: "USD ($)", rateFromInr: 1 / 84.5 },
  GBP: { symbol: "£", label: "GBP (£)", rateFromInr: 1 / 107 },
  EUR: { symbol: "€", label: "EUR (€)", rateFromInr: 1 / 91 },
};

export type DifficultyOfEntry = "Beginner-friendly" | "Moderate" | "Highly competitive";
export type DemandTrend = "Growing" | "Stable" | "Declining or uncertain";

export type CareerInsight = {
  // India annual ranges in INR (e.g. 450000 = ₹4.5L)
  indiaEntryInr: [number, number];
  indiaMidInr: [number, number];
  indiaExperiencedInr: [number, number];
  // Abroad annual ranges in USD (e.g. 65000 = $65k)
  abroadEntryUsd: [number, number];
  abroadMidUsd: [number, number];
  abroadExperiencedUsd: [number, number];
  compensationStructure: {
    baseNote: string;
    variableNote: string;
    freelanceNote: string;
    selfEmploymentNote: string;
  };
  educationCostInr: [number, number];
  educationCostSummary: string;
  employabilityMonths: [number, number];
  employabilityNote: string;
  difficultyOfEntry: DifficultyOfEntry;
  difficultyExplanation: string;
  jobOpportunities: {
    hiringIndustries: string[];
    typicalTitles: string[];
    sectors: string[];
    remotePossibility: "High remote availability" | "Hybrid common" | "Primarily on-site";
    freelanceAvailability: string;
  };
  futureDemand: {
    trend: DemandTrend;
    timeframe: string;
    outlookNote: string;
    source: string;
  };
  salarySource: string;
  salaryPeriod: string;
};

type IndustryBaseline = {
  entryInr: [number, number];
  midInr: [number, number];
  expInr: [number, number];
  entryUsd: [number, number];
  midUsd: [number, number];
  expUsd: [number, number];
  eduCostInr: [number, number];
  eduSummary: string;
  months: [number, number];
  trend: DemandTrend;
  remote: CareerInsight["jobOpportunities"]["remotePossibility"];
  sectors: string[];
  hiring: string[];
  source: string;
};

const INDUSTRY_BASELINES: Record<Industry, IndustryBaseline> = {
  "Technology & IT": {
    entryInr: [400_000, 900_000],
    midInr: [1_000_000, 2_200_000],
    expInr: [2_400_000, 4_800_000],
    entryUsd: [62_000, 95_000],
    midUsd: [100_000, 150_000],
    expUsd: [155_000, 230_000],
    eduCostInr: [0, 450_000],
    eduSummary: "₹0 (self-taught + open courses) up to ₹4.5L+ for private B.Tech/BCA degrees",
    months: [4, 12],
    trend: "Growing",
    remote: "High remote availability",
    sectors: ["Private tech companies", "Startups", "SaaS & IT services", "Global remote teams"],
    hiring: ["Software & SaaS", "FinTech", "E-commerce", "Enterprise IT"],
    source: "NASSCOM Tech Skills Report & AmbitionBox India / U.S. BLS (2025–2026)",
  },
  "Artificial Intelligence": {
    entryInr: [550_000, 1_200_000],
    midInr: [1_400_000, 3_000_000],
    expInr: [3_000_000, 6_000_000],
    entryUsd: [78_000, 118_000],
    midUsd: [125_000, 180_000],
    expUsd: [185_000, 270_000],
    eduCostInr: [0, 600_000],
    eduSummary: "₹0 (open Kaggle/Hugging Face tracks) to ₹6L+ for B.Tech/M.Tech AI programs",
    months: [6, 18],
    trend: "Growing",
    remote: "High remote availability",
    sectors: ["AI product firms", "R&D labs", "Cloud platforms", "Healthcare & FinTech AI"],
    hiring: ["AI & Data Platforms", "Cloud Infrastructure", "Autonomous & Robotics", "Analytics"],
    source: "WEF Future of Jobs & AmbitionBox India / U.S. BLS (2025–2026)",
  },
  Sports: {
    entryInr: [240_000, 550_000],
    midInr: [600_000, 1_400_000],
    expInr: [1_400_000, 3_200_000],
    entryUsd: [35_000, 58_000],
    midUsd: [60_000, 95_000],
    expUsd: [95_000, 165_000],
    eduCostInr: [5_000, 350_000],
    eduSummary:
      "₹5k–₹40k for federation licenses (AIFF/NIS); ₹1.5L–₹3.5L for B.P.Ed/Sports Science",
    months: [4, 15],
    trend: "Growing",
    remote: "Primarily on-site",
    sectors: ["Academies & clubs", "Sports federations", "Fitness brands", "Sports analytics tech"],
    hiring: [
      "Football & Cricket Academies",
      "Pro Leagues",
      "Sports Tech",
      "Schools & Universities",
    ],
    source: "SAI / Khelo India Industry Briefs & Sports Tech Outlook (2025–2026)",
  },
  Healthcare: {
    entryInr: [350_000, 800_000],
    midInr: [850_000, 1_900_000],
    expInr: [1_800_000, 4_200_000],
    entryUsd: [52_000, 85_000],
    midUsd: [85_000, 145_000],
    expUsd: [150_000, 260_000],
    eduCostInr: [50_000, 1_800_000],
    eduSummary:
      "₹50k–₹3L in govt colleges (NEET/allied health) up to ₹15L+ in private institutions",
    months: [12, 48],
    trend: "Growing",
    remote: "Primarily on-site",
    sectors: ["Public & private hospitals", "Clinics", "Public health NGOs", "Digital health"],
    hiring: ["Hospital Networks", "Diagnostics & Rehab", "Public Health", "HealthTech"],
    source: "National Health Authority Reports & U.S. BLS Healthcare Outlook (2025–2026)",
  },
  "Business & Management": {
    entryInr: [400_000, 850_000],
    midInr: [1_000_000, 2_200_000],
    expInr: [2_200_000, 4_800_000],
    entryUsd: [55_000, 82_000],
    midUsd: [90_000, 140_000],
    expUsd: [145_000, 225_000],
    eduCostInr: [5_000, 1_200_000],
    eduSummary: "₹5k–₹1.5L for BBA/B.Com in public universities; ₹4L–₹20L for premier MBA programs",
    months: [4, 15],
    trend: "Stable",
    remote: "Hybrid common",
    sectors: ["Corporates", "Consulting firms", "Startups", "Operations & retail"],
    hiring: ["Consulting", "Consumer Goods & Retail", "SaaS Startups", "Manufacturing"],
    source: "AICTE Management Placement Benchmarks & U.S. BLS (2025–2026)",
  },
  Finance: {
    entryInr: [450_000, 1_000_000],
    midInr: [1_200_000, 2_600_000],
    expInr: [2_500_000, 5_500_000],
    entryUsd: [62_000, 95_000],
    midUsd: [100_000, 155_000],
    expUsd: [160_000, 250_000],
    eduCostInr: [15_000, 800_000],
    eduSummary: "₹15k–₹1.5L (B.Com/CA/NISM tracks) up to ₹8L+ for CFA/MBA Finance pathways",
    months: [6, 24],
    trend: "Growing",
    remote: "Hybrid common",
    sectors: ["Banks & NBFCs", "Investment & wealth firms", "FinTech", "Corporate treasury"],
    hiring: ["Banking & Markets", "FinTech", "Audit & Advisory", "Insurance"],
    source: "AmbitionBox Finance Benchmarks & U.S. BLS Financial Analysts (2025–2026)",
  },
  Law: {
    entryInr: [360_000, 900_000],
    midInr: [900_000, 2_200_000],
    expInr: [2_200_000, 5_000_000],
    entryUsd: [60_000, 98_000],
    midUsd: [105_000, 165_000],
    expUsd: [170_000, 260_000],
    eduCostInr: [40_000, 1_200_000],
    eduSummary: "₹40k–₹3L for govt LL.B colleges; ₹6L–₹15L+ for 5-year NLU / private BA-LL.B",
    months: [18, 60],
    trend: "Stable",
    remote: "Hybrid common",
    sectors: ["Law firms", "In-house corporate legal", "Independent litigation", "Policy bodies"],
    hiring: ["Corporate Law Firms", "Tech Compliance & IP", "Courts & Chambers", "Public Policy"],
    source: "Bar Council of India Career Guides & U.S. BLS Legal Outlook (2025–2026)",
  },
  "Science & Research": {
    entryInr: [350_000, 750_000],
    midInr: [800_000, 1_600_000],
    expInr: [1_600_000, 3_400_000],
    entryUsd: [52_000, 78_000],
    midUsd: [82_000, 125_000],
    expUsd: [130_000, 195_000],
    eduCostInr: [15_000, 500_000],
    eduSummary:
      "₹15k–₹1.2L in public B.Sc/M.Sc (with CSIR/GATE fellowships for PhD); ₹3L–₹5L private",
    months: [12, 36],
    trend: "Growing",
    remote: "Primarily on-site",
    sectors: ["R&D institutes", "Biotech & Pharma", "Universities", "Deep-tech labs"],
    hiring: ["CSIR/ISRO/DRDO Labs", "Biotech & Life Sciences", "Materials & Energy", "Academia"],
    source: "DST India R&D Indicators & U.S. BLS Life/Physical Scientists (2025–2026)",
  },
  "Creative Arts": {
    entryInr: [240_000, 550_000],
    midInr: [600_000, 1_300_000],
    expInr: [1_300_000, 2_800_000],
    entryUsd: [38_000, 58_000],
    midUsd: [62_000, 95_000],
    expUsd: [95_000, 155_000],
    eduCostInr: [0, 400_000],
    eduSummary:
      "₹0 (self-paced open portfolio tools like Blender/Krita) up to ₹4L for BFA/diplomas",
    months: [3, 12],
    trend: "Stable",
    remote: "High remote availability",
    sectors: ["Studios & agencies", "Publishing & gaming", "Independent freelancing", "Education"],
    hiring: [
      "Animation & Game Studios",
      "Media Agencies",
      "Publishing Houses",
      "Creators & Brands",
    ],
    source: "FICCI-EY Media Report & Creative Sector Benchmarks (2025–2026)",
  },
  Design: {
    entryInr: [380_000, 850_000],
    midInr: [950_000, 2_000_000],
    expInr: [2_000_000, 4_200_000],
    entryUsd: [56_000, 86_000],
    midUsd: [92_000, 138_000],
    expUsd: [140_000, 205_000],
    eduCostInr: [0, 600_000],
    eduSummary: "₹0 (Figma + open UX case studies) to ₹6L+ for B.Des/NID/private design schools",
    months: [4, 12],
    trend: "Growing",
    remote: "High remote availability",
    sectors: ["Product tech companies", "Design studios", "E-commerce", "Freelance consulting"],
    hiring: ["SaaS & Consumer Apps", "Digital Agencies", "Consumer Hardware", "FinTech"],
    source: "DesignIndia Insights & AmbitionBox UX/Product Benchmarks (2025–2026)",
  },
  "Media & Entertainment": {
    entryInr: [280_000, 600_000],
    midInr: [650_000, 1_500_000],
    expInr: [1_500_000, 3_400_000],
    entryUsd: [40_000, 65_000],
    midUsd: [68_000, 108_000],
    expUsd: [110_000, 180_000],
    eduCostInr: [0, 450_000],
    eduSummary:
      "₹0 (open digital storytelling & audio tools) to ₹4.5L for mass communication degrees",
    months: [3, 12],
    trend: "Stable",
    remote: "Hybrid common",
    sectors: ["Digital publications", "OTT & broadcast", "Creator studios", "PR agencies"],
    hiring: ["Digital Newsrooms", "Streaming & Podcasts", "Sports Media", "Brand Content Teams"],
    source: "FICCI-EY Media & Entertainment Report (2025–2026)",
  },
  Education: {
    entryInr: [260_000, 550_000],
    midInr: [550_000, 1_200_000],
    expInr: [1_100_000, 2_400_000],
    entryUsd: [42_000, 62_000],
    midUsd: [60_000, 90_000],
    expUsd: [88_000, 135_000],
    eduCostInr: [15_000, 250_000],
    eduSummary: "₹15k–₹1.2L for public B.Ed/M.Ed; EdTech curriculum tracks start ₹0 online",
    months: [6, 24],
    trend: "Growing",
    remote: "Hybrid common",
    sectors: ["Schools & colleges", "EdTech platforms", "Corporate L&D", "Special education"],
    hiring: ["K-12 & Higher Ed", "EdTech Startups", "Skill Academies", "Corporate Learning Teams"],
    source: "Ministry of Education AISHE & U.S. BLS Education Outlook (2025–2026)",
  },
  Government: {
    entryInr: [420_000, 820_000],
    midInr: [850_000, 1_500_000],
    expInr: [1_500_000, 2_800_000],
    entryUsd: [48_000, 72_000],
    midUsd: [75_000, 112_000],
    expUsd: [115_000, 170_000],
    eduCostInr: [5_000, 250_000],
    eduSummary:
      "₹5k–₹60k for public bachelor's + exam fees (optional test prep coaching ₹30k–₹1.5L)",
    months: [12, 36],
    trend: "Stable",
    remote: "Primarily on-site",
    sectors: [
      "Central & state ministries",
      "Municipal administration",
      "Public sector undertakings",
    ],
    hiring: ["Civil & Administrative Services", "Policy Think Tanks", "Public Sector Utilities"],
    source: "7th/8th Pay Commission Grade Benchmarks & NCS India (2025–2026)",
  },
  Defence: {
    entryInr: [600_000, 1_050_000],
    midInr: [1_100_000, 1_900_000],
    expInr: [1_900_000, 3_400_000],
    entryUsd: [45_000, 72_000],
    midUsd: [75_000, 118_000],
    expUsd: [120_000, 185_000],
    eduCostInr: [0, 100_000],
    eduSummary:
      "NDA/CDS/AFCAT academy training is government-funded once selected; exam/fitness prep minimal",
    months: [12, 36],
    trend: "Stable",
    remote: "Primarily on-site",
    sectors: ["Armed forces", "Coast guard & paramilitary", "Defence R&D & cyber defence"],
    hiring: ["Indian Army / Navy / Air Force", "Cyber Defence Wings", "Aerospace & Defence Labs"],
    source: "Join Indian Army/Navy/IAF Officer Pay Matrix & Official Notices (2025–2026)",
  },
  Environment: {
    entryInr: [320_000, 680_000],
    midInr: [750_000, 1_600_000],
    expInr: [1_600_000, 3_400_000],
    entryUsd: [50_000, 76_000],
    midUsd: [78_000, 120_000],
    expUsd: [125_000, 185_000],
    eduCostInr: [10_000, 400_000],
    eduSummary: "₹10k–₹1L in state universities; free ESG & climate policy modules on UN CC:Learn",
    months: [6, 24],
    trend: "Growing",
    remote: "Hybrid common",
    sectors: [
      "ESG & sustainability consulting",
      "Renewable energy",
      "Conservation NGOs",
      "Gov agencies",
    ],
    hiring: ["Clean Energy Firms", "ESG Audit Teams", "Environmental Agencies", "Climate Tech"],
    source: "ILO Green Jobs Outlook & WEF Sustainability Skills Brief (2025–2026)",
  },
  Hospitality: {
    entryInr: [240_000, 500_000],
    midInr: [550_000, 1_250_000],
    expInr: [1_250_000, 2_800_000],
    entryUsd: [36_000, 56_000],
    midUsd: [58_000, 92_000],
    expUsd: [95_000, 155_000],
    eduCostInr: [20_000, 450_000],
    eduSummary: "₹20k–₹3L for IHM/hospitality diplomas; on-the-job apprenticeships often paid",
    months: [3, 12],
    trend: "Growing",
    remote: "Primarily on-site",
    sectors: ["Hotels & resorts", "Airlines & travel platforms", "Events & culinary ventures"],
    hiring: ["Hospitality Chains", "Travel Tech", "Aviation & Cruise", "Event Management"],
    source: "Ministry of Tourism & Hospitality Sector Skill Council (2025–2026)",
  },
  Engineering: {
    entryInr: [400_000, 880_000],
    midInr: [950_000, 2_000_000],
    expInr: [2_000_000, 4_200_000],
    entryUsd: [64_000, 90_000],
    midUsd: [95_000, 142_000],
    expUsd: [145_000, 210_000],
    eduCostInr: [50_000, 800_000],
    eduSummary:
      "₹50k–₹3L in govt engineering/polytechnic colleges up to ₹8L+ in private universities",
    months: [12, 48],
    trend: "Stable",
    remote: "Hybrid common",
    sectors: ["Infrastructure & manufacturing", "EV & energy", "Aerospace & robotics", "EPC firms"],
    hiring: [
      "Automotive & EV",
      "Infrastructure & Construction",
      "Energy & Power",
      "Industrial Mfg",
    ],
    source: "AICTE Engineering Placement Insights & U.S. BLS Engineering (2025–2026)",
  },
  Entrepreneurship: {
    entryInr: [180_000, 750_000],
    midInr: [800_000, 2_400_000],
    expInr: [2_000_000, 6_000_000],
    entryUsd: [42_000, 85_000],
    midUsd: [85_000, 160_000],
    expUsd: [150_000, 300_000],
    eduCostInr: [0, 350_000],
    eduSummary:
      "₹0 (open startup playbooks & incubators) + variable initial prototype/registration capital",
    months: [3, 18],
    trend: "Growing",
    remote: "High remote availability",
    sectors: [
      "Early-stage startups",
      "D2C & local services",
      "Venture studios",
      "Product operations",
    ],
    hiring: ["Tech & Consumer Startups", "Venture Incubators", "Self-founded Businesses"],
    source: "DPIIT Startup India Brief & Global Entrepreneurship Monitor (2025–2026)",
  },
  Agriculture: {
    entryInr: [260_000, 560_000],
    midInr: [600_000, 1_300_000],
    expInr: [1_300_000, 2_600_000],
    entryUsd: [44_000, 66_000],
    midUsd: [68_000, 102_000],
    expUsd: [105_000, 155_000],
    eduCostInr: [10_000, 300_000],
    eduSummary:
      "₹10k–₹1.2L in public State Agricultural Universities (SAUs); FAO/SWAYAM modules free",
    months: [6, 24],
    trend: "Growing",
    remote: "Primarily on-site",
    sectors: ["AgriTech startups", "Food processing", "FPOs & cooperatives", "Rural banking"],
    hiring: ["AgriTech Firms", "Dairy & Food Processing", "Seed & Crop Science", "Rural Advisory"],
    source: "ICAR Career Compendium & FAO Agri-Food Outlook (2025–2026)",
  },
  "Social Sciences": {
    entryInr: [280_000, 620_000],
    midInr: [650_000, 1_450_000],
    expInr: [1_400_000, 2_800_000],
    entryUsd: [44_000, 68_000],
    midUsd: [70_000, 108_000],
    expUsd: [110_000, 165_000],
    eduCostInr: [10_000, 350_000],
    eduSummary: "₹10k–₹1L in public BA/MA universities; up to ₹3.5L for specialized MA/M.Phil",
    months: [6, 24],
    trend: "Stable",
    remote: "Hybrid common",
    sectors: ["Policy think tanks", "UX/Market research", "NGOs & UN agencies", "Hospitals & HR"],
    hiring: ["Policy Institutes", "UX & Consumer Insights", "Development Sector", "Education"],
    source: "TISS / Public Policy Placement Reports & U.S. BLS Social Science (2025–2026)",
  },
};

// Soft skill vocabulary used to cleanly separate Career.skills into technical vs soft skills.
const SOFT_SKILL_PATTERNS = [
  "communication",
  "leadership",
  "empathy",
  "teamwork",
  "writing",
  "storytelling",
  "negotiation",
  "patience",
  "listening",
  "presentation",
  "public speaking",
  "critical thinking",
  "problem",
  "observation",
  "mentoring",
  "coaching",
  "time management",
  "stakeholder",
  "ethics",
  "adaptability",
  "collaboration",
  "decision",
  "calmness",
  "persuasion",
  "cultural",
  "creativity",
  "interpersonal",
  "client",
];

export function splitSkills(career: Career): { technical: string[]; soft: string[] } {
  const technical: string[] = [];
  const soft: string[] = [];

  for (const s of career.skills) {
    const low = s.toLowerCase();
    if (SOFT_SKILL_PATTERNS.some((p) => low.includes(p))) {
      soft.push(s);
    } else {
      technical.push(s);
    }
  }

  // Supplement soft skills from capabilities if the career tuple only listed technical skills
  if (soft.length === 0) {
    for (const cap of career.capabilities.slice(0, 3)) {
      const pretty = cap.replace(/_/g, " ");
      const capTitle = pretty.charAt(0).toUpperCase() + pretty.slice(1);
      if (!soft.includes(capTitle)) soft.push(capTitle);
    }
  }

  return {
    technical: technical.length ? technical : career.skills.slice(0, 3),
    soft,
  };
}

export function formatAmountFromInr(amountInr: number, currency: CurrencyCode): string {
  const meta = CURRENCY_META[currency];
  if (currency === "INR") {
    if (amountInr >= 100_000) {
      const lakhs = amountInr / 100_000;
      return `₹${Number.isInteger(lakhs) ? lakhs : lakhs.toFixed(1)} LPA`;
    }
    return `₹${Math.round(amountInr).toLocaleString("en-IN")}`;
  }
  const converted = Math.round((amountInr * meta.rateFromInr) / 1000);
  return `${meta.symbol}${converted}k`;
}

export function formatRangeFromInr(
  rangeInr: [number, number],
  currency: CurrencyCode,
  isAnnualSalary = true,
): string {
  if (currency === "INR") {
    if (isAnnualSalary && rangeInr[0] >= 100_000) {
      const lo = (rangeInr[0] / 100_000).toFixed(1).replace(/\.0$/, "");
      const hi = (rangeInr[1] / 100_000).toFixed(1).replace(/\.0$/, "");
      return `₹${lo}L – ₹${hi}L / yr`;
    }
    return `₹${Math.round(rangeInr[0]).toLocaleString("en-IN")} – ₹${Math.round(rangeInr[1]).toLocaleString("en-IN")}`;
  }
  const meta = CURRENCY_META[currency];
  const lo = Math.max(1, Math.round(rangeInr[0] * meta.rateFromInr));
  const hi = Math.max(lo, Math.round(rangeInr[1] * meta.rateFromInr));
  if (isAnnualSalary && hi >= 2000) {
    return `${meta.symbol}${Math.round(lo / 1000)}k – ${meta.symbol}${Math.round(hi / 1000)}k / yr`;
  }
  return `${meta.symbol}${lo.toLocaleString("en-US")} – ${meta.symbol}${hi.toLocaleString("en-US")}`;
}

export function formatAbroadRange(rangeUsd: [number, number], currency: CurrencyCode): string {
  if (currency === "USD") {
    return `$${Math.round(rangeUsd[0] / 1000)}k – $${Math.round(rangeUsd[1] / 1000)}k / yr`;
  }
  const inrEquivalent: [number, number] = [rangeUsd[0] * 84.5, rangeUsd[1] * 84.5];
  if (currency === "INR") {
    const lo = (inrEquivalent[0] / 100_000).toFixed(1).replace(/\.0$/, "");
    const hi = (inrEquivalent[1] / 100_000).toFixed(1).replace(/\.0$/, "");
    return `$${Math.round(rangeUsd[0] / 1000)}k–$${Math.round(rangeUsd[1] / 1000)}k (~₹${lo}L–₹${hi}L)`;
  }
  const meta = CURRENCY_META[currency];
  const lo = Math.round((inrEquivalent[0] * meta.rateFromInr) / 1000);
  const hi = Math.round((inrEquivalent[1] * meta.rateFromInr) / 1000);
  return `${meta.symbol}${lo}k – ${meta.symbol}${hi}k / yr`;
}

function roundToNearest10k(n: number): number {
  return Math.round(n / 10_000) * 10_000;
}

export function getCareerInsight(career: Career): CareerInsight {
  const base = INDUSTRY_BASELINES[career.industry];
  // Scale slightly by commitment level & emerging role status (transparent deterministic offset)
  const levelMultiplier =
    career.commitmentLevel >= 5
      ? 1.15
      : career.commitmentLevel === 4
        ? 1.06
        : career.commitmentLevel <= 2
          ? 0.92
          : 1.0;
  const emergingBoost = career.emerging ? 1.08 : 1.0;
  const factor = levelMultiplier * emergingBoost;

  const scaleInr = (pair: [number, number]): [number, number] => [
    roundToNearest10k(pair[0] * factor),
    roundToNearest10k(pair[1] * factor),
  ];
  const scaleUsd = (pair: [number, number]): [number, number] => [
    Math.round((pair[0] * factor) / 1000) * 1000,
    Math.round((pair[1] * factor) / 1000) * 1000,
  ];

  const difficultyOfEntry: DifficultyOfEntry =
    career.commitmentLevel <= 2
      ? "Beginner-friendly"
      : career.commitmentLevel === 3
        ? "Moderate"
        : "Highly competitive";

  const difficultyExplanation =
    difficultyOfEntry === "Beginner-friendly"
      ? `Accessible entry curve with low formal barriers (${career.minEducation}); portfolio projects can open junior roles quickly.`
      : difficultyOfEntry === "Moderate"
        ? `Requires structured skills in ${career.skills.slice(0, 2).join(" & ")} plus demonstrable project or internship experience.`
        : `High competition or formal screening (${career.pathways[0] ?? career.minEducation}); expects sustained preparation.`;

  const trend: DemandTrend = career.emerging ? "Growing" : base.trend;
  const outlookNote = career.emerging
    ? `${career.name} is an emerging specialty within ${career.industry}, driven by automation, analytics, or specialized workflows.`
    : trend === "Growing"
      ? `Steady expansion expected across ${career.industry}, especially for candidates combining ${career.skills.slice(0, 2).join(" and ")}.`
      : `Consistent replacement & core demand in ${career.industry}; differentiation via practical specialization matters.`;

  const remotePossibility: CareerInsight["jobOpportunities"]["remotePossibility"] =
    career.environment.toLowerCase().includes("remote")
      ? "High remote availability"
      : career.environment.toLowerCase().includes("outdoors") ||
          career.environment.toLowerCase().includes("people") ||
          career.environment.toLowerCase().includes("lab")
        ? "Primarily on-site"
        : base.remote;

  const isEntrepreneurial =
    career.industry === "Entrepreneurship" ||
    career.industry === "Creative Arts" ||
    career.industry === "Design";

  return {
    indiaEntryInr: scaleInr(base.entryInr),
    indiaMidInr: scaleInr(base.midInr),
    indiaExperiencedInr: scaleInr(base.expInr),
    abroadEntryUsd: scaleUsd(base.entryUsd),
    abroadMidUsd: scaleUsd(base.midUsd),
    abroadExperiencedUsd: scaleUsd(base.expUsd),
    compensationStructure: {
      baseNote: isEntrepreneurial
        ? "Income can blend retainer contracts with milestone-based studio revenue rather than fixed monthly pay alone."
        : "Structured annual fixed base CTC (India) or base salary (abroad), paid monthly or bi-weekly.",
      variableNote:
        career.industry === "Finance" || career.industry === "Business & Management"
          ? "Performance bonuses and equity/ESOPs commonly add 10%–30% in mid/senior roles."
          : "Annual performance bonus (5%–15%) or ESOPs in growth-stage companies.",
      freelanceNote: career.freelanceOpportunity,
      selfEmploymentNote: career.entrepreneurshipOpportunity,
    },
    educationCostInr: base.eduCostInr,
    educationCostSummary: `${base.eduSummary}. ${career.estimatedCostNote}`,
    employabilityMonths: base.months,
    employabilityNote: `Typically ${base.months[0]}–${base.months[1]} months of focused skill-building or formal qualification completion before job-ready applications.`,
    difficultyOfEntry,
    difficultyExplanation,
    jobOpportunities: {
      hiringIndustries: Array.from(new Set([career.industry, ...base.hiring])).slice(0, 4),
      typicalTitles: career.progression.slice(0, 3),
      sectors: base.sectors,
      remotePossibility,
      freelanceAvailability: career.freelanceOpportunity,
    },
    futureDemand: {
      trend,
      timeframe: "2025–2030",
      outlookNote,
      source: base.source,
    },
    salarySource: base.source,
    salaryPeriod: "2025–2026 indicative market benchmarks",
  };
}
