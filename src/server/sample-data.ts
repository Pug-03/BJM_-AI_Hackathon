/**
 * Fictional sample data for the demo and judge mode. Every person and
 * organization here is invented; all are flagged `isSample` and labelled
 * "Sample" in the UI. Names are deliberately diverse. Work-setup notes are
 * private fields — they are never shown publicly.
 */

export type WorkModeT = "REMOTE" | "ONSITE" | "HYBRID" | "ANY";
export type AvailabilityT = "FULL_TIME" | "PART_TIME" | "FREELANCE" | "PROJECT";
export type OrgTypeT = "INDIVIDUAL" | "ASSOCIATION" | "STARTUP" | "PRIVATE_COMPANY" | "GOVERNMENT";

export interface SampleTalent {
  key: string;
  firstName: string;
  lastName: string;
  displayName: string;
  handle: string;
  headline: string;
  bio: string;
  province: string;
  country: string;
  languages: string[];
  workMode: WorkModeT;
  availability: AvailabilityT[];
  skills: string[];
  specialTalents?: string;
  workSetupNeeds?: string;
  dobYear: number;
  showAge: boolean;
  education: { level: string; school: string; field?: string; yearEnd?: number }[];
  certificates: { kind: "EMPLOYMENT" | "TRAINING" | "OTHER"; title: string; issuer: string; year: number }[];
  portfolio: { title: string; description: string; art: number; link?: string }[];
  posts: { kind: "WORK" | "PHOTO"; text: string; art?: number; daysAgo: number }[];
  stats: { completedJobs: number; rehires: number; responseMins: number };
  cover: number;
  contacts: {
    kind: "PHONE" | "EMAIL" | "LINE" | "INSTAGRAM" | "TIKTOK" | "FACEBOOK" | "LINKEDIN" | "WEBSITE";
    value: string;
    visibility: "PUBLIC" | "CHAT_ONLY" | "HIDDEN";
  }[];
}

