import { useState, useCallback } from 'react';
import { getUserProjects } from '../services/projectService';
import type { Project } from '../types/project.types';

interface UseUserProjectsResult {
  projects: Project[];
  loading: boolean;
  refreshing: boolean;
  loadProjects: (userId: string) => Promise<void>;
  handleRefresh: (userId: string) => Promise<void>;
}

export function useUserProjects(): UseUserProjectsResult {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadProjects = useCallback(async (userId: string) => {
    // Prevent fetching if userId is missing or the placeholder default
    if (!userId || userId === '00000000-0000-0000-0000-000000000000') {
      setProjects([]);
      setLoading(false);
      return;
    }

    console.log('loadProjects called');
    setLoading(true);
    try {
      console.log('Fetching projects for userId:', userId);
      // Use the existing service logic
      const { data, error } = await getUserProjects(userId);
      console.log('Projects fetched:', { data, error });

      if (error) {
        console.error('Error loading projects:', error);
      }
      setProjects(data || []);
    } catch (err) {
      console.error('Exception loading projects:', err);
    } finally {
      setLoading(false);
      console.log('Loading set to false');
    }
  }, []); // Dependencies are now internal to the component, making it stable

  const handleRefresh = useCallback(
    async (userId: string) => {
      setRefreshing(true);
      await loadProjects(userId);
      setRefreshing(false);
    },
    [loadProjects]
  );

  return {
    projects,
    loading,
    refreshing,
    loadProjects,
    handleRefresh,
  };
}
