export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      fishing_recommendations: {
        Row: {
          best_time_end: string | null
          best_time_start: string | null
          created_at: string | null
          current_conditions: string | null
          fish_species: string[] | null
          id: string
          location_coordinates: unknown | null
          location_name: string
          popularity_score: number | null
          updated_at: string | null
        }
        Insert: {
          best_time_end?: string | null
          best_time_start?: string | null
          created_at?: string | null
          current_conditions?: string | null
          fish_species?: string[] | null
          id?: string
          location_coordinates?: unknown | null
          location_name: string
          popularity_score?: number | null
          updated_at?: string | null
        }
        Update: {
          best_time_end?: string | null
          best_time_start?: string | null
          created_at?: string | null
          current_conditions?: string | null
          fish_species?: string[] | null
          id?: string
          location_coordinates?: unknown | null
          location_name?: string
          popularity_score?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      fishing_resources: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          region: string
          resource_type: string
          url: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          region: string
          resource_type: string
          url: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          region?: string
          resource_type?: string
          url?: string
        }
        Relationships: []
      }
      fishing_spots: {
        Row: {
          created_at: string | null
          fish_analysis: string
          google_place_id: string
          id: string
          last_updated: string | null
        }
        Insert: {
          created_at?: string | null
          fish_analysis: string
          google_place_id: string
          id?: string
          last_updated?: string | null
        }
        Update: {
          created_at?: string | null
          fish_analysis?: string
          google_place_id?: string
          id?: string
          last_updated?: string | null
        }
        Relationships: []
      }
      secrets: {
        Row: {
          created_at: string | null
          key_name: string
          key_value: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          key_name: string
          key_value: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          key_name?: string
          key_value?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
