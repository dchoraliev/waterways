import React, {
  createContext,
  useContext,
  useState,
  PropsWithChildren,
} from 'react';
import type { Observation } from '../components/ObservationCard';

export type JourneyStatus = 'draft' | 'submitted';

export interface JourneyDraft {
  id: string;
  createdAt: number;
  status: JourneyStatus;
  observations: Observation[];
}

interface DraftJourneysContextValue {
  drafts: JourneyDraft[];
  saveDraft: (draft: JourneyDraft) => void;
  removeDraft: (id: string) => void;
  clearDrafts: () => void;
  getDraftById: (id: string) => JourneyDraft | undefined;
}

const DraftJourneysContext = createContext<DraftJourneysContextValue | null>(
  null,
);

export const DraftJourneysProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const [drafts, setDrafts] = useState<JourneyDraft[]>([]);

  const saveDraft = (draft: JourneyDraft) => {
    setDrafts((prev) => {
      const index = prev.findIndex((j) => j.id === draft.id);
      if (index === -1) {
        return [...prev, draft];
      }
      const next = [...prev];
      next[index] = draft;
      return next;
    });
  };

  const removeDraft = (id: string) => {
    setDrafts((prev) => prev.filter((j) => j.id !== id));
  };

  const clearDrafts = () => setDrafts([]);

  const getDraftById = (id: string) =>
    drafts.find((journey) => journey.id === id);

  const value: DraftJourneysContextValue = {
    drafts,
    saveDraft,
    removeDraft,
    clearDrafts,
    getDraftById,
  };

  return (
    <DraftJourneysContext.Provider value={value}>
      {children}
    </DraftJourneysContext.Provider>
  );
};

export function useDraftJourneys(): DraftJourneysContextValue {
  const ctx = useContext(DraftJourneysContext);
  if (!ctx) {
    throw new Error(
      'useDraftJourneys must be used within a DraftJourneysProvider',
    );
  }
  return ctx;
}