export const sampleTalent: SampleTalent[] = [
  {
    key: "mali",
    firstName: "Mali",
    lastName: "Srisuk",
    displayName: "Mali Srisuk",
    handle: "mali-srisuk",
    headline: "Customer support specialist",
    bio: "I help customers solve problems by chat and email in Thai and English. Five years in e-commerce support, calm under pressure, and I keep tidy notes so the next person can pick up where I left off.",
    province: "Bangkok",
    country: "TH",
    languages: ["Thai", "English"],
    workMode: "REMOTE",
    availability: ["FULL_TIME", "PART_TIME"],
    skills: [
      "Customer support",
      "Live chat",
      "Zendesk",
      "Thai–English translation",
      "Excel",
      "Complaint handling",
    ],
    specialTalents: "Typing 75 words per minute in Thai and English",
    workSetupNeeds: "Screen reader (NVDA) and remote work",
    dobYear: 1996,
    showAge: true,
    education: [
      { level: "Bachelor's degree", school: "Ramkhamhaeng University", field: "English", yearEnd: 2018 },
    ],
    certificates: [
      {
        kind: "EMPLOYMENT",
        title: "Customer support agent, 2019–2024",
        issuer: "Sample online marketplace",
        year: 2024,
      },
      {
        kind: "TRAINING",
        title: "Customer service excellence",
        issuer: "Sample training institute",
        year: 2022,
      },
    ],
    portfolio: [
      {
        title: "Support macros library",
        description: "60 reply templates in Thai and English that cut average reply time by a third.",
        art: 1,
      },
    ],
    posts: [
      {
        kind: "WORK",
        text: "Finished a 3-month contract handling Shopee and LINE OA chats for a skincare brand. 4.9 average customer rating.",
        art: 1,
        daysAgo: 3,
      },
      {
        kind: "WORK",
        text: "New: I wrote a short guide on handling refund requests kindly and quickly. Happy to share it with teams.",
        daysAgo: 20,
      },
    ],
    stats: { completedJobs: 31, rehires: 9, responseMins: 25 },
    cover: 1,
    contacts: [
      { kind: "EMAIL", value: "mali.sample@able.example", visibility: "CHAT_ONLY" },
      { kind: "LINE", value: "mali.sample", visibility: "CHAT_ONLY" },
      { kind: "LINKEDIN", value: "https://www.linkedin.com/in/sample-mali", visibility: "PUBLIC" },
    ],
  },
  {
    key: "kittipong",
    firstName: "Kittipong",
    lastName: "Wongsa",
    displayName: "Kittipong Wongsa",
    handle: "kittipong-design",
    headline: "Graphic designer for brands and packaging",
    bio: "I design logos, packaging and social posts for small Thai brands. I work fast in Figma and Illustrator and love Thai typography. Deaf — I communicate by chat, email and Thai Sign Language.",
    province: "Chiang Mai",
    country: "TH",
    languages: ["Thai", "Thai Sign Language", "English"],
    workMode: "HYBRID",
    availability: ["FREELANCE", "PROJECT"],
    skills: [
      "Graphic design",
      "Figma",
      "Adobe Illustrator",
      "Branding",
      "Packaging design",
      "Thai typography",
    ],
    specialTalents: "Hand lettering in Thai scripts",
    workSetupNeeds: "Chat or email instead of phone calls; sign-language-friendly meetings",
    dobYear: 1993,
    showAge: false,
    education: [
      { level: "Bachelor's degree", school: "Chiang Mai University", field: "Fine Arts", yearEnd: 2015 },
    ],
    certificates: [
      { kind: "TRAINING", title: "Brand identity design", issuer: "Sample design academy", year: 2021 },
    ],
    portfolio: [
      {
        title: "Doi Coffee packaging",
        description: "Bag and label system for a hill-tribe coffee cooperative.",
        art: 2,
      },
      {
        title: "Lanna festival posters",
        description: "Poster series using a custom Thai display face.",
        art: 3,
      },
    ],
    posts: [
      { kind: "PHOTO", text: "Packaging mockups for a small coffee roaster in Mae Rim.", art: 2, daysAgo: 2 },
      { kind: "WORK", text: "Open for two new branding projects from December.", daysAgo: 9 },
    ],
    stats: { completedJobs: 48, rehires: 15, responseMins: 60 },
    cover: 2,
    contacts: [
      { kind: "INSTAGRAM", value: "kittipong.sample", visibility: "PUBLIC" },
      { kind: "WEBSITE", value: "https://kittipong.able.example", visibility: "PUBLIC" },
      { kind: "EMAIL", value: "kittipong.sample@able.example", visibility: "CHAT_ONLY" },
    ],
  },
  {
    key: "ananya",
    firstName: "Ananya",
    lastName: "Rattanakul",
    displayName: "Ananya Rattanakul",
    handle: "ananya-data",
    headline: "Data analyst — SQL, Power BI, Python",
    bio: "I turn messy sales and operations data into dashboards people actually use. Comfortable with SQL, Power BI and Python. I work best remotely with flexible hours.",
    province: "Nonthaburi",
    country: "TH",
    languages: ["Thai", "English"],
    workMode: "REMOTE",
    availability: ["FULL_TIME"],
    skills: ["SQL", "Power BI", "Python", "Excel", "Data visualization", "Data cleaning"],
    workSetupNeeds: "Flexible hours and a height-adjustable desk if on-site",
    dobYear: 1998,
    showAge: true,
    education: [
      { level: "Master's degree", school: "Chulalongkorn University", field: "Statistics", yearEnd: 2022 },
      { level: "Bachelor's degree", school: "Kasetsart University", field: "Economics", yearEnd: 2020 },
    ],
    certificates: [
      {
        kind: "TRAINING",
        title: "Data analytics professional certificate",
        issuer: "Sample online course provider",
        year: 2023,
      },
    ],
    portfolio: [
      {
        title: "Retail sales dashboard",
        description: "Power BI dashboard tracking 120 stores' daily sales and stock.",
        art: 4,
      },
    ],
    posts: [
      {
        kind: "WORK",
        text: "Shared a Power BI template for small shops to track daily sales. Free to use.",
        art: 4,
        daysAgo: 5,
      },
    ],
    stats: { completedJobs: 12, rehires: 4, responseMins: 40 },
    cover: 3,
    contacts: [
      { kind: "LINKEDIN", value: "https://www.linkedin.com/in/sample-ananya", visibility: "PUBLIC" },
      { kind: "EMAIL", value: "ananya.sample@able.example", visibility: "CHAT_ONLY" },
    ],
  },
  {
    key: "somchai",
    firstName: "Somchai",
    lastName: "Boonmee",
    displayName: "Somchai Boonmee",
    handle: "somchai-books",
    headline: "Bookkeeper and payroll for small businesses",
    bio: "Ten years keeping the books for shops, clinics and guesthouses. Express, Excel, VAT and payroll. Wheelchair user — I prefer remote work or step-free offices.",
    province: "Khon Kaen",
    country: "TH",
    languages: ["Thai", "Isan"],
    workMode: "REMOTE",
    availability: ["PART_TIME", "FREELANCE"],
    skills: ["Bookkeeping", "Payroll", "Express accounting", "Excel", "VAT filing", "Invoicing"],
    workSetupNeeds: "Step-free access if on-site",
    dobYear: 1984,
    showAge: false,
    education: [
      {
        level: "Vocational certificate (Higher)",
        school: "Khon Kaen Technical College",
        field: "Accounting",
        yearEnd: 2005,
      },
    ],
    certificates: [
      { kind: "EMPLOYMENT", title: "Accountant, 2012–2020", issuer: "Sample guesthouse group", year: 2020 },
      {
        kind: "TRAINING",
        title: "Payroll and social security filing",
        issuer: "Sample accounting school",
        year: 2019,
      },
    ],
    portfolio: [],
    posts: [
      {
        kind: "WORK",
        text: "Closed the year-end books for three clients this month, all on time.",
        daysAgo: 12,
      },
    ],
    stats: { completedJobs: 57, rehires: 22, responseMins: 90 },
    cover: 4,
    contacts: [{ kind: "PHONE", value: "+66 80 000 0004", visibility: "CHAT_ONLY" }],
  },
  {
    key: "nok",
    firstName: "Nok",
    lastName: "Chaiyaporn",
    displayName: "Nok Chaiyaporn",
    handle: "nok-edits",
    headline: "Video editor and subtitler",
    bio: "I edit YouTube and TikTok videos and write accurate Thai and English subtitles. I care a lot about captions — good captions help everyone watch.",
    province: "Bangkok",
    country: "TH",
    languages: ["Thai", "English"],
    workMode: "REMOTE",
    availability: ["FREELANCE", "PROJECT"],
    skills: ["Video editing", "Premiere Pro", "Subtitling", "Motion graphics", "CapCut", "Color grading"],
    dobYear: 2000,
    showAge: true,
    education: [
      {
        level: "Bachelor's degree",
        school: "Bangkok University",
        field: "Communication Arts",
        yearEnd: 2022,
      },
    ],
    certificates: [
      { kind: "TRAINING", title: "Professional subtitling", issuer: "Sample media institute", year: 2023 },
    ],
    portfolio: [
      {
        title: "Cooking channel edits",
        description: "Weekly edits and bilingual captions for a 200k-subscriber cooking channel.",
        art: 5,
      },
    ],
    posts: [
      {
        kind: "PHOTO",
        text: "Behind the scenes: my caption workflow for a cooking show.",
        art: 5,
        daysAgo: 1,
      },
      { kind: "WORK", text: "Booking January projects now.", daysAgo: 15 },
    ],
    stats: { completedJobs: 26, rehires: 11, responseMins: 30 },
    cover: 5,
    contacts: [
      { kind: "TIKTOK", value: "nok.edits.sample", visibility: "PUBLIC" },
      { kind: "EMAIL", value: "nok.sample@able.example", visibility: "CHAT_ONLY" },
    ],
  },
  {
    key: "daniel",
    firstName: "Daniel",
    lastName: "Okafor",
    displayName: "Daniel Okafor",
    handle: "daniel-okafor",
    headline: "Front-end developer focused on accessibility",
    bio: "I build fast, accessible web apps with TypeScript and React. I test everything with a keyboard and a screen reader. Based in Bangkok, open to remote teams anywhere.",
    province: "Bangkok",
    country: "TH",
    languages: ["English", "Thai"],
    workMode: "ANY",
    availability: ["FULL_TIME", "PROJECT"],
    skills: ["TypeScript", "React", "Next.js", "Accessibility testing", "CSS", "Node.js"],
    dobYear: 1991,
    showAge: false,
    education: [
      { level: "Bachelor's degree", school: "University of Lagos", field: "Computer Science", yearEnd: 2013 },
    ],
    certificates: [
      {
        kind: "TRAINING",
        title: "Web accessibility specialist",
        issuer: "Sample accessibility association",
        year: 2022,
      },
    ],
    portfolio: [
      {
        title: "Clinic booking app",
        description: "Accessible booking flow; WCAG 2.2 AA, 98 Lighthouse accessibility score.",
        art: 6,
        link: "https://example.com",
      },
    ],
    posts: [
      { kind: "WORK", text: "Wrote up 10 quick accessibility fixes for React forms.", art: 6, daysAgo: 4 },
    ],
    stats: { completedJobs: 19, rehires: 6, responseMins: 45 },
    cover: 6,
    contacts: [
      { kind: "LINKEDIN", value: "https://www.linkedin.com/in/sample-daniel", visibility: "PUBLIC" },
      { kind: "WEBSITE", value: "https://daniel.able.example", visibility: "PUBLIC" },
    ],
  },
  {
    key: "preeya",
    firstName: "Preeya",
    lastName: "Thongdee",
    displayName: "Preeya Thongdee",
    handle: "preeya-tsl",
    headline: "Thai Sign Language teacher and interpreter",
    bio: "I teach Thai Sign Language to teams and interpret meetings and events. I also make short TSL lessons for social media.",
    province: "Nakhon Pathom",
    country: "TH",
    languages: ["Thai Sign Language", "Thai"],
    workMode: "HYBRID",
    availability: ["PART_TIME", "PROJECT"],
    skills: ["Thai Sign Language", "Interpreting", "Teaching", "Content creation", "Workshop facilitation"],
    dobYear: 1989,
    showAge: false,
    education: [
      {
        level: "Bachelor's degree",
        school: "Ratchasuda College, Mahidol University",
        field: "Sign language interpreting",
        yearEnd: 2011,
      },
    ],
    certificates: [
      {
        kind: "OTHER",
        title: "Registered sign language interpreter",
        issuer: "Sample interpreters association",
        year: 2015,
      },
    ],
    portfolio: [
      { title: "TSL basics for offices", description: "A 6-session course taught to 14 companies.", art: 7 },
    ],
    posts: [
      {
        kind: "PHOTO",
        text: "Workshop day: 30 hotel staff learned greetings and service phrases in TSL.",
        art: 7,
        daysAgo: 6,
      },
    ],
    stats: { completedJobs: 40, rehires: 18, responseMins: 120 },
    cover: 7,
    contacts: [{ kind: "FACEBOOK", value: "https://facebook.com/sample.preeya", visibility: "PUBLIC" }],
  },
  {
    key: "wichai",
    firstName: "Wichai",
    lastName: "Saelim",
    displayName: "Wichai Saelim",
    handle: "wichai-qa",
    headline: "Software tester — screen reader and manual QA",
    bio: "Blind since birth, I test apps and websites with VoiceOver, TalkBack and NVDA, and write clear bug reports in Jira. I find the problems your users will hit first.",
    province: "Pathum Thani",
    country: "TH",
    languages: ["Thai", "English"],
    workMode: "REMOTE",
    availability: ["FULL_TIME", "FREELANCE"],
    skills: ["Manual testing", "Screen reader testing", "VoiceOver", "NVDA", "Jira", "Accessibility audits"],
    workSetupNeeds: "Screen reader; documents in accessible formats",
    dobYear: 1995,
    showAge: true,
    education: [
      {
        level: "Bachelor's degree",
        school: "Thammasat University",
        field: "Information Technology",
        yearEnd: 2017,
      },
    ],
    certificates: [
      { kind: "EMPLOYMENT", title: "QA tester, 2018–2023", issuer: "Sample banking app team", year: 2023 },
    ],
    portfolio: [
      {
        title: "Banking app audit",
        description: "Found 84 accessibility issues before launch; all fixed.",
        art: 8,
      },
    ],
    posts: [
      {
        kind: "WORK",
        text: "Audited a food delivery app this week. Biggest issue: unlabeled buttons. Easy to fix!",
        daysAgo: 2,
      },
    ],
    stats: { completedJobs: 22, rehires: 8, responseMins: 20 },
    cover: 8,
    contacts: [{ kind: "EMAIL", value: "wichai.sample@able.example", visibility: "CHAT_ONLY" }],
  },
  {
    key: "linmei",
    firstName: "Lin Mei",
    lastName: "Chen",
    displayName: "Lin Mei Chen",
    handle: "linmei-translates",
    headline: "Chinese–Thai–English translator",
    bio: "I translate product listings, contracts and websites between Chinese, Thai and English, and proofread for natural, correct wording.",
    province: "Bangkok",
    country: "TH",
    languages: ["Mandarin Chinese", "Thai", "English"],
    workMode: "REMOTE",
    availability: ["FREELANCE"],
    skills: ["Translation", "Proofreading", "Localization", "Mandarin Chinese", "Thai–English translation"],
    dobYear: 1990,
    showAge: false,
    education: [
      {
        level: "Bachelor's degree",
        school: "Mae Fah Luang University",
        field: "Chinese Studies",
        yearEnd: 2012,
      },
    ],
    certificates: [
      { kind: "OTHER", title: "HSK Level 6", issuer: "Sample language testing center", year: 2014 },
    ],
    portfolio: [],
    posts: [
      {
        kind: "WORK",
        text: "Localized 400 product listings for a cross-border shop this month.",
        daysAgo: 8,
      },
    ],
    stats: { completedJobs: 64, rehires: 25, responseMins: 35 },
    cover: 1,
    contacts: [{ kind: "LINE", value: "linmei.sample", visibility: "CHAT_ONLY" }],
  },
  {
    key: "arthit",
    firstName: "Arthit",
    lastName: "Phromma",
    displayName: "Arthit Phromma",
    handle: "arthit-wood",
    headline: "Furniture maker and online shop seller",
    bio: "I make small teak furniture and home goods, photograph them myself, and sell on Shopee and Facebook. Looking for workshop or e-commerce roles.",
    province: "Lampang",
    country: "TH",
    languages: ["Thai"],
    workMode: "ONSITE",
    availability: ["FULL_TIME", "PART_TIME"],
    skills: ["Woodworking", "Furniture making", "Product photography", "Shopee", "Facebook Marketplace"],
    specialTalents: "Traditional Lanna wood carving",
    dobYear: 1987,
    showAge: false,
    education: [{ level: "Secondary school", school: "Lampang Kanlayanee School", yearEnd: 2005 }],
    certificates: [
      {
        kind: "TRAINING",
        title: "Online selling for craftspeople",
        issuer: "Sample community college",
        year: 2021,
      },
    ],
    portfolio: [
      {
        title: "Teak side tables",
        description: "A best-selling line of small tables, 300+ sold online.",
        art: 9,
      },
    ],
    posts: [
      { kind: "PHOTO", text: "New batch of side tables, finished with natural oil.", art: 9, daysAgo: 3 },
    ],
    stats: { completedJobs: 15, rehires: 3, responseMins: 180 },
    cover: 2,
    contacts: [{ kind: "FACEBOOK", value: "https://facebook.com/sample.arthit", visibility: "PUBLIC" }],
  },
  {
    key: "siriporn",
    firstName: "Siriporn",
    lastName: "Kaewmanee",
    displayName: "Siriporn Kaewmanee",
    handle: "siriporn-hr",
    headline: "HR coordinator — recruitment and onboarding",
    bio: "I run hiring pipelines end to end: job posts, screening, interviews and onboarding. I've helped two companies build inclusive hiring practices.",
    province: "Chonburi",
    country: "TH",
    languages: ["Thai", "English"],
    workMode: "HYBRID",
    availability: ["FULL_TIME"],
    skills: ["Recruitment", "Onboarding", "HRIS", "Interviewing", "Inclusive hiring", "Excel"],
    workSetupNeeds: "Flexible hours for medical appointments",
    dobYear: 1992,
    showAge: true,
    education: [
      {
        level: "Bachelor's degree",
        school: "Burapha University",
        field: "Human Resource Management",
        yearEnd: 2014,
      },
    ],
    certificates: [
      {
        kind: "EMPLOYMENT",
        title: "HR officer, 2015–2024",
        issuer: "Sample manufacturing company",
        year: 2024,
      },
    ],
    portfolio: [],
    posts: [
      {
        kind: "WORK",
        text: "Ran an inclusive hiring workshop for line managers — notes in my portfolio soon.",
        daysAgo: 10,
      },
    ],
    stats: { completedJobs: 8, rehires: 2, responseMins: 50 },
    cover: 3,
    contacts: [
      { kind: "LINKEDIN", value: "https://www.linkedin.com/in/sample-siriporn", visibility: "PUBLIC" },
    ],
  },
  {
    key: "maya",
    firstName: "Maya",
    lastName: "Fernandes",
    displayName: "Maya Fernandes",
    handle: "maya-words",
    headline: "UX writer and content designer",
    bio: "I write clear interface copy and help teams use plain language. I've localized apps for Thai and Southeast Asian users.",
    province: "Phuket",
    country: "TH",
    languages: ["English", "Portuguese", "Thai"],
    workMode: "REMOTE",
    availability: ["FREELANCE", "PROJECT"],
    skills: ["UX writing", "Content design", "Plain language", "Localization", "Figma"],
    workSetupNeeds: "Captions on video calls",
    dobYear: 1994,
    showAge: false,
    education: [
      { level: "Bachelor's degree", school: "University of Lisbon", field: "Linguistics", yearEnd: 2016 },
    ],
    certificates: [{ kind: "TRAINING", title: "Content design", issuer: "Sample UX school", year: 2020 }],
    portfolio: [
      { title: "Wallet app copy", description: "Rewrote onboarding copy; completion up 18%.", art: 10 },
    ],
    posts: [
      {
        kind: "WORK",
        text: "Tiny copy change, big result: 'Continue' → 'Send code' cut drop-off on a sign-up screen.",
        daysAgo: 7,
      },
    ],
    stats: { completedJobs: 21, rehires: 7, responseMins: 70 },
    cover: 4,
    contacts: [{ kind: "WEBSITE", value: "https://maya.able.example", visibility: "PUBLIC" }],
  },
];

