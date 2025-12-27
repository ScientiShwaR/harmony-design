export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      attendance: {
        Row: {
          check_in_time: string | null
          check_out_time: string | null
          created_at: string
          date: string
          id: string
          marked_by: string | null
          notes: string | null
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string
          date: string
          id?: string
          marked_by?: string | null
          notes?: string | null
          status: string
          student_id: string
          updated_at?: string
        }
        Update: {
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string
          date?: string
          id?: string
          marked_by?: string | null
          notes?: string | null
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_events: {
        Row: {
          actor_roles: string[] | null
          actor_user_id: string | null
          after_json: Json | null
          before_json: Json | null
          command_type: string
          created_at: string
          device_id: string | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: unknown
          metadata_json: Json | null
          reason: string | null
        }
        Insert: {
          actor_roles?: string[] | null
          actor_user_id?: string | null
          after_json?: Json | null
          before_json?: Json | null
          command_type: string
          created_at?: string
          device_id?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown
          metadata_json?: Json | null
          reason?: string | null
        }
        Update: {
          actor_roles?: string[] | null
          actor_user_id?: string | null
          after_json?: Json | null
          before_json?: Json | null
          command_type?: string
          created_at?: string
          device_id?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown
          metadata_json?: Json | null
          reason?: string | null
        }
        Relationships: []
      }
      classes: {
        Row: {
          academic_year: string
          capacity: number | null
          class_teacher_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          room_number: string | null
          section: string | null
          updated_at: string
        }
        Insert: {
          academic_year: string
          capacity?: number | null
          class_teacher_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          room_number?: string | null
          section?: string | null
          updated_at?: string
        }
        Update: {
          academic_year?: string
          capacity?: number | null
          class_teacher_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          room_number?: string | null
          section?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_class_teacher_id_fkey"
            columns: ["class_teacher_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      evidence_items: {
        Row: {
          created_at: string
          description: string | null
          file_name: string | null
          file_type: string | null
          file_url: string | null
          id: string
          notes: string | null
          pack_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          title: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          notes?: string | null
          pack_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          title: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          notes?: string | null
          pack_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          title?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evidence_items_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "evidence_packs"
            referencedColumns: ["id"]
          },
        ]
      }
      evidence_packs: {
        Row: {
          category: string
          completed_items: number
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          name: string
          progress: number
          status: string
          total_items: number
          updated_at: string
        }
        Insert: {
          category: string
          completed_items?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          name: string
          progress?: number
          status?: string
          total_items?: number
          updated_at?: string
        }
        Update: {
          category?: string
          completed_items?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          name?: string
          progress?: number
          status?: string
          total_items?: number
          updated_at?: string
        }
        Relationships: []
      }
      policies: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          policy_key: string
          policy_value: Json
          version: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          policy_key: string
          policy_value: Json
          version?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          policy_key?: string
          policy_value?: Json
          version?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string
          id: string
          permission: string
          role_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          permission: string
          role_id: string
        }
        Update: {
          created_at?: string
          id?: string
          permission?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          display_name: string
          id: string
          name: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_name: string
          id?: string
          name: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          description?: string | null
          display_name?: string
          id?: string
          name?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      staff: {
        Row: {
          address: string | null
          blood_group: string | null
          created_at: string
          created_by: string | null
          date_of_birth: string | null
          department: string | null
          designation: string
          email: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          employee_id: string
          experience_years: number | null
          first_name: string
          gender: string | null
          id: string
          join_date: string
          last_name: string
          phone: string
          qualification: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          blood_group?: string | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          department?: string | null
          designation: string
          email: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_id: string
          experience_years?: number | null
          first_name: string
          gender?: string | null
          id?: string
          join_date?: string
          last_name: string
          phone: string
          qualification?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          blood_group?: string | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          department?: string | null
          designation?: string
          email?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_id?: string
          experience_years?: number | null
          first_name?: string
          gender?: string | null
          id?: string
          join_date?: string
          last_name?: string
          phone?: string
          qualification?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      students: {
        Row: {
          address: string | null
          admission_date: string
          admission_number: string
          blood_group: string | null
          class_id: string | null
          created_at: string
          created_by: string | null
          date_of_birth: string
          first_name: string
          gender: string
          guardian_email: string | null
          guardian_name: string
          guardian_phone: string
          id: string
          last_name: string
          medical_notes: string | null
          section: string | null
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          admission_date?: string
          admission_number: string
          blood_group?: string | null
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          date_of_birth: string
          first_name: string
          gender: string
          guardian_email?: string | null
          guardian_name: string
          guardian_phone: string
          id?: string
          last_name: string
          medical_notes?: string | null
          section?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          admission_date?: string
          admission_number?: string
          blood_group?: string | null
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string
          first_name?: string
          gender?: string
          guardian_email?: string | null
          guardian_name?: string
          guardian_phone?: string
          id?: string
          last_name?: string
          medical_notes?: string | null
          section?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      timetable_slots: {
        Row: {
          class_id: string
          created_at: string
          created_by: string | null
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean
          room_number: string | null
          start_time: string
          subject: string
          teacher_id: string | null
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          created_by?: string | null
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean
          room_number?: string | null
          start_time: string
          subject: string
          teacher_id?: string | null
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          created_by?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean
          room_number?: string | null
          start_time?: string
          subject?: string
          teacher_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "timetable_slots_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_slots_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_permissions: { Args: { _user_id: string }; Returns: string[] }
      has_permission: {
        Args: { _permission: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "teacher" | "clerk" | "principal" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["teacher", "clerk", "principal", "admin"],
    },
  },
} as const
