import { supabase } from '../services/supabase';

export interface Project {
  id: string;
  name: string;
}

export const getUserProjects = async (
  userId: string
): Promise<{ data: Project[] | null; error: Error | null }> => {
  try {
    const { data: membershipData, error: membershipError } = await supabase
      .from('project_membership')
      .select('project:projects(id, name)')
      .eq('user_id', userId)
      .order('joined_at', { ascending: false });

    if (membershipError) throw membershipError;

    const membershipProjects =
      (membershipData
        ?.map((item) => (item as unknown as { project: Project }).project)
        .filter(Boolean) as Project[]) || [];

    const { data: createdData, error: createdError } = await supabase
      .from('projects')
      .select('id, name')
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    if (createdError) throw createdError;

    const createdProjects =
      (createdData?.filter((project): project is Project =>
        Boolean(project?.id && project?.name)
      ) as Project[] | undefined) || [];

    const projectMap = new Map<string, Project>();

    for (const project of [...membershipProjects, ...createdProjects]) {
      if (!projectMap.has(project.id)) {
        projectMap.set(project.id, project);
      }
    }

    const projects = [...projectMap.values()];

    return { data: projects, error: null };
  } catch (error: unknown) {
    console.error('Error fetching user projects (web):', error);
    return { data: null, error: error as Error };
  }
};
