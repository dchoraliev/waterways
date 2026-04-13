/// @ts-nocheck

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    return new Response(JSON.stringify({ error: 'Missing Supabase environment variables' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  try {
    const requestBody = await req.json().catch(() => ({}));
    const action =
      requestBody && typeof requestBody === 'object' && 'action' in requestBody
        ? String((requestBody as { action?: unknown }).action ?? '')
        : '';
    const currentPassword =
      requestBody && typeof requestBody === 'object' && 'currentPassword' in requestBody
        ? String((requestBody as { currentPassword?: unknown }).currentPassword ?? '')
        : '';

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: getUserError,
    } = await userClient.auth.getUser();

    if (getUserError || !user) {
      return new Response(JSON.stringify({ error: getUserError?.message ?? 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (!user.email) {
      return new Response(
        JSON.stringify({ error: 'Authenticated user does not have an email address.' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    if (action !== 'confirm-delete') {
      return new Response(
        JSON.stringify({
          error: 'Invalid action. Use confirm-delete to delete an account.',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    if (!currentPassword.trim()) {
      return new Response(JSON.stringify({ error: 'Current password is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const { error: verifyPasswordError } = await userClient.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (verifyPasswordError) {
      return new Response(
        JSON.stringify({
          error: `Current password is invalid: ${verifyPasswordError.message}`,
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { error: deleteMembershipError } = await adminClient
      .from('project_membership')
      .delete()
      .eq('user_id', user.id);

    if (deleteMembershipError) {
      return new Response(
        JSON.stringify({
          error: `Failed to delete user project memberships: ${deleteMembershipError.message}`,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    const deletedAt = new Date().toISOString();
    const sanitizedEmail = `deleted-${user.id}@deleted.local`;

    const anonymizedUserPayload = {
      first_name: null,
      last_name: null,
      email: sanitizedEmail,
      verified: false,
      status: 'deleted',
      role: 'regular',
      share_name_on_map: false,
      banned_at: deletedAt,
    };

    let { error: anonymizeUserProfileError } = await adminClient
      .from('users')
      .update(anonymizedUserPayload)
      .eq('id', user.id);

    if (anonymizeUserProfileError) {
      return new Response(
        JSON.stringify({
          error: `Failed to anonymize user profile: ${anonymizeUserProfileError.message}`,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    const randomPassword = `${crypto.randomUUID().replace(/-/g, '')}Aa1!`;

    const { error: deleteError } = await adminClient.auth.admin.updateUserById(user.id, {
      email: sanitizedEmail,
      password: randomPassword,
      user_metadata: {
        deleted_at: deletedAt,
      },
    });

    if (deleteError) {
      return new Response(JSON.stringify({ error: deleteError.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});
