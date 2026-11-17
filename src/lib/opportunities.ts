import type { Industry } from "./career-types";
import type { Career } from "./careers";
import type { UserProfileRecord } from "./db";
import type { Roadmap } from "./store";

export const OPPORTUNITY_CATEGORIES = [
  "Internships",
  "Free online courses",
  "Scholarships",
  "Hackathons",
  "Competitions",
  "Certifications",
  "Beginner-friendly projects",
  "Workshops & events",
  "Freelancing opportunities",
  "Entry-level jobs",
] as const;

export type OpportunityCategory = (typeof OPPORTUNITY_CATEGORIES)[number];

export type OpportunityMode = "Online" | "Remote" | "Hybrid" | "On-site";
export type OpportunityCost =
  "Free" | "Free audit / Paid cert" | "Paid / Stipend-backed" | "Varies";
export type OpportunityDifficulty = "Beginner" | "Intermediate" | "Advanced";

export type Opportunity = {
  id: string;
  title: string;
  provider: string;
  category: OpportunityCategory;
  description: string;
  fields: Industry[];
  requiredSkills: string[];
  location: string;
  mode: OpportunityMode;
  cost: OpportunityCost;
  difficulty: OpportunityDifficulty;
  eligibility: string;
  listingType: "Curated Ongoing Portal" | "Periodic Official Cohort";
  scheduleNote: string;
  lastVerified: string;
  url: string;
};

