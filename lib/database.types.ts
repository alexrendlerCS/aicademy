export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      modules: {
        Row: {
          id: string;
          created_at: string;
          title: string;
          description: string | null;
          content: Json;
          created_by: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          title: string;
          description?: string | null;
          content: Json;
          created_by: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          title?: string;
          description?: string | null;
          content?: Json;
          created_by?: string;
          updated_at?: string | null;
        };
      };
      module_progress: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          module_id: string;
          completed: boolean;
          score: number | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_id: string;
          module_id: string;
          completed?: boolean;
          score?: number | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          user_id?: string;
          module_id?: string;
          completed?: boolean;
          score?: number | null;
          updated_at?: string | null;
        };
      };
      classes: {
        Row: {
          id: string;
          created_at: string;
          name: string;
          description: string | null;
          created_by: string;
          code: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          name: string;
          description?: string | null;
          created_by: string;
          code: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          name?: string;
          description?: string | null;
          created_by?: string;
          code?: string;
          updated_at?: string | null;
        };
      };
      class_memberships: {
        Row: {
          id: string;
          created_at: string;
          class_id: string;
          user_id: string;
          role: string;
          status: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          class_id: string;
          user_id: string;
          role: string;
          status: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          class_id?: string;
          user_id?: string;
          role?: string;
          status?: string;
          updated_at?: string | null;
        };
      };
      module_assignments: {
        Row: {
          id: string;
          created_at: string;
          module_id: string;
          class_id: string;
          created_by: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          module_id: string;
          class_id: string;
          created_by: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          module_id?: string;
          class_id?: string;
          created_by?: string;
          updated_at?: string | null;
        };
      };
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
  };
}
