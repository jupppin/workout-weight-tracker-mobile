/**
 * RefreshContext
 *
 * Simple event system to trigger data refresh across screens.
 * Used to notify screens when data has changed (e.g., after logging a workout).
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

interface RefreshContextValue {
  /** Counter that increments when data should be refreshed */
  refreshTrigger: number;
  /** Call this to trigger a refresh in screens that listen to it */
  triggerRefresh: () => void;
}

const RefreshContext = createContext<RefreshContextValue | null>(null);

interface RefreshProviderProps {
  children: React.ReactNode;
}

export function RefreshProvider({ children }: RefreshProviderProps) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const value = useMemo(
    () => ({
      refreshTrigger,
      triggerRefresh,
    }),
    [refreshTrigger, triggerRefresh]
  );

  return (
    <RefreshContext.Provider value={value}>
      {children}
    </RefreshContext.Provider>
  );
}

export function useRefresh(): RefreshContextValue {
  const context = useContext(RefreshContext);
  if (!context) {
    return {
      refreshTrigger: 0,
      triggerRefresh: () => {},
    };
  }
  return context;
}

export { RefreshContext };
