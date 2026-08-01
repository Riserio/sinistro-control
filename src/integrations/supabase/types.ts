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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          acao: string
          campo: string
          campo_label: string
          criado_em: string
          id: string
          modulo: string
          record_id: string
          usuario: string
          valor_antigo: string | null
          valor_novo: string | null
        }
        Insert: {
          acao: string
          campo: string
          campo_label: string
          criado_em?: string
          id?: string
          modulo: string
          record_id: string
          usuario?: string
          valor_antigo?: string | null
          valor_novo?: string | null
        }
        Update: {
          acao?: string
          campo?: string
          campo_label?: string
          criado_em?: string
          id?: string
          modulo?: string
          record_id?: string
          usuario?: string
          valor_antigo?: string | null
          valor_novo?: string | null
        }
        Relationships: []
      }
      config_regras: {
        Row: {
          dias_parado: number
          id: string
          updated_at: string
        }
        Insert: {
          dias_parado?: number
          id?: string
          updated_at?: string
        }
        Update: {
          dias_parado?: number
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ativo: boolean
          criado_em: string
          email: string
          fator: string
          id: string
          ip_permitido: string | null
          nome: string
          palavra_chave: string | null
          perfil: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          criado_em?: string
          email?: string
          fator?: string
          id: string
          ip_permitido?: string | null
          nome?: string
          palavra_chave?: string | null
          perfil?: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          criado_em?: string
          email?: string
          fator?: string
          id?: string
          ip_permitido?: string | null
          nome?: string
          palavra_chave?: string | null
          perfil?: string
          updated_at?: string
        }
        Relationships: []
      }
      sinistros_casco_perda_parcial: {
        Row: {
          abertura_realizada: string | null
          causa: string | null
          cobertura: string | null
          complemento_pagamento: number | null
          contratante: string | null
          covid: string | null
          cpf_cnpj: string | null
          created_at: string
          created_by: string
          data_aviso: string | null
          data_contratacao_item: string | null
          data_finalizacao_star: string | null
          data_nascimento: string | null
          data_pagamento_complemento: string | null
          data_pagamento_oficina_indenizacao: string | null
          data_pagamento_pecas_i: string | null
          data_pagamento_pecas_ii: string | null
          data_reestimativa_negativa: string | null
          data_reestimativa_positiva: string | null
          data_registro_reabertura: string | null
          data_sinistro: string | null
          descricao_cobertura_servico: string | null
          franquia: number | null
          id: string
          nome_segurado: string | null
          nome_terceiro: string | null
          numero: string | null
          numero_apolice: string | null
          numero_comunicado: string | null
          numero_processo: string | null
          numero_produto: string | null
          obito: string | null
          observacoes_processo: string | null
          placa: string | null
          placa_terceiro: string | null
          reestimativa_negativa: number | null
          reestimativa_positiva: number | null
          status_processo: string | null
          status_star: string | null
          tempo_coberto_dias: number | null
          terceiro: string | null
          tipo_contratacao: string | null
          tipo_processo: string | null
          updated_at: string
          updated_by: string
          valor_avisado_sinistro: number | null
          valor_fipe_cobertura: number | null
          valor_oficina_indenizacao: number | null
          valor_pecas_i: number | null
          valor_pecas_ii: number | null
          valor_pendente: number | null
          valor_total_pago_processo: number | null
        }
        Insert: {
          abertura_realizada?: string | null
          causa?: string | null
          cobertura?: string | null
          complemento_pagamento?: number | null
          contratante?: string | null
          covid?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          created_by?: string
          data_aviso?: string | null
          data_contratacao_item?: string | null
          data_finalizacao_star?: string | null
          data_nascimento?: string | null
          data_pagamento_complemento?: string | null
          data_pagamento_oficina_indenizacao?: string | null
          data_pagamento_pecas_i?: string | null
          data_pagamento_pecas_ii?: string | null
          data_reestimativa_negativa?: string | null
          data_reestimativa_positiva?: string | null
          data_registro_reabertura?: string | null
          data_sinistro?: string | null
          descricao_cobertura_servico?: string | null
          franquia?: number | null
          id?: string
          nome_segurado?: string | null
          nome_terceiro?: string | null
          numero?: string | null
          numero_apolice?: string | null
          numero_comunicado?: string | null
          numero_processo?: string | null
          numero_produto?: string | null
          obito?: string | null
          observacoes_processo?: string | null
          placa?: string | null
          placa_terceiro?: string | null
          reestimativa_negativa?: number | null
          reestimativa_positiva?: number | null
          status_processo?: string | null
          status_star?: string | null
          tempo_coberto_dias?: number | null
          terceiro?: string | null
          tipo_contratacao?: string | null
          tipo_processo?: string | null
          updated_at?: string
          updated_by?: string
          valor_avisado_sinistro?: number | null
          valor_fipe_cobertura?: number | null
          valor_oficina_indenizacao?: number | null
          valor_pecas_i?: number | null
          valor_pecas_ii?: number | null
          valor_pendente?: number | null
          valor_total_pago_processo?: number | null
        }
        Update: {
          abertura_realizada?: string | null
          causa?: string | null
          cobertura?: string | null
          complemento_pagamento?: number | null
          contratante?: string | null
          covid?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          created_by?: string
          data_aviso?: string | null
          data_contratacao_item?: string | null
          data_finalizacao_star?: string | null
          data_nascimento?: string | null
          data_pagamento_complemento?: string | null
          data_pagamento_oficina_indenizacao?: string | null
          data_pagamento_pecas_i?: string | null
          data_pagamento_pecas_ii?: string | null
          data_reestimativa_negativa?: string | null
          data_reestimativa_positiva?: string | null
          data_registro_reabertura?: string | null
          data_sinistro?: string | null
          descricao_cobertura_servico?: string | null
          franquia?: number | null
          id?: string
          nome_segurado?: string | null
          nome_terceiro?: string | null
          numero?: string | null
          numero_apolice?: string | null
          numero_comunicado?: string | null
          numero_processo?: string | null
          numero_produto?: string | null
          obito?: string | null
          observacoes_processo?: string | null
          placa?: string | null
          placa_terceiro?: string | null
          reestimativa_negativa?: number | null
          reestimativa_positiva?: number | null
          status_processo?: string | null
          status_star?: string | null
          tempo_coberto_dias?: number | null
          terceiro?: string | null
          tipo_contratacao?: string | null
          tipo_processo?: string | null
          updated_at?: string
          updated_by?: string
          valor_avisado_sinistro?: number | null
          valor_fipe_cobertura?: number | null
          valor_oficina_indenizacao?: number | null
          valor_pecas_i?: number | null
          valor_pecas_ii?: number | null
          valor_pendente?: number | null
          valor_total_pago_processo?: number | null
        }
        Relationships: []
      }
      sinistros_indenizacao_integral: {
        Row: {
          abertura_realizada: string | null
          causa: string | null
          cobertura: string | null
          complemento_pagamento: number | null
          contratante: string | null
          covid: string | null
          cpf_cnpj: string | null
          created_at: string
          created_by: string
          data_aviso: string | null
          data_aviso_salvado: string | null
          data_contratacao_item: string | null
          data_finalizacao_pag_neg: string | null
          data_nascimento: string | null
          data_pagamento: string | null
          data_pagamento_cancelamento: string | null
          data_pagamento_negativa: string | null
          data_reavaliacao: string | null
          data_reavaliacao_positiva: string | null
          data_reavaliacao_salvado: string | null
          data_recebimento_cancelamento: string | null
          data_registro: string | null
          data_sinistro: string | null
          desconto_autuacao: number | null
          desconto_desagio_contrato: number | null
          desconto_premio: number | null
          descricao_cobertura_servico: string | null
          franquia: number | null
          id: string
          nome_segurado: string | null
          nome_terceiro: string | null
          numero: string | null
          numero_apolice: string | null
          numero_comunicado: string | null
          numero_processo: string | null
          numero_produto: string | null
          obito: string | null
          placa: string | null
          placa_terceiro: string | null
          reavaliacao: number | null
          reavaliacao_negativa: number | null
          reavaliacao_positiva: number | null
          reavaliacao_salvado: number | null
          salvado: string | null
          status_processo: string | null
          status_salvado: string | null
          status_star: string | null
          tempo_coberto_dias: number | null
          terceiro: string | null
          tipo_contratacao: string | null
          tipo_processo: string | null
          tipo_processo_ii: string | null
          updated_at: string
          updated_by: string
          valor_financiamento: number | null
          valor_fipe_cobertura: number | null
          valor_lancamento: number | null
          valor_pendente: number | null
          valor_real_pago: number | null
          valor_residual_instantaneo: number | null
          valor_total_pago_negado: number | null
          valor_total_sinistro: number | null
          valor_venda: number | null
        }
        Insert: {
          abertura_realizada?: string | null
          causa?: string | null
          cobertura?: string | null
          complemento_pagamento?: number | null
          contratante?: string | null
          covid?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          created_by?: string
          data_aviso?: string | null
          data_aviso_salvado?: string | null
          data_contratacao_item?: string | null
          data_finalizacao_pag_neg?: string | null
          data_nascimento?: string | null
          data_pagamento?: string | null
          data_pagamento_cancelamento?: string | null
          data_pagamento_negativa?: string | null
          data_reavaliacao?: string | null
          data_reavaliacao_positiva?: string | null
          data_reavaliacao_salvado?: string | null
          data_recebimento_cancelamento?: string | null
          data_registro?: string | null
          data_sinistro?: string | null
          desconto_autuacao?: number | null
          desconto_desagio_contrato?: number | null
          desconto_premio?: number | null
          descricao_cobertura_servico?: string | null
          franquia?: number | null
          id?: string
          nome_segurado?: string | null
          nome_terceiro?: string | null
          numero?: string | null
          numero_apolice?: string | null
          numero_comunicado?: string | null
          numero_processo?: string | null
          numero_produto?: string | null
          obito?: string | null
          placa?: string | null
          placa_terceiro?: string | null
          reavaliacao?: number | null
          reavaliacao_negativa?: number | null
          reavaliacao_positiva?: number | null
          reavaliacao_salvado?: number | null
          salvado?: string | null
          status_processo?: string | null
          status_salvado?: string | null
          status_star?: string | null
          tempo_coberto_dias?: number | null
          terceiro?: string | null
          tipo_contratacao?: string | null
          tipo_processo?: string | null
          tipo_processo_ii?: string | null
          updated_at?: string
          updated_by?: string
          valor_financiamento?: number | null
          valor_fipe_cobertura?: number | null
          valor_lancamento?: number | null
          valor_pendente?: number | null
          valor_real_pago?: number | null
          valor_residual_instantaneo?: number | null
          valor_total_pago_negado?: number | null
          valor_total_sinistro?: number | null
          valor_venda?: number | null
        }
        Update: {
          abertura_realizada?: string | null
          causa?: string | null
          cobertura?: string | null
          complemento_pagamento?: number | null
          contratante?: string | null
          covid?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          created_by?: string
          data_aviso?: string | null
          data_aviso_salvado?: string | null
          data_contratacao_item?: string | null
          data_finalizacao_pag_neg?: string | null
          data_nascimento?: string | null
          data_pagamento?: string | null
          data_pagamento_cancelamento?: string | null
          data_pagamento_negativa?: string | null
          data_reavaliacao?: string | null
          data_reavaliacao_positiva?: string | null
          data_reavaliacao_salvado?: string | null
          data_recebimento_cancelamento?: string | null
          data_registro?: string | null
          data_sinistro?: string | null
          desconto_autuacao?: number | null
          desconto_desagio_contrato?: number | null
          desconto_premio?: number | null
          descricao_cobertura_servico?: string | null
          franquia?: number | null
          id?: string
          nome_segurado?: string | null
          nome_terceiro?: string | null
          numero?: string | null
          numero_apolice?: string | null
          numero_comunicado?: string | null
          numero_processo?: string | null
          numero_produto?: string | null
          obito?: string | null
          placa?: string | null
          placa_terceiro?: string | null
          reavaliacao?: number | null
          reavaliacao_negativa?: number | null
          reavaliacao_positiva?: number | null
          reavaliacao_salvado?: number | null
          salvado?: string | null
          status_processo?: string | null
          status_salvado?: string | null
          status_star?: string | null
          tempo_coberto_dias?: number | null
          terceiro?: string | null
          tipo_contratacao?: string | null
          tipo_processo?: string | null
          tipo_processo_ii?: string | null
          updated_at?: string
          updated_by?: string
          valor_financiamento?: number | null
          valor_fipe_cobertura?: number | null
          valor_lancamento?: number | null
          valor_pendente?: number | null
          valor_real_pago?: number | null
          valor_residual_instantaneo?: number | null
          valor_total_pago_negado?: number | null
          valor_total_sinistro?: number | null
          valor_venda?: number | null
        }
        Relationships: []
      }
      solicitacoes_acesso: {
        Row: {
          aprovado_em: string | null
          aprovado_por: string | null
          criado_em: string
          email: string
          id: string
          ip: string | null
          nome: string
          status: string
          user_id: string
        }
        Insert: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          criado_em?: string
          email?: string
          id?: string
          ip?: string | null
          nome?: string
          status?: string
          user_id: string
        }
        Update: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          criado_em?: string
          email?: string
          id?: string
          ip?: string | null
          nome?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      bootstrap_profile: {
        Args: { _nome?: string }
        Returns: {
          ativo: boolean
          criado_em: string
          email: string
          fator: string
          id: string
          ip_permitido: string | null
          nome: string
          palavra_chave: string | null
          perfil: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_ativo: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "editor" | "visualizador"
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
      app_role: ["admin", "editor", "visualizador"],
    },
  },
} as const
