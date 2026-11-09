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
    PostgrestVersion: "14.18"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      cereri: {
        Row: {
          id: string
          id_extern: string | null
          lead_id: string
          primita_la: string
          raspunsuri: Json
          sursa: Database["public"]["Enums"]["sursa"]
          utm: Json
        }
        Insert: {
          id?: string
          id_extern?: string | null
          lead_id: string
          primita_la?: string
          raspunsuri?: Json
          sursa: Database["public"]["Enums"]["sursa"]
          utm?: Json
        }
        Update: {
          id?: string
          id_extern?: string | null
          lead_id?: string
          primita_la?: string
          raspunsuri?: Json
          sursa?: Database["public"]["Enums"]["sursa"]
          utm?: Json
        }
        Relationships: [
          {
            foreignKeyName: "cereri_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead_uri"
            referencedColumns: ["id"]
          },
        ]
      }
      clienti: {
        Row: {
          caller_id: string | null
          closer_id: string | null
          creat_la: string
          email: string | null
          id: string
          lead_id: string | null
          nume: string
          serviciu: Database["public"]["Enums"]["serviciu"]
          sursa: Database["public"]["Enums"]["sursa"]
          telefon: string | null
        }
        Insert: {
          caller_id?: string | null
          closer_id?: string | null
          creat_la?: string
          email?: string | null
          id?: string
          lead_id?: string | null
          nume: string
          serviciu: Database["public"]["Enums"]["serviciu"]
          sursa: Database["public"]["Enums"]["sursa"]
          telefon?: string | null
        }
        Update: {
          caller_id?: string | null
          closer_id?: string | null
          creat_la?: string
          email?: string | null
          id?: string
          lead_id?: string | null
          nume?: string
          serviciu?: Database["public"]["Enums"]["serviciu"]
          sursa?: Database["public"]["Enums"]["sursa"]
          telefon?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clienti_caller_id_fkey"
            columns: ["caller_id"]
            isOneToOne: false
            referencedRelation: "profiluri"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clienti_closer_id_fkey"
            columns: ["closer_id"]
            isOneToOne: false
            referencedRelation: "profiluri"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clienti_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: true
            referencedRelation: "lead_uri"
            referencedColumns: ["id"]
          },
        ]
      }
      discutii: {
        Row: {
          closer_id: string
          creat_de: string | null
          creat_la: string
          id: string
          incepe_la: string
          lead_id: string
          sfarseste_la: string
        }
        Insert: {
          closer_id: string
          creat_de?: string | null
          creat_la?: string
          id?: string
          incepe_la: string
          lead_id: string
          sfarseste_la: string
        }
        Update: {
          closer_id?: string
          creat_de?: string | null
          creat_la?: string
          id?: string
          incepe_la?: string
          lead_id?: string
          sfarseste_la?: string
        }
        Relationships: [
          {
            foreignKeyName: "discutii_closer_id_fkey"
            columns: ["closer_id"]
            isOneToOne: false
            referencedRelation: "profiluri"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discutii_creat_de_fkey"
            columns: ["creat_de"]
            isOneToOne: false
            referencedRelation: "profiluri"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discutii_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead_uri"
            referencedColumns: ["id"]
          },
        ]
      }
      evenimente: {
        Row: {
          autor_id: string | null
          detalii: Json
          id: number
          la: string
          lead_id: string
          tip: string
        }
        Insert: {
          autor_id?: string | null
          detalii?: Json
          id?: never
          la?: string
          lead_id: string
          tip: string
        }
        Update: {
          autor_id?: string | null
          detalii?: Json
          id?: never
          la?: string
          lead_id?: string
          tip?: string
        }
        Relationships: [
          {
            foreignKeyName: "evenimente_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "profiluri"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evenimente_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead_uri"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_uri: {
        Row: {
          callback_la: string | null
          caller_id: string | null
          closer_id: string | null
          creat_de: string | null
          creat_la: string
          email: string | null
          email_norm: string | null
          id: string
          incercari: number
          intrat_la: string
          motiv: string | null
          nume: string
          serviciu: Database["public"]["Enums"]["serviciu"]
          stare: Database["public"]["Enums"]["stare"]
          sursa: Database["public"]["Enums"]["sursa"]
          telefon: string | null
          telefon_norm: string | null
        }
        Insert: {
          callback_la?: string | null
          caller_id?: string | null
          closer_id?: string | null
          creat_de?: string | null
          creat_la?: string
          email?: string | null
          email_norm?: string | null
          id?: string
          incercari?: number
          intrat_la?: string
          motiv?: string | null
          nume: string
          serviciu: Database["public"]["Enums"]["serviciu"]
          stare?: Database["public"]["Enums"]["stare"]
          sursa: Database["public"]["Enums"]["sursa"]
          telefon?: string | null
          telefon_norm?: string | null
        }
        Update: {
          callback_la?: string | null
          caller_id?: string | null
          closer_id?: string | null
          creat_de?: string | null
          creat_la?: string
          email?: string | null
          email_norm?: string | null
          id?: string
          incercari?: number
          intrat_la?: string
          motiv?: string | null
          nume?: string
          serviciu?: Database["public"]["Enums"]["serviciu"]
          stare?: Database["public"]["Enums"]["stare"]
          sursa?: Database["public"]["Enums"]["sursa"]
          telefon?: string | null
          telefon_norm?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_uri_caller_id_fkey"
            columns: ["caller_id"]
            isOneToOne: false
            referencedRelation: "profiluri"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_uri_closer_id_fkey"
            columns: ["closer_id"]
            isOneToOne: false
            referencedRelation: "profiluri"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_uri_creat_de_fkey"
            columns: ["creat_de"]
            isOneToOne: false
            referencedRelation: "profiluri"
            referencedColumns: ["id"]
          },
        ]
      }
      notite: {
        Row: {
          autor_id: string | null
          id: string
          la: string
          lead_id: string
          link_vocal: string | null
          text: string
        }
        Insert: {
          autor_id?: string | null
          id?: string
          la?: string
          lead_id: string
          link_vocal?: string | null
          text: string
        }
        Update: {
          autor_id?: string | null
          id?: string
          la?: string
          lead_id?: string
          link_vocal?: string | null
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "notite_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "profiluri"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notite_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead_uri"
            referencedColumns: ["id"]
          },
        ]
      }
      profiluri: {
        Row: {
          activ: boolean
          creat_la: string
          durata_discutie_min: number
          email: string
          id: string
          nume: string
          rol: Database["public"]["Enums"]["rol"]
        }
        Insert: {
          activ?: boolean
          creat_la?: string
          durata_discutie_min?: number
          email: string
          id: string
          nume: string
          rol: Database["public"]["Enums"]["rol"]
        }
        Update: {
          activ?: boolean
          creat_la?: string
          durata_discutie_min?: number
          email?: string
          id?: string
          nume?: string
          rol?: Database["public"]["Enums"]["rol"]
        }
        Relationships: []
      }
      program_closer: {
        Row: {
          closer_id: string
          de_la: string
          id: string
          pana_la: string
          zi: number
        }
        Insert: {
          closer_id: string
          de_la: string
          id?: string
          pana_la: string
          zi: number
        }
        Update: {
          closer_id?: string
          de_la?: string
          id?: string
          pana_la?: string
          zi?: number
        }
        Relationships: [
          {
            foreignKeyName: "program_closer_closer_id_fkey"
            columns: ["closer_id"]
            isOneToOne: false
            referencedRelation: "profiluri"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      programeaza_discutie: {
        Args: { p_closer: string; p_incepe: string; p_lead: string }
        Returns: undefined
      }
      rol_curent: { Args: never; Returns: Database["public"]["Enums"]["rol"] }
      salveaza_program: {
        Args: { p_closer: string; p_durata: number; p_zile: Json }
        Returns: undefined
      }
    }
    Enums: {
      rol: "admin" | "caller" | "closer" | "constructor"
      serviciu: "site" | "automatizari" | "1la1" | "altceva"
      stare:
        | "nou"
        | "fara_raspuns"
        | "a_raspuns"
        | "callback"
        | "programat"
        | "oferta_trimisa"
        | "client"
        | "pierdut"
        | "descalificat"
      sursa:
        | "formular_site"
        | "reclama_meta"
        | "reclama_tiktok"
        | "cold_calling"
        | "recomandare"
        | "dm_instagram"
        | "dm_tiktok"
        | "altceva"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      rol: ["admin", "caller", "closer", "constructor"],
      serviciu: ["site", "automatizari", "1la1", "altceva"],
      stare: [
        "nou",
        "fara_raspuns",
        "a_raspuns",
        "callback",
        "programat",
        "oferta_trimisa",
        "client",
        "pierdut",
        "descalificat",
      ],
      sursa: [
        "formular_site",
        "reclama_meta",
        "reclama_tiktok",
        "cold_calling",
        "recomandare",
        "dm_instagram",
        "dm_tiktok",
        "altceva",
      ],
    },
  },
} as const
