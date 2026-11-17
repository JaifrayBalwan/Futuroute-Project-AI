export type Resource = {
  name: string;
  url: string;
  cost: "Free" | "Free to audit" | "Free tier";
  note: string;
};

export const INDUSTRIES = [
  "Technology & IT",
  "Artificial Intelligence",
  "Sports",
  "Healthcare",
  "Business & Management",
  "Finance",
  "Law",
  "Science & Research",
  "Creative Arts",
  "Design",
  "Media & Entertainment",
  "Education",
  "Government",
  "Defence",
  "Environment",
  "Hospitality",
  "Engineering",
  "Entrepreneurship",
  "Agriculture",
  "Social Sciences",
] as const;

export type Industry = (typeof INDUSTRIES)[number];

export type CareerHue = "lavender" | "cyan" | "turquoise" | "pink" | "violet" | "warning";

export type Career = {
  id: string;
  name: string;
  industry: Industry;
  subcategory: string;
  short: string;
  hue: CareerHue;
  day: string;
  responsibilities: string[];
  skills: string[];
  capabilities: string[];
  interests: string[];
  subjects: string[];
  pathways: string[];
  altRoutes: string[];
  projects: string[];
  commitment: string;
  commitmentLevel: number; // 1-5 relative effort to reach beginner-project level (illustrative)
  estimatedCostNote: string;
  progression: string[];
  freelanceOpportunity: string;
  entrepreneurshipOpportunity: string;
  entryLevelOpportunities: string;
  pros: string[];
  cons: string[];
  resources: Resource[];
  trial: string;
  challengeId: string;
  emerging: boolean;
  environment: string;
  minEducation: string;
  budgetTier: number; // 0 = completely free to begin, 500 / 1000 / 5000 for optional gear/exams
  tags: string[];
};

export const VERIFIED_RESOURCES = {
  fcc: {
    name: "freeCodeCamp",
    url: "https://www.freecodecamp.org/learn",
    cost: "Free",
    note: "Interactive web & programming curriculum",
  },
  mdn: {
    name: "MDN Learn Web Development",
    url: "https://developer.mozilla.org/en-US/docs/Learn",
    cost: "Free",
    note: "Reference-quality HTML/CSS/JS guides",
  },
  cs50: {
    name: "Harvard CS50x",
    url: "https://cs50.harvard.edu/x/",
    cost: "Free",
    note: "Foundations of computer science",
  },
  odin: {
    name: "The Odin Project",
    url: "https://www.theodinproject.com/",
    cost: "Free",
    note: "Project-based web development path",
  },
  kaggle: {
    name: "Kaggle Learn",
    url: "https://www.kaggle.com/learn",
    cost: "Free",
    note: "Short Python, pandas & ML courses",
  },
  ml: {
    name: "Machine Learning Specialization (Coursera)",
    url: "https://www.coursera.org/learn/machine-learning",
    cost: "Free to audit",
    note: "Audit option availability may vary",
  },
  huggingface: {
    name: "Hugging Face Learn",
    url: "https://huggingface.co/learn",
    cost: "Free",
    note: "Hands-on NLP, LLM & computer vision courses",
  },
  khan: {
    name: "Khan Academy Computing",
    url: "https://www.khanacademy.org/computing",
    cost: "Free",
    note: "Gentle introduction for school students",
  },
  khanEcon: {
    name: "Khan Academy Economics & Finance",
    url: "https://www.khanacademy.org/economics-finance-domain",
    cost: "Free",
    note: "Microeconomics, macroeconomics & finance basics",
  },
  khanSci: {
    name: "Khan Academy Science",
    url: "https://www.khanacademy.org/science",
    cost: "Free",
    note: "Biology, chemistry, physics & health foundations",
  },
  khanHum: {
    name: "Khan Academy Humanities",
    url: "https://www.khanacademy.org/humanities",
    cost: "Free",
    note: "History, civics, art history & storytelling",
  },
  w3py: {
    name: "W3Schools Python",
    url: "https://www.w3schools.com/python/",
    cost: "Free",
    note: "Quick Python syntax practice",
  },
  thm: {
    name: "TryHackMe",
    url: "https://tryhackme.com/",
    cost: "Free tier",
    note: "Guided security labs; some rooms paid",
  },
  owasp: {
    name: "OWASP Top Ten",
    url: "https://owasp.org/www-project-top-ten/",
    cost: "Free",
    note: "Common web security risks",
  },
  figma: {
    name: "Figma Resource Library",
    url: "https://www.figma.com/resource-library/",
    cost: "Free",
    note: "Design fundamentals; Figma has a free plan",
  },
  laws: {
    name: "Laws of UX",
    url: "https://lawsofux.com/",
    cost: "Free",
    note: "Psychology principles behind interfaces",
  },
  skillshop: {
    name: "Google Skillshop",
    url: "https://skillshop.withgoogle.com/",
    cost: "Free",
    note: "Google Ads & Analytics training",
  },
  nptel: {
    name: "NPTEL",
    url: "https://nptel.ac.in/",
    cost: "Free",
    note: "IIT/IISc university courses; proctored exam fee optional",
  },
  swayam: {
    name: "SWAYAM India",
    url: "https://swayam.gov.in/",
    cost: "Free",
    note: "National MOOC platform across arts, law, science & commerce",
  },
  mitocw: {
    name: "MIT OpenCourseWare",
    url: "https://ocw.mit.edu/",
    cost: "Free",
    note: "Open university lecture notes & engineering courses",
  },
  mslearn: {
    name: "Microsoft Learn",
    url: "https://learn.microsoft.com/en-us/training/",
    cost: "Free",
    note: "Cloud, data, and software career learning paths",
  },
  openwho: {
    name: "OpenWHO Learning",
    url: "https://openwho.org/",
    cost: "Free",
    note: "WHO public health & epidemiology courses",
  },
  fifa: {
    name: "FIFA Training Centre",
    url: "https://www.fifatrainingcentre.com/",
    cost: "Free",
    note: "Tactical analysis, coaching methodology & grassroots guides",
  },
  varsity: {
    name: "Varsity by Zerodha",
    url: "https://zerodha.com/varsity/",
    cost: "Free",
    note: "Structured personal finance, markets & valuation modules",
  },
  ncert: {
    name: "NCERT Textbooks & Guides",
    url: "https://ncert.nic.in/",
    cost: "Free",
    note: "Core Indian school textbooks across science, humanities & commerce",
  },
  unccl: {
    name: "UN CC:Learn",
    url: "https://unccelearn.org/",
    cost: "Free",
    note: "UN climate change, sustainability & environmental policy courses",
  },
  fao: {
    name: "FAO elearning Academy",
    url: "https://elearning.fao.org/",
    cost: "Free",
    note: "Sustainable agriculture, food systems & rural development",
  },
  blender: {
    name: "Blender Tutorials",
    url: "https://www.blender.org/support/tutorials/",
    cost: "Free",
    note: "Open-source 3D modelling, animation & rendering",
  },
  godot: {
    name: "Godot Engine Docs",
    url: "https://docs.godotengine.org/en/stable/",
    cost: "Free",
    note: "Free open-source 2D & 3D game development",
  },
  courseraAudit: {
    name: "Coursera (Free Audit)",
    url: "https://www.coursera.org/",
    cost: "Free to audit",
    note: "Many university courses allow free video auditing",
  },
} satisfies Record<string, Resource>;

