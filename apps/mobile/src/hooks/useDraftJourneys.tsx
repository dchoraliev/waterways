import React, { createContext, useContext, useState, PropsWithChildren } from 'react';
import type { Observation } from '../components/ObservationCard';
import { getObservationsByTripId } from '../database/ObservationManager';

export type JourneyStatus = 'draft' | 'submitted';

export interface JourneyDraft {
  id: string;
  createdAt: number;
  status: JourneyStatus;
  observations: Observation[];
  projectId: string | null;
}

interface DraftJourneysContextValue {
  drafts: JourneyDraft[];
  saveDraft: (draft: JourneyDraft) => void;
  removeDraft: (id: string) => void;
  clearDrafts: () => void;
  getDraftById: (id: string) => JourneyDraft | undefined;
  getDraftByTripId: (tripId: string) => Promise<JourneyDraft>;
  markObservationHasMedia: (observationId: string) => void;
}

const DraftJourneysContext = createContext<DraftJourneysContextValue | null>(null);

export const DraftJourneysProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [drafts, setDrafts] = useState<JourneyDraft[]>([]);

  // Track which observation IDs have media attached
  const [mediaObservationIds, setMediaObservationIds] = useState<Set<string>>(new Set());

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

  const getDraftById = (id: string) => drafts.find((journey) => journey.id === id);

  // Called from CameraCaptureScreen after a successful photo/video capture
  const markObservationHasMedia = (observationId: string) => {
    setMediaObservationIds((prev) => new Set(prev).add(observationId));
  };

  const getDraftByTripId = async (tripId: string): Promise<JourneyDraft> => {
    // First, check if we have an in-memory draft with edits
    const existingDraft = drafts.find((d) => d.id === tripId);
    if (existingDraft) {
      return existingDraft;
    }

    // Fetch observations from database
    const rows = await getObservationsByTripId(tripId);

    const draftObservations: Observation[] = rows.map((row) => ({
      id: row.id,
      time: new Date(row.created_at).toLocaleString(),
      location: `${row.latitude}, ${row.longitude}`,
      description: row.observation || 'Some observation',
      tags: row.category_id ? [row.category_id] : [],
      hasAudio: !!row.audio_media_id,
      hasMedia: mediaObservationIds.has(row.id), // true only if markObservationHasMedia was called
      status: 'Offline',
    }));

    const draft: JourneyDraft = {
      id: tripId,
      createdAt: Date.now(),
      status: 'draft',
      observations: draftObservations,
      projectId: null,
    };

    return draft;
  };

  const value: DraftJourneysContextValue = {
    drafts,
    saveDraft,
    removeDraft,
    clearDrafts,
    getDraftById,
    getDraftByTripId,
    markObservationHasMedia,
  };

  return <DraftJourneysContext.Provider value={value}>{children}</DraftJourneysContext.Provider>;
};

export function useDraftJourneys(): DraftJourneysContextValue {
  const ctx = useContext(DraftJourneysContext);
  if (!ctx) {
    throw new Error('useDraftJourneys must be used within a DraftJourneysProvider');
  }
  return ctx;
}
