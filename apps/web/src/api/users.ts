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

function normalizeText(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
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
  const secondaryLabel = fullName
    ? email || `ID ${shortUserId}`
    : email
      ? `ID ${shortUserId}`
      : null;
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
