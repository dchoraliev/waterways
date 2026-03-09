export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '13.0.5';
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      observation_categories: {
        Row: {
          color: string | null;
          id: number;
          is_active: boolean | null;
          is_fallback: boolean;
          keywords: string[] | null;
          type: string;
        };
        Insert: {
          color?: string | null;
          id?: number;
          is_active?: boolean | null;
          is_fallback?: boolean;
          keywords?: string[] | null;
          type: string;
        };
        Update: {
          color?: string | null;
          id?: number;
          is_active?: boolean | null;
          is_fallback?: boolean;
          keywords?: string[] | null;
          type?: string;
        };
        Relationships: [];
      };
      observations: {
        Row: {
          categories: string[] | null;
          created_at: string;
          id: string;
          location: unknown;
          observation: string | null;
          observation_media: string[] | null;
          trip_id: string | null;
          unique_userID_localID_pair: string;
          user_id: string | null;
        };
        Insert: {
          categories?: string[] | null;
          created_at?: string;
          id?: string;
          location?: unknown;
          observation?: string | null;
          observation_media?: string[] | null;
          trip_id?: string | null;
          unique_userID_localID_pair: string;
          user_id?: string | null;
        };
        Update: {
          categories?: string[] | null;
          created_at?: string;
          id?: string;
          location?: unknown;
          observation?: string | null;
          observation_media?: string[] | null;
          trip_id?: string | null;
          unique_userID_localID_pair?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'observations_trip_id_fkey';
            columns: ['trip_id'];
            isOneToOne: false;
            referencedRelation: 'trips';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'observations_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      project_membership: {
        Row: {
          id: string;
          joined_at: string;
          project_id: string | null;
          user_id: string | null;
        };
        Insert: {
          id?: string;
          joined_at?: string;
          project_id?: string | null;
          user_id?: string | null;
        };
        Update: {
          id?: string;
          joined_at?: string;
          project_id?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'project_membership_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'project_membership_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      projects: {
        Row: {
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          join_code: string | null;
          name: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          join_code?: string | null;
          name: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          join_code?: string | null;
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'projects_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      trips: {
        Row: {
          created_at: string;
          end_location: unknown;
          end_time: string | null;
          id: string;
          project_id: string | null;
          start_location: unknown;
          start_time: string | null;
          unique_userID_localID_pair: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          end_location?: unknown;
          end_time?: string | null;
          id?: string;
          project_id?: string | null;
          start_location?: unknown;
          start_time?: string | null;
          unique_userID_localID_pair: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          end_location?: unknown;
          end_time?: string | null;
          id?: string;
          project_id?: string | null;
          start_location?: unknown;
          start_time?: string | null;
          unique_userID_localID_pair?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'trips_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'trips_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      user_signups_audit: {
        Row: {
          created_at: string | null;
          email: string | null;
          id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          email?: string | null;
          id?: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          email?: string | null;
          id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      users: {
        Row: {
          created_at: string;
          email: string;
          first_name: string | null;
          id: string;
          last_name: string | null;
          role: string | null;
          share_name_on_map: boolean;
          status: string | null;
          verified: boolean | null;
        };
        Insert: {
          created_at?: string;
          email: string;
          first_name?: string | null;
          id: string;
          last_name?: string | null;
          role?: string | null;
          share_name_on_map?: boolean;
          status?: string | null;
          verified?: boolean | null;
        };
        Update: {
          created_at?: string;
          email?: string;
          first_name?: string | null;
          id?: string;
          last_name?: string | null;
          role?: string | null;
          share_name_on_map?: boolean;
          status?: string | null;
          verified?: boolean | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_admin_observation_users: {
        Args: Record<PropertyKey, never>;
        Returns: {
          email: string | null;
          first_name: string | null;
          last_name: string | null;
          observation_count: number;
          user_id: string;
        }[];
      };
      get_filtered_observations: {
        Args: {
          p_categories?: string[] | null;
          p_keywords?: string | null;
          p_limit?: number | null;
          p_max_lat?: number | null;
          p_max_lng?: number | null;
          p_min_lat?: number | null;
          p_min_lng?: number | null;
          p_month?: number | null;
          p_my_projects_only?: boolean | null;
          p_offset?: number | null;
          p_project_id?: string | null;
          p_since?: string | null;
          p_until?: string | null;
          p_user_id?: string | null;
          p_year?: number | null;
        };
        Returns: {
          categories: string[] | null;
          created_at: string | null;
          id: string;
          latitude: number | null;
          location: string | null;
          longitude: number | null;
          observation: string | null;
          observation_media: string[] | null;
          observer_first_name: string | null;
          observer_last_name: string | null;
          project_description: string | null;
          project_id: string | null;
          project_name: string | null;
          total_count: number;
          trip_id: string | null;
          user_id: string | null;
        }[];
      };
      get_observation_types: {
        Args: Record<PropertyKey, never>;
        Returns: {
          type: string;
        }[];
      };
      get_observation_years: {
        Args: {
          p_my_projects_only?: boolean | null;
          p_project_id?: string | null;
        };
        Returns: {
          year: number;
        }[];
      };
      rpc_ban_user: {
        Args: {
          target_user: string;
        };
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  storage: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer TRow;
    }
    ? TRow
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer TRow;
      }
      ? TRow
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer TInsert;
    }
    ? TInsert
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer TInsert;
      }
      ? TInsert
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer TUpdate;
    }
    ? TUpdate
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer TUpdate;
      }
      ? TUpdate
      : never
    : never;
