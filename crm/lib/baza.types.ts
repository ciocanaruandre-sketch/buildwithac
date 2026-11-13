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
      abonament_oameni: {
        Row: {
          abonament_id: string
          om_id: string
          procent: number | null
        }
        Insert: {
          abonament_id: string
          om_id: string
          procent?: number | null
        }
        Update: {
          abonament_id?: string
          om_id?: string
          procent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "abonament_oameni_abonament_id_fkey"
            columns: ["abonament_id"]
            isOneToOne: false
            referencedRelation: "abonamente"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "abonament_oameni_om_id_fkey"
            columns: ["om_id"]
            isOneToOne: false
            referencedRelation: "profiluri"
            referencedColumns: ["id"]
          },
        ]
      }
      abonamente: {
        Row: {
          creat_la: string
          generat_pana: string | null
          id: string
          oprit_la: string | null
          porneste: string
          proiect_id: string
          suma_lei: number
          zi: number
        }
        Insert: {
          creat_la?: string
          generat_pana?: string | null
          id?: string
          oprit_la?: string | null
          porneste: string
          proiect_id: string
          suma_lei: number
          zi: number
        }
        Update: {
          creat_la?: string
          generat_pana?: string | null
          id?: string
          oprit_la?: string | null
          porneste?: string
          proiect_id?: string
          suma_lei?: number
          zi?: number
        }
        Relationships: [
          {
            foreignKeyName: "abonamente_proiect_id_fkey"
            columns: ["proiect_id"]
            isOneToOne: false
            referencedRelation: "proiecte"
            referencedColumns: ["id"]
          },
        ]
      }
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
      comisioane: {
        Row: {
          baza_lei: number
          creat_la: string
          id: string
          nota: string | null
          om_id: string
          platit_la: string | null
          procent: number | null
          proiect_id: string | null
          suma_lei: number | null
          tip: string
          transa_id: string | null
        }
        Insert: {
          baza_lei: number
          creat_la?: string
          id?: string
          nota?: string | null
          om_id: string
          platit_la?: string | null
          procent?: number | null
          proiect_id?: string | null
          suma_lei?: number | null
          tip?: string
          transa_id?: string | null
        }
        Update: {
          baza_lei?: number
          creat_la?: string
          id?: string
          nota?: string | null
          om_id?: string
          platit_la?: string | null
          procent?: number | null
          proiect_id?: string | null
          suma_lei?: number | null
          tip?: string
          transa_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comisioane_om_id_fkey"
            columns: ["om_id"]
            isOneToOne: false
            referencedRelation: "profiluri"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comisioane_proiect_id_fkey"
            columns: ["proiect_id"]
            isOneToOne: false
            referencedRelation: "proiecte"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comisioane_transa_id_fkey"
            columns: ["transa_id"]
            isOneToOne: false
            referencedRelation: "transe"
            referencedColumns: ["id"]
          },
        ]
      }
      conturi: {
        Row: {
          adaugat_de: string | null
          adaugat_la: string
          al_cui: Database["public"]["Enums"]["al_cui"]
          cont: string
          id: string
          proiect_id: string
          serviciu: string
          unde_parola: Database["public"]["Enums"]["unde_parola"]
        }
        Insert: {
          adaugat_de?: string | null
          adaugat_la?: string
          al_cui: Database["public"]["Enums"]["al_cui"]
          cont: string
          id?: string
          proiect_id: string
          serviciu: string
          unde_parola?: Database["public"]["Enums"]["unde_parola"]
        }
        Update: {
          adaugat_de?: string | null
          adaugat_la?: string
          al_cui?: Database["public"]["Enums"]["al_cui"]
          cont?: string
          id?: string
          proiect_id?: string
          serviciu?: string
          unde_parola?: Database["public"]["Enums"]["unde_parola"]
        }
        Relationships: [
          {
            foreignKeyName: "conturi_adaugat_de_fkey"
            columns: ["adaugat_de"]
            isOneToOne: false
            referencedRelation: "profiluri"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conturi_proiect_id_fkey"
            columns: ["proiect_id"]
            isOneToOne: false
            referencedRelation: "proiecte"
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
      evenimente_proiect: {
        Row: {
          autor_id: string | null
          detalii: Json
          id: number
          la: string
          proiect_id: string
          tip: string
        }
        Insert: {
          autor_id?: string | null
          detalii?: Json
          id?: never
          la?: string
          proiect_id: string
          tip: string
        }
        Update: {
          autor_id?: string | null
          detalii?: Json
          id?: never
          la?: string
          proiect_id?: string
          tip?: string
        }
        Relationships: [
          {
            foreignKeyName: "evenimente_proiect_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "profiluri"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evenimente_proiect_proiect_id_fkey"
            columns: ["proiect_id"]
            isOneToOne: false
            referencedRelation: "proiecte"
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
      livrari: {
        Row: {
          adaugat_de: string | null
          adaugat_la: string
          id: string
          link: string | null
          nota: string | null
          proiect_id: string
          stare: Database["public"]["Enums"]["stare_livrare"]
          titlu: string
        }
        Insert: {
          adaugat_de?: string | null
          adaugat_la?: string
          id?: string
          link?: string | null
          nota?: string | null
          proiect_id: string
          stare?: Database["public"]["Enums"]["stare_livrare"]
          titlu: string
        }
        Update: {
          adaugat_de?: string | null
          adaugat_la?: string
          id?: string
          link?: string | null
          nota?: string | null
          proiect_id?: string
          stare?: Database["public"]["Enums"]["stare_livrare"]
          titlu?: string
        }
        Relationships: [
          {
            foreignKeyName: "livrari_adaugat_de_fkey"
            columns: ["adaugat_de"]
            isOneToOne: false
            referencedRelation: "profiluri"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "livrari_proiect_id_fkey"
            columns: ["proiect_id"]
            isOneToOne: false
            referencedRelation: "proiecte"
            referencedColumns: ["id"]
          },
        ]
      }
      materiale: {
        Row: {
          adaugat_de: string | null
          adaugat_la: string
          cale: string | null
          id: string
          marime: number | null
          nota: string | null
          proiect_id: string
          titlu: string
          url: string | null
        }
        Insert: {
          adaugat_de?: string | null
          adaugat_la?: string
          cale?: string | null
          id?: string
          marime?: number | null
          nota?: string | null
          proiect_id: string
          titlu: string
          url?: string | null
        }
        Update: {
          adaugat_de?: string | null
          adaugat_la?: string
          cale?: string | null
          id?: string
          marime?: number | null
          nota?: string | null
          proiect_id?: string
          titlu?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "materiale_adaugat_de_fkey"
            columns: ["adaugat_de"]
            isOneToOne: false
            referencedRelation: "profiluri"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materiale_proiect_id_fkey"
            columns: ["proiect_id"]
            isOneToOne: false
            referencedRelation: "proiecte"
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
      notite_proiect: {
        Row: {
          autor_id: string | null
          id: string
          la: string
          proiect_id: string
          text: string
        }
        Insert: {
          autor_id?: string | null
          id?: string
          la?: string
          proiect_id: string
          text: string
        }
        Update: {
          autor_id?: string | null
          id?: string
          la?: string
          proiect_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "notite_proiect_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "profiluri"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notite_proiect_proiect_id_fkey"
            columns: ["proiect_id"]
            isOneToOne: false
            referencedRelation: "proiecte"
            referencedColumns: ["id"]
          },
        ]
      }
      procente_baza: {
        Row: {
          categorie: string
          procent: number | null
          rol: Database["public"]["Enums"]["rol"]
        }
        Insert: {
          categorie: string
          procent?: number | null
          rol: Database["public"]["Enums"]["rol"]
        }
        Update: {
          categorie?: string
          procent?: number | null
          rol?: Database["public"]["Enums"]["rol"]
        }
        Relationships: []
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
      proiect_oameni: {
        Row: {
          adaugat_la: string
          om_id: string
          procent: number | null
          proiect_id: string
        }
        Insert: {
          adaugat_la?: string
          om_id: string
          procent?: number | null
          proiect_id: string
        }
        Update: {
          adaugat_la?: string
          om_id?: string
          procent?: number | null
          proiect_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proiect_oameni_om_id_fkey"
            columns: ["om_id"]
            isOneToOne: false
            referencedRelation: "profiluri"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proiect_oameni_proiect_id_fkey"
            columns: ["proiect_id"]
            isOneToOne: false
            referencedRelation: "proiecte"
            referencedColumns: ["id"]
          },
        ]
      }
      proiect_vanzari: {
        Row: {
          adaugat_la: string
          om_id: string
          procent: number | null
          proiect_id: string
        }
        Insert: {
          adaugat_la?: string
          om_id: string
          procent?: number | null
          proiect_id: string
        }
        Update: {
          adaugat_la?: string
          om_id?: string
          procent?: number | null
          proiect_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proiect_vanzari_om_id_fkey"
            columns: ["om_id"]
            isOneToOne: false
            referencedRelation: "profiluri"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proiect_vanzari_proiect_id_fkey"
            columns: ["proiect_id"]
            isOneToOne: false
            referencedRelation: "proiecte"
            referencedColumns: ["id"]
          },
        ]
      }
      proiecte: {
        Row: {
          client_id: string
          creat_de: string | null
          creat_la: string
          id: string
          incasat_lei: number
          inchis_la: string | null
          pret_lei: number | null
          serviciu: Database["public"]["Enums"]["serviciu"]
          stadiu: Database["public"]["Enums"]["stadiu"]
          termen: string | null
          titlu: string
        }
        Insert: {
          client_id: string
          creat_de?: string | null
          creat_la?: string
          id?: string
          incasat_lei?: number
          inchis_la?: string | null
          pret_lei?: number | null
          serviciu: Database["public"]["Enums"]["serviciu"]
          stadiu?: Database["public"]["Enums"]["stadiu"]
          termen?: string | null
          titlu: string
        }
        Update: {
          client_id?: string
          creat_de?: string | null
          creat_la?: string
          id?: string
          incasat_lei?: number
          inchis_la?: string | null
          pret_lei?: number | null
          serviciu?: Database["public"]["Enums"]["serviciu"]
          stadiu?: Database["public"]["Enums"]["stadiu"]
          termen?: string | null
          titlu?: string
        }
        Relationships: [
          {
            foreignKeyName: "proiecte_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clienti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proiecte_creat_de_fkey"
            columns: ["creat_de"]
            isOneToOne: false
            referencedRelation: "profiluri"
            referencedColumns: ["id"]
          },
        ]
      }
      taskuri: {
        Row: {
          creat_de: string | null
          creat_la: string
          gata: boolean
          gata_la: string | null
          id: string
          om_id: string | null
          proiect_id: string
          termen: string | null
          titlu: string
        }
        Insert: {
          creat_de?: string | null
          creat_la?: string
          gata?: boolean
          gata_la?: string | null
          id?: string
          om_id?: string | null
          proiect_id: string
          termen?: string | null
          titlu: string
        }
        Update: {
          creat_de?: string | null
          creat_la?: string
          gata?: boolean
          gata_la?: string | null
          id?: string
          om_id?: string | null
          proiect_id?: string
          termen?: string | null
          titlu?: string
        }
        Relationships: [
          {
            foreignKeyName: "taskuri_creat_de_fkey"
            columns: ["creat_de"]
            isOneToOne: false
            referencedRelation: "profiluri"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "taskuri_om_id_fkey"
            columns: ["om_id"]
            isOneToOne: false
            referencedRelation: "profiluri"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "taskuri_proiect_id_fkey"
            columns: ["proiect_id"]
            isOneToOne: false
            referencedRelation: "proiecte"
            referencedColumns: ["id"]
          },
        ]
      }
      transe: {
        Row: {
          abonament_id: string | null
          alerta_trimisa_la: string | null
          creat_la: string
          eticheta: string
          id: string
          incasat_lei: number | null
          incasata_la: string | null
          proiect_id: string
          returnat_lei: number
          returnata_la: string | null
          scadenta: string
          suma_lei: number
          tip: Database["public"]["Enums"]["tip_transa"]
        }
        Insert: {
          abonament_id?: string | null
          alerta_trimisa_la?: string | null
          creat_la?: string
          eticheta: string
          id?: string
          incasat_lei?: number | null
          incasata_la?: string | null
          proiect_id: string
          returnat_lei?: number
          returnata_la?: string | null
          scadenta: string
          suma_lei: number
          tip: Database["public"]["Enums"]["tip_transa"]
        }
        Update: {
          abonament_id?: string | null
          alerta_trimisa_la?: string | null
          creat_la?: string
          eticheta?: string
          id?: string
          incasat_lei?: number | null
          incasata_la?: string | null
          proiect_id?: string
          returnat_lei?: number
          returnata_la?: string | null
          scadenta?: string
          suma_lei?: number
          tip?: Database["public"]["Enums"]["tip_transa"]
        }
        Relationships: [
          {
            foreignKeyName: "transe_abonament"
            columns: ["abonament_id"]
            isOneToOne: false
            referencedRelation: "abonamente"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transe_proiect_id_fkey"
            columns: ["proiect_id"]
            isOneToOne: false
            referencedRelation: "proiecte"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      anuleaza_incasare: { Args: { t: string }; Returns: undefined }
      azi_ro: { Args: never; Returns: string }
      cale_fisier_valida: { Args: { cale: string }; Returns: boolean }
      comisioane_viitoare: {
        Args: never
        Returns: {
          client: string
          comision: number
          eticheta: string
          procent: number
          proiect: string
          suma_lei: number
        }[]
      }
      comisioanele_mele: {
        Args: never
        Returns: {
          baza_lei: number
          client: string
          creat_la: string
          eticheta: string
          id: string
          platit_la: string
          procent: number
          suma_lei: number
          tip: string
        }[]
      }
      e_coleg: { Args: { alt: string }; Returns: boolean }
      genereaza_mentenanta: { Args: { pana: string }; Returns: number }
      in_functie_finante: { Args: never; Returns: boolean }
      incaseaza: {
        Args: { peste?: boolean; suma: number; t: string; zi: string }
        Returns: string
      }
      lei_text: { Args: { n: number }; Returns: string }
      lucreaza_la: { Args: { p: string }; Returns: boolean }
      muta_lead_uri: { Args: { de: string; la: string }; Returns: Json }
      muta_taskuri: { Args: { de: string; la: string }; Returns: number }
      oameni_proiect: {
        Args: { p: string }
        Returns: {
          om_id: string
        }[]
      }
      opreste_abonament: { Args: { a: string }; Returns: undefined }
      plateste_tot: { Args: { om: string; zi: string }; Returns: number }
      porneste_abonament: {
        Args: {
          om: string
          p: string
          porneste: string
          suma: number
          zi: number
        }
        Returns: string
      }
      programeaza_discutie: {
        Args: { p_closer: string; p_incepe: string; p_lead: string }
        Returns: undefined
      }
      proiect_din_cale: { Args: { cale: string }; Returns: string }
      returneaza: {
        Args: { suma: number; t: string; zi: string }
        Returns: undefined
      }
      rol_curent: { Args: never; Returns: Database["public"]["Enums"]["rol"] }
      salveaza_program: {
        Args: { p_closer: string; p_durata: number; p_zile: Json }
        Returns: undefined
      }
      schimba_abonament: {
        Args: { a: string; suma: number; zi: number }
        Returns: undefined
      }
      sterge_client: { Args: { c: string }; Returns: boolean }
      titlu_implicit: {
        Args: { s: Database["public"]["Enums"]["serviciu"] }
        Returns: string
      }
    }
    Enums: {
      al_cui: "client" | "firma"
      rol: "admin" | "caller" | "closer" | "constructor"
      serviciu: "site" | "automatizari" | "1la1" | "altceva"
      stadiu:
        | "discutie"
        | "schita"
        | "constructie"
        | "revizii"
        | "livrat"
        | "mentenanta"
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
      stare_livrare: "trimis" | "aprobat" | "de_refacut"
      sursa:
        | "formular_site"
        | "reclama_meta"
        | "reclama_tiktok"
        | "cold_calling"
        | "recomandare"
        | "dm_instagram"
        | "dm_tiktok"
        | "altceva"
      tip_transa:
        | "odata"
        | "avans"
        | "rest"
        | "rata"
        | "extra"
        | "mentenanta"
        | "inainte"
      unde_parola: "la_client" | "la_firma" | "manager_parole" | "nu_e_cazul"
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
      al_cui: ["client", "firma"],
      rol: ["admin", "caller", "closer", "constructor"],
      serviciu: ["site", "automatizari", "1la1", "altceva"],
      stadiu: [
        "discutie",
        "schita",
        "constructie",
        "revizii",
        "livrat",
        "mentenanta",
      ],
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
      stare_livrare: ["trimis", "aprobat", "de_refacut"],
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
      tip_transa: [
        "odata",
        "avans",
        "rest",
        "rata",
        "extra",
        "mentenanta",
        "inainte",
      ],
      unde_parola: ["la_client", "la_firma", "manager_parole", "nu_e_cazul"],
    },
  },
} as const
