export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      collections: {
        Row: {
          amount: number
          collection_date: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          paid_by: string
          paid_to: string
          status: string
        }
        Insert: {
          amount: number
          collection_date?: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          paid_by: string
          paid_to: string
          status?: string
        }
        Update: {
          amount?: number
          collection_date?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          paid_by?: string
          paid_to?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "collections_paid_by_fkey"
            columns: ["paid_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collections_paid_to_fkey"
            columns: ["paid_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_participants: {
        Row: {
          expense_id: string
          id: string
          share_amount: number
          user_id: string
        }
        Insert: {
          expense_id: string
          id?: string
          share_amount: number
          user_id: string
        }
        Update: {
          expense_id?: string
          id?: string
          share_amount?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_participants_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "group_expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_expenses: {
        Row: {
          amount: number
          created_at: string
          created_by: string
          description: string | null
          expense_date: string
          id: string
          split_type: Database["public"]["Enums"]["split_type_enum"]
        }
        Insert: {
          amount: number
          created_at?: string
          created_by: string
          description?: string | null
          expense_date?: string
          id?: string
          split_type?: Database["public"]["Enums"]["split_type_enum"]
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string
          description?: string | null
          expense_date?: string
          id?: string
          split_type?: Database["public"]["Enums"]["split_type_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "group_expenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      personal_expenses: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          description: string | null
          expense_date: string
          id: string
          user_id: string
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string
          description?: string | null
          expense_date?: string
          id?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          description?: string | null
          expense_date?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "personal_expenses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_group_expense: {
        Args: {
          p_amount: number
          p_description: string
          p_expense_date: string
          p_participants: Json
          p_split_type: string
        }
        Returns: string
      }
      update_group_expense: {
        Args: {
          p_amount: number
          p_description: string
          p_expense_date: string
          p_expense_id: string
          p_participants: Json
          p_split_type: string
        }
        Returns: undefined
      }
    }
    Enums: {
      split_type_enum: "equal" | "custom"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
