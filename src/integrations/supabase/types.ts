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
      payment_reports: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          method: string
          reference: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          method: string
          reference: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          method?: string
          reference?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          business_name: string | null
          courtesy_access: boolean | null
          courtesy_expires_at: string | null
          created_at: string | null
          expires_at: string | null
          full_name: string | null
          id: string
          paid_early: boolean | null
          role: string | null
          subscription_status: boolean | null
        }
        Insert: {
          business_name?: string | null
          courtesy_access?: boolean | null
          courtesy_expires_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          full_name?: string | null
          id: string
          paid_early?: boolean | null
          role?: string | null
          subscription_status?: boolean | null
        }
        Update: {
          business_name?: string | null
          courtesy_access?: boolean | null
          courtesy_expires_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          full_name?: string | null
          id?: string
          paid_early?: boolean | null
          role?: string | null
          subscription_status?: boolean | null
        }
        Relationships: []
      }
      products: {
        Row: {
          base_price: number | null
          category: string | null
          cost_price: number
          created_at: string | null
          final_price: number
          id: string
          iva_amount: number
          name: string
          sale_price: number
          sku: string
          stock: number
          user_id: string | null
        }
        Insert: {
          base_price?: number | null
          category?: string | null
          cost_price?: number
          created_at?: string | null
          final_price?: number
          id?: string
          iva_amount?: number
          name: string
          sale_price?: number
          sku: string
          stock?: number
          user_id?: string | null
        }
        Update: {
          base_price?: number | null
          category?: string | null
          cost_price?: number
          created_at?: string | null
          final_price?: number
          id?: string
          iva_amount?: number
          name?: string
          sale_price?: number
          sku?: string
          stock?: number
          user_id?: string | null
        }
        Relationships: []
      }
      sales: {
        Row: {
          created_at: string | null
          customer_name: string | null
          customer_phone: string | null
          id: string
          payment_method: string | null
          sale_number: number
          status: string | null
          subtotal: number
          tax: number
          total: number
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          payment_method?: string | null
          sale_number?: number
          status?: string | null
          subtotal?: number
          tax?: number
          total?: number
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          payment_method?: string | null
          sale_number?: number
          status?: string | null
          subtotal?: number
          tax?: number
          total?: number
          user_id?: string | null
        }
        Relationships: []
      }
      sale_items: {
        Row: {
          cost_price_at_sale: number
          created_at: string | null
          id: string
          product_id: string
          product_name: string
          quantity: number
          sale_id: string
          subtotal: number
          unit_price: number
          user_id: string | null
        }
        Insert: {
          cost_price_at_sale: number
          created_at?: string | null
          id?: string
          product_id: string
          product_name: string
          quantity: number
          sale_id: string
          subtotal: number
          unit_price: number
          user_id?: string | null
        }
        Update: {
          cost_price_at_sale?: number
          created_at?: string | null
          id?: string
          product_id?: string
          product_name?: string
          quantity?: number
          sale_id?: string
          subtotal?: number
          unit_price?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      debts: {
        Row: {
          created_at: string | null
          customer_name: string
          customer_phone: string | null
          id: string
          notes: string | null
          remaining_amount: number
          sale_id: string | null
          status: string | null
          total_amount: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          customer_name: string
          customer_phone?: string | null
          id?: string
          notes?: string | null
          remaining_amount: number
          sale_id?: string | null
          status?: string | null
          total_amount: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          customer_name?: string
          customer_phone?: string | null
          id?: string
          notes?: string | null
          remaining_amount?: number
          sale_id?: string | null
          status?: string | null
          total_amount?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "debts_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

export const Constants = {
  public: {
    Enums: {},
  },
} as const
