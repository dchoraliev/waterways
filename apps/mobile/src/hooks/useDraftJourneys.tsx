import React, {
  createContext,
  useContext,
  useState,
  PropsWithChildren,
  useCallback,
  useMemo,
} from 'react';
import type { Observation } from '../components/ObservationCard';
import { getObservationsByTripId } from '../database/ObservationManager';
import { cancelDraftReminder, scheduleDraftReminder } from '../services/DraftReminderService';
import { SyncStatus } from '../database/SyncStatus';
import { getTripsBySyncStatus, getTripById, updateTripById } from '../database/TripManager';
import { syncTrip } from '../database/SyncManager';

export interface JourneyDraft {
  id: string;
  createdAt: number;
  status: SyncStatus;
  observations: Observation[];
  projectId: string | null;
}

interface DraftJourneysContextValue {
  drafts: JourneyDraft[];
  saveDraft: (draft: JourneyDraft) => Promise<void>;
  submitDraft: (draft: JourneyDraft) => Promise<void>;
  loadPendingDrafts: () => Promise<void>;
  getDraftByTripId: (tripId: string) => Promise<JourneyDraft>;
  markObservationHasMedia: (
    observationId: string,
    secondsElapsed: number,
    mediaType: 'photo' | 'video'
  ) => void;
}

async function mapTripDataToJourneyDraftInterface(tripId: string): Promise<JourneyDraft> {
  // FIXED: Fetch trip to get project_id and created_at
  const trip = await getTripById(tripId);

  console.log('[DraftJourneys] Loading draft:', tripId, 'with project_id:', trip?.project_id);

  // Fetch observations for the trip
  const observationRows = await getObservationsByTripId(tripId);

  const draftObservations: Observation[] = observationRows.map((row) => ({
    id: row.id,
    time: new Date(row.created_at).toLocaleString(),
    location: `${row.latitude}, ${row.longitude}`,
    description: row.observation || 'Description not available',
    tags: row.category_id ? [row.category_id] : [],
    hasAudio: !!row.audio_media_id,
    hasMedia: !!row.local_media_id,
    status: row.sync_status as SyncStatus,
  }));

  return {
    id: tripId,
    createdAt: trip?.created_at ?? Date.now(),
    status: SyncStatus.DRAFTED,
    observations: draftObservations,
    projectId: trip?.project_id ?? null, // FIXED: Load project_id from database
  };
}

const DraftJourneysContext = createContext<DraftJourneysContextValue | null>(null);

