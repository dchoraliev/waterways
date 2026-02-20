import { supabase } from '../services/supabase';

export interface Project {
  id: string;
  name: string;
}

export const getUserProjects = async (
  userId: string
): Promise<{ data: Project[] | null; error: Error | null }> => {
  try {
    const { data, error } = await supabase
      .from('project_membership')
      .select('project:projects(id, name)')
      .eq('user_id', userId)
      .order('joined_at', { ascending: false });

    if (error) throw error;

    const projects =
      (data
        ?.map((item) => (item as unknown as { project: Project }).project)
        .filter(Boolean) as Project[]) || [];

    return { data: projects, error: null };
  } catch (error: unknown) {
    console.error('Error fetching user projects (web):', error);
    return { data: null, error: error as Error };
  }
};
