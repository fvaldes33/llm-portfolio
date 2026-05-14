export type LocationKey = "miami" | "charlottesville" | "charlotte";

export type Location = {
  key: LocationKey;
  city: string;
  state: string;
  years: string;
  headline: string;
  story: string;
  x: number;
  y: number;
};

export const LOCATIONS: Location[] = [
  {
    key: "miami",
    city: "Miami",
    state: "FL",
    years: "1988 – 2007",
    headline: "Born and raised. Cuban-American, son of immigrants.",
    story:
      "Born to two Cuban immigrant parents who worked extremely hard to give me what I needed. The neighborhood was poor and the parenting was relentless — there was no option to give up, only to move forward. My dad's favorite word was tenacity. He named my Optimist baseball team Tenacity.",
    x: 108,
    y: 574,
  },
  {
    key: "charlottesville",
    city: "Charlottesville",
    state: "VA",
    years: "2009 – 2012",
    headline: "UVA. First Cavaliers team to make the College World Series.",
    story:
      "After getting drafted out of high school I went JUCO at Broward for a year, then UVA's pitching coach found me in Miami after their catcher went pro. Massive culture shock — a Cuban kid from Miami in Charlottesville — but it became one of the best things that ever happened to me. I caught for the first UVA team to make the College World Series.",
    x: 210,
    y: 112,
  },
  {
    key: "charlotte",
    city: "Charlotte",
    state: "NC",
    years: "Now",
    headline: "Married, four kids, founding team at Safety Radar.",
    story:
      "Settled here after baseball. Got married in 2017. Four kids, five and under. From here I run engineering at Safety Radar and build on the side — Momwise, Carta Maps, FestKit. Charlotte's pace matches the life I want.",
    x: 88,
    y: 218,
  },
];

export type CurrentRole = {
  company: string;
  title: string;
  tenure: string;
  funding: string;
  stage: string;
  team: string;
  product: string;
  stack: string[];
  customers: string[];
  compliance: string[];
};

export const CURRENT_ROLE: CurrentRole = {
  company: "Safety Radar",
  title: "Director of Engineering · founding team",
  tenure: "Aug 2024 → now",
  funding: "$2M SAFE seed",
  stage: "Heading into Series A",
  team: "Engineering team of three",
  product:
    "AI-powered EHS platform. Data in → AI analysis workflows → insights, metrics, dashboards, charts, narratives out.",
  stack: [
    "React Router",
    "Postgres",
    "pgvector",
    "pg-boss",
    "agentic workflow editor",
    "reporting chat",
  ],
  customers: ["oil & gas", "air compression", "aerospace", "pipeline drilling"],
  compliance: ["SOC 2 Type II"],
};

export type CanvasPanel = "welcome" | "locations" | "current";

export const CANVAS_PANELS: CanvasPanel[] = ["welcome", "locations", "current"];

export const SUGGESTED_PROMPTS: { label: string; text: string }[] = [
  { label: "Where are you located?", text: "Where are you located?" },
  { label: "Where do you work now?", text: "Where do you work now?" },
  {
    label: "How did baseball shape your leadership?",
    text: "How did baseball shape your leadership?",
  },
  {
    label: "What do you believe about AI?",
    text: "What do you believe about AI?",
  },
  {
    label: "Are you open to consulting?",
    text: "Are you open to consulting?",
  },
];