export const DraftJourneysProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [drafts, setDrafts] = useState<JourneyDraft[]>([]);
  // Track which drafts already have notifications scheduled
  const [notificationScheduledForIds] = useState<Set<string>>(new Set());

  // FIXED: Wrap saveDraft in useCallback to prevent recreating on every render
  const saveDraft = useCallback(
    async (draft: JourneyDraft) => {
      // Check if this is a new draft (not already in state)
      setDrafts((prevDrafts) => {
        const existingDraft = prevDrafts.find((d) => d.id === draft.id);
        const isNewDraft = !existingDraft;

        // FIXED: Check if draft actually changed before saving to database
        const hasChanges =
          isNewDraft ||
          (existingDraft &&
            (existingDraft.projectId !== draft.projectId ||
              existingDraft.status !== draft.status ||
              existingDraft.observations.length !== draft.observations.length));

        // FIXED: Only schedule notification when draft is first created
        if (isNewDraft && draft.status === SyncStatus.DRAFTED) {
          const createdAt = draft.createdAt > 0 ? draft.createdAt : Date.now();

          // Only schedule if we haven't already scheduled for this ID
          if (!notificationScheduledForIds.has(draft.id)) {
            notificationScheduledForIds.add(draft.id);

            void scheduleDraftReminder(draft.id, createdAt).catch((error) => {
              console.warn('[DraftReminder] Failed to schedule reminder:', error);
              // Remove from set if scheduling failed so we can retry
              notificationScheduledForIds.delete(draft.id);
            });
          }
        }

        // CRITICAL FIX: If draft is REVIEWED or SYNCED, cancel notification and remove from array
        if (draft.status === SyncStatus.REVIEWED || draft.status === SyncStatus.SYNCED) {
          console.log('[DraftJourneys] Removing submitted/synced draft from array:', draft.id);
          void cancelDraftReminder(draft.id).catch((error) => {
            console.warn('[DraftReminder] Failed to cancel reminder:', error);
          });
          notificationScheduledForIds.delete(draft.id);

          // Remove from array
          return prevDrafts.filter((d) => d.id !== draft.id);
        }

        // FIXED: Only update database if something actually changed
        if (hasChanges) {
          console.log(
            '[DraftJourneys] Saving draft to database:',
            draft.id,
            'with project_id:',
            draft.projectId,
            'status:',
            draft.status
          );
          void updateTripById(draft.id, {
            project_id: draft.projectId,
            sync_status: draft.status, // ✅ Use actual status, not hardcoded DRAFTED!
          });
        } else {
          console.log('[DraftJourneys] No changes detected, skipping database save:', draft.id);
        }

        // Update the drafts array (for DRAFTED status only at this point)
        const index = prevDrafts.findIndex((j) => j.id === draft.id);
        if (index === -1) {
          return [...prevDrafts, draft];
        }
        const next = [...prevDrafts];
        next[index] = draft;
        return next;
      });
    },
    [notificationScheduledForIds]
  );

  const markObservationHasMedia = useCallback(
    (_observationId: string, _secondsElapsed: number, _mediaType: 'photo' | 'video') => {
      // Note: Currently unused but kept for API compatibility
    },
    []
  );

  // FIXED: Wrap getDraftByTripId in useCallback
  const getDraftByTripId = useCallback(
    async (tripId: string): Promise<JourneyDraft> => {
      // Check for existing draft in memory first
      const existingDraft = drafts.find((d) => d.id === tripId);
      if (existingDraft) {
        return existingDraft;
      }

      // If not in memory, fetch from database
      const draft = await mapTripDataToJourneyDraftInterface(tripId);
      return draft;
    },
    [drafts]
  );

  // FIXED: Wrap submitDraft in useCallback
  const submitDraft = useCallback(async (draft: JourneyDraft) => {
    console.log('[DraftJourneys] Submitting draft:', draft.id, 'with project_id:', draft.projectId);

    // FIXED: Cancel the draft reminder before submitting
    await cancelDraftReminder(draft.id).catch((error) => {
      console.warn('[DraftReminder] Failed to cancel reminder before submit:', error);
    });

    // CRITICAL FIX: Save project_id to the trip before syncing
    await updateTripById(draft.id, {
      project_id: draft.projectId,
      sync_status: SyncStatus.REVIEWED,
    });

    console.log('[DraftJourneys] Updated trip with project_id, starting sync...');

    // Trigger the trip sync
    syncTrip(draft.id);

    // Remove the draft from the memory draft list
    setDrafts((prev) => prev.filter((d) => d.id !== draft.id));
  }, []);

  // FIXED: Wrap loadPendingDrafts in useCallback - THIS IS THE KEY FIX
  const loadPendingDrafts = useCallback(async () => {
    console.log('[DraftJourneys] Loading pending drafts from database');
    const draftedTrips = await getTripsBySyncStatus(SyncStatus.DRAFTED);

    // FIXED: Load all drafts and merge, preventing duplicates
    const newDrafts: JourneyDraft[] = [];

    for (const trip of draftedTrips) {
      const mappedDraft = await mapTripDataToJourneyDraftInterface(trip.id);
      if (mappedDraft) {
        newDrafts.push(mappedDraft);
      }
    }

    // Update state with unique drafts (use Map to prevent duplicates by ID)
    setDrafts((prevDrafts) => {
      // FIXED: Remove any drafts that are no longer DRAFTED in the database
      const stillDrafted = prevDrafts.filter(
        (d) => d.status === SyncStatus.DRAFTED && newDrafts.some((nd) => nd.id === d.id)
      );

      // Create a Map of existing drafts by ID (preserves in-memory edits)
      const draftMap = new Map(stillDrafted.map((d) => [d.id, d]));

      // Add new drafts from database (only if not already in memory)
      newDrafts.forEach((draft) => {
        if (!draftMap.has(draft.id)) {
          draftMap.set(draft.id, draft);

          // Schedule notification for drafts loaded from database
          const createdAt = draft.createdAt > 0 ? draft.createdAt : Date.now();
          void scheduleDraftReminder(draft.id, createdAt).catch((error) => {
            console.warn('[DraftReminder] Failed to schedule reminder on load:', error);
          });
        }
      });

      // Return unique drafts as array
      return Array.from(draftMap.values());
    });
  }, []);

  // FIXED: Wrap value in useMemo to prevent recreating on every render
  const value = useMemo<DraftJourneysContextValue>(
    () => ({
      drafts,
      saveDraft,
      getDraftByTripId,
      markObservationHasMedia,
      submitDraft,
      loadPendingDrafts,
    }),
    [drafts, saveDraft, getDraftByTripId, markObservationHasMedia, submitDraft, loadPendingDrafts]
  );

  return <DraftJourneysContext.Provider value={value}>{children}</DraftJourneysContext.Provider>;
};

export function useDraftJourneys(): DraftJourneysContextValue {
  const ctx = useContext(DraftJourneysContext);
  if (!ctx) {
    throw new Error('useDraftJourneys must be used within a DraftJourneysProvider');
  }
  return ctx;
}
