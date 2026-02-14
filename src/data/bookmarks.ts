import { Bookmark } from '@/types';

export const SEED_BOOKMARKS: Bookmark[] = [
  // Single Text variant
  {
    id: 'bm1',
    variant: 'single-text',
    conversationId: 'c1',
    conversationTitle: 'Debug PostgreSQL connection pooling',
    messageId: 'm1-2',
    userQuery: 'Why is my connection pool timing out during peak traffic?',
    responsePreview: 'Looking at the connection timeout issue you mentioned. The pool size of 20 seems too low for your traffic pattern. Consider bumping to 50 with a 30s idle timeout...',
    fullResponse: 'Looking at the connection timeout issue you mentioned. The pool size of 20 seems too low for your traffic pattern. Consider bumping to 50 with a 30s idle timeout. Additionally, you should implement connection retry logic with exponential backoff. This will help handle temporary spikes without dropping requests.',
    project: 'Backend API',
    createdAt: '2026-02-12T18:30:00Z',
  },

  // Single with Code Block variant
  {
    id: 'bm2',
    variant: 'single-code',
    conversationId: 'c2',
    conversationTitle: 'TypeScript generic constraints help',
    messageId: 'm2-2',
    userQuery: 'How do I constrain a generic to only accept objects with an id property?',
    responsePreview: 'Using the extends keyword to constrain the generic parameter to only accept objects with a specific shape...',
    fullResponse: 'Using the extends keyword to constrain the generic parameter to only accept objects with a specific shape. Here is the pattern you want:',
    codeBlock: `function updateEntity<T extends { id: string }>(entity: T): T {
  // TypeScript now knows that entity.id exists and is a string
  console.log(\`Updating entity with id: \${entity.id}\`);
  return { ...entity, updatedAt: new Date() };
}

// This works
updateEntity({ id: '123', name: 'John' });

// This fails - no id property
updateEntity({ name: 'John' });`,
    codeLanguage: 'typescript',
    createdAt: '2026-02-09T15:00:00Z',
  },

  // Multi-Bookmark variant
  {
    id: 'bm3',
    variant: 'multi-bookmark',
    conversationId: 'c7',
    conversationTitle: 'Zod schema validation patterns',
    messageId: 'm7-2',
    userQuery: 'What are the best practices for sharing validation logic between frontend and backend?',
    responsePreview: 'Instead of duplicating types, derive your TypeScript types from the Zod schemas using z.infer...',
    fullResponse: 'Instead of duplicating types, derive your TypeScript types from the Zod schemas using z.infer. This keeps your runtime validation and compile-time types in sync. Here are three approaches:',
    options: [
      {
        id: 'A',
        label: 'OPTION A',
        title: 'Monorepo package',
        content: 'Create a shared validation package that both frontend and backend import. This ensures consistency and allows you to version your schemas independently.',
        isSaved: true,
      },
      {
        id: 'B',
        label: 'OPTION B',
        title: 'Code generation',
        content: 'Use a tool like ts-to-zod to generate schemas from TypeScript types. This works well for existing codebases but can lead to circular dependencies.',
        isSaved: false,
      },
      {
        id: 'C',
        label: 'OPTION C',
        title: 'Runtime validation only',
        content: 'Keep schemas in backend, frontend uses inferred types from API responses. Simple but loses compile-time validation on the frontend.',
        isSaved: true,
      },
    ],
    note: 'Leaning toward Option A for our project structure',
    createdAt: '2026-01-22T14:30:00Z',
  },

  // Draft variant
  {
    id: 'bm4',
    variant: 'draft',
    conversationId: 'c15',
    conversationTitle: 'Email to design team about new component library',
    messageId: 'm15-2',
    userQuery: 'Draft an email announcing our new design system to the team',
    responsePreview: 'Here is a draft email announcing the new component library...',
    fullResponse: 'Here is a draft email announcing the new component library:',
    draftContent: `Subject: Introducing Atlas - Our New Design System

Hi team,

I'm excited to announce that Atlas, our new design system, is now live and ready for use across all product teams.

**What's included:**
- 50+ production-ready React components
- Comprehensive design tokens (colors, spacing, typography)
- Figma library with 1:1 code parity
- Interactive Storybook documentation

**Getting started:**
Visit atlas.company.com for full documentation and migration guides. We've also scheduled hands-on workshops for each team next week.

Looking forward to seeing what you build with it!

Best,
[Your name]`,
    strategicNote: 'I kept the tone enthusiastic but professional, highlighted the key benefits, and included a clear call-to-action with the documentation link and workshop mention.',
    createdAt: '2026-01-15T11:00:00Z',
  },

  // Multi-Bookmark variant with single option
  {
    id: 'bm5',
    variant: 'multi-bookmark',
    conversationId: 'c6',
    conversationTitle: 'API rate limiting with Redis',
    messageId: 'm6-2',
    userQuery: 'Which rate limiting algorithm should I use for our API?',
    responsePreview: 'For the sliding window approach, use a sorted set with timestamps as scores...',
    fullResponse: 'For the sliding window approach, use a sorted set with timestamps as scores. This gives you O(log n) operations and atomic cleanup of expired entries. The implementation is more complex than token bucket but provides the most accurate rate limiting.',
    options: [
      {
        id: 'B',
        label: 'OPTION B',
        title: 'Sliding window with Redis sorted set',
        content: 'For the sliding window approach, use a sorted set with timestamps as scores. This gives you O(log n) operations and atomic cleanup of expired entries. The implementation is more complex than token bucket but provides the most accurate rate limiting.',
        isSaved: true,
      },
    ],
    project: 'Backend API',
    note: 'Most accurate for billing purposes',
    createdAt: '2026-01-22T13:30:00Z',
  },

  // Additional Single Text variant
  {
    id: 'bm6',
    variant: 'single-text',
    conversationId: 'c12',
    conversationTitle: 'Content strategy for Q1 blog',
    messageId: 'm12-2',
    userQuery: 'How should we structure our content calendar for the next quarter?',
    responsePreview: 'Focus on educational content that addresses your users pain points...',
    fullResponse: 'Focus on educational content that addresses your users pain points. Start with foundational how-to guides in weeks 1-4, then move to more advanced use cases in weeks 5-8. Mix in customer success stories every other week to maintain engagement. End the quarter with a comprehensive roundup piece that ties everything together.',
    createdAt: '2026-01-10T09:00:00Z',
  },

  // Additional Code variant
  {
    id: 'bm7',
    variant: 'single-code',
    conversationId: 'c4',
    conversationTitle: 'React hook dependency arrays',
    messageId: 'm4-2',
    userQuery: 'Why is my useEffect running on every render?',
    responsePreview: 'The useEffect cleanup function should handle the subscription teardown...',
    fullResponse: 'The useEffect cleanup function should handle the subscription teardown before the component unmounts. Your dependency array is missing the callback ref. Here is the corrected version:',
    codeBlock: `useEffect(() => {
  const handleResize = () => {
    setWidth(window.innerWidth);
  };

  window.addEventListener('resize', handleResize);

  // Cleanup function
  return () => {
    window.removeEventListener('resize', handleResize);
  };
}, []); // Empty array means this runs once on mount`,
    codeLanguage: 'javascript',
    project: 'Learning',
    createdAt: '2026-01-26T17:00:00Z',
  },

  // Design variant
  {
    id: 'bm8',
    variant: 'single-text',
    conversationId: 'c20',
    conversationTitle: 'Dashboard layout redesign feedback',
    messageId: 'm20-2',
    userQuery: 'Thoughts on using a sidebar navigation vs top navigation for our analytics dashboard?',
    responsePreview: 'For an analytics dashboard with multiple data views, a left sidebar navigation is generally the better choice...',
    fullResponse: 'For an analytics dashboard with multiple data views, a left sidebar navigation is generally the better choice. It provides persistent access to all sections without taking up valuable vertical space for your charts and data tables. Top navigation works better for marketing sites or apps with fewer than 5-6 main sections. With analytics, users typically need to switch between views frequently, and a collapsible sidebar gives them that flexibility.',
    createdAt: '2026-01-05T14:20:00Z',
  },
];
