
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "bot_sessions": {
                  Row: {
                    "chat_id": number,"created_at": string,"data": NonNullable<Json>,"state": string,"updated_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "chat_id": number,"created_at"?: string,"data"?: NonNullable<Json>,"state"?: string,"updated_at"?: string | null
                  }
                  Update: {
                    "chat_id"?: number,"created_at"?: string,"data"?: NonNullable<Json>,"state"?: string,"updated_at"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"bot_updates": {
                  Row: {
                    "created_at": string,"update_id": number
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"update_id": number
                  }
                  Update: {
                    "created_at"?: string,"update_id"?: number
                  }
                  Relationships: [
                    
                  ]
                },"brands": {
                  Row: {
                    "created_at": string,"id": string,"name": string,"slug": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"name": string,"slug": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"name"?: string,"slug"?: string
                  }
                  Relationships: [
                    
                  ]
                },"categories": {
                  Row: {
                    "created_at": string,"id": string,"name": string,"slug": string,"sort": number
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"name": string,"slug": string,"sort"?: number
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"name"?: string,"slug"?: string,"sort"?: number
                  }
                  Relationships: [
                    
                  ]
                },"order_items": {
                  Row: {
                    "created_at": string,"id": string,"line_total": number | null,"name_snapshot": string,"order_id": string,"price_snapshot": number,"product_id": string | null,"quantity": number
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"line_total"?: never,"name_snapshot": string,"order_id": string,"price_snapshot": number,"product_id"?: string | null,"quantity": number
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"line_total"?: never,"name_snapshot"?: string,"order_id"?: string,"price_snapshot"?: number,"product_id"?: string | null,"quantity"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "order_items_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "order_items_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    }
                  ]
                },"orders": {
                  Row: {
                    "city": string,"comment": string | null,"created_at": string,"customer_name": string,"customer_phone": string,"id": string,"idempotency_key": string,"number": number,"status": string,"total": number,"updated_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "city": string,"comment"?: string | null,"created_at"?: string,"customer_name": string,"customer_phone": string,"id"?: string,"idempotency_key": string,"number"?: never,"status"?: string,"total": number,"updated_at"?: string | null
                  }
                  Update: {
                    "city"?: string,"comment"?: string | null,"created_at"?: string,"customer_name"?: string,"customer_phone"?: string,"id"?: string,"idempotency_key"?: string,"number"?: never,"status"?: string,"total"?: number,"updated_at"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"product_images": {
                  Row: {
                    "created_at": string,"height": number | null,"id": string,"path": string,"product_id": string,"sort": number,"width": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"height"?: number | null,"id"?: string,"path": string,"product_id": string,"sort"?: number,"width"?: number | null
                  }
                  Update: {
                    "created_at"?: string,"height"?: number | null,"id"?: string,"path"?: string,"product_id"?: string,"sort"?: number,"width"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "product_images_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    }
                  ]
                },"products": {
                  Row: {
                    "aroma": string | null,"brand_id": string,"category_id": string,"created_at": string,"description": string | null,"discount_percent": number | null,"id": string,"in_stock": boolean,"is_hit": boolean,"is_new": boolean,"name": string,"old_price": number | null,"price": number,"slug": string,"sort": number,"status": string,"updated_at": string | null,"volume": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "aroma"?: string | null,"brand_id": string,"category_id": string,"created_at"?: string,"description"?: string | null,"discount_percent"?: never,"id"?: string,"in_stock"?: boolean,"is_hit"?: boolean,"is_new"?: boolean,"name": string,"old_price"?: number | null,"price": number,"slug": string,"sort"?: number,"status"?: string,"updated_at"?: string | null,"volume"?: string | null
                  }
                  Update: {
                    "aroma"?: string | null,"brand_id"?: string,"category_id"?: string,"created_at"?: string,"description"?: string | null,"discount_percent"?: never,"id"?: string,"in_stock"?: boolean,"is_hit"?: boolean,"is_new"?: boolean,"name"?: string,"old_price"?: number | null,"price"?: number,"slug"?: string,"sort"?: number,"status"?: string,"updated_at"?: string | null,"volume"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "products_brand_id_fkey"
      columns: ["brand_id"]
isOneToOne: false
      referencedRelation: "brands"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "products_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "bot_append_photo":
{ Args: { "p_chat_id": number,"p_file_id": string,"p_group_id": string }; Returns: {
              "first_in_group": boolean,"photo_count": number
            }[]
                           },
"create_order":
{ Args: { "p_city": string,"p_comment": string,"p_idempotency_key": string,"p_items": Json,"p_name": string,"p_phone": string }; Returns: {
              "created": boolean,"order_id": string,"order_number": number,"order_total": number
            }[]
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            
          }
        }
} as const