export interface SampleOrg {
  key: string;
  type: OrgTypeT;
  name: string;
  handle: string;
  description: string;
  industry: string;
  province: string;
  employeeCount: number;
  currentHires?: number;
  website?: string;
  verified: boolean;
  cover: number;
  needs: {
    title: string;
    skills: string[];
    workMode: WorkModeT;
    location?: string;
    employmentType: AvailabilityT;
    educationLevel?: string;
    ageMin?: number;
    ageMax?: number;
    offeredSetup: string[];
    description: string;
  }[];
}

export const sampleOrgs: SampleOrg[] = [
  // Individuals
  {
    key: "pim-bakery",
    type: "INDIVIDUAL",
    name: "Pim’s Home Bakery",
    handle: "pims-bakery",
    description: "A home bakery selling cakes and cookies online in Bangkok.",
    industry: "Food & beverage",
    province: "Bangkok",
    employeeCount: 2,
    verified: false,
    cover: 5,
    needs: [
      {
        title: "Online shop assistant",
        skills: ["Customer support", "Live chat", "Shopee"],
        workMode: "REMOTE",
        employmentType: "PART_TIME",
        offeredSetup: ["REMOTE", "FLEXIBLE_HOURS"],
        description: "Answer LINE and Shopee chats and take orders, about 4 hours a day.",
      },
    ],
  },
  {
    key: "narin-arch",
    type: "INDIVIDUAL",
    name: "Narin Studio (freelance architect)",
    handle: "narin-studio",
    description: "Independent architect designing homes and small cafés.",
    industry: "Architecture",
    province: "Chiang Mai",
    employeeCount: 1,
    verified: false,
    cover: 6,
    needs: [
      {
        title: "Presentation designer",
        skills: ["Graphic design", "Figma", "Adobe Illustrator"],
        workMode: "REMOTE",
        employmentType: "PROJECT",
        offeredSetup: ["REMOTE", "FLEXIBLE_HOURS"],
        description: "Turn sketches into clean client presentation boards.",
      },
    ],
  },
  {
    key: "somsak-farm",
    type: "INDIVIDUAL",
    name: "Somsak Family Farmstay",
    handle: "somsak-farmstay",
    description: "A small farmstay welcoming families in Khao Yai.",
    industry: "Hospitality",
    province: "Nakhon Ratchasima",
    employeeCount: 4,
    verified: false,
    cover: 7,
    needs: [
      {
        title: "Bookings and accounts helper",
        skills: ["Bookkeeping", "Excel", "Customer support"],
        workMode: "ANY",
        employmentType: "PART_TIME",
        offeredSetup: ["REMOTE", "STEP_FREE"],
        description: "Keep booking records and simple accounts.",
      },
    ],
  },
  {
    key: "kanya-shop",
    type: "INDIVIDUAL",
    name: "Kanya Handmade",
    handle: "kanya-handmade",
    description: "Handmade bags and accessories sold on Instagram and Shopee.",
    industry: "Retail",
    province: "Bangkok",
    employeeCount: 1,
    verified: false,
    cover: 8,
    needs: [
      {
        title: "Product photographer",
        skills: ["Product photography", "Instagram", "Photo editing"],
        workMode: "HYBRID",
        employmentType: "FREELANCE",
        offeredSetup: ["FLEXIBLE_HOURS"],
        description: "Shoot 20 products a month at home studio or your place.",
      },
    ],
  },
  {
    key: "tomjoy-photo",
    type: "INDIVIDUAL",
    name: "Tom & Joy Photography",
    handle: "tomjoy-photo",
    description: "Wedding and event photographers in Phuket.",
    industry: "Media",
    province: "Phuket",
    employeeCount: 2,
    verified: false,
    cover: 1,
    needs: [
      {
        title: "Video editor",
        skills: ["Video editing", "Premiere Pro", "Color grading"],
        workMode: "REMOTE",
        employmentType: "FREELANCE",
        offeredSetup: ["REMOTE", "FLEXIBLE_HOURS"],
        description: "Edit wedding highlight films, 2–4 per month.",
      },
    ],
  },
  // Associations / NGOs
  {
    key: "open-doors",
    type: "ASSOCIATION",
    name: "Open Doors Foundation",
    handle: "open-doors",
    description: "A foundation running job training and placement programmes.",
    industry: "Non-profit",
    province: "Bangkok",
    employeeCount: 35,
    verified: true,
    cover: 2,
    needs: [
      {
        title: "Programme coordinator",
        skills: ["Workshop facilitation", "Recruitment", "Excel"],
        workMode: "HYBRID",
        employmentType: "FULL_TIME",
        educationLevel: "Bachelor's degree",
        offeredSetup: ["FLEXIBLE_HOURS", "STEP_FREE", "SCREEN_READER", "SIGN_LANGUAGE"],
        description: "Coordinate training cohorts and partner employers.",
      },
    ],
  },
  {
    key: "inclusive-sports",
    type: "ASSOCIATION",
    name: "Bangkok Inclusive Sports Club",
    handle: "inclusive-sports",
    description: "A volunteer-run club for wheelchair basketball, boccia and swimming.",
    industry: "Sports",
    province: "Bangkok",
    employeeCount: 8,
    verified: true,
    cover: 3,
    needs: [
      {
        title: "Social media content creator",
        skills: ["Content creation", "Video editing", "CapCut"],
        workMode: "HYBRID",
        employmentType: "PART_TIME",
        offeredSetup: ["FLEXIBLE_HOURS", "STEP_FREE"],
        description: "Film and post match highlights and member stories.",
      },
    ],
  },
  {
    key: "tsl-network",
    type: "ASSOCIATION",
    name: "Thai Sign Language Network",
    handle: "tsl-network",
    description: "A network promoting Thai Sign Language in schools and workplaces.",
    industry: "Education",
    province: "Nakhon Pathom",
    employeeCount: 12,
    verified: true,
    cover: 4,
    needs: [
      {
        title: "TSL course instructor",
        skills: ["Thai Sign Language", "Teaching", "Workshop facilitation"],
        workMode: "ONSITE",
        location: "Nakhon Pathom",
        employmentType: "PART_TIME",
        offeredSetup: ["SIGN_LANGUAGE", "FLEXIBLE_HOURS"],
        description: "Teach evening TSL classes for office workers.",
      },
    ],
  },
  {
    key: "green-hands",
    type: "ASSOCIATION",
    name: "Green Hands Community Association",
    handle: "green-hands",
    description: "Community gardens and recycling projects in Khon Kaen.",
    industry: "Environment",
    province: "Khon Kaen",
    employeeCount: 15,
    verified: false,
    cover: 5,
    needs: [
      {
        title: "Part-time bookkeeper",
        skills: ["Bookkeeping", "Excel", "Invoicing"],
        workMode: "REMOTE",
        employmentType: "PART_TIME",
        offeredSetup: ["REMOTE", "FLEXIBLE_HOURS"],
        description: "Monthly accounts and donor reports.",
      },
    ],
  },
  {
    key: "silver-line",
    type: "ASSOCIATION",
    name: "Silver Line Volunteers",
    handle: "silver-line",
    description: "Phone and chat companionship for older people living alone.",
    industry: "Social services",
    province: "Chonburi",
    employeeCount: 20,
    verified: false,
    cover: 6,
    needs: [
      {
        title: "Chat support volunteer lead",
        skills: ["Customer support", "Live chat", "Complaint handling"],
        workMode: "REMOTE",
        employmentType: "PART_TIME",
        offeredSetup: ["REMOTE", "SCREEN_READER", "FLEXIBLE_HOURS"],
        description: "Lead a team of chat volunteers, paid part-time role.",
      },
    ],
  },
  // Startups
  {
    key: "kinnow",
    type: "STARTUP",
    name: "Kinnow Labs",
    handle: "kinnow-labs",
    description: "Learning apps for Thai primary schools.",
    industry: "Education technology",
    province: "Bangkok",
    employeeCount: 28,
    verified: true,
    cover: 7,
    website: "https://kinnow.able.example",
    needs: [
      {
        title: "Accessibility QA tester",
        skills: ["Manual testing", "Screen reader testing", "VoiceOver", "Jira"],
        workMode: "REMOTE",
        employmentType: "FULL_TIME",
        offeredSetup: ["REMOTE", "SCREEN_READER", "FLEXIBLE_HOURS"],
        description: "Test our apps with screen readers and keyboard before each release.",
      },
      {
        title: "Front-end developer",
        skills: ["TypeScript", "React", "Accessibility testing", "CSS"],
        workMode: "HYBRID",
        employmentType: "FULL_TIME",
        educationLevel: "Bachelor's degree",
        offeredSetup: ["REMOTE", "FLEXIBLE_HOURS", "STEP_FREE"],
        description: "Build accessible lesson screens in React.",
      },
    ],
  },
  {
    key: "payleaf",
    type: "STARTUP",
    name: "PayLeaf",
    handle: "payleaf",
    description: "Simple payment links for small shops.",
    industry: "Fintech",
    province: "Bangkok",
    employeeCount: 40,
    verified: true,
    cover: 8,
    needs: [
      {
        title: "Customer support specialist (TH/EN)",
        skills: ["Customer support", "Zendesk", "Thai–English translation", "Live chat"],
        workMode: "REMOTE",
        employmentType: "FULL_TIME",
        ageMin: 22,
        ageMax: 40,
        offeredSetup: ["REMOTE", "SCREEN_READER", "FLEXIBLE_HOURS"],
        description: "Help merchants by chat and email in Thai and English.",
      },
    ],
  },
  {
    key: "routewise",
    type: "STARTUP",
    name: "RouteWise",
    handle: "routewise",
    description: "Route planning software for delivery fleets.",
    industry: "Logistics technology",
    province: "Pathum Thani",
    employeeCount: 22,
    verified: false,
    cover: 1,
    needs: [
      {
        title: "Junior data analyst",
        skills: ["SQL", "Python", "Data visualization", "Excel"],
        workMode: "REMOTE",
        employmentType: "FULL_TIME",
        educationLevel: "Bachelor's degree",
        offeredSetup: ["REMOTE", "FLEXIBLE_HOURS"],
        description: "Analyse delivery data and build weekly reports.",
      },
    ],
  },
  {
    key: "lumen",
    type: "STARTUP",
    name: "Lumen Health",
    handle: "lumen-health",
    description: "Telehealth for clinics outside Bangkok.",
    industry: "Health technology",
    province: "Chiang Mai",
    employeeCount: 18,
    verified: true,
    cover: 2,
    needs: [
      {
        title: "UX writer (Thai and English)",
        skills: ["UX writing", "Plain language", "Localization"],
        workMode: "REMOTE",
        employmentType: "PROJECT",
        offeredSetup: ["REMOTE", "FLEXIBLE_HOURS"],
        description: "Rewrite patient-facing app copy in plain Thai and English.",
      },
    ],
  },
  {
    key: "craftly",
    type: "STARTUP",
    name: "Craftly Market",
    handle: "craftly",
    description: "An online marketplace for Thai handmade goods.",
    industry: "E-commerce",
    province: "Chiang Mai",
    employeeCount: 15,
    verified: false,
    cover: 3,
    needs: [
      {
        title: "Translator for product listings",
        skills: ["Translation", "Mandarin Chinese", "Thai–English translation", "Proofreading"],
        workMode: "REMOTE",
        employmentType: "FREELANCE",
        offeredSetup: ["REMOTE", "FLEXIBLE_HOURS"],
        description: "Translate listings to English and Chinese.",
      },
    ],
  },
  // Private companies
  {
    key: "siam-harbor",
    type: "PRIVATE_COMPANY",
    name: "Siam Harbor Logistics Co., Ltd.",
    handle: "siam-harbor",
    description: "Freight forwarding and warehousing across Thailand.",
    industry: "Logistics",
    province: "Chonburi",
    employeeCount: 320,
    currentHires: 1,
    verified: true,
    cover: 4,
    needs: [
      {
        title: "HR recruitment officer",
        skills: ["Recruitment", "Interviewing", "Inclusive hiring", "HRIS"],
        workMode: "ONSITE",
        location: "Laem Chabang",
        employmentType: "FULL_TIME",
        educationLevel: "Bachelor's degree",
        offeredSetup: ["STEP_FREE", "FLEXIBLE_HOURS"],
        description: "Lead hiring for warehouse and office teams.",
      },
    ],
  },
  {
    key: "cp-hotels",
    type: "PRIVATE_COMPANY",
    name: "Riverside Hotels Group",
    handle: "riverside-hotels",
    description: "Five hotels along the river in Bangkok and Ayutthaya.",
    industry: "Hospitality",
    province: "Bangkok",
    employeeCount: 540,
    currentHires: 3,
    verified: true,
    cover: 5,
    needs: [
      {
        title: "Guest relations (chat and email)",
        skills: ["Customer support", "Live chat", "Thai–English translation", "Complaint handling"],
        workMode: "HYBRID",
        employmentType: "FULL_TIME",
        offeredSetup: ["STEP_FREE", "SCREEN_READER", "SIGN_LANGUAGE"],
        description: "Handle guest messages before and after stays.",
      },
    ],
  },
  {
    key: "northstar",
    type: "PRIVATE_COMPANY",
    name: "NorthStar Accounting Co., Ltd.",
    handle: "northstar-accounting",
    description: "Accounting services for SMEs in the North-East.",
    industry: "Professional services",
    province: "Khon Kaen",
    employeeCount: 60,
    verified: true,
    cover: 6,
    needs: [
      {
        title: "Bookkeeper",
        skills: ["Bookkeeping", "Express accounting", "VAT filing", "Payroll"],
        workMode: "REMOTE",
        employmentType: "FULL_TIME",
        educationLevel: "Vocational certificate (Higher)",
        offeredSetup: ["REMOTE", "STEP_FREE"],
        description: "Manage books for 15–20 SME clients.",
      },
    ],
  },
  {
    key: "baan-ceramics",
    type: "PRIVATE_COMPANY",
    name: "Baan Ceramics Co., Ltd.",
    handle: "baan-ceramics",
    description: "Handmade ceramics exported to Japan and Europe.",
    industry: "Manufacturing",
    province: "Lampang",
    employeeCount: 140,
    currentHires: 0,
    verified: false,
    cover: 7,
    needs: [
      {
        title: "Workshop craftsperson",
        skills: ["Woodworking", "Product photography", "Furniture making"],
        workMode: "ONSITE",
        location: "Lampang",
        employmentType: "FULL_TIME",
        offeredSetup: ["STEP_FREE"],
        description: "Make display stands and packaging crates; shoot product photos.",
      },
    ],
  },
  {
    key: "metro-retail",
    type: "PRIVATE_COMPANY",
    name: "Metro Retail Thailand Co., Ltd.",
    handle: "metro-retail",
    description: "Supermarkets and convenience stores nationwide.",
    industry: "Retail",
    province: "Bangkok",
    employeeCount: 2400,
    currentHires: 12,
    verified: true,
    cover: 8,
    needs: [
      {
        title: "Sales data analyst",
        skills: ["SQL", "Power BI", "Excel", "Data cleaning"],
        workMode: "HYBRID",
        employmentType: "FULL_TIME",
        educationLevel: "Bachelor's degree",
        ageMin: 23,
        ageMax: 35,
        offeredSetup: ["REMOTE", "FLEXIBLE_HOURS", "STEP_FREE", "SCREEN_READER"],
        description: "Build store performance dashboards.",
      },
    ],
  },
  // Government agencies (fictional)
  {
    key: "gov-digital",
    type: "GOVERNMENT",
    name: "Office of Digital Public Services",
    handle: "digital-services-office",
    description: "A fictional agency used for demo purposes: building online public services.",
    industry: "Government",
    province: "Bangkok",
    employeeCount: 210,
    currentHires: 1,
    verified: true,
    cover: 1,
    needs: [
      {
        title: "Accessibility tester for public websites",
        skills: ["Accessibility audits", "Screen reader testing", "NVDA", "Manual testing"],
        workMode: "HYBRID",
        employmentType: "FULL_TIME",
        educationLevel: "Bachelor's degree",
        offeredSetup: ["SCREEN_READER", "STEP_FREE", "FLEXIBLE_HOURS"],
        description: "Test government websites against WCAG 2.2.",
      },
    ],
  },
  {
    key: "gov-library",
    type: "GOVERNMENT",
    name: "Municipal Library Network",
    handle: "library-network",
    description: "A fictional city library network for demo purposes.",
    industry: "Government",
    province: "Chiang Mai",
    employeeCount: 130,
    verified: true,
    cover: 2,
    needs: [
      {
        title: "Digital content assistant",
        skills: ["Content creation", "Subtitling", "Video editing"],
        workMode: "ONSITE",
        location: "Chiang Mai",
        employmentType: "PART_TIME",
        offeredSetup: ["STEP_FREE", "SIGN_LANGUAGE"],
        description: "Make captioned videos about library services.",
      },
    ],
  },
  {
    key: "gov-tourism",
    type: "GOVERNMENT",
    name: "Provincial Tourism Office",
    handle: "tourism-office",
    description: "A fictional provincial tourism office for demo purposes.",
    industry: "Government",
    province: "Phuket",
    employeeCount: 90,
    verified: true,
    cover: 3,
    needs: [
      {
        title: "Translator (Chinese, English)",
        skills: ["Translation", "Mandarin Chinese", "Proofreading"],
        workMode: "REMOTE",
        employmentType: "PROJECT",
        offeredSetup: ["REMOTE", "FLEXIBLE_HOURS"],
        description: "Translate visitor guides and signage text.",
      },
    ],
  },
  {
    key: "gov-health-data",
    type: "GOVERNMENT",
    name: "Public Health Data Center",
    handle: "health-data-center",
    description: "A fictional public health data unit for demo purposes.",
    industry: "Government",
    province: "Nonthaburi",
    employeeCount: 160,
    verified: true,
    cover: 4,
    needs: [
      {
        title: "Data analyst",
        skills: ["SQL", "Python", "Data visualization", "Power BI"],
        workMode: "HYBRID",
        employmentType: "FULL_TIME",
        educationLevel: "Master's degree",
        offeredSetup: ["FLEXIBLE_HOURS", "STEP_FREE", "SCREEN_READER"],
        description: "Analyse clinic visit data for monthly reports.",
      },
    ],
  },
  {
    key: "gov-transport",
    type: "GOVERNMENT",
    name: "City Transport Authority",
    handle: "city-transport",
    description: "A fictional city transport authority for demo purposes.",
    industry: "Government",
    province: "Bangkok",
    employeeCount: 1200,
    currentHires: 8,
    verified: true,
    cover: 5,
    needs: [
      {
        title: "Passenger support (chat)",
        skills: ["Customer support", "Live chat", "Complaint handling"],
        workMode: "REMOTE",
        employmentType: "FULL_TIME",
        offeredSetup: ["REMOTE", "SCREEN_READER", "SIGN_LANGUAGE", "FLEXIBLE_HOURS"],
        description: "Answer passenger questions on chat and social media.",
      },
    ],
  },
];

