export interface Observation {
  id: string;
  tripId?: string;
  projectName: string;
  journeyStartLocation: string;
  location: {
    lat: number;
    lng: number;
    name: string;
  };
  /** ISO 8601 UTC string from the DB (e.g. "2026-02-18T12:00:00+00:00") */
  createdAt: string;
  /** Display-friendly local time (e.g. "14:30:45") */
  timestamp: string;
  /** Local date string (e.g. "2026-02-18") */
  date: string;
  observation: string;
  observerName: string;
  userId: string;
  photos: string[];
  videos: string[];
  type: string;
  keywords: string[];

  // Optional Supabase audio recording id associated with this observation.
  // Audio metadata and signed URLs are loaded on the detail page only.
  audioRecordingId?: string;
}
