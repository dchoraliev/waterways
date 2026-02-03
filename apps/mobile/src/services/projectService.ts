import { supabase } from '@waterways/shared/src/supabase/client';
import type { Project } from '../types/project.types';

const generateJoinCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const createProject = async (
  name: string,
  userId: string
): Promise<{ data: Project | null; error: Error | null }> => {
  try {
    let joinCode = generateJoinCode();
    let codeExists = true;
    while (codeExists) {
      const { data: existing } = await supabase
        .from('projects')
        .select('id')
        .eq('join_code', joinCode)
        .single();
      if (!existing) {
        codeExists = false;
      } else {
        joinCode = generateJoinCode();
      }
    }

    const { data, error } = await supabase
      .from('projects')
      .insert([
        {
          name,
          created_by: userId,
          join_code: joinCode,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;

    const createdProject = data as Project;

    await supabase.from('project_membership').insert([
      {
        user_id: userId,
        project_id: createdProject.id,
        joined_at: new Date().toISOString(),
      },
    ]);

    return { data: createdProject, error: null };
  } catch (error: unknown) {
    console.error('Error creating project:', error);
    return { data: null, error: error as Error };
  }
};

export const getUserProjects = async (
  userId: string
): Promise<{ data: Project[] | null; error: Error | null }> => {
  try {
    const { data, error } = await supabase
      .from('project_membership')
      .select(
        `
        project:projects(
          id,
          name,
          description,
          created_by,
          created_at,
          join_code
        )
      `
      )
      .eq('user_id', userId)
      .order('joined_at', { ascending: false });

    if (error) throw error;

    const projects =
      (data
        ?.map((item) => (item as unknown as { project: Project }).project)
        .filter(Boolean) as Project[]) || [];
    return { data: projects, error: null };
  } catch (error: unknown) {
    console.error('Error fetching user projects:', error);
    return { data: null, error: error as Error };
  }
};

export const joinProjectWithCode = async (
  userId: string,
  joinCode: string
): Promise<{ success: boolean; error: string | null }> => {
  try {
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('join_code', joinCode.toUpperCase())
      .single();

    if (projectError || !project) {
      return { success: false, error: 'Invalid join code' };
    }

    const { data: existing } = await supabase
      .from('project_membership')
      .select('id')
      .eq('user_id', userId)
      .eq('project_id', project.id)
      .single();

    if (existing) {
      return { success: false, error: 'Already a member of this project' };
    }

    const { error: insertError } = await supabase.from('project_membership').insert([
      {
        user_id: userId,
        project_id: project.id,
        joined_at: new Date().toISOString(),
      },
    ]);

    if (insertError) throw insertError;

    return { success: true, error: null };
  } catch (error: unknown) {
    console.error('Error joining project:', error);
    return { success: false, error: 'Failed to join project' };
  }
};

export const leaveProject = async (
  userId: string,
  projectId: string
): Promise<{ error: Error | null }> => {
  try {
    const { error } = await supabase
      .from('project_membership')
      .delete()
      .eq('user_id', userId)
      .eq('project_id', projectId);

    if (error) throw error;
    return { error: null };
  } catch (error: unknown) {
    console.error('Error leaving project:', error);
    return { error: error as Error };
  }
};

export const removeUserFromProject = async (
  creatorId: string,
  projectId: string,
  userIdToRemove: string
): Promise<{ success: boolean; error: string | null }> => {
  try {
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('created_by')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return { success: false, error: 'Project not found' };
    }

    if (project.created_by !== creatorId) {
      return { success: false, error: 'Only the project creator can remove users' };
    }

    if (creatorId === userIdToRemove) {
      return { success: false, error: 'Project creator cannot be removed' };
    }

    const { error: deleteError } = await supabase
      .from('project_membership')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', userIdToRemove);

    if (deleteError) throw deleteError;

    return { success: true, error: null };
  } catch (error: unknown) {
    console.error('Error removing user from project:', error);
    return { success: false, error: 'Failed to remove user' };
  }
};

export const disbandProject = async (
  creatorId: string,
  projectId: string
): Promise<{ success: boolean; error: string | null }> => {
  try {
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('created_by')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return { success: false, error: 'Project not found' };
    }

    if (project.created_by !== creatorId) {
      return { success: false, error: 'Only the project creator can disband the project' };
    }

    const { error: membersError } = await supabase
      .from('project_membership')
      .delete()
      .eq('project_id', projectId);

    if (membersError) throw membersError;

    const { error: deleteError } = await supabase.from('projects').delete().eq('id', projectId);

    if (deleteError) throw deleteError;

    return { success: true, error: null };
  } catch (error: unknown) {
    console.error('Error disbanding project:', error);
    return { success: false, error: 'Failed to disband project' };
  }
};

interface MemberResponse {
  user_id: string;
  joined_at: string;
  users: {
    email: string;
    first_name: string | null;
    last_name: string | null;
  } | null;
}

export const getProjectMembers = async (
  projectId: string
): Promise<{
  data: Array<{
    user_id: string;
    joined_at: string;
    email: string;
    first_name?: string;
    last_name?: string;
    display_name: string;
  }> | null;
  error: Error | null;
}> => {
  try {
    const { data, error } = await supabase
      .from('project_membership')
      .select(
        `
        user_id, 
        joined_at,
        users:user_id (
          email,
          first_name,
          last_name
        )
      `
      )
      .eq('project_id', projectId)
      .order('joined_at', { ascending: true });

    if (error) throw error;

    const typedData = data as unknown as MemberResponse[];

    const members = (typedData || []).map((item) => {
      const user = item.users;
      const displayName =
        user?.first_name && user?.last_name
          ? `${user.first_name} ${user.last_name}`
          : user?.email || 'Unknown User';

      return {
        user_id: item.user_id,
        joined_at: item.joined_at,
        email: user?.email || '',
        first_name: user?.first_name || undefined,
        last_name: user?.last_name || undefined,
        display_name: displayName,
      };
    });

    return { data: members, error: null };
  } catch (error: unknown) {
    console.error('Error fetching project members:', error);
    return { data: null, error: error as Error };
  }
};
