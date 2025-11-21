import { supabase } from '@waterways/shared/src/supabase/client';
import type { Project } from '../types/project.types';

// Generate random 8-character code
const generateJoinCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Create a new project
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
    // FIX: Use unknown for catch block
    console.error('Error creating project:', error);
    return { data: null, error: error as Error };
  }
};

// Get user's projects
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

    // FIX for Conversion Error: Use (item as unknown as { project: Project })
    // to bypass the strict structural check on the nested Supabase type.
    const projects =
      (data
        ?.map((item) => (item as unknown as { project: Project }).project)
        .filter(Boolean) as Project[]) || [];
    return { data: projects, error: null };
  } catch (error: unknown) {
    // FIX: Use unknown for catch block
    console.error('Error fetching user projects:', error);
    return { data: null, error: error as Error };
  }
};

// Join project with code
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
    // FIX: Use unknown for catch block
    console.error('Error joining project:', error);
    return { success: false, error: 'Failed to join project' };
  }
};

// Leave a project
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
    // FIX: Use unknown for catch block
    console.error('Error leaving project:', error);
    return { error: error as Error };
  }
};
