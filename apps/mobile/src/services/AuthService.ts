// apps/mobile/src/services/AuthService.ts
import { getSession } from '@waterways/shared/src/supabase/auth';

interface SessionResponse {
  data?: {
    session?: {
      user?: {
        id: string;
      };
    } | null;
  };
}

/**
 * Returns the currently authenticated user's id, or null if not signed in.
 * Keeps screens free of supabase details.
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const res = await getSession();

    // If shared getSession() returns { data: { session }, error }
    const session =
      typeof res === 'object' && res && 'data' in res
        ? ((res as SessionResponse).data?.session ?? null)
        : (res ?? null);

    return session?.user?.id ?? null;
  } catch {
    return null;
  }
}
