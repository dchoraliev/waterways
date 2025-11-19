export interface Project {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  join_code: string;
}

export interface ProjectMembership {
  id: string;
  user_id: string;
  project_id: string;
  joined_at: string;
}