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
      documentos_lideranca: {
        Row: {
          caminho_arquivo: string
          created_at: string
          id: string
          lider_id: string
          nome_arquivo: string
          tamanho_arquivo: number | null
          tipo_arquivo: string | null
        }
        Insert: {
          caminho_arquivo: string
          created_at?: string
          id?: string
          lider_id: string
          nome_arquivo: string
          tamanho_arquivo?: number | null
          tipo_arquivo?: string | null
        }
        Update: {
          caminho_arquivo?: string
          created_at?: string
          id?: string
          lider_id?: string
          nome_arquivo?: string
          tamanho_arquivo?: number | null
          tipo_arquivo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documentos_lideranca_lider_id_fkey"
            columns: ["lider_id"]
            isOneToOne: false
            referencedRelation: "liderancas"
            referencedColumns: ["id"]
          },
        ]
      }
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
      ia_mensagens: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
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
      metas_votos: {
        Row: {
          created_at: string
          id: string
          lider_id: string
          meta: number
          nome: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          lider_id: string
          meta?: number
          nome?: string | null
          tipo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          lider_id?: string
          meta?: number
          nome?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: []
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
      whatsapp_config: {
        Row: {
          ai_brain_enabled: boolean | null
          ai_prompt: string | null
          anti_ban_delay_max: number | null
          anti_ban_delay_min: number | null
          api_key: string | null
          api_url: string | null
          auto_responder_enabled: boolean | null
          created_at: string
          id: string
          session_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_brain_enabled?: boolean | null
          ai_prompt?: string | null
          anti_ban_delay_max?: number | null
          anti_ban_delay_min?: number | null
          api_key?: string | null
          api_url?: string | null
          auto_responder_enabled?: boolean | null
          created_at?: string
          id?: string
          session_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_brain_enabled?: boolean | null
          ai_prompt?: string | null
          anti_ban_delay_max?: number | null
          anti_ban_delay_min?: number | null
          api_key?: string | null
          api_url?: string | null
          auto_responder_enabled?: boolean | null
          created_at?: string
          id?: string
          session_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_configuracoes: {
        Row: {
          anti_ban_batch_size: number | null
          anti_ban_delay_max: number | null
          anti_ban_delay_min: number | null
          auto_responder_brain: string | null
          auto_responder_enabled: boolean | null
          auto_responder_limit_per_contact: number | null
          created_at: string | null
          id: string
          instancia_id: string | null
          updated_at: string | null
        }
        Insert: {
          anti_ban_batch_size?: number | null
          anti_ban_delay_max?: number | null
          anti_ban_delay_min?: number | null
          auto_responder_brain?: string | null
          auto_responder_enabled?: boolean | null
          auto_responder_limit_per_contact?: number | null
          created_at?: string | null
          id?: string
          instancia_id?: string | null
          updated_at?: string | null
        }
        Update: {
          anti_ban_batch_size?: number | null
          anti_ban_delay_max?: number | null
          anti_ban_delay_min?: number | null
          auto_responder_brain?: string | null
          auto_responder_enabled?: boolean | null
          auto_responder_limit_per_contact?: number | null
          created_at?: string | null
          id?: string
          instancia_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_configuracoes_instancia_id_fkey"
            columns: ["instancia_id"]
            isOneToOne: true
            referencedRelation: "whatsapp_instancias"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_instancias: {
        Row: {
          created_at: string | null
          id: string
          instancia_key: string | null
          last_connected: string | null
          nome: string
          owner_id: string | null
          qrcode_data: string | null
          status: string | null
          tecnologia: string | null
          token: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          instancia_key?: string | null
          last_connected?: string | null
          nome: string
          owner_id?: string | null
          qrcode_data?: string | null
          status?: string | null
          tecnologia?: string | null
          token?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          instancia_key?: string | null
          last_connected?: string | null
          nome?: string
          owner_id?: string | null
          qrcode_data?: string | null
          status?: string | null
          tecnologia?: string | null
          token?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      whatsapp_mensagens: {
        Row: {
          contact_name: string | null
          content: string
          created_at: string
          external_id: string | null
          from_me: boolean
          id: string
          instancia_id: string | null
          message_type: string | null
          remote_jid: string
          status: string | null
          timestamp: string
          user_id: string
        }
        Insert: {
          contact_name?: string | null
          content: string
          created_at?: string
          external_id?: string | null
          from_me?: boolean
          id?: string
          instancia_id?: string | null
          message_type?: string | null
          remote_jid: string
          status?: string | null
          timestamp?: string
          user_id: string
        }
        Update: {
          contact_name?: string | null
          content?: string
          created_at?: string
          external_id?: string | null
          from_me?: boolean
          id?: string
          instancia_id?: string | null
          message_type?: string | null
          remote_jid?: string
          status?: string | null
          timestamp?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_mensagens_instancia_id_fkey"
            columns: ["instancia_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instancias"
            referencedColumns: ["id"]
          },
        ]
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
      get_campaign_summary: { Args: never; Returns: Json }
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