/** Sample reviews: [talentKey, orgKey, rating, text]. */
export const sampleReviews: [string, string, number, string][] = [
  ["mali", "payleaf", 5, "Mali handled our busiest month calmly and our merchants loved her replies."],
  ["mali", "pim-bakery", 5, "Fast, kind and organised. Orders never got lost."],
  ["mali", "cp-hotels", 4, "Great written English and Thai. Would hire again."],
  ["kittipong", "narin-arch", 5, "Beautiful boards, delivered early."],
  ["kittipong", "craftly", 5, "Our new packaging gets compliments every week."],
  ["ananya", "routewise", 5, "Clear dashboards and great questions about the data."],
  ["somchai", "green-hands", 5, "Our donor reports are finally on time."],
  ["somchai", "northstar", 4, "Accurate and reliable bookkeeping."],
  ["nok", "tomjoy-photo", 5, "Lovely edits; couples cried happy tears."],
  ["daniel", "kinnow", 5, "Raised our accessibility bar for the whole team."],
  ["preeya", "tsl-network", 5, "Students adore her classes."],
  ["preeya", "cp-hotels", 5, "Our staff can now greet Deaf guests properly."],
  ["wichai", "gov-digital", 5, "Found issues no automated tool caught."],
  ["wichai", "kinnow", 5, "Clear, reproducible bug reports."],
  ["linmei", "craftly", 5, "Natural translations, quick turnaround."],
  ["linmei", "gov-tourism", 4, "Careful work on our visitor guides."],
  ["arthit", "baan-ceramics", 4, "Skilled hands and good photos."],
  ["maya", "lumen", 5, "Patients understand our app now."],
];

/** Labels for the "accessible workplace setup we can offer" checklist. */
export const offeredSetupKeys = [
  "REMOTE",
  "FLEXIBLE_HOURS",
  "SCREEN_READER",
  "STEP_FREE",
  "SIGN_LANGUAGE",
  "OTHER",
] as const;
