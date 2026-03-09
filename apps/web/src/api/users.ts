import { supabase } from '../services/supabase';

export type UpdateResult = { success: boolean; error?: string; data?: unknown };

export interface AdminObservationUserOption {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  observationCount: number;
  displayName: string;
  displayLabel: string;
  secondaryLabel: string | null;
  searchValue: string;
}

export interface BannedUserRecord {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  status: string | null;
  bannedAt: string | null;
  createdAt: string;
  displayName: string;
}

export interface BannedUsersQueryOptions {
  since?: string;
  until?: string;
  search?: string;
}

function normalizeText(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed || null;
}

function getShortUserId(userId: string): string {
  return userId.slice(0, 8);
}

export function buildAdminObservationUserLabels(user: {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}): Pick<
  AdminObservationUserOption,
  'displayName' | 'displayLabel' | 'secondaryLabel' | 'searchValue'
> {
  const firstName = normalizeText(user.firstName);
  const lastName = normalizeText(user.lastName);
  const email = normalizeText(user.email);
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
  const shortUserId = getShortUserId(user.id);

  const displayName = fullName || email || `User ${shortUserId}`;
  let secondaryLabel: string | null = null;
  if (fullName) {
    secondaryLabel = email || `ID ${shortUserId}`;
  } else if (email) {
    secondaryLabel = `ID ${shortUserId}`;
  }
  const displayLabel = secondaryLabel ? `${displayName} (${secondaryLabel})` : displayName;
  const searchValue = [displayName, fullName, email, user.id, shortUserId]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return {
    displayName,
    displayLabel,
    secondaryLabel,
    searchValue,
  };
}

export async function fetchAdminObservationUsers(): Promise<AdminObservationUserOption[]> {
  try {
    const { data, error } = await supabase.rpc('get_admin_observation_users');

    if (error) {
      console.error('Error fetching admin observation users (RPC):', error);
      return [];
    }

    return (data ?? [])
      .map((row) => {
        const id = row.user_id;
        const firstName = normalizeText(row.first_name);
        const lastName = normalizeText(row.last_name);
        const email = normalizeText(row.email);
        const { displayName, displayLabel, secondaryLabel, searchValue } =
          buildAdminObservationUserLabels({
            id,
            firstName,
            lastName,
            email,
          });

        return {
          id,
          firstName,
          lastName,
          email,
          observationCount: Number(row.observation_count ?? 0),
          displayName,
          displayLabel,
          secondaryLabel,
          searchValue,
        };
      })
      .filter((user) => Boolean(user.id));
  } catch (err: unknown) {
    console.error('Exception fetching admin observation users (RPC):', err);
    return [];
  }
}

/**
 * Set a user's status to 'banned'.
 */
export async function banUser(userId: string): Promise<UpdateResult> {
  try {
    const { data, error } = await supabase.rpc('rpc_ban_user', { target_user: userId });
    if (error) {
      console.error('Error banning user (RPC):', error);
      return { success: false, error: error.message, data };
    }
    return { success: true, data };
  } catch (err: unknown) {
    console.error('Exception banning user (RPC):', err);
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

export async function unbanUser(userId: string): Promise<UpdateResult> {
  try {
    const client = supabase as unknown as {
      rpc: (
        fn: string,
        args: Record<string, unknown>
      ) => Promise<{ data: unknown; error: { message: string } | null }>;
    };

    const { data, error } = await client.rpc('rpc_unban_user', { target_user: userId });
    if (error) {
      console.error('Error unbanning user (RPC):', error);
      return { success: false, error: error.message, data };
    }
    return { success: true, data };
  } catch (err: unknown) {
    console.error('Exception unbanning user (RPC):', err);
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

export async function fetchBannedUsers(
  options: BannedUsersQueryOptions = {}
): Promise<BannedUserRecord[]> {
  const { since, until, search } = options;

  type AdminBannedUsersQuery = {
    eq: (column: string, value: unknown) => AdminBannedUsersQuery;
    order: (column: string, options?: Record<string, unknown>) => AdminBannedUsersQuery;
    gte: (column: string, value: string) => AdminBannedUsersQuery;
    lt: (column: string, value: string) => AdminBannedUsersQuery;
    then: PromiseLike<{
      data: unknown[] | null;
      error: { message?: string; details?: unknown } | null;
    }>['then'];
  };

  const client = supabase as unknown as {
    from: (table: string) => {
      select: (columns: string) => AdminBannedUsersQuery;
    };
  };

  const query = client
    .from('users')
    .select('id, first_name, last_name, email, status, banned_at, created_at')
    .eq('status', 'banned')
    .order('created_at', { ascending: false });

  let { data, error } = await query;

  if (error) {
    const rawDetails = (error as { details?: unknown }).details;
    const detailsText = typeof rawDetails === 'string' ? rawDetails : '';
    const details = `${error.message ?? ''} ${detailsText}`.toLowerCase();
    const missingBannedAt = details.includes('banned_at') && details.includes('does not exist');

    if (missingBannedAt) {
      const fallback = await client
        .from('users')
        .select('id, first_name, last_name, email, status, created_at')
        .eq('status', 'banned')
        .order('created_at', { ascending: false });
      data = fallback.data;
      error = fallback.error;
    }
  }

  if (error) {
    console.error('Error fetching banned users:', error);
    return [];
  }

  const rows = (data ?? []) as Array<{
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    status: string | null;
    banned_at?: string | null;
    created_at: string;
  }>;

  const mapped = rows.map((row) => {
    const firstName = normalizeText(row.first_name);
    const lastName = normalizeText(row.last_name);
    const email = normalizeText(row.email);
    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
    const displayName = fullName || email || `User ${getShortUserId(row.id)}`;
    const bannedAt = (row as { banned_at?: string | null }).banned_at ?? null;

    return {
      id: row.id,
      firstName,
      lastName,
      email,
      status: row.status,
      bannedAt,
      createdAt: row.created_at,
      displayName,
    } satisfies BannedUserRecord;
  });

  const rangeFiltered = mapped.filter((row: BannedUserRecord) => {
    const effectiveTimestamp = row.bannedAt ?? row.createdAt;
    const time = new Date(effectiveTimestamp).getTime();

    if (!Number.isFinite(time)) {
      return false;
    }

    if (since) {
      const sinceTime = new Date(since).getTime();
      if (Number.isFinite(sinceTime) && time < sinceTime) {
        return false;
      }
    }

    if (until) {
      const untilTime = new Date(until).getTime();
      if (Number.isFinite(untilTime) && time >= untilTime) {
        return false;
      }
    }

    return true;
  });

  const searchTerm = search?.trim().toLowerCase();
  if (!searchTerm) {
    return rangeFiltered;
  }

  return rangeFiltered.filter((row: BannedUserRecord) => {
    const haystack = [row.displayName, row.email, row.id].filter(Boolean).join(' ').toLowerCase();
    return haystack.includes(searchTerm);
  });
}

/**
 * Fetch a user's role and status by id.
 */
export async function fetchUserRoleAndStatus(
  userId: string
): Promise<{ role?: string | null; status?: string | null } | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('role, status')
      .eq('id', userId)
      .single();
    if (error) {
      console.warn('fetchUserRoleAndStatus error:', error.message || error);
      return null;
    }
    return { role: data?.role ?? null, status: data?.status ?? null };
  } catch (err) {
    console.warn('fetchUserRoleAndStatus exception:', err);
    return null;
  }
}
