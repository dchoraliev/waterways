import React, { createContext, useContext, useState, PropsWithChildren } from 'react';
import type { Observation } from '../components/ObservationCard';
import { getObservationsByTripId } from '../database/ObservationManager';

import {
  cancelDraftReminder,
  cancelDraftRemindersForTrips,
  scheduleDraftReminder,
} from '../services/DraftReminderService';

import { getMediaById } from '../database/MediaManager';

export type JourneyStatus = 'draft' | 'submitted';

export interface JourneyDraft {
  id: string;
  createdAt: number;
  status: JourneyStatus;
  observations: Observation[];
  projectId: string | null;
}

interface MediaEntry {
  secondsElapsed: number;
  mediaType: 'photo' | 'video';
}

interface DraftJourneysContextValue {
  drafts: JourneyDraft[];
  saveDraft: (draft: JourneyDraft) => void;
  removeDraft: (id: string) => void;
  clearDrafts: () => void;
  getDraftById: (id: string) => JourneyDraft | undefined;
  getDraftByTripId: (tripId: string) => Promise<JourneyDraft>;
  markObservationHasMedia: (
    observationId: string,
    secondsElapsed: number,
    mediaType: 'photo' | 'video'
  ) => void;
}

const DraftJourneysContext = createContext<DraftJourneysContextValue | null>(null);

export const DraftJourneysProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [drafts, setDrafts] = useState<JourneyDraft[]>([]);

  const [mediaObservationMap, setMediaObservationMap] = useState<Map<string, MediaEntry>>(
    new Map()
  );

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

    if (draft.status === 'draft') {
      const createdAt = draft.createdAt > 0 ? draft.createdAt : Date.now();
      void scheduleDraftReminder(draft.id, createdAt).catch((error) => {
        console.warn('[DraftReminder] Failed to schedule reminder:', error);
      });
    } else {
      void cancelDraftReminder(draft.id).catch((error) => {
        console.warn('[DraftReminder] Failed to cancel reminder:', error);
      });
    }
  };

  const removeDraft = (id: string) => {
    setDrafts((prev) => prev.filter((j) => j.id !== id));
    void cancelDraftReminder(id).catch((error) => {
      console.warn('[DraftReminder] Failed to cancel reminder:', error);
    });
  };

  const clearDrafts = () => {
    const ids = drafts.map((journey) => journey.id);
    setDrafts([]);
    void cancelDraftRemindersForTrips(ids).catch((error) => {
      console.warn('[DraftReminder] Failed to cancel reminders:', error);
    });
  };

  const getDraftById = (id: string) => drafts.find((journey) => journey.id === id);

  const markObservationHasMedia = (
    observationId: string,
    secondsElapsed: number,
    mediaType: 'photo' | 'video'
  ) => {
    setMediaObservationMap((prev) =>
      new Map(prev).set(observationId, { secondsElapsed, mediaType })
    );
  };

  const getDraftByTripId = async (tripId: string): Promise<JourneyDraft> => {
    const existingDraft = drafts.find((d) => d.id === tripId);
    if (existingDraft) {
      return existingDraft;
    }

    const rows = await getObservationsByTripId(tripId);

    const draftObservations: Observation[] = await Promise.all(
      rows.map(async (row) => {
        const entry = mediaObservationMap.get(row.id);

        // Fetch media file path from database if local_media_id exists
        let mediaFilePath: string | null = null;
        if (row.local_media_id) {
          const mediaRecord = await getMediaById(row.local_media_id);
          mediaFilePath = mediaRecord?.local_file_path ?? null;
        }

        return {
          id: row.id,
          time: new Date(row.created_at).toLocaleString(),
          location: `${row.latitude}, ${row.longitude}`,
          description: row.observation || 'Some observation',
          tags: row.category_id ? [row.category_id] : [],
          hasAudio: !!row.audio_media_id,
          hasMedia: !!entry || !!row.local_media_id, // Has media if either marked or has local_media_id
          mediaType: entry?.mediaType ?? null,
          mediaTimestamp: entry?.secondsElapsed ?? null,
          mediaFilePath: mediaFilePath,
          status: 'Offline',
        };
      })
    );

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
