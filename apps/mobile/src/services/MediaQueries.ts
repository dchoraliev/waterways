/**
 * Media Queries - Mobile implementation for querying observation media
 *
 * This module provides database query functions for retrieving media (photos, videos, audio)
 * associated with observations and trips from the local SQLite database.
 */

import { getDatabase } from '../database/db';
import { ObservationMedia } from '@waterways/shared/src/models/local-db-rows';

/**
 * Get media counts for a trip (photos and videos separately)
 *
 * @param tripId - The trip UUID to get media counts for
 * @returns Object with photoCount and videoCount
 *
 * Usage:
 *   const { photoCount, videoCount } = await getMediaCountsForTrip('trip-123');
 */
export async function getMediaCountsForTrip(tripId: string): Promise<{
  photoCount: number;
  videoCount: number;
}> {
  const db = await getDatabase();

  const result = await db!.getAllAsync<{ media_type: string; count: number }>(
    `
    SELECT 
      m.media_type,
      COUNT(*) as count
    FROM observation_media m
    JOIN observations o ON o.id = m.observation_id
    WHERE o.trip_id = ?
      AND m.media_type IN ('image', 'video')
    GROUP BY m.media_type
    `,
    [tripId]
  );

  let photoCount = 0;
  let videoCount = 0;

  for (const row of result) {
    if (row.media_type === 'image') {
      photoCount = row.count;
    } else if (row.media_type === 'video') {
      videoCount = row.count;
    }
  }

  return { photoCount, videoCount };
}

/**
 * Get all media for an observation
 *
 * @param observationId - The observation UUID to get media for
 * @returns Array of media records (photos, videos, audio)
 *
 * Usage:
 *   const media = await getMediaForObservation('obs-123');
 *   media.forEach(m => console.log(m.media_type, m.local_file_path));
 */
export async function getMediaForObservation(observationId: string): Promise<ObservationMedia[]> {
  const db = await getDatabase();

  const media = await db!.getAllAsync<ObservationMedia>(
    `SELECT * FROM observation_media WHERE observation_id = ? ORDER BY created_at DESC`,
    [observationId]
  );

  return media;
}

/**
 * Get all media for a trip (with observation context)
 *
 * @param tripId - The trip UUID to get media for
 * @returns Array of media records with observation_id included
 *
 * Usage:
 *   const allMedia = await getMediaForTrip('trip-123');
 */
export async function getMediaForTrip(tripId: string): Promise<ObservationMedia[]> {
  const db = await getDatabase();

  const media = await db!.getAllAsync<ObservationMedia>(
    `
    SELECT m.*, o.id as observation_id
    FROM observation_media m
    JOIN observations o ON o.id = m.observation_id
    WHERE o.trip_id = ?
    ORDER BY m.created_at DESC
    `,
    [tripId]
  );

  return media;
}

/**
 * Get media count for an observation
 *
 * @param observationId - The observation UUID
 * @returns Number of media items attached to this observation
 */
export async function getMediaCountForObservation(observationId: string): Promise<number> {
  const db = await getDatabase();

  const result = await db!.getAllAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM observation_media WHERE observation_id = ?`,
    [observationId]
  );

  return result[0]?.count ?? 0;
}

/**
 * Get all photos for a trip (images only)
 * Useful for building photo galleries
 */
export async function getPhotosForTrip(tripId: string): Promise<ObservationMedia[]> {
  const db = await getDatabase();

  const photos = await db!.getAllAsync<ObservationMedia>(
    `
    SELECT m.*, o.id as observation_id, o.observation as caption
    FROM observation_media m
    JOIN observations o ON o.id = m.observation_id
    WHERE o.trip_id = ?
      AND m.media_type = 'image'
    ORDER BY m.created_at DESC
    `,
    [tripId]
  );

  return photos;
}

/**
 * Get all videos for a trip
 */
export async function getVideosForTrip(tripId: string): Promise<ObservationMedia[]> {
  const db = await getDatabase();

  const videos = await db!.getAllAsync<ObservationMedia>(
    `
    SELECT m.*, o.id as observation_id, o.observation as caption
    FROM observation_media m
    JOIN observations o ON o.id = m.observation_id
    WHERE o.trip_id = ?
      AND m.media_type = 'video'
    ORDER BY m.created_at DESC
    `,
    [tripId]
  );

  return videos;
}