export type ResourceKey = keyof typeof VERIFIED_RESOURCES;

export type CompactCareerTuple = [
  id: string,
  name: string,
  subcategory: string,
  short: string,
  day: string,
  skills: string[],
  interests: string[],
  capabilities: string[],
  subjects: string[],
  pathways: string[],
  altRoutes: string[],
  projects: string[],
  emerging: boolean,
  commitmentLevel: 1 | 2 | 3 | 4 | 5,
  environment: string,
  minEducation: string,
  budgetTier: number,
  pros: string[],
  cons: string[],
  trial: string,
  resKeys: ResourceKey[],
  challengeId: string,
];

const COMMITMENT_TEXT: Record<number, string> = {
  1: "Beginner-friendly starting curve; foundational habits build over a few weeks.",
  2: "Moderate onboarding; steady weekly practice develops confidence over 2–3 months.",
  3: "Consistent structured practice across core skills and portfolio projects.",
  4: "Substantial domain or technical depth; requires sustained multi-month study.",
  5: "High academic or specialist rigour; formal qualifications or deep mastery required.",
};

const HUE_BY_INDUSTRY: Record<Industry, CareerHue> = {
  "Technology & IT": "lavender",
  "Artificial Intelligence": "pink",
  Sports: "turquoise",
  Healthcare: "cyan",
  "Business & Management": "warning",
  Finance: "cyan",
  Law: "violet",
  "Science & Research": "turquoise",
  "Creative Arts": "pink",
  Design: "violet",
  "Media & Entertainment": "warning",
  Education: "lavender",
  Government: "cyan",
  Defence: "warning",
  Environment: "turquoise",
  Hospitality: "pink",
  Engineering: "lavender",
  Entrepreneurship: "warning",
  Agriculture: "turquoise",
  "Social Sciences": "violet",
};

export function expandCareers(
  industry: Industry,
  items: CompactCareerTuple[],
  defaults: {
    progression: string[];
    freelance: string;
    entrepreneurship: string;
    entryLevel: string;
    costNote: string;
  },
): Career[] {
  return items.map((t) => {
    const [
      id,
      name,
      subcategory,
      short,
      day,
      skills,
      interests,
      capabilities,
      subjects,
      pathways,
      altRoutes,
      projects,
      emerging,
      commitmentLevel,
      environment,
      minEducation,
      budgetTier,
      pros,
      cons,
      trial,
      resKeys,
      challengeId,
    ] = t;

    const tags = Array.from(
      new Set([
        ...interests,
        ...capabilities,
        ...skills.map((s) => s.toLowerCase()),
        industry.toLowerCase(),
        subcategory.toLowerCase(),
      ]),
    );

    return {
      id,
      name,
      industry,
      subcategory,
      short,
      hue: HUE_BY_INDUSTRY[industry],
      day,
      responsibilities: [
        `Plan and execute core ${subcategory.toLowerCase()} workflows`,
        `Collaborate with peers and stakeholders on deliverables`,
        `Evaluate quality, safety, or outcomes against clear standards`,
        `Keep learning new methods and tools in ${industry}`,
      ],
      skills,
      capabilities,
      interests,
      subjects,
      pathways,
      altRoutes,
      projects,
      commitment: COMMITMENT_TEXT[commitmentLevel] ?? COMMITMENT_TEXT[3]!,
      commitmentLevel,
      estimatedCostNote: defaults.costNote,
      progression: [
        `Trainee / Junior ${name}`,
        name,
        `Senior / Lead ${name}`,
        `${subcategory} Director or Specialist`,
      ],
      freelanceOpportunity: defaults.freelance,
      entrepreneurshipOpportunity: defaults.entrepreneurship,
      entryLevelOpportunities: defaults.entryLevel,
      pros,
      cons,
      resources: resKeys.map((k) => VERIFIED_RESOURCES[k]),
      trial,
      challengeId,
      emerging,
      environment,
      minEducation,
      budgetTier,
      tags,
    };
  });
}
