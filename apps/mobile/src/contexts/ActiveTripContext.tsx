import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ActiveTripContextType {
  activeTripId: string | null;
  setActiveTripId: (tripId: string | null) => void;
}

const ActiveTripContext = createContext<ActiveTripContextType | undefined>(undefined);

export function ActiveTripProvider({ children }: { children: ReactNode }) {
  const [activeTripId, setActiveTripId] = useState<string | null>(null);

  return (
    <ActiveTripContext.Provider value={{ activeTripId, setActiveTripId }}>
      {children}
    </ActiveTripContext.Provider>
  );
}

export function useActiveTrip() {
  const context = useContext(ActiveTripContext);
  if (context === undefined) {
    throw new Error('useActiveTrip must be used within an ActiveTripProvider');
  }
  return context;
}
