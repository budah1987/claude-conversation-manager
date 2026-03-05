'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface DemoSession {
  demoConversation: { id: string; title: string } | null;
  activateDemoConversation: (id: string, title: string) => void;
}

const DemoSessionContext = createContext<DemoSession>({
  demoConversation: null,
  activateDemoConversation: () => {},
});

export function DemoSessionProvider({ children }: { children: ReactNode }) {
  const [demoConversation, setDemoConversation] = useState<{ id: string; title: string } | null>(null);

  const activateDemoConversation = useCallback((id: string, title: string) => {
    setDemoConversation({ id, title });
  }, []);

  return (
    <DemoSessionContext.Provider value={{ demoConversation, activateDemoConversation }}>
      {children}
    </DemoSessionContext.Provider>
  );
}

export function useDemoSession() {
  return useContext(DemoSessionContext);
}
