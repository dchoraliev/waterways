import { supabase } from '../services/supabase';

export type UpdateResult = { success: boolean; error?: string; data?: unknown };

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
  } catch (err: any) {
    console.error('Exception banning user (RPC):', err);
    return { success: false, error: err?.message ?? String(err) };
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
