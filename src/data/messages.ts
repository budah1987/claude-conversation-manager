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
    {
      id: 'c1-11',
      role: 'user',
      content:
        "One more thing — can you show me a complete production-ready pool configuration with all the edge cases handled? I want a single reference file I can copy into new projects.",
      timestamp: '2:26 PM',
    },
    {
      id: 'm-pool-config',
      role: 'assistant',
      content:
        "Here's a production-ready TypeScript database pool configuration that covers the full lifecycle — connection management, monitoring, health checks, graceful shutdown, and per-environment tuning:\n\n```typescript\nimport { Pool, PoolClient, PoolConfig } from 'pg';\n\n// ─── Configuration ────────────────────────────────────────────────────────────\n\nconst ENV = process.env.NODE_ENV ?? 'development';\n\nconst POOL_CONFIGS: Record<string, Partial<PoolConfig>> = {\n  development: {\n    max: 5,\n    min: 1,\n    idleTimeoutMillis: 10_000,\n    connectionTimeoutMillis: 3_000,\n  },\n  test: {\n    max: 3,\n    min: 1,\n    idleTimeoutMillis: 5_000,\n    connectionTimeoutMillis: 3_000,\n  },\n  staging: {\n    max: 20,\n    min: 5,\n    idleTimeoutMillis: 30_000,\n    connectionTimeoutMillis: 5_000,\n  },\n  production: {\n    max: 50,               // Tune to (DB max_connections * 0.8) / num_instances\n    min: 10,               // Keep warm connections for burst readiness\n    idleTimeoutMillis: 30_000,\n    connectionTimeoutMillis: 5_000,\n    maxUses: 7_500,        // Recycle connections to prevent memory creep\n    allowExitOnIdle: false, // Keep pool alive between requests in long-running processes\n  },\n};\n\nconst baseConfig: PoolConfig = {\n  connectionString: process.env.DATABASE_URL,\n  ssl: ENV === 'production'\n    ? { rejectUnauthorized: true, ca: process.env.DB_CA_CERT }\n    : false,\n  statement_timeout: 30_000,   // Kill runaway queries after 30s\n  query_timeout: 15_000,       // Client-side query timeout\n  application_name: `${process.env.APP_NAME ?? 'app'}-${ENV}`,\n  ...POOL_CONFIGS[ENV] ?? POOL_CONFIGS.production,\n};\n\n// ─── Pool Initialization ──────────────────────────────────────────────────────\n\nconst pool = new Pool(baseConfig);\n\n// ─── Connection Lifecycle Events ──────────────────────────────────────────────\n\npool.on('connect', (client: PoolClient) => {\n  // Set session defaults for every new connection\n  client.query(\"SET timezone = 'UTC'\");\n  client.query('SET statement_timeout = 30000');\n});\n\npool.on('error', (err: Error) => {\n  // Log but don't crash — pool will attempt reconnection\n  console.error('[db] Unexpected idle client error:', err.message);\n});\n\n// ─── Health Check ─────────────────────────────────────────────────────────────\n\nexport async function checkHealth(): Promise<{\n  ok: boolean;\n  latencyMs: number;\n  poolStats: { total: number; idle: number; waiting: number };\n}> {\n  const start = Date.now();\n  try {\n    await pool.query('SELECT 1');\n    return {\n      ok: true,\n      latencyMs: Date.now() - start,\n      poolStats: {\n        total: pool.totalCount,\n        idle: pool.idleCount,\n        waiting: pool.waitingCount,\n      },\n    };\n  } catch (err) {\n    return {\n      ok: false,\n      latencyMs: Date.now() - start,\n      poolStats: { total: 0, idle: 0, waiting: 0 },\n    };\n  }\n}\n\n// ─── Pool Monitoring ──────────────────────────────────────────────────────────\n\nconst MONITOR_INTERVAL = 30_000;\nlet monitorHandle: NodeJS.Timeout | null = null;\n\nfunction startMonitoring(): void {\n  monitorHandle = setInterval(() => {\n    const stats = {\n      total: pool.totalCount,\n      idle: pool.idleCount,\n      waiting: pool.waitingCount,\n      active: pool.totalCount - pool.idleCount,\n    };\n\n    if (stats.waiting > 5) {\n      console.warn('[db] Pool saturation warning:', stats);\n    } else if (ENV !== 'development') {\n      console.log('[db] Pool stats:', stats);\n    }\n  }, MONITOR_INTERVAL);\n\n  monitorHandle.unref(); // Don't prevent process exit\n}\n\nif (ENV !== 'test') {\n  startMonitoring();\n}\n\n// ─── Query Helper with Retry ──────────────────────────────────────────────────\n\nconst RETRYABLE_CODES = new Set(['08006', '08001', '08004', '57P03']);\n\nexport async function query<T = unknown>(\n  text: string,\n  values?: unknown[],\n  retries = 2\n): Promise<T[]> {\n  for (let attempt = 0; attempt <= retries; attempt++) {\n    try {\n      const result = await pool.query(text, values);\n      return result.rows as T[];\n    } catch (err: any) {\n      const isRetryable = RETRYABLE_CODES.has(err.code);\n      const isLastAttempt = attempt === retries;\n\n      if (!isRetryable || isLastAttempt) throw err;\n\n      const delay = Math.min(100 * 2 ** attempt, 2_000);\n      console.warn(`[db] Retryable error (${err.code}), attempt ${attempt + 1}/${retries}. Retrying in ${delay}ms...`);\n      await new Promise(r => setTimeout(r, delay));\n    }\n  }\n  throw new Error('Unreachable');\n}\n\n// ─── Transaction Helper ───────────────────────────────────────────────────────\n\nexport async function withTransaction<T>(\n  fn: (client: PoolClient) => Promise<T>\n): Promise<T> {\n  const client = await pool.connect();\n  try {\n    await client.query('BEGIN');\n    const result = await fn(client);\n    await client.query('COMMIT');\n    return result;\n  } catch (err) {\n    await client.query('ROLLBACK');\n    throw err;\n  } finally {\n    client.release();\n  }\n}\n\n// ─── Graceful Shutdown ────────────────────────────────────────────────────────\n\nasync function shutdown(signal: string): Promise<void> {\n  console.log(`[db] ${signal} received, draining pool...`);\n  if (monitorHandle) clearInterval(monitorHandle);\n\n  // Give in-flight queries up to 10s to complete\n  const timeout = setTimeout(() => {\n    console.error('[db] Shutdown timeout, forcing exit');\n    process.exit(1);\n  }, 10_000);\n\n  try {\n    await pool.end();\n    clearTimeout(timeout);\n    console.log('[db] Pool drained cleanly');\n  } catch (err) {\n    console.error('[db] Error draining pool:', err);\n    process.exit(1);\n  }\n}\n\nprocess.once('SIGTERM', () => shutdown('SIGTERM'));\nprocess.once('SIGINT', () => shutdown('SIGINT'));\n\n// ─── Exports ──────────────────────────────────────────────────────────────────\n\nexport default pool;\nexport { pool };\n```\n\n**Usage:**\n\n```typescript\nimport { query, withTransaction, checkHealth } from './db';\n\n// Simple query\nconst users = await query<User>('SELECT * FROM users WHERE active = $1', [true]);\n\n// Transaction\nawait withTransaction(async (client) => {\n  await client.query('UPDATE accounts SET balance = balance - $1 WHERE id = $2', [amount, fromId]);\n  await client.query('UPDATE accounts SET balance = balance + $1 WHERE id = $2', [amount, toId]);\n});\n\n// Health check endpoint\napp.get('/health', async (req, res) => {\n  const health = await checkHealth();\n  res.status(health.ok ? 200 : 503).json(health);\n});\n```\n\nKey decisions baked in:\n- **Per-environment configs** — dev gets a tiny pool so you notice connection leaks early\n- **maxUses: 7500** — prevents memory accumulation in long-running Node processes\n- **application_name** — shows up in pg_stat_activity so you can identify which service is holding connections\n- **Retry logic** — handles transient connection resets without crashing the request\n- **Graceful shutdown** — 10-second drain window prevents dropped requests during deploys",
      timestamp: '2:28 PM',
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
    {
      id: 'c2-9',
      role: 'user',
      content:
        "I want to build a type-safe event emitter where each event name maps to a specific payload type. What's the best way to do this with generics?",
      timestamp: '9:32 AM',
    },
    {
      id: 'c2-10',
      role: 'assistant',
      content:
        "There are three solid approaches, each with different trade-offs:\n\n**1. Interface map approach (Most common)** Define an interface that maps event names to their payload types, then use it as a constraint:\n\n```typescript\ninterface EventMap {\n  userLogin: { userId: string; timestamp: Date };\n  purchase: { itemId: string; amount: number };\n  error: { code: number; message: string };\n}\n\nclass Emitter<T extends Record<string, unknown>> {\n  private listeners = new Map<keyof T, Set<(payload: any) => void>>();\n\n  on<K extends keyof T>(event: K, fn: (payload: T[K]) => void) {\n    if (!this.listeners.has(event)) this.listeners.set(event, new Set());\n    this.listeners.get(event)!.add(fn);\n  }\n\n  emit<K extends keyof T>(event: K, payload: T[K]) {\n    this.listeners.get(event)?.forEach(fn => fn(payload));\n  }\n}\n\nconst bus = new Emitter<EventMap>();\nbus.on('purchase', (p) => console.log(p.amount)); // p is typed\nbus.emit('error', { code: 500, message: 'fail' }); // payload checked\n```\n\nThis is the most common pattern. It's simple, extensible, and gives full autocompletion on both event names and payloads.\n\n**2. Class-based with method overloads (Best IDE experience)** Use overloaded method signatures for a fixed set of events:\n\n```typescript\nclass AppEvents {\n  private handlers = new Map<string, Function[]>();\n\n  on(event: 'userLogin', fn: (p: { userId: string }) => void): void;\n  on(event: 'purchase', fn: (p: { itemId: string; amount: number }) => void): void;\n  on(event: 'error', fn: (p: { code: number; message: string }) => void): void;\n  on(event: string, fn: Function) {\n    const list = this.handlers.get(event) ?? [];\n    list.push(fn);\n    this.handlers.set(event, list);\n  }\n\n  emit(event: 'userLogin', payload: { userId: string }): void;\n  emit(event: 'purchase', payload: { itemId: string; amount: number }): void;\n  emit(event: 'error', payload: { code: number; message: string }): void;\n  emit(event: string, payload: unknown) {\n    this.handlers.get(event)?.forEach(fn => fn(payload));\n  }\n}\n```\n\nGreat IDE experience with explicit signatures, but scales poorly. Every new event means adding two more overload lines. Best for small, stable event sets.\n\n**3. Discriminated union approach (Best for reducers)** Model events as a union type and derive everything from it:\n\n```typescript\ntype AppEvent =\n  | { type: 'userLogin'; userId: string; timestamp: Date }\n  | { type: 'purchase'; itemId: string; amount: number }\n  | { type: 'error'; code: number; message: string };\n\ntype EventType = AppEvent['type'];\ntype EventPayload<T extends EventType> = Extract<AppEvent, { type: T }>;\n\nclass EventBus {\n  private listeners = new Map<string, Set<(e: any) => void>>();\n\n  on<T extends EventType>(type: T, fn: (event: EventPayload<T>) => void) {\n    if (!this.listeners.has(type)) this.listeners.set(type, new Set());\n    this.listeners.get(type)!.add(fn);\n  }\n\n  emit<T extends EventType>(event: EventPayload<T>) {\n    this.listeners.get(event.type)?.forEach(fn => fn(event));\n  }\n}\n\nconst bus = new EventBus();\nbus.on('purchase', (e) => console.log(e.amount));\nbus.emit({ type: 'error', code: 404, message: 'not found' });\n```\n\nThis pattern shines when events flow through reducers or middleware, since the union is easy to narrow with switch statements. The trade-off is that emit takes the full event object rather than separate name + payload args.\n\nMy take: start with option 1 (interface map). It covers 90% of use cases and is the easiest to refactor later. Use option 3 if your events already flow through a Redux-style reducer.",
      timestamp: '9:33 AM',
      solutions: [
        {
          label: 'Interface map approach',
          description: 'Simple, extensible — covers 90% of use cases with full autocompletion',
          fullContent: "Define an interface that maps event names to their payload types, then use it as a constraint:\n\n```typescript\ninterface EventMap {\n  userLogin: { userId: string; timestamp: Date };\n  purchase: { itemId: string; amount: number };\n  error: { code: number; message: string };\n}\n\nclass Emitter<T extends Record<string, unknown>> {\n  private listeners = new Map<keyof T, Set<(payload: any) => void>>();\n\n  on<K extends keyof T>(event: K, fn: (payload: T[K]) => void) {\n    if (!this.listeners.has(event)) this.listeners.set(event, new Set());\n    this.listeners.get(event)!.add(fn);\n  }\n\n  emit<K extends keyof T>(event: K, payload: T[K]) {\n    this.listeners.get(event)?.forEach(fn => fn(payload));\n  }\n}\n```\n\nThis is the most common pattern. It's simple, extensible, and gives full autocompletion on both event names and payloads.",
        },
        {
          label: 'Class-based with method overloads',
          description: 'Best IDE experience but scales poorly as events grow',
          fullContent: "Use overloaded method signatures for a fixed set of events:\n\n```typescript\nclass AppEvents {\n  private handlers = new Map<string, Function[]>();\n\n  on(event: 'userLogin', fn: (p: { userId: string }) => void): void;\n  on(event: 'purchase', fn: (p: { itemId: string; amount: number }) => void): void;\n  on(event: 'error', fn: (p: { code: number; message: string }) => void): void;\n  on(event: string, fn: Function) {\n    const list = this.handlers.get(event) ?? [];\n    list.push(fn);\n    this.handlers.set(event, list);\n  }\n}\n```\n\nGreat IDE experience with explicit signatures, but scales poorly. Every new event means adding two more overload lines.",
        },
        {
          label: 'Discriminated union approach',
          description: 'Ideal for reducers and middleware with easy switch narrowing',
          fullContent: "Model events as a union type and derive everything from it:\n\n```typescript\ntype AppEvent =\n  | { type: 'userLogin'; userId: string; timestamp: Date }\n  | { type: 'purchase'; itemId: string; amount: number }\n  | { type: 'error'; code: number; message: string };\n\ntype EventType = AppEvent['type'];\ntype EventPayload<T extends EventType> = Extract<AppEvent, { type: T }>;\n\nclass EventBus {\n  private listeners = new Map<string, Set<(e: any) => void>>();\n\n  on<T extends EventType>(type: T, fn: (event: EventPayload<T>) => void) {\n    if (!this.listeners.has(type)) this.listeners.set(type, new Set());\n    this.listeners.get(type)!.add(fn);\n  }\n\n  emit<T extends EventType>(event: EventPayload<T>) {\n    this.listeners.get(event.type)?.forEach(fn => fn(event));\n  }\n}\n```\n\nThis pattern shines when events flow through reducers or middleware, since the union is easy to narrow with switch statements.",
        },
      ],
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

  // === c15: Email to design team about new component library (Writing) ===
  // bm4 bookmarks c15-8 (end)
  c15: [
    {
      id: 'c15-1',
      role: 'user',
      content:
        "I need to write an email to our design and engineering teams announcing our new component library. We're launching Atlas next month. Can you help me structure it?",
      timestamp: '10:00 AM',
    },
    {
      id: 'c15-2',
      role: 'assistant',
      content:
        "A launch announcement email like this needs to answer four questions upfront:\n\n1. **What is it?** — One sentence on what Atlas is\n2. **Why does it matter?** — What problem it solves for them\n3. **What changes for me?** — Practical impact on their day-to-day\n4. **What do I do next?** — Single, clear call to action\n\nStructure it as:\n- Subject line (the most important part — gets it opened)\n- Opening hook (the strongest reason to care, in one sentence)\n- What's included (bullet list, scannable)\n- What's different this time / why it'll stick\n- Timeline and next steps\n- Sign off with a link to docs\n\nBefore I draft it — what's the most compelling thing about Atlas that would make a skeptical engineer or designer actually excited to use it?",
      timestamp: '10:02 AM',
    },
    {
      id: 'c15-3',
      role: 'user',
      content:
        "The team is skeptical because we've tried standardizing twice before and it never stuck. The components were either too rigid or poorly documented. How do I address that head-on without dwelling on past failures?",
      timestamp: '10:05 AM',
    },
    {
      id: 'c15-4',
      role: 'assistant',
      content:
        "Acknowledge it in a single sentence, then pivot immediately to what's different. Dwelling on past failures digs the hole deeper — one line of acknowledgment shows self-awareness, and then you move on.\n\nFormula: 'We've tried this before. Here's what's different this time: [specific, concrete thing]'\n\nThe key is making 'what's different' specific and verifiable. Vague promises ('this time it'll be better') will get eye-rolls. Specifics get attention:\n\n- 'Every component ships with a Figma-to-code mapping' (not 'better docs')\n- '3 teams piloted this for 60 days before launch' (not 'we tested it')\n- 'You can override any default without forking the component' (not 'more flexible')\n\nWhat are the actual concrete improvements in Atlas over your previous attempts?",
      timestamp: '10:07 AM',
    },
    {
      id: 'c15-5',
      role: 'user',
      content:
        "Good question. The real difference is that we had 3 product teams use it for 3 months before announcing it. Their feedback shaped the API. Implementation time dropped by 40% and they report fewer designer-developer back-and-forths.",
      timestamp: '10:10 AM',
    },
    {
      id: 'c15-6',
      role: 'assistant',
      content:
        "That's the whole email, right there. Lead with that.\n\n'3 teams. 3 months. 40% faster implementation.' That's your subject line candidate and your opening hook.\n\nThe 40% stat is verifiable and meaningful. The 3-month pilot signals real-world validation, not lab testing. The reduced back-and-forths addresses a pain point everyone on both sides feels.\n\nHere's the revised opening I'd use:\n\n---\n\n**Before we announce Atlas, it's already been doing the work.**\n\nThree product teams have been using it for 90 days. Implementation time is down 40%. The designer-developer revision loops that used to take days are taking hours.\n\nWe didn't build Atlas in isolation this time. We built it with you.\n\n---\n\nThis reframes the entire narrative: instead of 'here's the new system, please adopt it,' it's 'this already works, and here's the proof.' That's a much stronger position.",
      timestamp: '10:12 AM',
    },
    {
      id: 'c15-7',
      role: 'user',
      content:
        "Perfect. Now can you draft the full email? Keep it under 300 words, professional but not corporate-stiff. We're a 40-person startup.",
      timestamp: '10:15 AM',
    },
    {
      id: 'c15-8',
      role: 'assistant',
      content:
        "Here's the full draft:\n\n---\n\n**Subject:** Atlas is live — 3 teams, 90 days, 40% faster\n\nHi team,\n\nBefore we announce Atlas, it's already been doing the work.\n\nThree product teams piloted it for 90 days. Implementation time is down 40%. The designer-developer revision loops that used to eat days are taking hours. We didn't build this in isolation — the API reflects real feedback from the people who had to live with it.\n\n**What's in Atlas:**\n- 60+ production-ready React components with Figma-to-code parity\n- Design tokens for color, spacing, and typography — one source of truth\n- Flexible defaults: override anything without forking or copy-pasting\n- Interactive docs with live examples at atlas.internal\n\n**What's different this time:**\nWe've tried standardizing before and it didn't stick. This time, components were shaped by the teams using them, not handed down from above. If something in Atlas doesn't work for your use case, there's a clear path to propose changes — it's not a locked system.\n\n**Next step:**\nJoin the kickoff session on Thursday at 2 PM (link below). We'll walk through the component library, answer questions, and cover migration for existing projects. If you can't make it, the session will be recorded.\n\n[Join the kickoff](calendar-link) — [Read the docs](atlas.internal)\n\nThanks to the three pilot teams for shaping this. Looking forward to seeing what you build.\n\n— [Your name]\n\n---\n\nWord count: ~210. The tone is direct and confident without being boastful. The single CTA (Thursday kickoff) prevents decision paralysis. Let me know if you want a different subject line or a harder/softer tone.",
      timestamp: '10:17 AM',
    },
    {
      id: 'c15-9',
      role: 'user',
      content: "This is great. Can you also give me a few alternative subject lines — some with more urgency?",
      timestamp: '10:20 AM',
    },
    {
      id: 'c15-10',
      role: 'assistant',
      content:
        "Here are five alternatives across different tones:\n\n**Benefit-led (my recommendation):**\n- 'Atlas is live — 3 teams, 90 days, 40% faster'\n- 'We tested Atlas for 3 months before telling you about it'\n\n**Curiosity / intrigue:**\n- 'Why 3 teams have been secretly using Atlas since October'\n- 'The design system that's been quietly running in production'\n\n**Urgency / action:**\n- 'Atlas launches Thursday — join the kickoff or catch the recording'\n- 'Seats limited: Atlas design system kickoff this Thursday'\n\nMy pick is still the first one. 'Secretly using' and 'quietly running' can read as exclusionary to the people who weren't in the pilot — you don't want the email to make anyone feel left out before they've even read the body.\n\nThe benefit-led subject line works because it leads with proof, not promise. Engineers and designers are skeptical of hype; numbers cut through it.",
      timestamp: '10:22 AM',
    },
  ],

  // === c20: Dashboard layout redesign feedback (Design, Product) ===
  // bm8 bookmarks c20-8 (end)
  c20: [
    {
      id: 'c20-1',
      role: 'user',
      content:
        "We're redesigning our analytics dashboard from scratch. The main debate on the team is sidebar navigation vs top navigation. Which should we use?",
      timestamp: '2:00 PM',
    },
    {
      id: 'c20-2',
      role: 'assistant',
      content:
        "The short answer: it depends on how many top-level sections you have and how much vertical screen real estate your charts need.\n\n**Top navigation** works well when:\n- You have 4 or fewer main sections\n- Content is more page-like (articles, settings, docs)\n- Mobile is your primary platform\n\n**Sidebar navigation** works better when:\n- You have 5+ main sections\n- Users switch between sections frequently\n- You need persistent context about where they are\n- Desktop is the primary platform\n\nFor analytics dashboards specifically, sidebar is almost always the right call. The reason: users need to switch between views constantly (Overview → Acquisition → Retention → Revenue), and they need to do it without losing context. A sidebar makes that switching cost low.\n\nHow many main sections are you planning?",
      timestamp: '2:02 PM',
    },
    {
      id: 'c20-3',
      role: 'user',
      content:
        "We have 7 main sections: Overview, Acquisition, Engagement, Retention, Revenue, Experiments, and Settings.",
      timestamp: '2:04 PM',
    },
    {
      id: 'c20-4',
      role: 'assistant',
      content:
        "7 sections — sidebar, no question.\n\nTop nav with 7 sections on a typical 1440px desktop screen means each item gets about 120px. That's fine for short labels, but 'Experiments' and 'Engagement' start to feel cramped. At 1280px it collapses to a hamburger, which means users lose the navigation hierarchy entirely.\n\nMore importantly, analytics users live in 2-3 sections but need to glance at all 7. A sidebar keeps all options visible and scannable without any interaction. That passive visibility is underrated — it reminds users that Retention exists even when they're in Revenue.\n\nOne consideration: do Settings deserve to be a top-level nav item? Most analytics tools put Settings at the bottom of the sidebar, visually separated from the data sections. That way the primary navigation — the things users actually use daily — are grouped together, and admin/configuration is clearly secondary.",
      timestamp: '2:06 PM',
    },
    {
      id: 'c20-5',
      role: 'user',
      content:
        "Good point about Settings. What about mobile — about 30% of our users are on mobile devices. How does the sidebar work there?",
      timestamp: '2:09 PM',
    },
    {
      id: 'c20-6',
      role: 'assistant',
      content:
        "At 30% mobile, you need a real mobile navigation strategy — not just a collapsed hamburger.\n\nThe hamburger pattern is the weakest option for analytics. It hides the navigation entirely, requiring an extra tap to discover where to go. Users on dashboards are already doing cognitive work (interpreting data); don't add UI work on top.\n\nFor 7 sections at 30% mobile, I'd recommend a **bottom tab bar** for the 4-5 most-used sections, with an overflow pattern for the rest:\n\n```\n[Overview] [Acquisition] [Retention] [Revenue] [More ↑]\n```\n\nThe 'More' tab expands to show Engagement, Experiments, and Settings. This keeps the primary actions reachable with a thumb, which is the primary mobile interaction model.\n\nDecide the 4-5 primary tabs based on your actual usage data (if you have it) — which sections do mobile users visit most? If you don't have data yet, start with Overview, Acquisition, Retention, Revenue as the defaults and make it configurable later.\n\nOn tablets (768-1024px), consider a collapsed sidebar that shows icons only, with labels on hover. This preserves the desktop mental model while reclaiming screen space.",
      timestamp: '2:11 PM',
    },
    {
      id: 'c20-7',
      role: 'user',
      content:
        "That makes sense. What products do this kind of dashboard navigation well? I want to look at real examples before we start wireframing.",
      timestamp: '2:14 PM',
    },
    {
      id: 'c20-8',
      role: 'assistant',
      content:
        "A few dashboards that handle sidebar navigation well, each for different reasons:\n\n**Linear** — Best-in-class sidebar. Collapsible between full (icon + label) and icon-only modes with a clean animation. Active state uses a filled background, not just a colored label — easy to parse at a glance. Nested navigation (Teams → Projects) is handled elegantly with indentation, not dropdowns. Keyboard navigation is first-class.\n\n**Notion** — Excellent for variable-depth hierarchies. The sidebar can hold deeply nested pages without feeling chaotic because of strong visual weight differences between levels. The 'peek on hover' pattern for nested items is worth studying.\n\n**Mixpanel / Amplitude** — Worth looking at specifically because they're analytics dashboards solving the exact same problem you're facing. Amplitude uses a left sidebar with clear section grouping and puts Reports + Dashboards at the top, Settings at the bottom. The 'active section' highlight is a left-edge accent bar, which is subtle but effective.\n\n**Retool** — Good example of collapsible sidebar done right. The collapsed state shows just icons with tooltips on hover — no labels, but still fully navigable. This is what you'd want on tablets.\n\nHere's a rough wireframe structure for your sidebar:\n\n```\n┌─────────────────────────────────┐\n│ [Logo]          [Workspace ▾]   │\n├─────────────────────────────────┤\n│  ▪ Overview                     │  ← Active (filled bg)\n│  ○ Acquisition                  │\n│  ○ Engagement                   │\n│  ○ Retention                    │\n│  ○ Revenue                      │\n│  ○ Experiments                  │\n├─────────────────────────────────┤  ← Divider before admin\n│  ○ Settings                     │\n└─────────────────────────────────┘\n```\n\nFixed width of 220px for desktop, collapsible to 48px (icon-only). Active state: low-opacity background fill + bold label weight. Hover state: subtle background tint. No dropdowns in the sidebar — if a section has subsections, show them inline when that section is active.",
      timestamp: '2:16 PM',
    },
    {
      id: 'c20-9',
      role: 'user',
      content:
        "This is really helpful. Should the Overview section be the default landing page every session, or should we remember where the user was?",
      timestamp: '2:19 PM',
    },
    {
      id: 'c20-10',
      role: 'assistant',
      content:
        "Remember where they were, but default to Overview for first-time users.\n\nThe reasoning: if a user spends 80% of their time in Retention, forcing them through Overview every session is friction with no benefit. Overview is a starting point, not a required checkpoint.\n\nImplementation:\n\n```typescript\n// On mount, check for last visited section\nconst lastSection = localStorage.getItem('dashboard:lastSection');\nconst defaultSection = lastSection ?? 'overview';\n\n// On navigation, persist the current section\nfunction navigateTo(section: string) {\n  localStorage.setItem('dashboard:lastSection', section);\n  router.push(`/dashboard/${section}`);\n}\n```\n\nA few nuances:\n- **Don't persist Settings** as the last section — it's disorienting to land in Settings on load\n- **Reset on logout** — clear the stored section so new sessions start fresh\n- **Share links should still work** — if someone pastes a direct URL to Experiments, that takes priority over the stored preference\n\nFor the first visit specifically, Overview is the right default because new users need orientation. After 2-3 sessions, they know the tool and their preferred section is more valuable than the orientation.\n\nIf you have team accounts, consider storing the preference server-side per user rather than localStorage — so it follows them across devices.",
      timestamp: '2:21 PM',
    },
  ],

  // === c4: React hook dependency arrays (Code) ===
  // bm7 bookmarks c4-2 (beginning)
  c4: [
    {
      id: 'c4-1',
      role: 'user',
      content: "Why is my useEffect running on every render? I'm passing a function as a dependency and I think that's the problem.",
      timestamp: '4:45 PM',
    },
    {
      id: 'c4-2',
      role: 'assistant',
      content:
        "You're right — the function is the problem. Every render creates a new function reference, so React sees a \"new\" dependency each time and re-runs the effect.\n\nHere's what's happening:\n\n```javascript\n// This creates a new function object on every render\nconst handleClick = () => doSomething();\n\nuseEffect(() => {\n  subscribe(handleClick);\n}, [handleClick]); // Re-runs every render because handleClick is always new\n```\n\nYou have two fixes:\n\n**Option 1: Move the function inside the effect** (simplest when the function is only used by that effect)\n\n```javascript\nuseEffect(() => {\n  const handleClick = () => doSomething();\n  subscribe(handleClick);\n  return () => unsubscribe(handleClick);\n}, []); // Empty deps, function defined inside so it's stable\n```\n\n**Option 2: Wrap with useCallback** (when you need the function outside the effect too)\n\n```javascript\nconst handleClick = useCallback(() => {\n  doSomething();\n}, []); // useCallback memoizes the function, same reference across renders\n\nuseEffect(() => {\n  subscribe(handleClick);\n  return () => unsubscribe(handleClick);\n}, [handleClick]); // Now stable — only re-runs if handleClick's deps change\n```\n\nThe core rule: functions defined inline in a component body are unstable references. Either move them inside the effect or stabilize them with useCallback.",
      timestamp: '4:46 PM',
    },
    {
      id: 'c4-3',
      role: 'user',
      content: "I tried useCallback but now I'm getting an ESLint warning: 'React Hook useCallback received a function whose dependencies are unknown'. What does that mean?",
      timestamp: '4:49 PM',
    },
    {
      id: 'c4-4',
      role: 'assistant',
      content:
        "That's the exhaustive-deps rule from eslint-plugin-react-hooks. It's telling you that your useCallback has a dependency it doesn't know about.\n\nThe most common cause: you reference something from the component scope inside the callback but forget to list it as a dependency.\n\n```javascript\n// ESLint warning: 'userId' is used but not in the dependency array\nconst fetchUser = useCallback(() => {\n  return api.getUser(userId); // userId comes from props/state\n}, []); // missing userId\n\n// Correct\nconst fetchUser = useCallback(() => {\n  return api.getUser(userId);\n}, [userId]); // userId listed\n```\n\nThe rule is being helpful here — if userId changes and you don't re-create the callback, fetchUser will close over the stale value and fetch the wrong user.\n\nA few guidelines:\n- Primitive values (strings, numbers, booleans) from props/state always go in deps\n- Setter functions from useState (like setCount) are stable — you can omit them\n- Functions defined at module scope are stable — you can omit them\n- Inline objects and arrays are unstable — stabilize them with useMemo first",
      timestamp: '4:50 PM',
    },
    {
      id: 'c4-5',
      role: 'user',
      content: 'What if the function needs to close over a value from props and that prop changes frequently?',
      timestamp: '4:53 PM',
    },
    {
      id: 'c4-6',
      role: 'assistant',
      content:
        "Include the prop in useCallback's dependency array. The function will be re-created when the prop changes, which is correct behavior.\n\n```javascript\nconst handleSubmit = useCallback(() => {\n  submitForm(formData); // formData from props\n}, [formData]); // Re-creates when formData changes\n```\n\nIf re-creation is expensive or causes downstream effects, there's an advanced pattern using a ref to hold the latest value:\n\n```javascript\n// For event handlers that need to see the latest value without\n// re-subscribing to every change\nconst formDataRef = useRef(formData);\nuseEffect(() => {\n  formDataRef.current = formData; // Keep ref in sync\n});\n\nconst handleSubmit = useCallback(() => {\n  submitForm(formDataRef.current); // Always reads latest via ref\n}, []); // Stable reference, never re-creates\n```\n\nUse this ref pattern sparingly — it bypasses React's reactivity model. It's appropriate for event handlers and callbacks passed to third-party libraries that only need the latest value at call time.",
      timestamp: '4:54 PM',
    },
    {
      id: 'c4-7',
      role: 'user',
      content: 'Is this the same issue causing the infinite loop I have with fetch inside useEffect?',
      timestamp: '4:57 PM',
    },
    {
      id: 'c4-8',
      role: 'assistant',
      content:
        "Yes, same root cause. The classic infinite fetch loop:\n\n```javascript\n// Infinite loop\nuseEffect(() => {\n  fetch('/api/data').then(r => r.json()).then(setData);\n}, [data]); // 'data' changes after fetch -> re-runs effect -> fetches again...\n```\n\nFor data fetching, you almost never want to put the fetched data in the dependency array. Here's the correct async fetch pattern with cleanup:\n\n```javascript\nuseEffect(() => {\n  let cancelled = false; // Prevent state updates after unmount\n  const controller = new AbortController();\n\n  async function fetchData() {\n    try {\n      const response = await fetch('/api/data', {\n        signal: controller.signal,\n      });\n      const json = await response.json();\n      if (!cancelled) setData(json);\n    } catch (err) {\n      if (err.name !== 'AbortError') {\n        if (!cancelled) setError(err);\n      }\n    }\n  }\n\n  fetchData();\n\n  return () => {\n    cancelled = true;\n    controller.abort();\n  };\n}, [userId]); // Only re-fetch when userId changes\n```\n\nThe AbortController cancels in-flight requests when the effect re-runs. The cancelled flag prevents setState on unmounted components.",
      timestamp: '4:58 PM',
    },
    {
      id: 'c4-9',
      role: 'user',
      content: "Got it. What's the rule of thumb for deciding what goes into the dependency array?",
      timestamp: '5:01 PM',
    },
    {
      id: 'c4-10',
      role: 'assistant',
      content:
        "The mental model that makes it click: **anything the effect reads from the component scope goes in the array**.\n\nIf your effect body references it, it should be in deps. The ESLint rule enforces this mechanically. Trust it.\n\nPractical exceptions:\n- **setState setters** (setCount, setData) — always stable, safe to omit\n- **Dispatch from useReducer** — stable, safe to omit\n- **Module-level constants and functions** — stable, safe to omit\n- **Refs** (ref.current) — intentionally mutable, don't belong in deps\n\nThe hardest case is when you genuinely want to run the effect only once on mount, but the effect reads some value. The solution is usually to restructure: either move the value inside the effect, use a ref, or accept that the effect should re-run when the value changes.\n\nIf you find yourself fighting the exhaustive-deps rule, that's usually a signal the component needs to be split up.",
      timestamp: '5:02 PM',
    },
  ],

  // === c6: API rate limiting with Redis (Code, Backend API) ===
  // bm5 bookmarks c6-2 (beginning)
  c6: [
    {
      id: 'c6-1',
      role: 'user',
      content:
        "Which rate limiting algorithm should I use for our API? We need to protect against abuse but not penalize legitimate users who occasionally burst.",
      timestamp: '1:00 PM',
    },
    {
      id: 'c6-2',
      role: 'assistant',
      content:
        "For your requirements — protecting against abuse without penalizing legitimate bursts — the sliding window algorithm gives you the best balance.\n\n**The three main options:**\n\n**Fixed window** — Simplest to implement, but has an edge case: a user can send 2x your limit by front-loading requests at the end of one window and the start of the next. Attackers know this trick.\n\n**Token bucket** — Great for bursting. Users accumulate tokens over time and spend them on requests. A user who's been idle for an hour can burst at full speed. The downside: harder to explain to users what their current limit is.\n\n**Sliding window** — No burst-at-boundary exploit, smooth rate limiting. Users see a consistent rate over any rolling time period. This is what most production APIs use.\n\nHere's a Redis sliding window implementation using a sorted set:\n\n```typescript\nasync function isAllowed(\n  identifier: string,\n  limit: number,\n  windowMs: number\n): Promise<{ allowed: boolean; remaining: number }> {\n  const now = Date.now();\n  const windowStart = now - windowMs;\n  const key = `ratelimit:${identifier}`;\n\n  const [, , count] = await redis\n    .multi()\n    .zremrangebyscore(key, 0, windowStart)\n    .zadd(key, now, `${now}-${Math.random()}`)\n    .zcard(key)\n    .expire(key, Math.ceil(windowMs / 1000))\n    .exec();\n\n  const allowed = count <= limit;\n  return {\n    allowed,\n    remaining: Math.max(0, limit - count),\n  };\n}\n```\n\nCall it like: isAllowed(req.headers['x-api-key'], 100, 60_000) for 100 requests per minute.",
      timestamp: '1:02 PM',
    },
    {
      id: 'c6-3',
      role: 'user',
      content: 'Token bucket actually sounds better for us — our users do legitimate bursting when exporting data. How do I implement that with Redis?',
      timestamp: '1:05 PM',
    },
    {
      id: 'c6-4',
      role: 'assistant',
      content:
        "For token bucket you need atomic read-modify-write, which means a Lua script. Regular Redis commands aren't atomic enough — you'll get race conditions under concurrent requests.\n\n```typescript\nconst TOKEN_BUCKET_SCRIPT = `\nlocal key = KEYS[1]\nlocal capacity = tonumber(ARGV[1])\nlocal refill_rate = tonumber(ARGV[2])\nlocal now = tonumber(ARGV[3])\nlocal requested = tonumber(ARGV[4])\n\nlocal data = redis.call('HMGET', key, 'tokens', 'last_refill')\nlocal tokens = tonumber(data[1]) or capacity\nlocal last_refill = tonumber(data[2]) or now\n\nlocal elapsed = (now - last_refill) / 1000\nlocal new_tokens = math.min(capacity, tokens + (elapsed * refill_rate))\n\nif new_tokens >= requested then\n  new_tokens = new_tokens - requested\n  redis.call('HMSET', key, 'tokens', new_tokens, 'last_refill', now)\n  redis.call('EXPIRE', key, math.ceil(capacity / refill_rate) * 2)\n  return {1, math.floor(new_tokens)}\nelse\n  redis.call('HMSET', key, 'tokens', new_tokens, 'last_refill', now)\n  redis.call('EXPIRE', key, math.ceil(capacity / refill_rate) * 2)\n  return {0, math.floor(new_tokens)}\nend\n`;\n\nasync function checkTokenBucket(\n  identifier: string,\n  capacity: number = 100,\n  refillRate: number = 10\n): Promise<{ allowed: boolean; remaining: number }> {\n  const result = await redis.eval(\n    TOKEN_BUCKET_SCRIPT,\n    1,\n    `bucket:${identifier}`,\n    capacity,\n    refillRate,\n    Date.now(),\n    1\n  ) as [number, number];\n\n  return {\n    allowed: result[0] === 1,\n    remaining: result[1],\n  };\n}\n```\n\nWith capacity: 100, refillRate: 10 — users get 10 req/sec steady state but can burst up to 100 before hitting the limit.",
      timestamp: '1:07 PM',
    },
    {
      id: 'c6-5',
      role: 'user',
      content: 'Should we rate limit by IP or by API key?',
      timestamp: '1:10 PM',
    },
    {
      id: 'c6-6',
      role: 'assistant',
      content:
        "API key is significantly stronger. Rate limiting by IP has serious problems in practice:\n\n- Corporate users behind NAT or a proxy all share one IP — 50 employees hitting your API look like one aggressive client\n- Residential proxies and VPNs trivially rotate IPs, making IP bans useless against determined attackers\n- IPv6 gives attackers a nearly unlimited pool of addresses\n\nFor a public API, the right architecture is:\n\n1. **API key required** — no key, no access. This alone eliminates casual abuse.\n2. **Rate limit by API key** — your primary control. Per-key limits tied to their plan.\n3. **IP as a secondary signal** — if an IP is generating requests with many different keys, that's abuse. Use it for anomaly detection, not as the primary limiter.\n\n```typescript\nasync function rateLimit(req: Request) {\n  const apiKey = req.headers.get('x-api-key');\n\n  if (!apiKey) {\n    return { allowed: false, reason: 'missing_key' };\n  }\n\n  const keyLimit = await checkTokenBucket(`key:${apiKey}`, 1000, 50);\n  if (!keyLimit.allowed) {\n    return { allowed: false, reason: 'key_rate_limit' };\n  }\n\n  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim();\n  if (ip) {\n    const ipLimit = await checkTokenBucket(`ip:${ip}`, 500, 25);\n    if (!ipLimit.allowed) {\n      return { allowed: false, reason: 'ip_rate_limit' };\n    }\n  }\n\n  return { allowed: true };\n}\n```",
      timestamp: '1:12 PM',
    },
    {
      id: 'c6-7',
      role: 'user',
      content:
        'What limits make sense for us? Free tier is 100 req/hour, paid plan is $500/month and should get 10k req/hour.',
      timestamp: '1:15 PM',
    },
    {
      id: 'c6-8',
      role: 'assistant',
      content:
        "Those numbers are reasonable. A few refinements:\n\n**Free tier (100 req/hour)**\n- Token bucket: capacity 20, refill ~0.028/sec\n- Lets them burst 20 requests immediately (good for initial testing) then around 1 req every 36 seconds\n\n**Paid tier (10k req/hour)**\n- Token bucket: capacity 200, refill ~2.78/sec\n- Allows a 200-request burst for your export use case, then ~3 req/sec sustained\n\nFor 429 responses, always include a Retry-After header so clients can back off correctly:\n\n```typescript\nif (!limit.allowed) {\n  const retryAfter = Math.ceil(1 / refillRate);\n\n  return new Response('Too Many Requests', {\n    status: 429,\n    headers: {\n      'Retry-After': String(retryAfter),\n      'X-RateLimit-Limit': String(capacity),\n      'X-RateLimit-Remaining': String(limit.remaining),\n      'X-RateLimit-Reset': String(Date.now() + retryAfter * 1000),\n    },\n  });\n}\n```\n\nWell-behaved API clients automatically read Retry-After and wait instead of hammering your server. This one header dramatically reduces thundering herd behavior.",
      timestamp: '1:17 PM',
    },
    {
      id: 'c6-9',
      role: 'user',
      content: 'How do I surface rate limit info to API consumers proactively, not just when they get a 429?',
      timestamp: '1:20 PM',
    },
    {
      id: 'c6-10',
      role: 'assistant',
      content:
        "Include the standard rate limit headers on every successful response. This is the de facto convention that all major API clients understand:\n\n```typescript\nasync function rateLimitMiddleware(req: Request): Promise<Response> {\n  const apiKey = req.headers.get('x-api-key')!;\n  const tier = await getKeyTier(apiKey);\n  const { capacity, refillRate } = TIER_LIMITS[tier];\n\n  const limit = await checkTokenBucket(`key:${apiKey}`, capacity, refillRate);\n\n  const headers = {\n    'X-RateLimit-Limit': String(capacity),\n    'X-RateLimit-Remaining': String(limit.remaining),\n    'X-RateLimit-Reset': String(\n      Math.ceil(Date.now() / 1000) + Math.ceil((capacity - limit.remaining) / refillRate)\n    ),\n    'X-RateLimit-Policy': `${capacity};w=3600`,\n  };\n\n  if (!limit.allowed) {\n    return new Response('Too Many Requests', {\n      status: 429,\n      headers: { ...headers, 'Retry-After': String(Math.ceil(1 / refillRate)) },\n    });\n  }\n\n  const response = await handleRequest(req);\n  Object.entries(headers).forEach(([k, v]) => response.headers.set(k, v));\n  return response;\n}\n```\n\nThe key headers:\n- **X-RateLimit-Limit** — what their ceiling is\n- **X-RateLimit-Remaining** — how many tokens they have left right now\n- **X-RateLimit-Reset** — Unix timestamp when the limit resets\n\nGood SDKs like Axios and ky can be configured to read these and auto-throttle before hitting 429.",
      timestamp: '1:22 PM',
    },
  ],

  // === c7: Zod schema validation patterns (Code) ===
  // bm3 bookmarks c7-5 (middle)
  c7: [
    {
      id: 'c7-1',
      role: 'user',
      content:
        "We have the same validation logic duplicated in our Express backend and React frontend. User registration validates email format and password strength in two separate places. How do we centralize this?",
      timestamp: '11:30 AM',
    },
    {
      id: 'c7-2',
      role: 'assistant',
      content:
        "Zod is built for exactly this. Define your validation schemas once, and they work everywhere — Node.js backend, React frontend, even edge functions.\n\nThe key insight: Zod schemas are just JavaScript objects. You can put them in a shared file and import them anywhere.\n\n```typescript\n// schemas/user.ts — shared between frontend and backend\nimport { z } from 'zod';\n\nexport const registerSchema = z.object({\n  email: z.string().email('Invalid email format'),\n  password: z\n    .string()\n    .min(8, 'Password must be at least 8 characters')\n    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')\n    .regex(/[0-9]/, 'Must contain at least one number'),\n  name: z.string().min(2).max(100),\n});\n\n// Derive the TypeScript type from the schema — no duplication\nexport type RegisterInput = z.infer<typeof registerSchema>;\n```\n\nThen on the backend:\n```typescript\napp.post('/register', async (req, res) => {\n  const result = registerSchema.safeParse(req.body);\n  if (!result.success) {\n    return res.status(400).json({ errors: result.error.flatten() });\n  }\n  // result.data is now typed as RegisterInput\n});\n```\n\nAnd on the frontend with React Hook Form:\n```typescript\nconst form = useForm<RegisterInput>({\n  resolver: zodResolver(registerSchema),\n});\n```",
      timestamp: '11:32 AM',
    },
    {
      id: 'c7-3',
      role: 'user',
      content: "Where should we put the shared schemas? We're a monorepo with separate frontend and backend packages.",
      timestamp: '11:35 AM',
    },
    {
      id: 'c7-4',
      role: 'assistant',
      content:
        "In a monorepo, create a shared package:\n\n```\npackages/\n  schemas/\n    package.json\n    src/\n      user.ts\n      product.ts\n      index.ts\napps/\n  web/\n  api/\n```\n\n```json\n// packages/schemas/package.json\n{\n  \"name\": \"@company/schemas\",\n  \"exports\": {\n    \".\": \"./src/index.ts\"\n  },\n  \"dependencies\": {\n    \"zod\": \"^3.22.0\"\n  }\n}\n```\n\nBoth apps list @company/schemas in their dependencies. Your monorepo tool (Turborepo, Nx, pnpm workspaces) handles the linking.\n\nIf you're not on a monorepo yet, a simpler interim approach: put schemas in a shared/ directory at the repo root and configure path aliases in both tsconfig files to import from @shared/schemas. Less clean but gets you sharing without the monorepo overhead.",
      timestamp: '11:37 AM',
    },
    {
      id: 'c7-5',
      role: 'assistant',
      content:
        "A few best practices that save pain later:\n\n**1. Colocate schemas with their domain** — Don't put everything in one massive schemas file. user.ts goes with user-related code, product.ts with product code. Each file exports both the schema and the inferred type:\n\n```typescript\nexport const userSchema = z.object({ ... });\nexport type User = z.infer<typeof userSchema>;\n```\n\n**2. Use .extend() and .merge() to stay DRY** — When variants of a schema differ slightly:\n\n```typescript\nconst baseUserSchema = z.object({\n  email: z.string().email(),\n  name: z.string(),\n});\n\n// Frontend: what the user fills in\nexport const createUserSchema = baseUserSchema.extend({\n  password: z.string().min(8),\n  confirmPassword: z.string(),\n}).refine(data => data.password === data.confirmPassword, {\n  message: 'Passwords must match',\n  path: ['confirmPassword'],\n});\n\n// API response: what comes back from the server\nexport const userResponseSchema = baseUserSchema.extend({\n  id: z.string().uuid(),\n  createdAt: z.coerce.date(),\n});\n\nexport type CreateUserInput = z.infer<typeof createUserSchema>;\nexport type UserResponse = z.infer<typeof userResponseSchema>;\n```\n\n**3. Barrel export from index.ts** — So consumers import from one place:\n\n```typescript\n// packages/schemas/src/index.ts\nexport * from './user';\nexport * from './product';\nexport * from './order';\n```\n\n**4. Version your schemas** — When you ship a breaking schema change, consider keeping the old schema as v1UserSchema and the new one as userSchema. This prevents migration issues if you have multiple services on different deploy schedules.",
      timestamp: '11:39 AM',
    },
    {
      id: 'c7-6',
      role: 'user',
      content: 'How do we handle backend-only fields in the shared schema? For example, password hashes should never go to the frontend.',
      timestamp: '11:42 AM',
    },
    {
      id: 'c7-7',
      role: 'assistant',
      content:
        "Create separate schemas for what's stored vs. what's returned:\n\n```typescript\n// The full database row — backend only\nexport const userDbSchema = z.object({\n  id: z.string().uuid(),\n  email: z.string().email(),\n  name: z.string(),\n  passwordHash: z.string(),\n  salt: z.string(),\n  createdAt: z.coerce.date(),\n  updatedAt: z.coerce.date(),\n});\n\n// What the API returns — safe to share\nexport const userPublicSchema = userDbSchema.omit({\n  passwordHash: true,\n  salt: true,\n});\n\nexport type UserDb = z.infer<typeof userDbSchema>;\nexport type UserPublic = z.infer<typeof userPublicSchema>;\n```\n\nUsing .omit() derives the public schema from the private one — if you add a field to the DB schema, you have to explicitly decide whether to omit it. The burden is on inclusion, not exclusion, which is safer.\n\nIn your API handler:\n```typescript\nasync function getUser(id: string): Promise<UserPublic> {\n  const dbRow = await db.query('SELECT * FROM users WHERE id = $1', [id]);\n  const user = userDbSchema.parse(dbRow);\n  return userPublicSchema.parse(user); // Strips private fields\n}\n```",
      timestamp: '11:43 AM',
    },
    {
      id: 'c7-8',
      role: 'user',
      content: 'Can we validate API responses on the frontend too, or just inputs?',
      timestamp: '11:46 AM',
    },
    {
      id: 'c7-9',
      role: 'assistant',
      content:
        "Yes, and you should. Validating API responses on the frontend catches schema drift — when your backend changes the response shape but the frontend hasn't been updated.\n\n```typescript\nimport { userPublicSchema } from '@company/schemas';\n\nasync function fetchUser(id: string) {\n  const response = await fetch(`/api/users/${id}`);\n  const json = await response.json();\n\n  const result = userPublicSchema.safeParse(json);\n\n  if (!result.success) {\n    console.error('API response validation failed:', result.error.flatten());\n    throw new Error('Unexpected API response shape');\n  }\n\n  return result.data; // Fully typed as UserPublic\n}\n```\n\nIn practice this catches:\n- New required fields the frontend doesn't know about\n- Type changes (e.g., id changed from number to string UUID)\n- Renamed fields after a refactor\n\nA pragmatic approach: use .safeParse() in development and staging with console warnings, but consider whether to throw in production. Some teams prefer silent failures in prod over hard errors.",
      timestamp: '11:47 AM',
    },
    {
      id: 'c7-10',
      role: 'user',
      content: "This is exactly what we needed. One more: what about async validation, like checking if a username is already taken?",
      timestamp: '11:50 AM',
    },
    {
      id: 'c7-11',
      role: 'assistant',
      content:
        "Zod supports async validation with .refine(). The catch: you must use .parseAsync() instead of .parse() anywhere that schema is used.\n\n```typescript\nexport const usernameSchema = z\n  .string()\n  .min(3)\n  .max(30)\n  .regex(/^[a-z0-9_]+$/, 'Only lowercase letters, numbers, and underscores')\n  .refine(\n    async (username) => {\n      const exists = await db.users.count({ where: { username } });\n      return exists === 0;\n    },\n    { message: 'Username is already taken' }\n  );\n\nconst result = await usernameSchema.safeParseAsync(inputUsername);\n```\n\nOn the frontend, the async refine call goes to the database — which you don't want. Two strategies:\n\n**1. Split schemas** — usernameFormatSchema (sync, shared) and usernameAvailabilitySchema (async, backend only). Frontend validates format, backend validates both.\n\n**2. Use the form library's async validation** — React Hook Form has validate callbacks that run async. Keep the format validation in Zod, add the availability check as a separate form validation step:\n\n```typescript\nconst form = useForm({\n  resolver: zodResolver(usernameFormatSchema),\n});\n\nform.register('username', {\n  validate: async (value) => {\n    const res = await fetch(`/api/check-username?u=${value}`);\n    const { available } = await res.json();\n    return available || 'Username is already taken';\n  },\n});\n```\n\nOption 2 is cleaner — keeps async side effects out of your schema definitions.",
      timestamp: '11:52 AM',
    },
  ],

  // === c12: Content strategy for Q1 blog (Writing) ===
  // bm6 bookmarks c12-5 (middle)
  c12: [
    {
      id: 'c12-1',
      role: 'user',
      content: "How should we structure our content calendar for the next quarter? We're a developer tools company trying to grow organic traffic.",
      timestamp: '9:00 AM',
    },
    {
      id: 'c12-2',
      role: 'assistant',
      content:
        "For a developer tools company, I'd suggest this content mix:\n\n- **40% educational** (tutorials, how-to guides) — highest organic value, what developers actively search for\n- **30% thought leadership** (opinions, industry takes, architecture decisions) — builds brand and gets shared\n- **20% product updates** (new features, changelogs, use cases) — converts readers already in your funnel\n- **10% case studies** (customer stories, real results) — high trust, takes longer to produce\n\nThe 40% educational focus is deliberate. Tutorials rank well, stay relevant for years, and attract developers when they're actively solving a problem — the highest-intent moment.\n\nThought leadership creates the differentiation. Two developer tools companies publishing tutorials on the same topics can look identical. Your opinions and architectural philosophy are what makes one company's content worth following over another's.",
      timestamp: '9:02 AM',
    },
    {
      id: 'c12-3',
      role: 'user',
      content: "We only have bandwidth for about 2 posts per week. How do we prioritize given that constraint?",
      timestamp: '9:05 AM',
    },
    {
      id: 'c12-4',
      role: 'assistant',
      content:
        "With 2 posts per week, I'd do one evergreen plus one timely:\n\n**Monday: Evergreen SEO piece** — tutorial, how-to, or concept explanation targeting a specific search query. These compound. A well-written tutorial from January will still drive traffic in December. Spend more time here.\n\n**Thursday: Timely/topical piece** — a response to something current (a framework release, a Twitter debate, a library deprecation). These spike in the first week then flatten. Less time investment, but keeps you visible in the conversation.\n\nFor the evergreen pieces, do keyword research first. 'How to implement X with Y' style titles where X is a pain point and Y is your tool's domain. Check monthly search volume — even 200 searches/month for a high-intent dev topic is worthwhile.\n\nFor timely pieces, have a 1-2 day turnaround capacity. When a major library publishes a breaking change, you want to be first with a clear explainer. That's how you get inbound links.",
      timestamp: '9:07 AM',
    },
    {
      id: 'c12-5',
      role: 'assistant',
      content:
        "Here's a Q1 structure that builds on itself:\n\n**January — Foundations**\nTarget developers discovering your tool. Foundational how-to guides that answer 'what is this and why should I use it?'\n\nTitle suggestions:\n- 'Getting started with [Tool]: a complete guide for 2026'\n- 'Why we built [Tool]: the problem with existing solutions'\n- 'How [Tool] compares to [Competitor A] and [Competitor B]'\n- '5-minute setup: [Tool] with Next.js'\n- 'Understanding [core concept]: the mental model that makes [Tool] click'\n\n**February — Intermediate**\nNow that readers know the basics, go deeper into integrations and real-world workflows.\n\nTitle suggestions:\n- '[Tool] + [popular framework]: complete integration guide'\n- 'Migrating from [Old Approach] to [Tool]: step by step'\n- 'Production checklist: deploying [Tool] at scale'\n- 'Our customers' 5 most common [Tool] patterns'\n- 'How [Company] cut [metric] by [X]% using [Tool]'\n\n**March — Advanced**\nFor the developers who've been using your tool for a while. This content signals expertise and gets shared in developer communities.\n\nTitle suggestions:\n- 'Performance deep-dive: how we optimized [Tool] to handle [scale]'\n- 'Security hardening guide for [Tool] in production'\n- 'The [Tool] internals: how [feature] actually works'\n- 'Testing strategies for [Tool]-heavy applications'\n- '[Tool] 2026 roadmap: what we're building and why'\n\nThis arc — foundations to integrations to advanced — mirrors the learning journey of a new user becoming a power user.",
      timestamp: '9:09 AM',
    },
    {
      id: 'c12-6',
      role: 'user',
      content: 'Should we repurpose blog posts for LinkedIn and Twitter, or create separate content for each?',
      timestamp: '9:12 AM',
    },
    {
      id: 'c12-7',
      role: 'assistant',
      content:
        "Repurpose, but adapt to the platform. Creating separate content for each channel isn't sustainable at 2 posts/week.\n\nThe repurposing formula:\n\n**Blog post to Twitter thread**\nExtract the single most interesting insight or counterintuitive point. Open with that as a hook. The thread is 5-8 tweets, not a summary of the post — it's the post's best idea expanded with examples. End with a 'read the full post' link.\n\n**Blog post to LinkedIn**\nLinkedIn rewards narrative. Start with why the problem matters from a business or career perspective, not a technical one. The technical details live in the blog; LinkedIn gets the story around them. First comment contains the link (LinkedIn suppresses posts with links in the body).\n\n**Blog post to Newsletter**\nIf you have one, the newsletter intro is different from the blog intro. Newsletter readers feel more like a community — talk to them directly. Include what you learned writing the post, not just what's in the post.\n\nTime estimate: a 1-hour blog post takes maybe 30 additional minutes to distribute across all three. The blog is the depth, everything else is breadth.",
      timestamp: '9:14 AM',
    },
    {
      id: 'c12-8',
      role: 'user',
      content: 'How do we measure whether the content is actually working?',
      timestamp: '9:17 AM',
    },
    {
      id: 'c12-9',
      role: 'assistant',
      content:
        "Split your metrics into leading (early signals) and lagging (outcomes):\n\n**Leading metrics** — visible within 1-4 weeks:\n- Organic impressions in Google Search Console (are you showing up for target queries?)\n- Time on page (3+ minutes is good for technical content)\n- Scroll depth (are they reading past the fold?)\n- Social shares and inbound links\n\n**Lagging metrics** — visible in 2-6 months:\n- Organic search traffic to the blog (absolute and trend)\n- Signups attributed to blog (utm_source=blog)\n- Trial starts from content pages specifically\n- 'How did you hear about us?' responses mentioning your blog\n\nFor a developer tools company, watch **organic impressions by target keyword** most closely in Q1. That tells you whether Google is indexing and considering your content, even before rankings improve. Rankings take 3-6 months to stabilize.\n\nOne trap to avoid: don't optimize for page views early on. A technical tutorial with 500 highly-engaged developers reading it is worth more than a listicle with 5,000 bouncing.",
      timestamp: '9:19 AM',
    },
    {
      id: 'c12-10',
      role: 'user',
      content: 'Can you suggest a specific publishing schedule for January with titles?',
      timestamp: '9:22 AM',
    },
    {
      id: 'c12-11',
      role: 'assistant',
      content:
        "Here's a full January schedule:\n\n**Week 1 (Jan 6)**\n- Monday: 'Getting started with [Tool] in 2026: complete beginner guide' — Educational, evergreen\n- Thursday: 'What we shipped in December: [Feature] is now in GA' — Product update\n\n**Week 2 (Jan 13)**\n- Monday: 'How to set up [Tool] with Next.js App Router' — Tutorial, high search volume\n- Thursday: '[Tool] vs [Competitor]: an honest comparison' — Thought leadership\n\n**Week 3 (Jan 20)**\n- Monday: 'The 5 [Tool] patterns we see in every production deployment' — Evergreen best practices\n- Thursday: 'Why we open-sourced [component/feature]' — Announcement and story\n\n**Week 4 (Jan 27)**\n- Monday: 'Migrating from [Old Approach] to [Tool]: our guide' — Evergreen, captures migration searches\n- Thursday: 'Q1 2026 roadmap: what's coming in [Tool]' — Timely, drives engagement\n\nDistribution:\n- Monday posts: Full Twitter thread + LinkedIn narrative + Newsletter\n- Thursday posts: Single tweet with key stat or quote + short LinkedIn post\n\nWrite January posts in December if possible. Batching is 2-3x more efficient than producing one post at a time.",
      timestamp: '9:24 AM',
    },
  ],
};
