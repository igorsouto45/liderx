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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      eleitores: {
        Row: {
          bairro: string | null
          cep: string | null
          cidade: string | null
          complemento: string | null
          cpf: string | null
          created_at: string | null
          data_nascimento: string | null
          endereco: string | null
          id: string
          latitude: number | null
          lgpd_consent: boolean | null
          local_votacao_nome: string | null
          longitude: number | null
          nome: string
          numero: string | null
          origem_usuario_id: string | null
          secao_votacao: number | null
          status: Database["public"]["Enums"]["eleitor_status"]
          telefone: string | null
          uf: string | null
          zona_votacao: number | null
        }
        Insert: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          cpf?: string | null
          created_at?: string | null
          data_nascimento?: string | null
          endereco?: string | null
          id?: string
          latitude?: number | null
          lgpd_consent?: boolean | null
          local_votacao_nome?: string | null
          longitude?: number | null
          nome: string
          numero?: string | null
          origem_usuario_id?: string | null
          secao_votacao?: number | null
          status?: Database["public"]["Enums"]["eleitor_status"]
          telefone?: string | null
          uf?: string | null
          zona_votacao?: number | null
        }
        Update: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          cpf?: string | null
          created_at?: string | null
          data_nascimento?: string | null
          endereco?: string | null
          id?: string
          latitude?: number | null
          lgpd_consent?: boolean | null
          local_votacao_nome?: string | null
          longitude?: number | null
          nome?: string
          numero?: string | null
          origem_usuario_id?: string | null
          secao_votacao?: number | null
          status?: Database["public"]["Enums"]["eleitor_status"]
          telefone?: string | null
          uf?: string | null
          zona_votacao?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "eleitores_origem_usuario_id_fkey"
            columns: ["origem_usuario_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
        ]
      }
      interacoes: {
        Row: {
          data: string | null
          eleitor_id: string | null
          id: string
          mensagem: string
          resposta: string | null
        }
        Insert: {
          data?: string | null
          eleitor_id?: string | null
          id?: string
          mensagem: string
          resposta?: string | null
        }
        Update: {
          data?: string | null
          eleitor_id?: string | null
          id?: string
          mensagem?: string
          resposta?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interacoes_eleitor_id_fkey"
            columns: ["eleitor_id"]
            isOneToOne: false
            referencedRelation: "eleitores"
            referencedColumns: ["id"]
          },
        ]
      }
      liderancas: {
        Row: {
          auth_user_id: string | null
          bairro: string | null
          cep: string | null
          cidade: string | null
          complemento: string | null
          cpf: string | null
          created_at: string | null
          data_nascimento: string | null
          email: string | null
          endereco: string | null
          id: string
          latitude: number | null
          lgpd_consent: boolean | null
          local_votacao_nome: string | null
          longitude: number | null
          nome: string
          numero: string | null
          perfil_id: string | null
          secao_votacao: number | null
          telefone: string | null
          uf: string | null
          zona_votacao: number | null
        }
        Insert: {
          auth_user_id?: string | null
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          cpf?: string | null
          created_at?: string | null
          data_nascimento?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          latitude?: number | null
          lgpd_consent?: boolean | null
          local_votacao_nome?: string | null
          longitude?: number | null
          nome: string
          numero?: string | null
          perfil_id?: string | null
          secao_votacao?: number | null
          telefone?: string | null
          uf?: string | null
          zona_votacao?: number | null
        }
        Update: {
          auth_user_id?: string | null
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          cpf?: string | null
          created_at?: string | null
          data_nascimento?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          latitude?: number | null
          lgpd_consent?: boolean | null
          local_votacao_nome?: string | null
          longitude?: number | null
          nome?: string
          numero?: string | null
          perfil_id?: string | null
          secao_votacao?: number | null
          telefone?: string | null
          uf?: string | null
          zona_votacao?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "liderancas_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
        ]
      }
      locais_votacao: {
        Row: {
          bairro: string | null
          cep: string | null
          created_at: string
          endereco: string | null
          id: string
          latitude: number | null
          local_nome: string | null
          local_numero: number | null
          longitude: number | null
          municipio: string
          secao: number
          uf: string
          zona: number
        }
        Insert: {
          bairro?: string | null
          cep?: string | null
          created_at?: string
          endereco?: string | null
          id?: string
          latitude?: number | null
          local_nome?: string | null
          local_numero?: number | null
          longitude?: number | null
          municipio: string
          secao: number
          uf: string
          zona: number
        }
        Update: {
          bairro?: string | null
          cep?: string | null
          created_at?: string
          endereco?: string | null
          id?: string
          latitude?: number | null
          local_nome?: string | null
          local_numero?: number | null
          longitude?: number | null
          municipio?: string
          secao?: number
          uf?: string
          zona?: number
        }
        Relationships: []
      }
      mensagens: {
        Row: {
          conteudo: string
          created_at: string
          destinatario_id: string | null
          id: string
          lida: boolean
          remetente_id: string
          titulo: string | null
        }
        Insert: {
          conteudo: string
          created_at?: string
          destinatario_id?: string | null
          id?: string
          lida?: boolean
          remetente_id: string
          titulo?: string | null
        }
        Update: {
          conteudo?: string
          created_at?: string
          destinatario_id?: string | null
          id?: string
          lida?: boolean
          remetente_id?: string
          titulo?: string | null
        }
        Relationships: []
      }
      mensagens_lidas: {
        Row: {
          lida_em: string | null
          mensagem_id: string
          perfil_id: string
        }
        Insert: {
          lida_em?: string | null
          mensagem_id: string
          perfil_id: string
        }
        Update: {
          lida_em?: string | null
          mensagem_id?: string
          perfil_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mensagens_lidas_mensagem_id_fkey"
            columns: ["mensagem_id"]
            isOneToOne: false
            referencedRelation: "mensagens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensagens_lidas_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
        ]
      }
      perfis: {
        Row: {
          created_at: string | null
          id: string
          nome: string
          tipo: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string | null
          id: string
          nome: string
          tipo?: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string | null
          id?: string
          nome?: string
          tipo?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      prioridades: {
        Row: {
          created_at: string | null
          descricao: string | null
          id: string
          lider_id: string | null
          status: string | null
          titulo: string
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          lider_id?: string | null
          status?: string | null
          titulo: string
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          lider_id?: string | null
          status?: string | null
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "prioridades_lider_id_fkey"
            columns: ["lider_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      create_leadership_user: {
        Args: { user_email: string; user_nome: string; user_password: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "líder" | "operador"
      eleitor_status: "apoiador" | "indeciso" | "rejeição"
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
      app_role: ["admin", "líder", "operador"],
      eleitor_status: ["apoiador", "indeciso", "rejeição"],
    },
  },
} as const
