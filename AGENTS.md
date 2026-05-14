# AGENTS.md

Guidance for coding agents working on `francovaldes.dev`.

## Project

Personal CV/conversation site for **Franco Xavier Valdes** (`fvaldes33`). Built with React Router framework mode, shadcn/ui, Tailwind CSS v4, and ai-elements for the future chat interface.

The site should feel like a standout personal operating system and living CV, not a generic portfolio or top-down resume story.

## Core positioning

Franco is:

- Director of Engineering at Safety Radar
- Founding team member at Safety Radar
- Technical leader, entrepreneur, and father of four
- Cuban-American, born and raised in Miami, now in Charlotte, NC
- Former catcher: Team USA 16U, high school state championships, UVA College World Series team, drafted by the Detroit Tigers in the 15th round, Rockford RiverHawks independent baseball
- 15+ years development experience
- ~8 years management experience
- ~5 years AI product experience

Core through-line: **tenacity**.

Homepage vibe: **“Technical leader, entrepreneur, and father of four.”**

## Voice and tone

Use first person for future chat responses: “I’m Franco...”

Tone:

- casual
- direct
- specific
- confident without being inflated
- warm enough to feel human
- no corporate fog
- no generic AI-founder hype

Avoid filler like generic “thought leader” principles on the page. Deeper beliefs can surface in chat.

## Design direction

Use the `impeccable` skill for UI/design work.

Current design direction lives in:

- `PRODUCT.md`
- `DESIGN.md`

Important design notes:

- Use the existing shadcn green palette and semantic tokens.
- Green is Franco’s favorite color.
- Keep Inter for now. Geist is acceptable later.
- Do not introduce novelty fonts without approval.
- Avoid changing global shadcn theme tokens unless explicitly requested.
- Use the provided SVG logo in the nav/header.
- The interface should feel more like a personal command center than a chronological biography.
- Chat should be a first-class surface, not hidden in a floating bubble.
- Avoid:
  - generic portfolio layouts
  - hero metric templates
  - identical card grids
  - dark AI dashboard clichés
  - baseball theme-park visuals
  - generic “belief tiles” that could belong to anyone
  - gradient text
  - glassmorphism as default

## Current implementation notes

Environment variables that need browser access should be exposed through the root loader, not `VITE_` globals. See `app/root.tsx`, `app/hooks/use-root-loader.ts`, and `app/hooks/use-env.ts`. For example, the map uses `MAPTILER_API_KEY` from `useEnv()`.

Important files:

- `app/routes/home.tsx` route module
- `app/screens/home/home.tsx` homepage mock
- `app/app.css` global Tailwind/shadcn theme
- `app/root.tsx` root layout/providers
- `content/interview/**` structured interview knowledge base
- `PRODUCT.md` product/brand context
- `DESIGN.md` design context

React Router route modules should follow framework mode conventions. `meta` should use modern route types from `./+types/...`.

Global UI generally belongs in `app/root.tsx`; route-specific UI belongs under route/screen components.

## Commands

Before handing off code, run:

```sh
npm run check
```

Available scripts:

```sh
npm run dev
npm run build
npm run start
npm run typecheck
npm run lint
npm run lint:strict
npm run lint:fix
npm run format
npm run format:check
npm run check
```

Quality stack:

- ESLint flat config: `eslint.config.js`
- Prettier: `.prettierrc.json`
- Tailwind class sorting via `prettier-plugin-tailwindcss`

## shadcn/ui rules

Project uses shadcn/ui with aliases from `components.json`:

- components: `~/components`
- ui: `~/components/ui`
- utils: `~/lib/utils`
- screens: `~/screens`
- hooks: `~/hooks`

Follow shadcn conventions:

- Use semantic tokens: `bg-background`, `text-foreground`, `text-muted-foreground`, `bg-primary`, etc.
- Prefer shadcn components before custom primitives.
- Use `gap-*`, not `space-*`.
- Use `size-*` when width and height are equal.
- Use `cn()` for conditional class composition.
- Do not manually override component colors unless design requires it.
- For icons in buttons, use `data-icon` where applicable and avoid manual icon sizing inside components.

## Performance/code guidelines

Use `vercel-react-best-practices` for React implementation work.

Key defaults:

- Keep static data at module scope when possible.
- Avoid unnecessary client state.
- Avoid effects for derived state.
- Keep dependencies and imports tight.
- Avoid heavy dynamic work during render.
- Prefer semantic HTML and accessible links/buttons.

## Interview/content source of truth

The personal knowledge base lives under:

```txt
content/interview/
```

Structure:

- `sessions/`: chronological interview sessions and prompts
- `answers/`: structured normalized YAML by topic
- `profiles/`: synthesized profiles for site/chat usage
- `research/`: source extracts, open loops, imported files

Important synthesized profile:

- `content/interview/profiles/chat-knowledge-profile.md`

Preserve raw answers before summarizing. If new personal facts are added, update the relevant YAML file and, if useful, the synthesized profile.

## Public-safe facts

Safe to mention:

- Franco Xavier Valdes / fvaldes33
- Director of Engineering at Safety Radar
- Founding team member at Safety Radar
- Safety Radar is an AI-powered EHS platform
- Safety Radar is SOC 2 Type II compliant
- Public $2M SAFE seed round
- Customers across oil and gas, air compression, aerospace, pipeline drilling, and related industries, but avoid private specifics
- Father of four kids five and under
- Husband, married in 2017
- Cuban-American, Miami-raised, Charlotte-based
- UVA BA in Spanish
- Baseball background listed above
- Public email: `franco@appvents.com`
- Open to AI consulting, AI implementation, Expo/iOS apps, startup advising, part-time/fractional engineering leadership, podcasts/speaking
- Not actively looking for full-time roles, but open to exceptional opportunities

## Do not expose

Never expose unless Franco explicitly changes this:

- children’s names
- exact home location
- old phone number from CV
- Safety Radar ARR
- internal “90% human-approved metric generation” claim
- private customer names or private POCs
- Exxon POC specifically, use “major energy customer” if needed
- customer emails from `reviews.csv`

When chat/site output hits a private area, gracefully avoid the detail rather than announcing the boundary awkwardly.

## Projects to highlight

### Safety Radar

Current main role. AI-powered EHS platform. Franco owns technology, built the MVP/platform foundation, and leads a small engineering team.

Public-safe stack/details:

- React Router
- Postgres
- pgvector
- pg-boss
- AI workflows
- reporting chat
- dashboards
- RBAC/SSO
- SOC 2 Type II compliant

### Momwise

`https://momwise.ai`

AI-powered parenting assistant for parents with children 0–18. Built because Franco and his wife have four young kids and know the mental load of parenting.

Stack:

- React Native
- Expo
- Uniwind
- Hono
- Supabase
- multiple AI providers
- Google/Outlook calendar integration

### Carta Maps

`https://cartamaps.com`

Design-forward no-code mapping tool. Launched 2022. Has real users and roughly $1.5k–$2k MRR depending on churn.

Stack:

- React
- Tailwind
- Supabase
- Stripe

Testimonials from CSV should be anonymous unless approved.

### FestKit

`https://usefestkit.com`

Festival/event operating system derived from Carta Maps. Vendor ops, invoicing, event portal, and maps. Uses Stripe Connect. New yearly product with early revenue.

## Career chronology

- Union: Feb 2015–Dec 2021. Started backend developer, eventually Director of Technology. Built large design systems and high-scale CMS deployments.
- Kroger: Dec 2021–Mar 2023. Advanced Software Engineer on innovation team. Worked on POCs like drone delivery and restaurant bulk sales.
- Trenchant Analytics / TAC: Mar 2023–Aug 2024. Senior Software Engineer. AI contract-writing tools for DoD FAR/non-FAR contracts and Air Force fork.
- Safety Radar: Aug 2024–present. Director of Engineering / founding team member.

## Notable narrative

Core story: poor Miami kid from Cuban immigrant family → elite catcher/baseball player → UVA culture shock and College World Series → professional baseball → self-taught iOS developer after App Store bet → agency engineer/leader → DoD AI engineer → founding engineering leader at AI startup.

The athlete-to-engineer transition is the most memorable story and should be used carefully as a differentiator, not as a gimmick.

## Contact/CTA

Primary CTA is email only for now:

```txt
franco@appvents.com
```

Other CTA types can include:

- view projects
- read story
- podcast invite
- speaking invite
- consulting/advisory
- exceptional recruiting opportunity

No booking link currently.
