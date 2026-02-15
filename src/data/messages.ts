// src/data/messages.ts
import { Message } from '@/types';

export const CONVERSATION_MESSAGES: Record<string, Message[]> = {
  // === c1: Debug PostgreSQL connection pooling (Code, pinned) ===
  c1: [
    {
      id: 'c1-1',
      role: 'user',
      content:
        "I'm getting intermittent connection timeouts in production. The app works fine locally but under load we're seeing 'connection pool exhausted' errors every few minutes. Using pg with a pool size of 20.",
      timestamp: '2:14 PM',
    },
    {
      id: 'c1-2',
      role: 'assistant',
      content:
        "A pool size of 20 is likely too low for your traffic pattern. A few things to check:\n\nFirst, what's your average query duration? If queries take 50ms on average and you're handling 500 requests/second, you need at least 25 connections just to keep up, not accounting for bursts.\n\nSecond, are you properly releasing connections back to the pool? A common issue is forgetting to call `release()` in error paths, which causes connections to leak.\n\nThird, check if you have any long-running queries or transactions holding connections open. One slow query can cascade into pool exhaustion under load.",
      timestamp: '2:14 PM',
    },
    {
      id: 'c1-3',
      role: 'user',
      content:
        'Average query duration is around 30-40ms. Traffic is bursty though, we get spikes during market open at 9:30 AM ET. How should I configure the pool for that pattern?',
      timestamp: '2:15 PM',
    },
    {
      id: 'c1-4',
      role: 'assistant',
      content:
        "For bursty traffic like market open, I'd recommend:\n\n```typescript\nconst pool = new Pool({\n  max: 50,              // handle burst capacity\n  min: 10,              // keep warm connections ready\n  idleTimeoutMillis: 30000,\n  connectionTimeoutMillis: 5000,\n  maxUses: 7500,        // recycle connections\n});\n```\n\nThe key insight is `min: 10` keeps connections warm so you're not establishing new ones during the spike. `max: 50` gives you burst headroom. And `maxUses: 7500` prevents memory leaks from long-lived connections.\n\nYou should also add connection pool monitoring. Log pool.totalCount, pool.idleCount, and pool.waitingCount every 30 seconds. That'll tell you if 50 is actually enough or if you need to go higher.",
      timestamp: '2:16 PM',
    },
    {
      id: 'c1-5',
      role: 'user',
      content:
        "Makes sense. We're also running on Vercel serverless functions. Does that change the calculus?",
      timestamp: '2:18 PM',
    },
    {
      id: 'c1-6',
      role: 'assistant',
      content:
        "Yes, significantly. Serverless changes everything about connection pooling.\n\nThe problem: each serverless function invocation might create its own pool. If you get 200 concurrent invocations, that's potentially 200 × 50 = 10,000 connection attempts to your database. PostgreSQL will reject most of those.\n\nThe solution: use a connection pooler like PgBouncer or Supabase's built-in pooler (Supavisor) that sits between your functions and the database.\n\nIf you're on Neon or Supabase, they have serverless-friendly pooling built in. For raw PostgreSQL, deploy PgBouncer:\n\n```\n[pgbouncer]\npool_mode = transaction\nmax_client_conn = 1000\ndefault_pool_size = 50\n```\n\nTransaction mode is critical for serverless because connections are returned to the pool after each transaction, not held for the session lifetime.\n\nThen in your Vercel functions, set pool max to 1. Each function gets one connection from PgBouncer, and PgBouncer manages the actual database connections.",
      timestamp: '2:19 PM',
    },
    {
      id: 'c1-7',
      role: 'user',
      content: "We're on Supabase. So I should use their connection pooler and set max: 1 in the app?",
      timestamp: '2:20 PM',
    },
    {
      id: 'c1-8',
      role: 'assistant',
      content:
        "Exactly. Supabase provides two connection strings:\n\n1. **Direct connection** (port 5432) — use for migrations and local dev\n2. **Pooled connection** (port 6543) — use in production, especially serverless\n\nIn your Vercel environment:\n\n```typescript\nconst pool = new Pool({\n  connectionString: process.env.DATABASE_URL, // pooled string, port 6543\n  max: 1,\n});\n```\n\nThe Supavisor pooler handles everything else. Your function gets a connection almost instantly from the warm pool instead of doing a full TCP + SSL handshake.\n\nOne gotcha: make sure you're using the pooled string in production. I've seen teams deploy with the direct connection string and wonder why they're hitting connection limits at 20 concurrent users.",
      timestamp: '2:21 PM',
    },
    {
      id: 'c1-9',
      role: 'user',
      content: 'That explains a lot. Let me swap the connection strings and test. Should I keep PgBouncer in the mix too or is Supavisor enough?',
      timestamp: '2:23 PM',
    },
    {
      id: 'c1-10',
      role: 'assistant',
      content:
        "Supavisor alone is enough. Running PgBouncer on top of Supavisor would add an unnecessary hop and could actually cause issues with prepared statements being cached at two different layers.\n\nAfter you swap the connection string, here's a quick test to verify it's working:\n\n1. Deploy to Vercel\n2. Hit your API with 50 concurrent requests (use `hey` or `autocannon`)\n3. Check Supabase dashboard → Database → Active connections\n\nYou should see the connection count stay well under your plan's limit (probably 50-200 depending on tier) even under load. If it spikes above that, the pooler isn't being used.\n\nLet me know how it goes. The 9:30 AM spike should be a non-issue after this change.",
      timestamp: '2:24 PM',
    },
  ],

  // === w1: Q1 case study draft review (Writing, pinned) ===
  w1: [
    {
      id: 'w1-1',
      role: 'user',
      content:
        "Here's my draft for the Q1 case study. The project was redesigning the dispute resolution flow for merchants on a payment platform. Can you review the structure and give me honest feedback?",
      timestamp: '10:30 AM',
    },
    {
      id: 'w1-2',
      role: 'assistant',
      content:
        "I've read through the draft. Here's my feedback, starting with what needs the most work:\n\nThe problem statement is too vague. \"Merchants found the dispute process confusing\" doesn't tell me anything specific. How many merchants? What was the drop-off rate? Where exactly did they get confused? You need something like: \"42% of merchants abandoned the dispute response form before submission, resulting in $2.3M in auto-lost disputes per quarter.\"\n\nYour contributions section uses passive voice throughout. \"The flow was redesigned\" and \"research was conducted\" don't tell me what YOU did. Switch to active voice: \"I redesigned the flow\" and \"I conducted 12 merchant interviews.\"\n\nThe before/after comparison is strong but you're missing the middle. What options did you explore and reject? Hiring managers want to see your decision-making process, not just the output.",
      timestamp: '10:31 AM',
    },
    {
      id: 'w1-3',
      role: 'user',
      content:
        "Fair points. I actually have the metrics somewhere. The real number was 38% abandonment on the evidence upload step specifically. And I did 8 merchant interviews, not 12. Should I round up?",
      timestamp: '10:33 AM',
    },
    {
      id: 'w1-4',
      role: 'assistant',
      content:
        "No, never inflate numbers. Use exact figures. \"8 merchant interviews\" is perfectly credible for a case study. Rounding to 12 is the kind of thing that falls apart in an interview when someone asks you to describe all twelve.\n\n38% abandonment on the evidence upload step is much more compelling than the generic version. Lead with that specific metric. Here's a rewrite for your opening:\n\n\"Merchants were losing disputes they could have won. 38% abandoned the response flow at the evidence upload step, resulting in an estimated $1.8M in preventable losses per quarter. The upload experience required 6 separate actions across 3 screens to attach a single piece of evidence.\"\n\nSee how that gives the reader a clear picture of the problem's scale and the specific UX failure? Now they want to know how you fixed it.",
      timestamp: '10:34 AM',
    },
    {
      id: 'w1-5',
      role: 'user',
      content:
        "That's way better. For the solution section, I showed three concepts to the team. Should I include all three or just the one we shipped?",
      timestamp: '10:36 AM',
    },
    {
      id: 'w1-6',
      role: 'assistant',
      content:
        "Include all three, but frame them as a decision matrix. This is the most valuable part of a case study for design engineering roles.\n\nFor each concept, show:\n- A single screen or sketch (doesn't need to be polished)\n- The core tradeoff it represented\n- Why you chose or rejected it\n\nFor example:\n\n**Concept A: Guided wizard** — Step-by-step flow, lowest cognitive load, but required 4 screens and increased time-to-submit from 3 to 8 minutes. Rejected because merchants are time-constrained during dispute windows.\n\n**Concept B: Single-page form** — Everything on one screen. Fast to submit but overwhelming. User testing showed merchants missed required fields 60% of the time.\n\n**Concept C: Progressive disclosure** — Shipped this. Starts simple, reveals fields as needed. Evidence upload reduced from 6 actions to 2 via drag-and-drop with auto-categorization.\n\nThis shows you think in tradeoffs, not just solutions. That's what separates a senior designer from a junior one.",
      timestamp: '10:37 AM',
    },
    {
      id: 'w1-7',
      role: 'user',
      content: 'I like the matrix approach. One more thing: the results section. We only had 3 weeks of post-launch data when I left the project. Is that enough to include metrics?',
      timestamp: '10:40 AM',
    },
    {
      id: 'w1-8',
      role: 'assistant',
      content:
        "Three weeks is enough if you're transparent about it. Frame it as early results:\n\n\"In the first 3 weeks post-launch: evidence upload abandonment dropped from 38% to 12%. Average dispute response time decreased from 22 minutes to 9 minutes. Merchant win rate on disputes increased from 31% to 44%.\"\n\nThen add a note: \"These are early indicators. A 90-day analysis was planned but fell outside my tenure on the project.\"\n\nThis shows intellectual honesty and awareness that 3 weeks isn't statistically conclusive. Interviewers respect that more than someone who presents 3-week data as if it's a finalized study.\n\nAlso add a 'What I'd do differently' section at the end. Even one sentence like: \"I'd have pushed for A/B testing from day one instead of a full rollout. The 3-concept approach was right but we validated too late.\" That signals growth mindset and self-awareness.",
      timestamp: '10:41 AM',
    },
    {
      id: 'w1-9',
      role: 'user',
      content: 'This is incredibly helpful. Let me rework the draft with these changes and send you v2.',
      timestamp: '10:44 AM',
    },
    {
      id: 'w1-10',
      role: 'assistant',
      content:
        "Sounds good. When you send v2, I'll specifically check:\n\n1. Does the problem statement have specific metrics?\n2. Are your contributions in active voice?\n3. Is the decision matrix clear with tradeoffs for each concept?\n4. Are results framed honestly with the time caveat?\n5. Is there a \"what I'd do differently\" section?\n\nOne more thing for the rewrite: make sure your case study can be walked through in 5 minutes during an interview. If it takes longer to explain, cut scope. Better to tell one tight story than a sprawling one.",
      timestamp: '10:44 AM',
    },
  ],

  // === d1: Component library naming conventions (Design, pinned) ===
  d1: [
    {
      id: 'd1-1',
      role: 'user',
      content:
        "I'm building out the component library for our design system. Struggling with naming conventions. We have Button, Input, Select, etc. but they collide with HTML element names and third-party libraries. What's the best practice here?",
      timestamp: '3:45 PM',
    },
    {
      id: 'd1-2',
      role: 'assistant',
      content:
        "This is a common problem as design systems scale. The standard approaches:\n\n**Prefix with system name:** MdsButton, MdsInput, MdsSelect (where Mds = your design system abbreviation). This is what Shopify Polaris does (PolarisButton) and Adobe Spectrum. Zero collision risk.\n\n**Namespace import:** Keep names simple but always import from the design system namespace. `import { Button } from '@mds/components'`. Collisions resolved at import time.\n\n**Semantic naming:** Name by function, not element. ActionButton, TextInput, DropdownSelect. More descriptive but can get verbose.\n\nI'd go with the prefix approach for your primitives. It's the most explicit and scales cleanly. When a developer sees MdsButton in code, there's zero ambiguity about which Button it is.",
      timestamp: '3:46 PM',
    },
    {
      id: 'd1-3',
      role: 'user',
      content: 'We went with the prefix: Mds. Now the question is how to organize variants. Like we have primary, secondary, ghost, and danger buttons. Props vs separate components?',
      timestamp: '3:48 PM',
    },
    {
      id: 'd1-4',
      role: 'assistant',
      content:
        "Props, not separate components. Every major design system converges on this pattern for good reason.\n\n```typescript\n<MdsButton variant=\"primary\" />\n<MdsButton variant=\"secondary\" />\n<MdsButton variant=\"ghost\" />\n<MdsButton variant=\"danger\" />\n```\n\nIf you create MdsPrimaryButton, MdsSecondaryButton, etc., you end up with a combinatorial explosion when you add sizes (sm, md, lg) and states (loading, disabled). That's 4 variants × 3 sizes × 3 states = 36 potential components vs. one component with props.\n\nThe variant prop should be a union type:\n\n```typescript\ntype ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';\ntype ButtonSize = 'sm' | 'md' | 'lg';\n\ninterface MdsButtonProps {\n  variant?: ButtonVariant;  // default: 'primary'\n  size?: ButtonSize;        // default: 'md'\n  isLoading?: boolean;\n  isDisabled?: boolean;\n}\n```\n\nOne exception: if a variant has fundamentally different behavior (like IconButton which only takes an icon, no text), make it a separate component. Different behavior = different component. Different appearance = same component, different props.",
      timestamp: '3:49 PM',
    },
    {
      id: 'd1-5',
      role: 'user',
      content: 'Makes sense. What about the file structure? Flat folder or nested by category?',
      timestamp: '3:51 PM',
    },
    {
      id: 'd1-6',
      role: 'assistant',
      content:
        "Start flat, nest when a category hits 5+ components. Here's the progression:\n\n**Phase 1 (under 15 components):**\n```\ncomponents/\n  MdsButton.tsx\n  MdsInput.tsx\n  MdsSelect.tsx\n  MdsCheckbox.tsx\n  MdsAvatar.tsx\n  index.ts          // barrel export\n```\n\n**Phase 2 (15-40 components):**\n```\ncomponents/\n  inputs/\n    MdsInput.tsx\n    MdsSelect.tsx\n    MdsCheckbox.tsx\n    MdsRadio.tsx\n    MdsSwitch.tsx\n    index.ts\n  actions/\n    MdsButton.tsx\n    MdsIconButton.tsx\n    MdsLink.tsx\n    index.ts\n  display/\n    MdsAvatar.tsx\n    MdsBadge.tsx\n    MdsTag.tsx\n    index.ts\n  index.ts            // re-exports from all categories\n```\n\nThe barrel index.ts at the root always re-exports everything so consumers never need to know the internal structure. `import { MdsButton, MdsInput } from '@mds/components'` works regardless of how you reorganize internally.\n\nDon't pre-optimize the folder structure. Start flat and refactor when navigation becomes painful. Premature nesting is worse than a slightly long flat list.",
      timestamp: '3:52 PM',
    },
    {
      id: 'd1-7',
      role: 'user',
      content: 'Last question: should we include design tokens in the component library package or keep them separate?',
      timestamp: '3:55 PM',
    },
    {
      id: 'd1-8',
      role: 'assistant',
      content:
        "Separate package. Tokens should be consumed independently of components.\n\nHere's why: your marketing site might use tokens for consistent colors and spacing but never import a single React component. Your native mobile team needs tokens but can't use React components at all. Tokens are the foundation layer that everything else builds on.\n\nPackage structure:\n```\n@mds/tokens     — CSS variables, JSON, SCSS maps\n@mds/components — React components (depends on @mds/tokens)\n@mds/icons      — Icon set (standalone)\n```\n\n`@mds/components` lists `@mds/tokens` as a peer dependency. When you install components, you're required to also have tokens. But tokens can be installed alone.\n\nFor the token package itself, export in multiple formats: CSS custom properties for web, JSON for React Native/Figma plugins, SCSS maps if anyone needs them. Style Dictionary is the standard tool for this multi-format export.\n\nThis architecture means you can ship a token update (like a new color) without touching the component library. Smaller releases, fewer breaking changes, happier consumers.",
      timestamp: '3:56 PM',
    },
  ],

  // === p2: Case study 7-day timeline (Planning, pinned) ===
  p2: [
    {
      id: 'p2-1',
      role: 'user',
      content:
        "I want to do a design case study in 7 days. The goal is a portfolio piece that shows both design thinking and implementation. I'm targeting design engineering roles at companies like Linear, Stripe, Vercel. Is 7 days realistic?",
      timestamp: '11:00 AM',
    },
    {
      id: 'p2-2',
      role: 'assistant',
      content:
        "Seven days is tight but realistic if you scope correctly. The biggest risk is spending too long on research and running out of build time. Here's the split I'd recommend:\n\n**Day 1: Research + Define** (1 day)\nPick the problem. Validate it with real user evidence (Reddit threads, GitHub issues, support forums). Write the problem statement. Don't do original user interviews, you don't have time.\n\n**Day 2: Ideate + Select** (1 day)\nSketch 3 concepts. Pick one based on feasibility, impact, and what shows your skills best. Not the most ambitious idea, but the most completable one.\n\n**Days 3-5: Build** (3 days)\nThis is where design engineers differentiate. Build a working prototype, not just mockups. Next.js + Tailwind is the right stack. Focus on one core flow that's polished rather than multiple half-finished features.\n\n**Day 6: Test + Polish** (1 day)\nGet 2-3 people to try it. Fix the obvious issues. Add transitions and microinteractions. These details signal craft.\n\n**Day 7: Write + Ship** (1 day)\nWrite the case study narrative. Deploy the prototype. Post on social.\n\nThe trap to avoid: spending 3 days on research and 2 on building. Interviewers at Linear and Vercel care more about what you shipped than how much research you did.",
      timestamp: '11:01 AM',
    },
    {
      id: 'p2-3',
      role: 'user',
      content: 'What if I focus on improving Claude\'s conversation management? I use it every day and the search/organization is rough. Is redesigning an AI product a good portfolio topic?',
      timestamp: '11:04 AM',
    },
    {
      id: 'p2-4',
      role: 'assistant',
      content:
        "It's a strong choice for several reasons:\n\n1. **Relevance.** Every company on your list uses or competes with AI tools. Showing you understand AI product patterns signals domain fit.\n\n2. **Built-in validation.** You're a daily user, so you have genuine pain points. You're not inventing problems, you're solving ones you've experienced.\n\n3. **Competitive landscape.** ChatGPT, Gemini, and Claude all have different approaches to conversation management. That gives you natural competitive analysis material without extra research.\n\n4. **Technical depth.** A conversation manager involves search, filtering, categorization, state management. These are real engineering challenges, not just visual design.\n\nThe risk: Anthropic might view it as presumptuous or inaccurate. Mitigate this by framing it as \"a design exploration\" not \"what Claude should do.\" And focus on patterns that are genuinely useful, not just different for the sake of being different.\n\nOne more thing: make sure the case study shows you understand why the current experience exists (constraints, tradeoffs) before proposing changes. That shows design maturity.",
      timestamp: '11:05 AM',
    },
    {
      id: 'p2-5',
      role: 'user',
      content: "Good call on the framing. What specific problems should I focus on? There are a lot of issues but I can't tackle everything in 7 days.",
      timestamp: '11:08 AM',
    },
    {
      id: 'p2-6',
      role: 'assistant',
      content:
        "Pick the problems with the most evidence and the clearest design opportunities:\n\n**1. Finding past conversations is painful.** The sidebar is a chronological list with no categorization. Once you have 50+ conversations, finding anything requires scrolling or using Cmd+K search. But search only matches titles, not content.\n\n**2. No distinction between deep work and quick questions.** A 30-message coding session and a one-off \"what's the capital of France\" live in the same flat list with equal visual weight.\n\n**3. No sense of your usage patterns.** Power users can't see what they use Claude for most. There's no dashboard, no analytics, no reflection.\n\nI'd focus on #1 as the core problem and weave in #2 and #3 as supporting features. The deliverable would be an enhanced home screen that replaces the blank \"How can I help?\" page with:\n- Topic-based organization (auto-categorized)\n- Quick access to recent and pinned conversations\n- A search experience that searches content, not just titles\n\nThat's scoped enough for 7 days and hits all the notes: research-backed, technically interesting, visually demonstrable.",
      timestamp: '11:09 AM',
    },
    {
      id: 'p2-7',
      role: 'user',
      content: "Perfect. That's exactly what I was thinking. Let's go with the enhanced home approach. What should the prototype include vs what can I mock?",
      timestamp: '11:12 AM',
    },
    {
      id: 'p2-8',
      role: 'assistant',
      content:
        "Build these for real:\n- **Topic grid** with real data showing conversation counts, colors, and filtering\n- **Search overlay** (Cmd+K) with actual filtering across titles, content, and projects\n- **Pinned conversations** in the sidebar\n- **Conversation detail view** showing a chat thread\n- **Dark mode** toggle that uses a proper token system\n\nMock these (static, not functional):\n- Auto-categorization logic (just pre-categorize in seed data)\n- Message sending (input exists but doesn't actually send)\n- Settings, Projects, Artifacts pages (just the sidebar nav items)\n\nThe key insight: everything you build should be interactive in the demo. If a reviewer can click through topic filters, search for conversations, open a chat thread, and toggle dark mode, they'll assume the whole thing works. That's the power of a focused prototype over a broad mockup.",
      timestamp: '11:13 AM',
    },
  ],

  // === c2: TypeScript generic constraints help (Code, recent) ===
  c2: [
    {
      id: 'c2-1',
      role: 'user',
      content:
        "I have a function that takes an object and a key, and returns the value at that key. But TypeScript doesn't know the return type. How do I constrain the generic so it infers correctly?",
      timestamp: '9:20 AM',
    },
    {
      id: 'c2-2',
      role: 'assistant',
      content:
        "You need two generic parameters with a constraint linking them:\n\n```typescript\nfunction getValue<T, K extends keyof T>(obj: T, key: K): T[K] {\n  return obj[key];\n}\n\nconst user = { name: 'Amir', age: 30, active: true };\n\nconst name = getValue(user, 'name');    // type: string\nconst age = getValue(user, 'age');      // type: number\nconst active = getValue(user, 'active'); // type: boolean\n```\n\n`K extends keyof T` constrains the second parameter to only accept valid keys of the first parameter. And the return type `T[K]` is an indexed access type that resolves to the specific value type at that key.\n\nThis gives you both autocompletion on the key parameter and precise return type inference.",
      timestamp: '9:20 AM',
    },
    {
      id: 'c2-3',
      role: 'user',
      content: "What if I want to constrain T itself? Like only accept objects that have a specific shape, say they must have an 'id' field?",
      timestamp: '9:22 AM',
    },
    {
      id: 'c2-4',
      role: 'assistant',
      content:
        "Use `extends` on T directly:\n\n```typescript\ninterface HasId {\n  id: string;\n}\n\nfunction getById<T extends HasId>(items: T[], id: string): T | undefined {\n  return items.find(item => item.id === id);\n}\n\n// Works: User has 'id'\ninterface User extends HasId {\n  name: string;\n  email: string;\n}\n\nconst users: User[] = [{ id: '1', name: 'Amir', email: 'a@b.com' }];\nconst user = getById(users, '1'); // type: User | undefined\n\n// Error: number[] doesn't have 'id'\ngetById([1, 2, 3], '1'); // Type 'number' does not satisfy constraint 'HasId'\n```\n\nThe constraint `T extends HasId` means T must be a superset of HasId. It has to have at least an `id: string` property, but can have anything else. The return type preserves the full T, not just HasId, so you get all properties in the result.",
      timestamp: '9:23 AM',
    },
    {
      id: 'c2-5',
      role: 'user',
      content: 'Can you constrain to multiple interfaces? Like must have both id and createdAt?',
      timestamp: '9:25 AM',
    },
    {
      id: 'c2-6',
      role: 'assistant',
      content:
        "Yes, use intersection:\n\n```typescript\ninterface HasId {\n  id: string;\n}\n\ninterface HasTimestamp {\n  createdAt: Date;\n  updatedAt: Date;\n}\n\nfunction findRecent<T extends HasId & HasTimestamp>(\n  items: T[],\n  since: Date\n): T[] {\n  return items\n    .filter(item => item.createdAt > since)\n    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());\n}\n```\n\n`T extends HasId & HasTimestamp` requires T to satisfy both interfaces. This is the pattern you'll use most in practice: building composable constraints from small interfaces.\n\nYou can also inline it if you don't want named interfaces:\n\n```typescript\nfunction findRecent<T extends { id: string; createdAt: Date }>(\n  items: T[]\n): T[]\n```\n\nBoth work. Named interfaces are better when you reuse the constraint across multiple functions.",
      timestamp: '9:26 AM',
    },
    {
      id: 'c2-7',
      role: 'user',
      content: 'This is exactly what I needed. One more: conditional types based on generics. When would I use those?',
      timestamp: '9:28 AM',
    },
    {
      id: 'c2-8',
      role: 'assistant',
      content:
        "Conditional types are for when the return type depends on the input type. The most practical use case is API response unwrapping:\n\n```typescript\ntype ApiResponse<T> = T extends Array<infer U>\n  ? { data: U[]; total: number }\n  : { data: T };\n\nfunction fetchApi<T>(endpoint: string): Promise<ApiResponse<T>> {\n  // implementation\n}\n\n// Returns { data: User[], total: number }\nconst users = await fetchApi<User[]>('/users');\n\n// Returns { data: User }\nconst user = await fetchApi<User>('/users/1');\n```\n\nThe type system automatically picks the right response shape based on whether you're fetching a list or a single item.\n\nAnother common one is making certain fields optional based on a mode:\n\n```typescript\ntype FormFields<Mode extends 'create' | 'edit'> = {\n  name: string;\n  email: string;\n  id: Mode extends 'edit' ? string : never;\n};\n```\n\nIn practice, you'll reach for conditional types maybe 5% of the time. Generic constraints (`extends`) handle 90% of cases. Use conditional types when the output shape fundamentally changes based on the input, not just for slight variations.",
      timestamp: '9:29 AM',
    },
  ],

  // === c3: Next.js middleware auth flow (Code, recent) ===
  c3: [
    {
      id: 'c3-1',
      role: 'user',
      content:
        "I'm setting up auth middleware in Next.js App Router. I want to protect all routes under /dashboard and redirect unauthenticated users to /login. But I'm getting type errors on the session object in the edge runtime.",
      timestamp: '4:10 PM',
    },
    {
      id: 'c3-2',
      role: 'assistant',
      content:
        "The edge runtime type errors usually come from the JWT payload shape not matching what your auth library returns. Here's the proper setup:\n\n```typescript\n// middleware.ts\nimport { NextResponse } from 'next/server';\nimport type { NextRequest } from 'next/server';\nimport { getToken } from 'next-auth/jwt';\n\nexport async function middleware(request: NextRequest) {\n  const token = await getToken({\n    req: request,\n    secret: process.env.NEXTAUTH_SECRET,\n  });\n\n  if (!token) {\n    const loginUrl = new URL('/login', request.url);\n    loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);\n    return NextResponse.redirect(loginUrl);\n  }\n\n  return NextResponse.next();\n}\n\nexport const config = {\n  matcher: ['/dashboard/:path*'],\n};\n```\n\nThe key: use `getToken` from next-auth/jwt, not `getServerSession`. `getServerSession` doesn't work in edge middleware because it needs Node.js APIs. `getToken` reads the JWT directly from the cookie, which works everywhere.\n\nThe `callbackUrl` param is important so you can redirect back after login.",
      timestamp: '4:11 PM',
    },
    {
      id: 'c3-3',
      role: 'user',
      content: "Got it. Now I need to add role-based access. Admin users can access /dashboard/admin, regular users can't. Where should that logic live?",
      timestamp: '4:14 PM',
    },
    {
      id: 'c3-4',
      role: 'assistant',
      content:
        "Keep it in the middleware. Don't scatter auth checks across page components.\n\n```typescript\nexport async function middleware(request: NextRequest) {\n  const token = await getToken({\n    req: request,\n    secret: process.env.NEXTAUTH_SECRET,\n  });\n\n  // Not authenticated at all\n  if (!token) {\n    const loginUrl = new URL('/login', request.url);\n    loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);\n    return NextResponse.redirect(loginUrl);\n  }\n\n  // Role-based access\n  const isAdminRoute = request.nextUrl.pathname.startsWith('/dashboard/admin');\n  if (isAdminRoute && token.role !== 'admin') {\n    return NextResponse.redirect(new URL('/dashboard', request.url));\n  }\n\n  return NextResponse.next();\n}\n```\n\nFor the type error on `token.role`, you need to extend the JWT type:\n\n```typescript\n// types/next-auth.d.ts\nimport { JWT } from 'next-auth/jwt';\n\ndeclare module 'next-auth/jwt' {\n  interface JWT {\n    role?: 'admin' | 'user';\n  }\n}\n```\n\nAnd make sure you're setting the role in your NextAuth callbacks:\n\n```typescript\ncallbacks: {\n  async jwt({ token, user }) {\n    if (user) {\n      token.role = user.role;\n    }\n    return token;\n  },\n}\n```\n\nThis keeps all access control in one place. If you later add more roles or routes, it's one file to update.",
      timestamp: '4:15 PM',
    },
    {
      id: 'c3-5',
      role: 'user',
      content: 'What about API routes? Should those go through the same middleware or do I check auth separately?',
      timestamp: '4:18 PM',
    },
    {
      id: 'c3-6',
      role: 'assistant',
      content:
        "Same middleware. Add API routes to the matcher:\n\n```typescript\nexport const config = {\n  matcher: [\n    '/dashboard/:path*',\n    '/api/dashboard/:path*',\n  ],\n};\n```\n\nThe middleware will reject unauthenticated API calls with a redirect. But for API routes, you probably want a 401 JSON response instead of a redirect:\n\n```typescript\nexport async function middleware(request: NextRequest) {\n  const token = await getToken({\n    req: request,\n    secret: process.env.NEXTAUTH_SECRET,\n  });\n\n  const isApiRoute = request.nextUrl.pathname.startsWith('/api/');\n\n  if (!token) {\n    if (isApiRoute) {\n      return NextResponse.json(\n        { error: 'Unauthorized' },\n        { status: 401 }\n      );\n    }\n    const loginUrl = new URL('/login', request.url);\n    loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);\n    return NextResponse.redirect(loginUrl);\n  }\n\n  // ... role checks\n  return NextResponse.next();\n}\n```\n\nThis way your frontend gets redirects and your API consumers get proper HTTP status codes. Same auth logic, different response formats based on the request type.",
      timestamp: '4:19 PM',
    },
    {
      id: 'c3-7',
      role: 'user',
      content: "This is clean. Last thing: should I exclude public API routes like /api/health and /api/webhooks from the middleware?",
      timestamp: '4:22 PM',
    },
    {
      id: 'c3-8',
      role: 'assistant',
      content:
        "Yes. Two approaches:\n\n**Option 1: Negative matcher (recommended)**\n```typescript\nexport const config = {\n  matcher: [\n    '/dashboard/:path*',\n    '/api/((?!health|webhooks).*)',\n  ],\n};\n```\n\nThe regex `((?!health|webhooks).*)` matches all /api/ routes except /api/health and /api/webhooks.\n\n**Option 2: Check inside middleware**\n```typescript\nconst publicApiRoutes = ['/api/health', '/api/webhooks'];\nconst isPublicApi = publicApiRoutes.some(route =>\n  request.nextUrl.pathname.startsWith(route)\n);\nif (isPublicApi) return NextResponse.next();\n```\n\nI prefer Option 1 because it prevents the middleware from even running on those routes. Less cold start overhead, and public routes are guaranteed fast.\n\nFor webhooks specifically, you'll want to verify the webhook signature inside the route handler itself. Stripe sends a `stripe-signature` header you can validate. Don't rely on middleware for webhook auth since the verification needs the raw request body, which middleware doesn't have access to in the edge runtime.",
      timestamp: '4:23 PM',
    },
  ],

  // === react-demo: What is react.js? ===
  'react-demo': [
    {
      id: 'rd-1',
      role: 'user',
      content: 'What is react.js?',
      timestamp: '12:00 PM',
    },
    {
      id: 'rd-2',
      role: 'assistant',
      content:
        "**React** (also called React.js or ReactJS) is an open-source JavaScript library for building user interfaces. It was created by Jordan Walke at Meta (formerly Facebook) and released in 2013. React is used to build single-page applications and is particularly well-suited for creating complex, interactive UIs that need to update efficiently.\n\nAt its core, React introduces a few key concepts:\n\n- **Components** — React apps are built from reusable, self-contained pieces called components. Each component manages its own state and renders a piece of the UI. You compose small components together to build entire pages.\n\n- **JSX** — React uses a syntax extension called JSX that lets you write HTML-like markup directly in JavaScript. Under the hood, JSX compiles to regular JavaScript function calls.\n\n- **Virtual DOM** — Instead of updating the browser's DOM directly (which is slow), React maintains a lightweight copy called the virtual DOM. When state changes, React calculates the minimal set of DOM updates needed and applies them in a batch. This makes UI updates fast and predictable.\n\n- **One-way data flow** — Data in React flows downward from parent components to children via props. This makes it easier to reason about how data moves through your application compared to two-way binding approaches.\n\nReact has a massive ecosystem including tools like Next.js (full-stack framework), React Router (navigation), and React Native (mobile apps). It remains one of the most widely adopted frontend technologies, used by companies like Meta, Netflix, Airbnb, and thousands of others.",
      timestamp: '12:00 PM',
    },
  ],
};
