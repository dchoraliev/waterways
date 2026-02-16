// networkService.ts
import * as Network from 'expo-network';
import { syncAllFailedTrips, syncAllReviewedTrips } from '../database/SyncManager';
import { on } from 'events';

// File states to prevent overlapping syncs if network flaps rapidly
let inSyncingFlight: boolean = false;
let subscription: { remove: () => void } | null = null;
let lastIsOnline: boolean | null = null;

export function performAutoSyncTaskOnce(): void {
  console.log('Performing one-time auto-sync task...');
  onNetworkOnline();
}

/**
 * TODO: Implement what your app should do when it goes offline.
 * Example ideas: pause sync queue, show toast/banner, mark app state offline, etc.
 */
function onNetworkOffline(): void {
  console.log('Network went offline...');
  // TODO: implement
}

/**
 * TODO: Implement what your app should do when it comes back online.
 * Example ideas: resume sync queue, trigger background sync, hide banner, etc.
 */
function onNetworkOnline(): void {
  console.log('Network is online! Starting auto-sync process...');
  // Avoid triggering multiple syncs if we rapidly toggle online/offline
  if (inSyncingFlight) return;

  // Set a flag to prevent overlapping syncs if network flaps
  inSyncingFlight = true;

  // TODO: Transcribe pending audios recordings

  // Sync pending trips data
  syncAllReviewedTrips();

  // Sync failed trips data
  syncAllFailedTrips();

  // Clear the flag
  inSyncingFlight = false;
}

/**
 * expo-network provides:
 * - isConnected: connected to *a network* (wifi/cellular/etc.)
 * - type: wifi/cellular/none/unknown
 *
 * NOTE: "isConnected" is the closest signal expo-network exposes for internet connectivity.
 * Some environments may still be behind a captive portal or have restricted access.
 */
function computeIsOnline(state: Network.NetworkState | null | undefined): boolean {
  return state?.isConnected === true;
}

/**
 * Starts listening to network changes.
 * - Safe to call multiple times (won't double subscribe)
 * - Immediately evaluates current state once, so you get an initial online/offline callback
 */
export async function startNetworkListener(): Promise<void> {
  if (subscription) return;

  // Initial state check (so app reacts immediately on startup)
  try {
    const initialState = await Network.getNetworkStateAsync();
    const isOnline = computeIsOnline(initialState);

    lastIsOnline = isOnline;
    if (isOnline) onNetworkOnline();
    else onNetworkOffline();
  } catch {
    // If we can't read state yet, we'll rely on listener updates
    lastIsOnline = null;
  }

  subscription = Network.addNetworkStateListener((state) => {
    const isOnline = computeIsOnline(state);

    // Only fire when status actually changes
    if (isOnline !== lastIsOnline) {
      lastIsOnline = isOnline;
      if (isOnline) onNetworkOnline();
      else onNetworkOffline();
    }
  });
}

/**
 * Stops listening to network changes.
 */
export function stopNetworkListener(): void {
  if (!subscription) return;
  subscription.remove();
  subscription = null;
}

/**
 * Optional helpers (handy for UI / debugging)
 */
export async function getIsOnline(): Promise<boolean> {
  const state = await Network.getNetworkStateAsync();
  return computeIsOnline(state);
}

export function isListening(): boolean {
  return subscription != null;
}
