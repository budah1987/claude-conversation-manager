import { Conversation } from '@/types';

export const ALL_CONVERSATIONS: Conversation[] = [
  // === CODE (12 conversations) ===
  {
    id: 'c1',
    title: 'Debug PostgreSQL connection pooling',
    preview: 'Looking at the connection timeout issue you mentioned. The pool size of 20 seems too low for your traffic pattern. Consider bumping to 50 with a 30s idle timeout...',
    timestamp: '2026-02-12T18:00:00Z',
    project: 'Backend API',
    pinned: true,
    starred: true,
  },
  {
    id: 'c2',
    title: 'TypeScript generic constraints help',
    preview: 'Using the extends keyword to constrain the generic parameter to only accept objects with a specific shape. Here is the pattern you want...',
    timestamp: '2026-02-09T14:30:00Z',
  },
  {
    id: 'c3',
    title: 'Next.js middleware auth flow',
    preview: 'Added typescript types for the session object to fix the middleware type errors in the edge runtime. The key issue was the JWT payload shape...',
    timestamp: '2026-01-28T10:15:00Z',
    project: 'Backend API',
  },
  {
    id: 'c4',
    title: 'React hook dependency arrays',
    preview: 'The useEffect cleanup function should handle the subscription teardown before the component unmounts. Your dependency array is missing the callback ref...',
    timestamp: '2026-01-26T16:45:00Z',
    project: 'Learning',
  },
  {
    id: 'c5',
    title: 'Optimizing Tailwind bundle size',
    preview: 'Your production CSS is 48kb which is larger than expected. The issue is the safelist pattern matching too broadly. Here is how to scope it down...',
    timestamp: '2026-01-24T09:20:00Z',
  },
  {
    id: 'c6',
    title: 'API rate limiting with Redis',
    preview: 'For the sliding window approach, use a sorted set with timestamps as scores. This gives you O(log n) operations and atomic cleanup of expired entries...',
    timestamp: '2026-01-22T13:00:00Z',
    project: 'Backend API',
  },
  {
    id: 'c7',
    title: 'Zod schema validation patterns',
    preview: 'Instead of duplicating types, derive your TypeScript types from the Zod schemas using z.infer. This keeps your runtime validation and compile-time types in sync...',
    timestamp: '2026-01-20T11:30:00Z',
  },
  {
    id: 'c8',
    title: 'Fix Prisma migration conflict',
    preview: 'The migration history diverged because two branches modified the same table. You need to mark the conflicting migration as resolved, then create a new baseline...',
    timestamp: '2026-01-18T15:45:00Z',
    project: 'Backend API',
  },
  {
    id: 'c9',
    title: 'WebSocket reconnection strategy',
    preview: 'Exponential backoff with jitter is the right approach here. Start at 1s, cap at 30s, and add random jitter of 0-1s to prevent thundering herd on server recovery...',
    timestamp: '2026-01-15T10:00:00Z',
  },
  {
    id: 'c10',
    title: 'Server component data fetching',
    preview: 'Since this component never needs client interactivity, keep it as a server component and fetch directly. The waterfall concern is solved by parallel Promise.all...',
    timestamp: '2026-01-12T14:20:00Z',
  },
  {
    id: 'c11',
    title: 'Stripe webhook signature verification',
    preview: 'The 400 errors are happening because the raw body is being parsed before verification. You need to use the raw buffer, not the JSON-parsed body, for signature checks...',
    timestamp: '2026-01-08T16:30:00Z',
    project: 'Backend API',
  },
  {
    id: 'c12',
    title: 'Custom ESLint rule for import order',
    preview: 'Here is an ESLint plugin config that enforces your preferred import grouping: external packages first, then internal aliases, then relative imports, each separated by a blank line...',
    timestamp: '2026-01-05T12:00:00Z',
  },

  // === WRITING (8 conversations) ===
  {
    id: 'w1',
    title: 'Q1 case study draft review',
    preview: "Here's my feedback on the structure. The problem statement needs more specificity around the user pain. Currently it reads as a generic UX improvement story...",
    timestamp: '2026-02-11T19:00:00Z',
    pinned: true,
    starred: true,
  },
  {
    id: 'w2',
    title: 'LinkedIn post about design systems',
    preview: 'This draft is solid but the hook needs work. Opening with a question performs better than a statement on LinkedIn. Try leading with the tension between speed and consistency...',
    timestamp: '2026-02-08T10:30:00Z',
  },
  {
    id: 'w3',
    title: 'Portfolio project descriptions',
    preview: 'For each project, lead with the business outcome, not the process. Hiring managers scan in 8 seconds. The payment dashboard entry should open with the 34% adoption increase...',
    timestamp: '2026-01-29T13:15:00Z',
    project: 'Job Search',
  },
  {
    id: 'w4',
    title: 'Cold outreach email to Linear',
    preview: 'Keep it under 100 words. Reference a specific thing they shipped recently that you admire, then connect it to a problem you have solved. No attachments on first touch...',
    timestamp: '2026-01-25T11:00:00Z',
    project: 'Job Search',
  },
  {
    id: 'w5',
    title: 'Technical blog post outline',
    preview: 'The token system article should follow a problem-solution-implementation arc. Open with why most design token implementations break down, then show your approach...',
    timestamp: '2026-01-21T14:45:00Z',
  },
  {
    id: 'w6',
    title: 'Resume bullet point rewrites',
    preview: 'Every bullet should follow the "accomplished X by doing Y which resulted in Z" format. Your current Meridian bullet buries the $200M figure at the end. Lead with it...',
    timestamp: '2026-01-17T09:30:00Z',
    project: 'Job Search',
  },
  {
    id: 'w7',
    title: 'Readme for open source project',
    preview: 'Structure it as: one-line description, screenshot/gif, quick start (under 3 commands), features list, API reference. Skip the badges until you have real CI/CD...',
    timestamp: '2026-01-13T16:00:00Z',
  },
  {
    id: 'w8',
    title: 'Thank you note after interview',
    preview: 'Reference the specific technical discussion you had about their edge caching architecture. Reiterate your interest and mention the follow-up idea you discussed...',
    timestamp: '2026-01-09T10:15:00Z',
    project: 'Job Search',
  },

  // === RESEARCH (5 conversations) ===
  {
    id: 'r1',
    title: 'Competitive analysis framework',
    preview: 'For the research phase, start with a feature parity matrix across all four platforms, then layer in user sentiment from forums and reviews. Weight by recency...',
    timestamp: '2026-01-25T15:30:00Z',
  },
  {
    id: 'r2',
    title: 'AI chat organization pain points',
    preview: 'The most requested feature across all platforms is folders or categories. 277 upvotes on OpenAI forum, 100K users on the Superpower extension, 20+ Chrome extensions built to solve this...',
    timestamp: '2026-01-23T11:45:00Z',
    project: 'Case Study',
  },
  {
    id: 'r3',
    title: 'Design engineer salary benchmarks',
    preview: 'Based on levels.fyi and Glassdoor data, design engineer roles at your target companies range from $160-220K base in SF/NYC. Remote positions trend 10-15% lower...',
    timestamp: '2026-01-19T14:00:00Z',
    project: 'Job Search',
  },
  {
    id: 'r4',
    title: 'Comparing command palette patterns',
    preview: 'Linear, Raycast, and VS Code all use slightly different approaches. Linear groups by action type, Raycast by recency, VS Code by file type. The key UX differentiator is...',
    timestamp: '2026-01-14T10:30:00Z',
    project: 'Case Study',
  },
  {
    id: 'r5',
    title: 'B2B SaaS onboarding benchmarks',
    preview: 'The industry standard for time-to-value in B2B tools is under 5 minutes. Your payment dashboard hits this at 3 minutes for basic setup, but the advanced config pushes it to 12...',
    timestamp: '2026-01-07T16:20:00Z',
  },

  // === DESIGN (4 conversations) ===
  {
    id: 'd1',
    title: 'Component library naming conventions',
    preview: 'For the design system, I recommend prefixing all primitive components with the system name to avoid collisions with third-party libraries. So Button becomes MdsButton...',
    timestamp: '2026-02-08T13:00:00Z',
    project: 'Design System',
    pinned: true,
    starred: true,
  },
  {
    id: 'd2',
    title: 'Dark mode token mapping strategy',
    preview: 'Rather than creating separate dark tokens, use semantic aliases that swap values. So --bg-primary maps to white in light and #30302E in dark. This keeps your component code theme-agnostic...',
    timestamp: '2026-01-27T11:15:00Z',
    project: 'Design System',
  },
  {
    id: 'd3',
    title: 'Figma auto-layout best practices',
    preview: 'Set your base frame to hug contents horizontally and fill container vertically. Use absolute positioning only for overlays and floating elements, never for layout...',
    timestamp: '2026-01-16T14:45:00Z',
    project: 'Design System',
  },
  {
    id: 'd4',
    title: 'Accessible color contrast for alerts',
    preview: 'Your warning state fails WCAG AA on the light background. The amber text needs to darken to at least #6B4D1A to hit 4.5:1 contrast ratio against white. Here are the adjusted values...',
    timestamp: '2026-01-10T09:00:00Z',
    project: 'Design System',
  },

  // === PLANNING (3 conversations) ===
  {
    id: 'p1',
    title: 'Sprint planning template',
    preview: 'Here is a structured template for your bi-weekly sprint planning. It includes capacity allocation, carry-over tracking, and a risk flag column for blockers...',
    timestamp: '2026-01-27T10:00:00Z',
    project: 'Backend API',
  },
  {
    id: 'p2',
    title: 'Case study 7-day timeline',
    preview: 'Day 1: research and define. Day 2: ideate and pick direction. Days 3-5: prototype build. Day 6: test and polish. Day 7: write the case study and launch on social...',
    timestamp: '2026-01-24T15:30:00Z',
    project: 'Case Study',
    pinned: true,
    starred: true,
  },
  {
    id: 'p3',
    title: 'Q1 job search strategy',
    preview: 'Focus on 4 companies max. For each: research their design team, find a warm intro if possible, build one targeted artifact, then reach out. Spray-and-pray does not work at this level...',
    timestamp: '2026-01-11T12:45:00Z',
    project: 'Job Search',
  },

  // === DEMO ===
  {
    id: 'react-demo',
    title: 'What is react.js?',
    preview: 'React is a JavaScript library for building user interfaces, primarily for web applications. It was developed by Meta and is maintained by a community of developers...',
    timestamp: '2026-02-14T12:00:00Z',
    project: 'Learning',
  },

  // === LEARNING (3 conversations) ===
  {
    id: 'l1',
    title: 'Understanding React Server Components',
    preview: 'The mental model shift is this: server components run once on the server and send HTML. Client components hydrate and become interactive. The boundary is the "use client" directive...',
    timestamp: '2026-01-22T14:00:00Z',
    project: 'Learning',
  },
  {
    id: 'l2',
    title: 'Framer Motion animation patterns',
    preview: 'For enter/exit animations, wrap with AnimatePresence and use initial, animate, and exit props. The key prop on children forces re-mount which triggers the animation cycle...',
    timestamp: '2026-01-15T11:30:00Z',
    project: 'Learning',
  },
  {
    id: 'l3',
    title: 'Design tokens vs CSS variables',
    preview: 'Design tokens are platform-agnostic values (JSON), CSS variables are one output format. Tokens Studio exports tokens that get transformed into CSS, iOS, Android values. The token is the source of truth...',
    timestamp: '2026-01-06T13:15:00Z',
    project: 'Learning',
  },
];

export const RECENT_SEARCHES = [
  'typescript generics',
  'PostgreSQL pooling',
  'design system tokens',
  'case study',
  'Stripe webhook',
];