export const OPPORTUNITIES_CATALOG: Opportunity[] = [
  // 1. Internships
  {
    id: "opp-aicte-internship",
    title: "AICTE National Internship Portal",
    provider: "All India Council for Technical Education (Gov of India)",
    category: "Internships",
    description:
      "Official government portal connecting college & diploma students with internships across engineering, IT, design, public policy, and agri-tech.",
    fields: ["Technology & IT", "Engineering", "Design", "Government", "Agriculture"],
    requiredSkills: ["Domain fundamentals", "Resume", "Communication"],
    location: "Pan-India / Remote",
    mode: "Hybrid",
    cost: "Free",
    difficulty: "Beginner",
    eligibility: "School/College & Diploma students across India",
    listingType: "Curated Ongoing Portal",
    scheduleNote: "Rolling openings updated continuously",
    lastVerified: "Nov 2026",
    url: "https://internship.aicte-india.org/",
  },
  {
    id: "opp-internshala",
    title: "Internshala Verified Student Internships",
    provider: "Internshala",
    category: "Internships",
    description:
      "Filter verified stipended & remote internships across software, UI/UX, finance, marketing, media, law, and sports management.",
    fields: [
      "Technology & IT",
      "Design",
      "Business & Management",
      "Finance",
      "Media & Entertainment",
      "Law",
    ],
    requiredSkills: ["Portfolio basics", "Communication", "Domain fundamentals"],
    location: "India & Work-from-home",
    mode: "Remote",
    cost: "Free",
    difficulty: "Beginner",
    eligibility: "Class 12+, UG, PG & freshers",
    listingType: "Curated Ongoing Portal",
    scheduleNote: "Rolling monthly intakes",
    lastVerified: "Nov 2026",
    url: "https://internshala.com/internships/",
  },

  // 2. Free online courses
  {
    id: "opp-swayam-gov",
    title: "SWAYAM National Free MOOCs",
    provider: "Ministry of Education, Gov of India",
    category: "Free online courses",
    description:
      "Free courses from IITs, IIMs, and central universities covering engineering, law, commerce, psychology, agriculture, and humanities.",
    fields: [
      "Technology & IT",
      "Business & Management",
      "Law",
      "Science & Research",
      "Education",
      "Social Sciences",
    ],
    requiredSkills: ["Self-paced study", "Foundational reading"],
    location: "Online",
    mode: "Online",
    cost: "Free audit / Paid cert",
    difficulty: "Beginner",
    eligibility: "Open to Class 9–12, UG, PG & lifelong learners",
    listingType: "Periodic Official Cohort",
    scheduleNote: "Jan & July semester cycles; lecture videos free anytime",
    lastVerified: "Nov 2026",
    url: "https://swayam.gov.in/",
  },
  {
    id: "opp-freecodecamp",
    title: "freeCodeCamp Full Verified Curriculum",
    provider: "freeCodeCamp.org",
    category: "Free online courses",
    description:
      "100% free interactive coding, data analysis, Python, relational databases, and machine learning tracks with free certificates.",
    fields: ["Technology & IT", "Artificial Intelligence", "Design"],
    requiredSkills: ["HTML/CSS", "JavaScript", "Python"],
    location: "Global Online",
    mode: "Online",
    cost: "Free",
    difficulty: "Beginner",
    eligibility: "Open to all ages worldwide",
    listingType: "Curated Ongoing Portal",
    scheduleNote: "Self-paced year-round",
    lastVerified: "Nov 2026",
    url: "https://www.freecodecamp.org/learn",
  },
  {
    id: "opp-mit-ocw",
    title: "MIT OpenCourseWare Full University Archive",
    provider: "Massachusetts Institute of Technology",
    category: "Free online courses",
    description:
      "Free MIT lecture notes, assignments, and exams across computer science, economics, biology, mechanical engineering, and urban planning.",
    fields: [
      "Engineering",
      "Science & Research",
      "Artificial Intelligence",
      "Finance",
      "Environment",
    ],
    requiredSkills: ["Mathematics", "Independent study"],
    location: "Global Online",
    mode: "Online",
    cost: "Free",
    difficulty: "Intermediate",
    eligibility: "High school advanced learners, UG & PG",
    listingType: "Curated Ongoing Portal",
    scheduleNote: "Open archive year-round",
    lastVerified: "Nov 2026",
    url: "https://ocw.mit.edu/",
  },

  // 3. Scholarships
  {
    id: "opp-nsp-india",
    title: "National Scholarship Portal (NSP India)",
    provider: "Government of India",
    category: "Scholarships",
    description:
      "Official central & state scholarship gateway supporting merit, means-based, technical diploma, and higher-education students.",
    fields: ["Education", "Engineering", "Healthcare", "Science & Research", "Social Sciences"],
    requiredSkills: ["Academic records", "Verified identity"],
    location: "India",
    mode: "Online",
    cost: "Free",
    difficulty: "Beginner",
    eligibility: "Pre-matric, Post-matric, UG & Technical students",
    listingType: "Periodic Official Cohort",
    scheduleNote: "Annual official application windows (check portal)",
    lastVerified: "Nov 2026",
    url: "https://scholarships.gov.in/",
  },
  {
    id: "opp-aicte-pragati-saksham",
    title: "AICTE Pragati, Saksham & Swanath Scholarships",
    provider: "AICTE",
    category: "Scholarships",
    description:
      "Official technical education support schemes for girl students and differently-abled students pursuing diploma or degree programs.",
    fields: ["Engineering", "Technology & IT", "Design"],
    requiredSkills: ["Enrolled in AICTE-approved institution"],
    location: "India",
    mode: "Online",
    cost: "Free",
    difficulty: "Beginner",
    eligibility: "Eligible Diploma / Degree students via NSP",
    listingType: "Periodic Official Cohort",
    scheduleNote: "Annual academic cycle via NSP",
    lastVerified: "Nov 2026",
    url: "https://www.aicte-india.org/schemes/students-development-schemes",
  },

  // 4. Hackathons
  {
    id: "opp-sih-india",
    title: "Smart India Hackathon (SIH Official Portal)",
    provider: "Ministry of Education Innovation Cell & AICTE",
    category: "Hackathons",
    description:
      "India's largest national student hackathon solving real-world problem statements across software, hardware, healthcare, and civic tech.",
    fields: [
      "Technology & IT",
      "Artificial Intelligence",
      "Engineering",
      "Environment",
      "Healthcare",
    ],
    requiredSkills: ["Teamwork", "Prototyping", "Problem-solving"],
    location: "India (Nodal Centres & Online)",
    mode: "Hybrid",
    cost: "Free",
    difficulty: "Intermediate",
    eligibility: "School (SIH Jr) & College teams",
    listingType: "Periodic Official Cohort",
    scheduleNote: "Annual national cycle (usually Aug–Dec)",
    lastVerified: "Nov 2026",
    url: "https://www.sih.gov.in/",
  },
  {
    id: "opp-devpost",
    title: "Devpost Student & Open Hackathons",
    provider: "Devpost",
    category: "Hackathons",
    description:
      "Live directory of global remote AI, web, game dev, sustainability, and fintech hackathons with beginner tracks and team matching.",
    fields: ["Technology & IT", "Artificial Intelligence", "Design", "Entrepreneurship"],
    requiredSkills: ["Prototyping", "Pitching", "Coding or No-Code"],
    location: "Global / Remote",
    mode: "Online",
    cost: "Free",
    difficulty: "Beginner",
    eligibility: "Students and builders worldwide",
    listingType: "Curated Ongoing Portal",
    scheduleNote: "Weekly new remote hackathons",
    lastVerified: "Nov 2026",
    url: "https://devpost.com/hackathons",
  },

  // 5. Competitions
  {
    id: "opp-unstop",
    title: "Unstop Student Case Competitions & Challenges",
    provider: "Unstop",
    category: "Competitions",
    description:
      "Case studies, strategy battles, finance challenges, marketing sprints, and coding contests hosted by universities and companies.",
    fields: ["Business & Management", "Finance", "Entrepreneurship", "Technology & IT", "Sports"],
    requiredSkills: ["Case analysis", "Presentation", "Teamwork"],
    location: "India & Online",
    mode: "Online",
    cost: "Free",
    difficulty: "Beginner",
    eligibility: "UG, PG & school participants (varies by event)",
    listingType: "Curated Ongoing Portal",
    scheduleNote: "Rolling weekly competitions",
    lastVerified: "Nov 2026",
    url: "https://unstop.com/competitions",
  },
  {
    id: "opp-kaggle-comp",
    title: "Kaggle Getting Started & Featured ML Competitions",
    provider: "Kaggle",
    category: "Competitions",
    description:
      "Practice predictive modeling, sports analytics, computer vision, and tabular data workflows on open datasets with free notebooks.",
    fields: ["Artificial Intelligence", "Technology & IT", "Sports", "Finance"],
    requiredSkills: ["Python", "Data analysis", "Statistics"],
    location: "Global Online",
    mode: "Online",
    cost: "Free",
    difficulty: "Intermediate",
    eligibility: "Open to students and practitioners",
    listingType: "Curated Ongoing Portal",
    scheduleNote: "Ongoing beginner playgrounds & seasonal contests",
    lastVerified: "Nov 2026",
    url: "https://www.kaggle.com/competitions",
  },

  // 6. Certifications
  {
    id: "opp-google-skillshop",
    title: "Google Skillshop Official Certifications",
    provider: "Google",
    category: "Certifications",
    description:
      "Free training and assessment credentials for Google Analytics, Search/Performance Marketing, and campaign measurement.",
    fields: ["Business & Management", "Media & Entertainment", "Entrepreneurship"],
    requiredSkills: ["Digital analytics", "Campaign logic"],
    location: "Online",
    mode: "Online",
    cost: "Free",
    difficulty: "Beginner",
    eligibility: "Open to all learners",
    listingType: "Curated Ongoing Portal",
    scheduleNote: "On-demand self-paced",
    lastVerified: "Nov 2026",
    url: "https://skillshop.withgoogle.com/",
  },
  {
    id: "opp-nptel-cert",
    title: "NPTEL IIT/IISc Domain Certifications",
    provider: "IITs & IISc (Gov Supported)",
    category: "Certifications",
    description:
      "Study full IIT/IISc courses free; take an optional proctored in-person exam (approx ₹1,000, with fee waivers for eligible students).",
    fields: [
      "Engineering",
      "Technology & IT",
      "Artificial Intelligence",
      "Science & Research",
      "Finance",
    ],
    requiredSkills: ["Weekly assignments", "Exam prep"],
    location: "Online + Exam centres across India",
    mode: "Hybrid",
    cost: "Free audit / Paid cert",
    difficulty: "Intermediate",
    eligibility: "Students, faculty & working learners",
    listingType: "Periodic Official Cohort",
    scheduleNote: "Jan & July exam semesters",
    lastVerified: "Nov 2026",
    url: "https://nptel.ac.in/",
  },

  // 7. Beginner-friendly projects
  {
    id: "opp-github-good-first",
    title: "GitHub Good First Issue Open-Source Projects",
    provider: "GitHub Open Source",
    category: "Beginner-friendly projects",
    description:
      "Contribute small documentation improvements, bug fixes, or UI tweaks to real open-source tools to build verifiable public work.",
    fields: ["Technology & IT", "Artificial Intelligence", "Design"],
    requiredSkills: ["Git basics", "Reading docs"],
    location: "Global Remote",
    mode: "Online",
    cost: "Free",
    difficulty: "Beginner",
    eligibility: "Anyone with a free GitHub account",
    listingType: "Curated Ongoing Portal",
    scheduleNote: "Continuous open issues",
    lastVerified: "Nov 2026",
    url: "https://github.com/topics/good-first-issue",
  },
  {
    id: "opp-fifa-grassroots",
    title: "FIFA Training Centre Match & Coaching Briefs",
    provider: "FIFA",
    category: "Beginner-friendly projects",
    description:
      "Use free FIFA match-analysis frameworks and session templates to write tactical scouting reports or youth session plans.",
    fields: ["Sports", "Media & Entertainment"],
    requiredSkills: ["Match observation", "Structured writing"],
    location: "Online / Local pitch practice",
    mode: "Hybrid",
    cost: "Free",
    difficulty: "Beginner",
    eligibility: "Aspiring coaches, analysts & sports writers",
    listingType: "Curated Ongoing Portal",
    scheduleNote: "Open library year-round",
    lastVerified: "Nov 2026",
    url: "https://www.fifatrainingcentre.com/",
  },

  // 8. Workshops & events
  {
    id: "opp-ms-learn-events",
    title: "Microsoft Learn Virtual Training Days & Workshops",
    provider: "Microsoft",
    category: "Workshops & events",
    description:
      "Free live instructor-led online workshops covering Cloud fundamentals, AI workflows, Data visualization, and Security.",
    fields: ["Technology & IT", "Artificial Intelligence", "Business & Management"],
    requiredSkills: ["Curiosity", "Basic computer literacy"],
    location: "Global Online",
    mode: "Online",
    cost: "Free",
    difficulty: "Beginner",
    eligibility: "Students and beginners",
    listingType: "Curated Ongoing Portal",
    scheduleNote: "Weekly regional time-zone sessions",
    lastVerified: "Nov 2026",
    url: "https://events.microsoft.com/",
  },
  {
    id: "opp-openwho-workshops",
    title: "OpenWHO Public Health & Clinical Briefings",
    provider: "World Health Organization",
    category: "Workshops & events",
    description:
      "Free self-paced workshops on public health communication, epidemiology basics, mental health first aid, and emergency response.",
    fields: ["Healthcare", "Social Sciences", "Environment"],
    requiredSkills: ["Reading", "Interest in health & community"],
    location: "Global Online",
    mode: "Online",
    cost: "Free",
    difficulty: "Beginner",
    eligibility: "Students, volunteers & healthcare aspirants",
    listingType: "Curated Ongoing Portal",
    scheduleNote: "Available anytime",
    lastVerified: "Nov 2026",
    url: "https://openwho.org/",
  },

  // 9. Freelancing opportunities
  {
    id: "opp-contra-freelance",
    title: "Contra Commission-Free Independent Portfolio Showcase",
    provider: "Contra",
    category: "Freelancing opportunities",
    description:
      "Build a structured freelance portfolio for UI/UX, video editing, writing, web builds, and marketing without platform commission cuts on projects.",
    fields: [
      "Design",
      "Creative Arts",
      "Technology & IT",
      "Media & Entertainment",
      "Business & Management",
    ],
    requiredSkills: ["1–2 sample projects", "Client communication"],
    location: "Global Remote",
    mode: "Remote",
    cost: "Free",
    difficulty: "Intermediate",
    eligibility: "18+ with portfolio samples",
    listingType: "Curated Ongoing Portal",
    scheduleNote: "Open year-round",
    lastVerified: "Nov 2026",
    url: "https://contra.com/",
  },
  {
    id: "opp-upwork-starter",
    title: "Freelance Market Brief Explorer (Writing, Design & Dev)",
    provider: "Upwork Marketplace",
    category: "Freelancing opportunities",
    description:
      "Inspect real client project briefs to see what skills businesses pay for in copywriting, spreadsheets, design, and coding before pitching.",
    fields: ["Design", "Technology & IT", "Media & Entertainment", "Finance", "Creative Arts"],
    requiredSkills: ["Niche portfolio", "Proposal writing"],
    location: "Global Remote",
    mode: "Remote",
    cost: "Varies",
    difficulty: "Intermediate",
    eligibility: "18+ adhering to local tax/platform rules",
    listingType: "Curated Ongoing Portal",
    scheduleNote: "Live marketplace briefs",
    lastVerified: "Nov 2026",
    url: "https://www.upwork.com/",
  },

  // 10. Entry-level jobs
  {
    id: "opp-ncs-india",
    title: "National Career Service (NCS India) Job & Career Portal",
    provider: "Ministry of Labour & Employment, Gov of India",
    category: "Entry-level jobs",
    description:
      "Verified government-run portal listing fresher/entry-level jobs, apprenticeships, and career counselling fairs across public & private employers.",
    fields: [
      "Government",
      "Engineering",
      "Finance",
      "Hospitality",
      "Healthcare",
      "Agriculture",
      "Technology & IT",
    ],
    requiredSkills: ["Updated CV", "Basic interview prep"],
    location: "Pan-India",
    mode: "Hybrid",
    cost: "Free",
    difficulty: "Beginner",
    eligibility: "10th/12th pass, ITI, Diploma & Graduates",
    listingType: "Curated Ongoing Portal",
    scheduleNote: "Daily verified employer listings",
    lastVerified: "Nov 2026",
    url: "https://www.ncs.gov.in/",
  },
  {
    id: "opp-hackerearth-jobs",
    title: "HackerEarth Hiring Challenges & Fresher Roles",
    provider: "HackerEarth",
    category: "Entry-level jobs",
    description:
      "Skill-first technical hiring challenges where beginners and final-year students qualify for developer and data interviews by solving problems.",
    fields: ["Technology & IT", "Artificial Intelligence"],
    requiredSkills: ["Data structures", "Programming", "Debugging"],
    location: "India & Global Remote",
    mode: "Remote",
    cost: "Free",
    difficulty: "Intermediate",
    eligibility: "Final-year students & freshers",
    listingType: "Curated Ongoing Portal",
    scheduleNote: "Monthly company challenges",
    lastVerified: "Nov 2026",
    url: "https://www.hackerearth.com/challenges/hiring/",
  },
];

export function recommendOpportunities(
  catalog: Opportunity[],
  profile?: UserProfileRecord | null,
  savedCareers: Career[] = [],
  activeRoadmap?: Roadmap,
  allCareers: Career[] = [],
): Opportunity[] {
  const focusIndustries = new Set<Industry>();
  for (const sc of savedCareers) focusIndustries.add(sc.industry);
  if (activeRoadmap) {
    const rmCareer = allCareers.find((c) => c.id === activeRoadmap.careerId);
    if (rmCareer) focusIndustries.add(rmCareer.industry);
  }

  const interestStr = [
    ...(profile?.interests ?? []),
    ...(profile?.subjects ?? []),
    ...(profile?.currentSkills ?? []),
  ]
    .join(" ")
    .toLowerCase();

  return [...catalog]
    .map((opp) => {
      let score = 0;
      if (opp.fields.some((f) => focusIndustries.has(f))) score += 5;
      for (const skill of opp.requiredSkills) {
        if (interestStr.includes(skill.toLowerCase())) score += 2;
      }
      if (opp.cost === "Free") score += 1;
      if (profile?.budget === 0 && opp.cost === "Free") score += 2;
      if (opp.difficulty === "Beginner") score += 1;
      return { opp, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((x) => x.opp);
}
