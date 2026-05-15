import type { CanvasDocument } from "./canvas-document";

export const welcomeCanvasDocument: CanvasDocument = {
  title: "Welcome",
  intent: "welcome",
  blocks: [
    {
      type: "hero",
      eyebrow: "Franco Xavier Valdes",
      title: "Builder. Leader. Entreprenuer.",
      body: "I lead engineering at Safety Radar, build products on the side, and help small teams turn ambiguous problems into useful software that ships.",
    },
    {
      type: "statGrid",
      items: [
        {
          label: "Current",
          value: "Safety Radar",
          detail: "Director of Engineering, founding team",
        },
        {
          label: "Built",
          value: "15+ years",
          detail: "Software, product, AI, and engineering teams",
        },
        {
          label: "Origin",
          value: "Miami → Charlotte",
          detail: "Cuban-American, raising a family in NC",
        },
        {
          label: "Open to",
          value: "Advising + consulting",
          detail: "AI implementation, Expo apps, leadership, podcasts",
        },
      ],
    },
    {
      type: "momentGrid",
      items: [
        {
          eyebrow: "Builder",
          title: "Products, not theater",
          body: "Safety Radar by day, side products when the problem will not leave me alone: Momwise, Carta Maps, and FestKit all came from real friction.",
        },
        {
          eyebrow: "Leader",
          title: "Small teams, clear ownership",
          body: "I like direct feedback, low bureaucracy, fewer meetings, and people who can turn ambiguity into a plan without making it political.",
        },
        {
          eyebrow: "AI operator",
          title: "Context beats model worship",
          body: "The best AI products start with the user's problem, clean retrieval, tight workflows, and boring repeatable work that should not need a human every time.",
        },
      ],
    },
    {
      type: "tagList",
      label: "Ask me about",
      items: [
        "Safety Radar",
        "AI product strategy",
        "founding engineering",
        "side projects",
        "Momwise",
        "Carta Maps",
        "FestKit",
        "engineering leadership",
      ],
    },
    {
      type: "callout",
      title: "This site is a showcase, not a resume wall.",
      text: "Ask a question. Ask a question and AI will answer based on thousands of data points about me, my story and my work.",
      tone: "primary",
    },
  ],
};

export const locationsCanvasDocument: CanvasDocument = {
  title: "Places Franco has lived",
  intent: "locations",
  blocks: [
    {
      type: "hero",
      eyebrow: "Where I have been",
      title: "Miami → Charlottesville → Charlotte.",
      body: "Three places explain a lot: where I got my grit, where baseball stretched me, and where I built my family and engineering career.",
    },
    {
      type: "map",
      description: "Tap a pin for the story.",
      locations: [
        {
          id: "miami",
          label: "Miami",
          sublabel: "Born and raised",
          lat: 25.7617,
          lng: -80.1918,
          story:
            "Born to two Cuban immigrant parents who worked extremely hard to give me what I needed. Poor neighborhood, relentless parenting, and my dad's favorite word: tenacity.",
        },
        {
          id: "charlottesville",
          label: "Charlottesville",
          sublabel: "UVA baseball",
          lat: 38.0293,
          lng: -78.4767,
          story:
            "A total culture shock after Miami. I caught for the first UVA team to make the College World Series and made friendships that changed my life.",
        },
        {
          id: "charlotte",
          label: "Charlotte",
          sublabel: "Now",
          lat: 35.2271,
          lng: -80.8431,
          story:
            "Settled here after baseball. Married in 2017, four kids five and under, Safety Radar by day, side products whenever the problem keeps bothering me.",
        },
      ],
    },
  ],
};

export const currentCanvasDocument: CanvasDocument = {
  title: "Current role",
  intent: "current",
  blocks: [
    {
      type: "hero",
      eyebrow: "Currently",
      title: "Safety Radar",
      body: "Director of Engineering and founding team member at an AI-powered EHS platform.",
    },
    {
      type: "statGrid",
      items: [
        { label: "Tenure", value: "Aug 2024 → now" },
        { label: "Team", value: "3 engineers", detail: "including me" },
        { label: "Funding", value: "$2M SAFE seed" },
        { label: "Stage", value: "Heading into Series A" },
      ],
    },
    {
      type: "paragraph",
      text: "Data in, AI analysis workflows, insights and dashboards out. The platform handles messy EHS data, datashelf context, workflow orchestration, reporting chat, and customer-facing metrics.",
    },
    {
      type: "tagList",
      label: "Stack and surfaces",
      items: [
        "React Router",
        "Postgres",
        "pgvector",
        "pg-boss",
        "workflow editor",
        "reporting chat",
        "RBAC",
        "SSO",
        "SOC 2 Type II compliant",
      ],
    },
  ],
};

export const projectsCanvasDocument: CanvasDocument = {
  title: "Side builds",
  intent: "projects",
  blocks: [
    {
      type: "hero",
      eyebrow: "Side builds",
      title: "Products I built because the problem would not leave me alone.",
    },
    {
      type: "projectList",
      items: [
        {
          name: "Momwise",
          description:
            "AI parenting assistant built from the mental load of raising four kids five and under.",
          href: "https://momwise.ai",
          meta: "Expo, Hono, Supabase, AI providers",
        },
        {
          name: "Carta Maps",
          description:
            "Design-forward no-code maps with real users and recurring revenue.",
          href: "https://cartamaps.com",
          meta: "React, Tailwind, Supabase, Stripe",
        },
        {
          name: "FestKit",
          description:
            "Festival operating system for vendor ops, invoicing, portals, and maps.",
          href: "https://usefestkit.com",
          meta: "React, Supabase, Stripe Connect",
        },
      ],
    },
  ],
};
