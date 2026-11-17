import type { Career } from "./careers";

export type BudgetItemCategory = "paid_course" | "paid_tool" | "certification" | "project_expense";

export type BudgetCatalogItem = {
  id: string;
  name: string;
  provider: string;
  providerUrl: string;
  category: BudgetItemCategory;
  estimatedCostInr: number;
  priceType: "estimated";
  priceNote: string;
  domainTags: string[];
  levelTags: Array<"beginner" | "some" | "comfortable">;
  whyRecommended: string;
};

export const BUDGET_CATEGORY_LABEL: Record<BudgetItemCategory, string> = {
  paid_course: "Paid Course / Structured Study",
  paid_tool: "Tools / Software / Gear",
  certification: "Certification / Exam Prep",
  project_expense: "Project / Practice Expense",
};

/**
 * Curated realistic INR learning & starter expenses across domains.
 * Every cost is explicitly marked as `estimated` with an official provider link
 * so students verify current pricing before paying.
 */
export const BUDGET_CATALOG: BudgetCatalogItem[] = [
  // ---- ₹200 – ₹500 tier ----
  {
    id: "study-notebook-flashcards",
    name: "Dedicated Concept Notebook & Printed Cheat-Sheets",
    provider: "Local stationery / print shop",
    providerUrl: "https://ncert.nic.in/",
    category: "project_expense",
    estimatedCostInr: 250,
    priceType: "estimated",
    priceNote: "Estimated INR print/stationery cost; optional if you prefer digital notes.",
    domainTags: ["general", "science", "law", "government", "education", "healthcare", "finance"],
    levelTags: ["beginner", "some"],
    whyRecommended:
      "Helps structure weekly summaries, diagrams, and active-recall notes without screen fatigue.",
  },
  {
    id: "udemy-starter-sale",
    name: "Practical Project-Based Course (Udemy Sale Tier)",
    provider: "Udemy",
    providerUrl: "https://www.udemy.com/",
    category: "paid_course",
    estimatedCostInr: 499,
    priceType: "estimated",
    priceNote: "Estimated India promotional sale tier (regular list prices vary frequently).",
    domainTags: [
      "technology",
      "ai",
      "data",
      "design",
      "business",
      "media",
      "marketing",
      "engineering",
    ],
    levelTags: ["beginner", "some"],
    whyRecommended:
      "Compact step-by-step video walkthrough to accelerate your first portfolio build.",
  },
  {
    id: "sports-match-journal-stopwatch",
    name: "Match Observation Clipboard, Tactile Notebook & Basic Stopwatch",
    provider: "Local sports retailer",
    providerUrl: "https://www.fifatrainingcentre.com/",
    category: "project_expense",
    estimatedCostInr: 350,
    priceType: "estimated",
    priceNote: "Estimated local sports kit accessory cost; verify locally.",
    domainTags: ["sports", "football", "cricket", "defence", "fitness"],
    levelTags: ["beginner", "some", "comfortable"],
    whyRecommended:
      "Lets you chart live passes, transition timings, and sprint intervals pitch-side.",
  },
  {
    id: "design-sketchpad-fineliners",
    name: "A4 Grid Sketchbook & Fineliner Wireframing Pens",
    provider: "Local art / stationery store",
    providerUrl: "https://www.figma.com/resource-library/",
    category: "paid_tool",
    estimatedCostInr: 350,
    priceType: "estimated",
    priceNote: "Estimated stationery cost for rapid paper wireframes and visual thumbnails.",
    domainTags: ["design", "creative", "art", "architecture", "engineering"],
    levelTags: ["beginner", "some"],
    whyRecommended:
      "Fast paper sketching before opening digital tools improves layout clarity and proportion.",
  },
  {
    id: "canva-pro-starter-month",
    name: "Canva Pro (1-Month Creator & Brand Kit Access)",
    provider: "Canva",
    providerUrl: "https://www.canva.com/pricing/",
    category: "paid_tool",
    estimatedCostInr: 500,
    priceType: "estimated",
    priceNote: "Estimated monthly India individual plan; free tier also available.",
    domainTags: ["design", "media", "marketing", "business", "entrepreneurship", "education"],
    levelTags: ["beginner", "some"],
    whyRecommended:
      "Unlocks brand kits, presentation exports, and quick campaign mockups for portfolio decks.",
  },
  {
    id: "cyber-tryhackme-month",
    name: "TryHackMe Premium Lab Access (1 Month)",
    provider: "TryHackMe",
    providerUrl: "https://tryhackme.com/pricing",
    category: "paid_tool",
    estimatedCostInr: 950,
    priceType: "estimated",
    priceNote: "Estimated INR equivalent of monthly subscription; free rooms available first.",
    domainTags: ["cyber", "technology", "defence"],
    levelTags: ["beginner", "some", "comfortable"],
    whyRecommended:
      "Browser-based guided Linux, networking, and ethical hacking VMs with zero local setup.",
  },
  {
    id: "ref-book-secondhand",
    name: "Second-Hand Domain Handbook or Exam Guidebook",
    provider: "Local bookstore / academic market",
    providerUrl: "https://swayam.gov.in/",
    category: "paid_course",
    estimatedCostInr: 450,
    priceType: "estimated",
    priceNote: "Estimated second-hand textbook range; check libraries first.",
    domainTags: ["law", "finance", "government", "healthcare", "science", "social", "agriculture"],
    levelTags: ["beginner", "some"],
    whyRecommended:
      "Concise offline reference chapters for deep reading and solved practice problems.",
  },

  // ---- ₹600 – ₹1,500 tier ----
  {
    id: "nptel-exam-cert",
    name: "NPTEL Proctored University Exam Certificate",
    provider: "NPTEL (IIT / IISc)",
    providerUrl: "https://nptel.ac.in/",
    category: "certification",
    estimatedCostInr: 1000,
    priceType: "estimated",
    priceNote: "Estimated official NPTEL exam registration fee per course (auditing is ₹0).",
    domainTags: [
      "technology",
      "ai",
      "data",
      "engineering",
      "science",
      "finance",
      "business",
      "mathematics",
      "general",
    ],
    levelTags: ["beginner", "some", "comfortable"],
    whyRecommended:
      "Recognised IIT/IISc proctored exam certificate after completing free lecture videos.",
  },
  {
    id: "sports-cones-whistle-kit",
    name: "Grassroots Training Cones, Bibs & Whistle Starter Kit",
    provider: "Local sporting goods store",
    providerUrl: "https://www.fifatrainingcentre.com/",
    category: "paid_tool",
    estimatedCostInr: 850,
    priceType: "estimated",
    priceNote: "Estimated grassroots coaching kit pricing in INR.",
    domainTags: ["sports", "football", "cricket"],
    levelTags: ["beginner", "some", "comfortable"],
    whyRecommended:
      "Enables running real 4v4 positioning drills and filming practical coaching clips.",
  },
  {
    id: "domain-portfolio-starter",
    name: "Personal Portfolio Custom Domain (.in / .dev 1st Year)",
    provider: "Domain registrar (e.g. Cloudflare / Namecheap)",
    providerUrl: "https://www.cloudflare.com/products/registrar/",
    category: "project_expense",
    estimatedCostInr: 850,
    priceType: "estimated",
    priceNote: "Estimated 1st-year domain registration; hosting is ₹0 on GitHub/Cloudflare Pages.",
    domainTags: [
      "technology",
      "ai",
      "design",
      "media",
      "marketing",
      "entrepreneurship",
      "creative",
      "writing",
    ],
    levelTags: ["some", "comfortable"],
    whyRecommended:
      "Gives your portfolio projects and case studies a clean personal URL to share with mentors.",
  },
  {
    id: "figma-pro-month",
    name: "Figma Professional Plan (1-Month Intensive Sprint)",
    provider: "Figma",
    providerUrl: "https://www.figma.com/pricing/",
    category: "paid_tool",
    estimatedCostInr: 1000,
    priceType: "estimated",
    priceNote: "Estimated 1-month individual fee; Figma Starter & Education plans are ₹0.",
    domainTags: ["design", "technology", "media"],
    levelTags: ["some", "comfortable"],
    whyRecommended:
      "Unlocks shared component libraries and unlimited prototype versions (check student free plan first).",
  },
  {
    id: "datacamp-udemy-data",
    name: "SQL, Excel & Analytics Guided Case-Study Track",
    provider: "Udemy / Data Learning Provider",
    providerUrl: "https://www.kaggle.com/learn",
    category: "paid_course",
    estimatedCostInr: 650,
    priceType: "estimated",
    priceNote: "Estimated India discounted course fee alongside free Kaggle datasets.",
    domainTags: ["data", "finance", "business", "sports", "ai"],
    levelTags: ["beginner", "some"],
    whyRecommended:
      "Structured multi-table datasets and dashboard rubrics tailored to real business & sports KPIs.",
  },
  {
    id: "field-lab-consumables",
    name: "Local Field Sampling Notebook, Test Strips & Travel Pass",
    provider: "Local transport / lab supply",
    providerUrl: "https://unccelearn.org/",
    category: "project_expense",
    estimatedCostInr: 650,
    priceType: "estimated",
    priceNote: "Estimated field visit & basic water/soil kit allowance.",
    domainTags: ["environment", "agriculture", "science", "healthcare", "social"],
    levelTags: ["beginner", "some"],
    whyRecommended:
      "Covers local site visits, soil/water observations, or community interviews for your case report.",
  },

  // ---- ₹1,200 – ₹2,500 tier ----
  {
    id: "coursera-plus-month",
    name: "Coursera Single Course Certificate / Coursera Plus Trial Window",
    provider: "Coursera",
    providerUrl: "https://www.coursera.org/courseraplus",
    category: "paid_course",
    estimatedCostInr: 1650,
    priceType: "estimated",
    priceNote: "Estimated India regional pricing; apply for Financial Aid or audit free first.",
    domainTags: [
      "technology",
      "ai",
      "data",
      "business",
      "finance",
      "healthcare",
      "design",
      "social",
      "general",
    ],
    levelTags: ["beginner", "some", "comfortable"],
    whyRecommended:
      "Structured graded assignments and shareable completion certificate from university partners.",
  },
  {
    id: "nism-finance-exam",
    name: "NISM Financial Markets / Mutual Fund Certification Exam",
    provider: "NISM (SEBI)",
    providerUrl: "https://www.nism.ac.in/",
    category: "certification",
    estimatedCostInr: 1500,
    priceType: "estimated",
    priceNote: "Estimated official NISM module exam fee in INR; verify exact module on nism.ac.in.",
    domainTags: ["finance", "business"],
    levelTags: ["some", "comfortable"],
    whyRecommended:
      "Industry-standard Indian regulatory credential for finance, advisory, and market roles.",
  },
  {
    id: "cloud-credits-lab",
    name: "Cloud Sandbox / AI API Practice Budget (Compute & Storage)",
    provider: "Cloud Provider (AWS / GCP / Azure)",
    providerUrl: "https://learn.microsoft.com/en-us/training/",
    category: "project_expense",
    estimatedCostInr: 1200,
    priceType: "estimated",
    priceNote:
      "Estimated optional sandbox top-up beyond free tier limits (set strict billing alerts).",
    domainTags: ["technology", "ai", "cyber", "data"],
    levelTags: ["some", "comfortable"],
    whyRecommended:
      "Lets you deploy full-stack APIs, containers, or small inference services safely with billing caps.",
  },
  {
    id: "sports-video-tagging-tripod",
    name: "Smartphone Stabiliser / Tripod & Match-Recording Memory Card",
    provider: "Local electronics store",
    providerUrl: "https://www.fifatrainingcentre.com/",
    category: "project_expense",
    estimatedCostInr: 1100,
    priceType: "estimated",
    priceNote: "Estimated accessory cost for filming steady amateur matches to tag tactics.",
    domainTags: ["sports", "football", "cricket", "media"],
    levelTags: ["beginner", "some", "comfortable"],
    whyRecommended:
      "Lets you capture high-angle footage of local matches to build a genuine tactical breakdown reel.",
  },
  {
    id: "user-research-prototype-budget",
    name: "Mini Product Pilot / User Testing Print & Refreshment Kit",
    provider: "Local print & campus test",
    providerUrl: "https://lawsofux.com/",
    category: "project_expense",
    estimatedCostInr: 900,
    priceType: "estimated",
    priceNote: "Estimated small-scale real-world validation cost for prototype or service pilots.",
    domainTags: ["design", "entrepreneurship", "business", "hospitality", "social"],
    levelTags: ["some", "comfortable"],
    whyRecommended:
      "Funds physical mockups, printed surveys, or small pilot samples to validate real user feedback.",
  },

  // ---- ₹2,500 – ₹5,000+ tier ----
  {
    id: "arduino-robotics-kit",
    name: "Microcontroller, Sensor & Breadboard Hardware Starter Kit",
    provider: "Electronics robotics supplier",
    providerUrl: "https://ocw.mit.edu/",
    category: "paid_tool",
    estimatedCostInr: 2400,
    priceType: "estimated",
    priceNote: "Estimated starter electronics/IoT kit price; check college lab availability first.",
    domainTags: ["engineering", "technology", "ai", "science"],
    levelTags: ["beginner", "some", "comfortable"],
    whyRecommended:
      "Hands-on embedded circuits, sensors, and motor control experiments for hardware portfolios.",
  },
  {
    id: "edx-verified-track",
    name: "edX / University Verified Specialization Track",
    provider: "edX",
    providerUrl: "https://www.edx.org/",
    category: "certification",
    estimatedCostInr: 3500,
    priceType: "estimated",
    priceNote: "Estimated single verified certificate fee (audit track remains free).",
    domainTags: ["technology", "ai", "data", "science", "business", "law", "healthcare"],
    levelTags: ["some", "comfortable"],
    whyRecommended:
      "University-graded assessments and verified completion record for academic or job portfolios.",
  },
  {
    id: "workshop-bootcamp-pass",
    name: "Weekend Applied Workshop / Federation Intro Clinic Pass",
    provider: "Regional association / university club",
    providerUrl: "https://www.the-aiff.com/",
    category: "certification",
    estimatedCostInr: 2500,
    priceType: "estimated",
    priceNote: "Estimated regional workshop or introductory clinic registration fee.",
    domainTags: ["sports", "football", "cricket", "hospitality", "defence", "entrepreneurship"],
    levelTags: ["beginner", "some", "comfortable"],
    whyRecommended:
      "In-person mentor feedback, peer drills, and official grassroots participation exposure.",
  },
  {
    id: "drawing-tablet-creative",
    name: "Entry Pen Tablet or Portfolio Audio/Visual Starter Mic",
    provider: "Hardware / creator store",
    providerUrl: "https://www.blender.org/support/tutorials/",
    category: "paid_tool",
    estimatedCostInr: 3200,
    priceType: "estimated",
    priceNote: "Estimated entry hardware cost (only needed once committed to digital art/audio).",
    domainTags: ["creative", "design", "media", "music"],
    levelTags: ["some", "comfortable"],
    whyRecommended:
      "Improves precision for digital illustration, 3D sculpting, or crisp voiceover/podcast demos.",
  },
  {
    id: "ms-google-assoc-cert",
    name: "Cloud / Analytics Associate Certification Prep & Practice Tests",
    provider: "Microsoft Learn / Google Skillshop",
    providerUrl: "https://learn.microsoft.com/en-us/credentials/",
    category: "certification",
    estimatedCostInr: 3600,
    priceType: "estimated",
    priceNote:
      "Estimated India student-discounted fundamental exam voucher & mock test bundle; confirm live discount.",
    domainTags: ["technology", "ai", "data", "cyber"],
    levelTags: ["some", "comfortable"],
    whyRecommended:
      "Validates cloud, data, or security fundamentals with an industry-recognised voucher exam.",
  },
];

function careerSignalSet(career: Career): Set<string> {
  const tokens = new Set<string>();
  const raw = [
    career.industry,
    career.subcategory,
    ...career.interests,
    ...career.tags,
    ...career.skills,
  ];
  for (const s of raw) {
    for (const part of s.toLowerCase().split(/[\s/&,-]+/)) {
      if (part.length >= 2) tokens.add(part);
    }
  }
  return tokens;
}

export function scoreCatalogItemForCareer(
  item: BudgetCatalogItem,
  career: Career,
  level: "beginner" | "some" | "comfortable",
): number {
  const sig = careerSignalSet(career);
  let score = 0;
  for (const tag of item.domainTags) {
    if (tag === "general") score += 0.5;
    else if (sig.has(tag)) score += 3;
  }
  if (item.levelTags.includes(level)) score += 1.5;
  return score;
}
