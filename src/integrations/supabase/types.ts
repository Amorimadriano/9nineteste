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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      anexos: {
        Row: {
          conta_pagar_id: string | null
          conta_receber_id: string | null
          created_at: string
          id: string
          nome_arquivo: string
          storage_path: string
          tamanho: number | null
          tipo_arquivo: string | null
          user_id: string
        }
        Insert: {
          conta_pagar_id?: string | null
          conta_receber_id?: string | null
          created_at?: string
          id?: string
          nome_arquivo: string
          storage_path: string
          tamanho?: number | null
          tipo_arquivo?: string | null
          user_id: string
        }
        Update: {
          conta_pagar_id?: string | null
          conta_receber_id?: string | null
          created_at?: string
          id?: string
          nome_arquivo?: string
          storage_path?: string
          tamanho?: number | null
          tipo_arquivo?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "anexos_conta_pagar_id_fkey"
            columns: ["conta_pagar_id"]
            isOneToOne: false
            referencedRelation: "contas_pagar"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anexos_conta_receber_id_fkey"
            columns: ["conta_receber_id"]
            isOneToOne: false
            referencedRelation: "contas_receber"
            referencedColumns: ["id"]
          },
        ]
      }
      assinaturas: {
        Row: {
          boleto_barcode: string | null
          boleto_url: string | null
          created_at: string
          data_fim: string | null
          data_inicio: string | null
          id: string
          metodo_pagamento: string | null
          pagarme_charge_id: string | null
          pagarme_customer_id: string | null
          pagarme_order_id: string | null
          pix_qr_code: string | null
          pix_qr_code_url: string | null
          plano: string
          status: string
          updated_at: string
          user_id: string
          valor: number
        }
        Insert: {
          boleto_barcode?: string | null
          boleto_url?: string | null
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          id?: string
          metodo_pagamento?: string | null
          pagarme_charge_id?: string | null
          pagarme_customer_id?: string | null
          pagarme_order_id?: string | null
          pix_qr_code?: string | null
          pix_qr_code_url?: string | null
          plano?: string
          status?: string
          updated_at?: string
          user_id: string
          valor?: number
        }
        Update: {
          boleto_barcode?: string | null
          boleto_url?: string | null
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          id?: string
          metodo_pagamento?: string | null
          pagarme_charge_id?: string | null
          pagarme_customer_id?: string | null
          pagarme_order_id?: string | null
          pix_qr_code?: string | null
          pix_qr_code_url?: string | null
          plano?: string
          status?: string
          updated_at?: string
          user_id?: string
          valor?: number
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          user_id?: string
        }
        Relationships: []
      }
      bancos_cartoes: {
        Row: {
          agencia: string | null
          ativo: boolean
          banco: string | null
          bandeira: string | null
          conta: string | null
          created_at: string
          id: string
          limite: number | null
          nome: string
          observacoes: string | null
          saldo_inicial: number | null
          tipo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agencia?: string | null
          ativo?: boolean
          banco?: string | null
          bandeira?: string | null
          conta?: string | null
          created_at?: string
          id?: string
          limite?: number | null
          nome: string
          observacoes?: string | null
          saldo_inicial?: number | null
          tipo?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agencia?: string | null
          ativo?: boolean
          banco?: string | null
          bandeira?: string | null
          conta?: string | null
          created_at?: string
          id?: string
          limite?: number | null
          nome?: string
          observacoes?: string | null
          saldo_inicial?: number | null
          tipo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      card_aliquotas_reforma: {
        Row: {
          aliquota_cbs: number
          aliquota_ibs: number
          ano: number
          created_at: string
          id: string
          observacao: string | null
          updated_at: string
        }
        Insert: {
          aliquota_cbs?: number
          aliquota_ibs?: number
          ano: number
          created_at?: string
          id?: string
          observacao?: string | null
          updated_at?: string
        }
        Update: {
          aliquota_cbs?: number
          aliquota_ibs?: number
          ano?: number
          created_at?: string
          id?: string
          observacao?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      card_audit_logs: {
        Row: {
          acao: string
          created_at: string
          detalhes: Json | null
          entidade: string
          entidade_id: string | null
          id: string
          user_id: string
        }
        Insert: {
          acao: string
          created_at?: string
          detalhes?: Json | null
          entidade: string
          entidade_id?: string | null
          id?: string
          user_id: string
        }
        Update: {
          acao?: string
          created_at?: string
          detalhes?: Json | null
          entidade?: string
          entidade_id?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      card_dashboard_cache: {
        Row: {
          atualizado_em: string | null
          cashflow_previsto: Json | null
          chargebacks: number | null
          conferidas: number | null
          divergentes: number | null
          empresa_id: string | null
          id: string
          pendentes: number | null
          por_adquirente: Json | null
          por_bandeira: Json | null
          split_cbs: number | null
          split_ibs: number | null
          split_liquido_projetado: number | null
          total_bruto: number | null
          total_liquido: number | null
          total_taxas: number | null
          total_transacoes: number | null
          user_id: string
        }
        Insert: {
          atualizado_em?: string | null
          cashflow_previsto?: Json | null
          chargebacks?: number | null
          conferidas?: number | null
          divergentes?: number | null
          empresa_id?: string | null
          id?: string
          pendentes?: number | null
          por_adquirente?: Json | null
          por_bandeira?: Json | null
          split_cbs?: number | null
          split_ibs?: number | null
          split_liquido_projetado?: number | null
          total_bruto?: number | null
          total_liquido?: number | null
          total_taxas?: number | null
          total_transacoes?: number | null
          user_id: string
        }
        Update: {
          atualizado_em?: string | null
          cashflow_previsto?: Json | null
          chargebacks?: number | null
          conferidas?: number | null
          divergentes?: number | null
          empresa_id?: string | null
          id?: string
          pendentes?: number | null
          por_adquirente?: Json | null
          por_bandeira?: Json | null
          split_cbs?: number | null
          split_ibs?: number | null
          split_liquido_projetado?: number | null
          total_bruto?: number | null
          total_liquido?: number | null
          total_taxas?: number | null
          total_transacoes?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_dashboard_cache_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresa"
            referencedColumns: ["id"]
          },
        ]
      }
      card_importacoes: {
        Row: {
          adquirente: string
          criado_em: string | null
          empresa_id: string | null
          erros: Json | null
          id: string
          nome_arquivo: string
          processado_em: string | null
          status: string | null
          tamanho_arquivo: number | null
          tipo_arquivo: string
          total_erros: number | null
          total_importadas: number | null
          total_linhas: number | null
          user_id: string
        }
        Insert: {
          adquirente: string
          criado_em?: string | null
          empresa_id?: string | null
          erros?: Json | null
          id?: string
          nome_arquivo: string
          processado_em?: string | null
          status?: string | null
          tamanho_arquivo?: number | null
          tipo_arquivo?: string
          total_erros?: number | null
          total_importadas?: number | null
          total_linhas?: number | null
          user_id: string
        }
        Update: {
          adquirente?: string
          criado_em?: string | null
          empresa_id?: string | null
          erros?: Json | null
          id?: string
          nome_arquivo?: string
          processado_em?: string | null
          status?: string | null
          tamanho_arquivo?: number | null
          tipo_arquivo?: string
          total_erros?: number | null
          total_importadas?: number | null
          total_linhas?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_importacoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresa"
            referencedColumns: ["id"]
          },
        ]
      }
      card_relatorios_gerados: {
        Row: {
          criado_em: string | null
          empresa_id: string | null
          filtros: Json | null
          id: string
          nome_arquivo: string | null
          periodo_fim: string
          periodo_inicio: string
          tamanho_bytes: number | null
          tipo_relatorio: string
          total_bruto: number | null
          total_divergencias: number | null
          total_liquido: number | null
          total_transacoes: number | null
          user_id: string
        }
        Insert: {
          criado_em?: string | null
          empresa_id?: string | null
          filtros?: Json | null
          id?: string
          nome_arquivo?: string | null
          periodo_fim: string
          periodo_inicio: string
          tamanho_bytes?: number | null
          tipo_relatorio: string
          total_bruto?: number | null
          total_divergencias?: number | null
          total_liquido?: number | null
          total_transacoes?: number | null
          user_id: string
        }
        Update: {
          criado_em?: string | null
          empresa_id?: string | null
          filtros?: Json | null
          id?: string
          nome_arquivo?: string | null
          periodo_fim?: string
          periodo_inicio?: string
          tamanho_bytes?: number | null
          tipo_relatorio?: string
          total_bruto?: number | null
          total_divergencias?: number | null
          total_liquido?: number | null
          total_transacoes?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_relatorios_gerados_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresa"
            referencedColumns: ["id"]
          },
        ]
      }
      card_report_config: {
        Row: {
          atualizado_em: string | null
          criado_em: string | null
          empresa_id: string | null
          id: string
          incluir_detalhamento_parcelas: boolean | null
          incluir_graficos: boolean | null
          logo_empresa: boolean | null
          nome_relatorio: string
          periodo_padrao_dias: number | null
          tipo_relatorio: string
          user_id: string
        }
        Insert: {
          atualizado_em?: string | null
          criado_em?: string | null
          empresa_id?: string | null
          id?: string
          incluir_detalhamento_parcelas?: boolean | null
          incluir_graficos?: boolean | null
          logo_empresa?: boolean | null
          nome_relatorio: string
          periodo_padrao_dias?: number | null
          tipo_relatorio?: string
          user_id: string
        }
        Update: {
          atualizado_em?: string | null
          criado_em?: string | null
          empresa_id?: string | null
          id?: string
          incluir_detalhamento_parcelas?: boolean | null
          incluir_graficos?: boolean | null
          logo_empresa?: boolean | null
          nome_relatorio?: string
          periodo_padrao_dias?: number | null
          tipo_relatorio?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_report_config_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresa"
            referencedColumns: ["id"]
          },
        ]
      }
      card_simulacoes_salvas: {
        Row: {
          aliquota_cbs: number
          aliquota_ibs: number
          ano_referencia: number
          criado_em: string | null
          empresa_id: string | null
          id: string
          nome: string
          observacoes: string | null
          taxa_mdr: number
          user_id: string
          valor_bruto: number
          valor_cbs: number | null
          valor_ibs: number | null
          valor_liquido: number | null
          valor_mdr: number | null
        }
        Insert: {
          aliquota_cbs: number
          aliquota_ibs: number
          ano_referencia: number
          criado_em?: string | null
          empresa_id?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          taxa_mdr: number
          user_id: string
          valor_bruto: number
          valor_cbs?: number | null
          valor_ibs?: number | null
          valor_liquido?: number | null
          valor_mdr?: number | null
        }
        Update: {
          aliquota_cbs?: number
          aliquota_ibs?: number
          ano_referencia?: number
          criado_em?: string | null
          empresa_id?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          taxa_mdr?: number
          user_id?: string
          valor_bruto?: number
          valor_cbs?: number | null
          valor_ibs?: number | null
          valor_liquido?: number | null
          valor_mdr?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "card_simulacoes_salvas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresa"
            referencedColumns: ["id"]
          },
        ]
      }
      card_split_simulacoes: {
        Row: {
          aliquota_cbs: number
          aliquota_ibs: number
          ano_referencia: number
          created_at: string
          id: string
          observacoes: string | null
          transacao_id: string | null
          updated_at: string
          user_id: string
          valor_bruto: number
          valor_cbs: number
          valor_ibs: number
          valor_liquido_empresa: number
          valor_mdr: number
        }
        Insert: {
          aliquota_cbs?: number
          aliquota_ibs?: number
          ano_referencia: number
          created_at?: string
          id?: string
          observacoes?: string | null
          transacao_id?: string | null
          updated_at?: string
          user_id: string
          valor_bruto?: number
          valor_cbs?: number
          valor_ibs?: number
          valor_liquido_empresa?: number
          valor_mdr?: number
        }
        Update: {
          aliquota_cbs?: number
          aliquota_ibs?: number
          ano_referencia?: number
          created_at?: string
          id?: string
          observacoes?: string | null
          transacao_id?: string | null
          updated_at?: string
          user_id?: string
          valor_bruto?: number
          valor_cbs?: number
          valor_ibs?: number
          valor_liquido_empresa?: number
          valor_mdr?: number
        }
        Relationships: [
          {
            foreignKeyName: "card_split_simulacoes_transacao_id_fkey"
            columns: ["transacao_id"]
            isOneToOne: false
            referencedRelation: "card_transacoes_brutas"
            referencedColumns: ["id"]
          },
        ]
      }
      card_transacoes_brutas: {
        Row: {
          adquirente: string
          arquivo_origem: string | null
          autorizacao: string | null
          banco_cartao_id: string | null
          bandeira: string | null
          conciliado: boolean
          created_at: string
          data_conciliacao: string | null
          data_prevista_recebimento: string | null
          data_recebimento: string | null
          data_venda: string
          empresa_id: string | null
          id: string
          nsu: string | null
          observacoes: string | null
          parcela_atual: number
          parcelas: number
          score_conciliacao: number | null
          status_auditoria: string
          taxa_mdr: number
          tipo_arquivo: string | null
          tipo_transacao: string
          updated_at: string
          user_id: string
          valor_bruto: number
          valor_extrato_bancario: number | null
          valor_liquido: number
          valor_taxa: number
        }
        Insert: {
          adquirente?: string
          arquivo_origem?: string | null
          autorizacao?: string | null
          banco_cartao_id?: string | null
          bandeira?: string | null
          conciliado?: boolean
          created_at?: string
          data_conciliacao?: string | null
          data_prevista_recebimento?: string | null
          data_recebimento?: string | null
          data_venda: string
          empresa_id?: string | null
          id?: string
          nsu?: string | null
          observacoes?: string | null
          parcela_atual?: number
          parcelas?: number
          score_conciliacao?: number | null
          status_auditoria?: string
          taxa_mdr?: number
          tipo_arquivo?: string | null
          tipo_transacao?: string
          updated_at?: string
          user_id: string
          valor_bruto?: number
          valor_extrato_bancario?: number | null
          valor_liquido?: number
          valor_taxa?: number
        }
        Update: {
          adquirente?: string
          arquivo_origem?: string | null
          autorizacao?: string | null
          banco_cartao_id?: string | null
          bandeira?: string | null
          conciliado?: boolean
          created_at?: string
          data_conciliacao?: string | null
          data_prevista_recebimento?: string | null
          data_recebimento?: string | null
          data_venda?: string
          empresa_id?: string | null
          id?: string
          nsu?: string | null
          observacoes?: string | null
          parcela_atual?: number
          parcelas?: number
          score_conciliacao?: number | null
          status_auditoria?: string
          taxa_mdr?: number
          tipo_arquivo?: string | null
          tipo_transacao?: string
          updated_at?: string
          user_id?: string
          valor_bruto?: number
          valor_extrato_bancario?: number | null
          valor_liquido?: number
          valor_taxa?: number
        }
        Relationships: [
          {
            foreignKeyName: "card_transacoes_brutas_banco_cartao_id_fkey"
            columns: ["banco_cartao_id"]
            isOneToOne: false
            referencedRelation: "bancos_cartoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_transacoes_brutas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresa"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          id: string
          nome: string
          plano_conta_id: string | null
          tipo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          plano_conta_id?: string | null
          tipo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          plano_conta_id?: string | null
          tipo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categorias_plano_conta_id_fkey"
            columns: ["plano_conta_id"]
            isOneToOne: false
            referencedRelation: "plano_contas"
            referencedColumns: ["id"]
          },
        ]
      }
      certificados_nfse: {
        Row: {
          arquivo_path: string | null
          ativo: boolean
          cnpj: string | null
          created_at: string
          emissor: string | null
          id: string
          nome: string
          updated_at: string
          user_id: string
          valido_ate: string | null
        }
        Insert: {
          arquivo_path?: string | null
          ativo?: boolean
          cnpj?: string | null
          created_at?: string
          emissor?: string | null
          id?: string
          nome: string
          updated_at?: string
          user_id: string
          valido_ate?: string | null
        }
        Update: {
          arquivo_path?: string | null
          ativo?: boolean
          cnpj?: string | null
          created_at?: string
          emissor?: string | null
          id?: string
          nome?: string
          updated_at?: string
          user_id?: string
          valido_ate?: string | null
        }
        Relationships: []
      }
      clientes: {
        Row: {
          ativo: boolean
          bairro: string | null
          cep: string | null
          cidade: string | null
          cnae: string | null
          complemento: string | null
          created_at: string
          documento: string | null
          email: string | null
          empresa_id: string | null
          endereco: string | null
          estado: string | null
          id: string
          natureza_juridica: string | null
          nome: string
          numero: string | null
          observacoes: string | null
          telefone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cnae?: string | null
          complemento?: string | null
          created_at?: string
          documento?: string | null
          email?: string | null
          empresa_id?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          natureza_juridica?: string | null
          nome: string
          numero?: string | null
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cnae?: string | null
          complemento?: string | null
          created_at?: string
          documento?: string | null
          email?: string | null
          empresa_id?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          natureza_juridica?: string | null
          nome?: string
          numero?: string | null
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cobranca_historico: {
        Row: {
          canal: string
          cliente_email: string | null
          cliente_nome: string | null
          conta_receber_id: string | null
          created_at: string
          data_vencimento: string | null
          id: string
          mensagem: string | null
          status: string
          tipo: string
          user_id: string
          valor: number | null
        }
        Insert: {
          canal?: string
          cliente_email?: string | null
          cliente_nome?: string | null
          conta_receber_id?: string | null
          created_at?: string
          data_vencimento?: string | null
          id?: string
          mensagem?: string | null
          status?: string
          tipo: string
          user_id: string
          valor?: number | null
        }
        Update: {
          canal?: string
          cliente_email?: string | null
          cliente_nome?: string | null
          conta_receber_id?: string | null
          created_at?: string
          data_vencimento?: string | null
          id?: string
          mensagem?: string | null
          status?: string
          tipo?: string
          user_id?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cobranca_historico_conta_receber_id_fkey"
            columns: ["conta_receber_id"]
            isOneToOne: false
            referencedRelation: "contas_receber"
            referencedColumns: ["id"]
          },
        ]
      }
      contador_config: {
        Row: {
          created_at: string
          email_contador: string
          escritorio: string | null
          id: string
          nome_contador: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_contador: string
          escritorio?: string | null
          id?: string
          nome_contador?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_contador?: string
          escritorio?: string | null
          id?: string
          nome_contador?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contador_documentos: {
        Row: {
          ano_referencia: number | null
          created_at: string
          enviado: boolean
          enviado_em: string | null
          id: string
          mes_referencia: number | null
          nome_arquivo: string
          storage_path: string
          tamanho: number | null
          tipo_arquivo: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ano_referencia?: number | null
          created_at?: string
          enviado?: boolean
          enviado_em?: string | null
          id?: string
          mes_referencia?: number | null
          nome_arquivo: string
          storage_path: string
          tamanho?: number | null
          tipo_arquivo?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ano_referencia?: number | null
          created_at?: string
          enviado?: boolean
          enviado_em?: string | null
          id?: string
          mes_referencia?: number | null
          nome_arquivo?: string
          storage_path?: string
          tamanho?: number | null
          tipo_arquivo?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contas_pagar: {
        Row: {
          banco_cartao_id: string | null
          categoria_id: string | null
          created_at: string
          data_emissao: string
          data_fim_recorrencia: string | null
          data_pagamento: string | null
          data_vencimento: string
          descricao: string
          documento: string | null
          forma_pagamento: string | null
          fornecedor_id: string | null
          frequencia: string | null
          id: string
          observacoes: string | null
          recorrente: boolean
          status: string
          updated_at: string
          user_id: string
          valor: number
        }
        Insert: {
          banco_cartao_id?: string | null
          categoria_id?: string | null
          created_at?: string
          data_emissao?: string
          data_fim_recorrencia?: string | null
          data_pagamento?: string | null
          data_vencimento: string
          descricao: string
          documento?: string | null
          forma_pagamento?: string | null
          fornecedor_id?: string | null
          frequencia?: string | null
          id?: string
          observacoes?: string | null
          recorrente?: boolean
          status?: string
          updated_at?: string
          user_id: string
          valor: number
        }
        Update: {
          banco_cartao_id?: string | null
          categoria_id?: string | null
          created_at?: string
          data_emissao?: string
          data_fim_recorrencia?: string | null
          data_pagamento?: string | null
          data_vencimento?: string
          descricao?: string
          documento?: string | null
          forma_pagamento?: string | null
          fornecedor_id?: string | null
          frequencia?: string | null
          id?: string
          observacoes?: string | null
          recorrente?: boolean
          status?: string
          updated_at?: string
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "contas_pagar_banco_cartao_id_fkey"
            columns: ["banco_cartao_id"]
            isOneToOne: false
            referencedRelation: "bancos_cartoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_pagar_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_pagar_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      contas_receber: {
        Row: {
          banco_cartao_id: string | null
          categoria_id: string | null
          cliente_id: string | null
          created_at: string
          data_emissao: string
          data_fim_recorrencia: string | null
          data_recebimento: string | null
          data_vencimento: string
          descricao: string
          documento: string | null
          forma_pagamento: string | null
          frequencia: string | null
          id: string
          observacoes: string | null
          recorrente: boolean
          status: string
          updated_at: string
          user_id: string
          valor: number
        }
        Insert: {
          banco_cartao_id?: string | null
          categoria_id?: string | null
          cliente_id?: string | null
          created_at?: string
          data_emissao?: string
          data_fim_recorrencia?: string | null
          data_recebimento?: string | null
          data_vencimento: string
          descricao: string
          documento?: string | null
          forma_pagamento?: string | null
          frequencia?: string | null
          id?: string
          observacoes?: string | null
          recorrente?: boolean
          status?: string
          updated_at?: string
          user_id: string
          valor: number
        }
        Update: {
          banco_cartao_id?: string | null
          categoria_id?: string | null
          cliente_id?: string | null
          created_at?: string
          data_emissao?: string
          data_fim_recorrencia?: string | null
          data_recebimento?: string | null
          data_vencimento?: string
          descricao?: string
          documento?: string | null
          forma_pagamento?: string | null
          frequencia?: string | null
          id?: string
          observacoes?: string | null
          recorrente?: boolean
          status?: string
          updated_at?: string
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "contas_receber_banco_cartao_id_fkey"
            columns: ["banco_cartao_id"]
            isOneToOne: false
            referencedRelation: "bancos_cartoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_receber_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_receber_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      empresa: {
        Row: {
          bairro: string | null
          cep: string | null
          cidade: string | null
          cnpj: string | null
          complemento: string | null
          created_at: string
          email: string | null
          endereco: string | null
          estado: string | null
          id: string
          inscricao_estadual: string | null
          inscricao_municipal: string | null
          logo_url: string | null
          nome_fantasia: string | null
          numero: string | null
          observacoes: string | null
          razao_social: string | null
          telefone: string | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          complemento?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          inscricao_estadual?: string | null
          inscricao_municipal?: string | null
          logo_url?: string | null
          nome_fantasia?: string | null
          numero?: string | null
          observacoes?: string | null
          razao_social?: string | null
          telefone?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          complemento?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          inscricao_estadual?: string | null
          inscricao_municipal?: string | null
          logo_url?: string | null
          nome_fantasia?: string | null
          numero?: string | null
          observacoes?: string | null
          razao_social?: string | null
          telefone?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      extrato_bancario: {
        Row: {
          banco_cartao_id: string | null
          conciliado: boolean
          conta_pagar_id: string | null
          conta_receber_id: string | null
          created_at: string
          data_transacao: string
          descricao: string
          fitid: string | null
          id: string
          lancamento_id: string | null
          origem: string
          parcela_atual: number | null
          parcelas: number | null
          tipo: string
          updated_at: string
          user_id: string
          valor: number
        }
        Insert: {
          banco_cartao_id?: string | null
          conciliado?: boolean
          conta_pagar_id?: string | null
          conta_receber_id?: string | null
          created_at?: string
          data_transacao: string
          descricao: string
          fitid?: string | null
          id?: string
          lancamento_id?: string | null
          origem?: string
          parcela_atual?: number | null
          parcelas?: number | null
          tipo?: string
          updated_at?: string
          user_id: string
          valor: number
        }
        Update: {
          banco_cartao_id?: string | null
          conciliado?: boolean
          conta_pagar_id?: string | null
          conta_receber_id?: string | null
          created_at?: string
          data_transacao?: string
          descricao?: string
          fitid?: string | null
          id?: string
          lancamento_id?: string | null
          origem?: string
          parcela_atual?: number | null
          parcelas?: number | null
          tipo?: string
          updated_at?: string
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "extrato_bancario_banco_cartao_id_fkey"
            columns: ["banco_cartao_id"]
            isOneToOne: false
            referencedRelation: "bancos_cartoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extrato_bancario_conta_pagar_id_fkey"
            columns: ["conta_pagar_id"]
            isOneToOne: false
            referencedRelation: "contas_pagar"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extrato_bancario_conta_receber_id_fkey"
            columns: ["conta_receber_id"]
            isOneToOne: false
            referencedRelation: "contas_receber"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extrato_bancario_lancamento_id_fkey"
            columns: ["lancamento_id"]
            isOneToOne: false
            referencedRelation: "lancamentos_caixa"
            referencedColumns: ["id"]
          },
        ]
      }
      fechamentos_mensais: {
        Row: {
          ano: number
          contas_pagar_pendentes: number
          contas_receber_pendentes: number
          created_at: string
          custos_diretos: number
          despesa_total: number
          despesas_operacionais: number
          fechado_em: string | null
          id: string
          lucro_bruto: number
          lucro_liquido: number
          mes: number
          observacoes: string | null
          receita_total: number
          saldo_final: number
          saldo_inicial: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ano?: number
          contas_pagar_pendentes?: number
          contas_receber_pendentes?: number
          created_at?: string
          custos_diretos?: number
          despesa_total?: number
          despesas_operacionais?: number
          fechado_em?: string | null
          id?: string
          lucro_bruto?: number
          lucro_liquido?: number
          mes: number
          observacoes?: string | null
          receita_total?: number
          saldo_final?: number
          saldo_inicial?: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ano?: number
          contas_pagar_pendentes?: number
          contas_receber_pendentes?: number
          created_at?: string
          custos_diretos?: number
          despesa_total?: number
          despesas_operacionais?: number
          fechado_em?: string | null
          id?: string
          lucro_bruto?: number
          lucro_liquido?: number
          mes?: number
          observacoes?: string | null
          receita_total?: number
          saldo_final?: number
          saldo_inicial?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      fornecedores: {
        Row: {
          ativo: boolean
          bairro: string | null
          cep: string | null
          cidade: string | null
          cnae: string | null
          complemento: string | null
          created_at: string
          documento: string | null
          email: string | null
          empresa_id: string | null
          endereco: string | null
          estado: string | null
          id: string
          natureza_juridica: string | null
          nome: string
          numero: string | null
          observacoes: string | null
          telefone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cnae?: string | null
          complemento?: string | null
          created_at?: string
          documento?: string | null
          email?: string | null
          empresa_id?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          natureza_juridica?: string | null
          nome: string
          numero?: string | null
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cnae?: string | null
          complemento?: string | null
          created_at?: string
          documento?: string | null
          email?: string | null
          empresa_id?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          natureza_juridica?: string | null
          nome?: string
          numero?: string | null
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lancamentos_caixa: {
        Row: {
          categoria_id: string | null
          conta_pagar_id: string | null
          conta_receber_id: string | null
          created_at: string
          data_lancamento: string
          descricao: string
          id: string
          observacoes: string | null
          tipo: string
          updated_at: string
          user_id: string
          valor: number
        }
        Insert: {
          categoria_id?: string | null
          conta_pagar_id?: string | null
          conta_receber_id?: string | null
          created_at?: string
          data_lancamento?: string
          descricao: string
          id?: string
          observacoes?: string | null
          tipo: string
          updated_at?: string
          user_id: string
          valor: number
        }
        Update: {
          categoria_id?: string | null
          conta_pagar_id?: string | null
          conta_receber_id?: string | null
          created_at?: string
          data_lancamento?: string
          descricao?: string
          id?: string
          observacoes?: string | null
          tipo?: string
          updated_at?: string
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "lancamentos_caixa_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_caixa_conta_pagar_id_fkey"
            columns: ["conta_pagar_id"]
            isOneToOne: false
            referencedRelation: "contas_pagar"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_caixa_conta_receber_id_fkey"
            columns: ["conta_receber_id"]
            isOneToOne: false
            referencedRelation: "contas_receber"
            referencedColumns: ["id"]
          },
        ]
      }
      leads_diagnostico: {
        Row: {
          cnpj: string | null
          created_at: string
          email: string
          empresa: string
          faturamento_mensal: string | null
          id: string
          nome: string
          num_funcionarios: string | null
          observacoes_internas: string | null
          origem: string
          principal_dor: string | null
          status: string
          telefone: string
          updated_at: string
        }
        Insert: {
          cnpj?: string | null
          created_at?: string
          email: string
          empresa: string
          faturamento_mensal?: string | null
          id?: string
          nome: string
          num_funcionarios?: string | null
          observacoes_internas?: string | null
          origem?: string
          principal_dor?: string | null
          status?: string
          telefone: string
          updated_at?: string
        }
        Update: {
          cnpj?: string | null
          created_at?: string
          email?: string
          empresa?: string
          faturamento_mensal?: string | null
          id?: string
          nome?: string
          num_funcionarios?: string | null
          observacoes_internas?: string | null
          origem?: string
          principal_dor?: string | null
          status?: string
          telefone?: string
          updated_at?: string
        }
        Relationships: []
      }
      licencas_software: {
        Row: {
          chave_licenca: string
          cnpj: string | null
          configuracao_extra: Json
          contato_nome: string | null
          created_at: string
          data_fim: string | null
          data_inicio: string
          desconto_percentual: number | null
          email: string | null
          id: string
          max_usuarios: number
          nome_fantasia: string | null
          observacoes: string | null
          plano: string
          razao_social: string
          status: string
          telefone: string | null
          tipo_cliente: string
          updated_at: string
          user_id: string
          valor_mensal: number
        }
        Insert: {
          chave_licenca?: string
          cnpj?: string | null
          configuracao_extra?: Json
          contato_nome?: string | null
          created_at?: string
          data_fim?: string | null
          data_inicio?: string
          desconto_percentual?: number | null
          email?: string | null
          id?: string
          max_usuarios?: number
          nome_fantasia?: string | null
          observacoes?: string | null
          plano?: string
          razao_social: string
          status?: string
          telefone?: string | null
          tipo_cliente?: string
          updated_at?: string
          user_id: string
          valor_mensal?: number
        }
        Update: {
          chave_licenca?: string
          cnpj?: string | null
          configuracao_extra?: Json
          contato_nome?: string | null
          created_at?: string
          data_fim?: string | null
          data_inicio?: string
          desconto_percentual?: number | null
          email?: string | null
          id?: string
          max_usuarios?: number
          nome_fantasia?: string | null
          observacoes?: string | null
          plano?: string
          razao_social?: string
          status?: string
          telefone?: string | null
          tipo_cliente?: string
          updated_at?: string
          user_id?: string
          valor_mensal?: number
        }
        Relationships: []
      }
      metas_orcamentarias: {
        Row: {
          ano: number
          categoria_id: string | null
          created_at: string
          id: string
          mes: number
          observacoes: string | null
          updated_at: string
          user_id: string
          valor_orcado: number
        }
        Insert: {
          ano?: number
          categoria_id?: string | null
          created_at?: string
          id?: string
          mes: number
          observacoes?: string | null
          updated_at?: string
          user_id: string
          valor_orcado?: number
        }
        Update: {
          ano?: number
          categoria_id?: string | null
          created_at?: string
          id?: string
          mes?: number
          observacoes?: string | null
          updated_at?: string
          user_id?: string
          valor_orcado?: number
        }
        Relationships: [
          {
            foreignKeyName: "metas_orcamentarias_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      notas_fiscais_servico: {
        Row: {
          aliquota_cofins: number | null
          aliquota_csll: number | null
          aliquota_inss: number | null
          aliquota_ir: number | null
          aliquota_iss: number | null
          aliquota_pis: number | null
          base_calculo: number | null
          certificado_id: string | null
          cliente_bairro: string | null
          cliente_cep: string | null
          cliente_cidade: string | null
          cliente_cnpj_cpf: string | null
          cliente_complemento: string | null
          cliente_email: string | null
          cliente_endereco: string | null
          cliente_estado: string | null
          cliente_ibge: string | null
          cliente_nome: string | null
          cliente_nome_fantasia: string | null
          cliente_numero: string | null
          cliente_razao_social: string | null
          cliente_telefone: string | null
          cliente_tipo_documento: string | null
          cnae: string | null
          codigo_tributacao: string | null
          codigo_verificacao: string | null
          created_at: string | null
          data_competencia: string | null
          data_emissao: string | null
          id: string
          iss_retido: boolean | null
          link_nfse: string | null
          link_pdf: string | null
          link_xml: string | null
          municipio_prestacao: number | null
          natureza_operacao: number | null
          numero_nota: string | null
          numero_rps: string | null
          protocolo: string | null
          regime_tributario: number | null
          retencao_cofins: number | null
          retencao_csll: number | null
          retencao_inss: number | null
          retencao_ir: number | null
          retencao_pis: number | null
          serie: string | null
          servico_cnae: string | null
          servico_codigo: string | null
          servico_codigo_tributacao: string | null
          servico_descricao: string | null
          servico_discriminacao: string | null
          servico_item_lista_servico: string | null
          status: string | null
          tipo_rps: string | null
          updated_at: string | null
          user_id: string
          valor_deducoes: number | null
          valor_iss: number | null
          valor_liquido: number | null
          valor_servico: number | null
          xml_envio: string | null
          xml_retorno: string | null
        }
        Insert: {
          aliquota_cofins?: number | null
          aliquota_csll?: number | null
          aliquota_inss?: number | null
          aliquota_ir?: number | null
          aliquota_iss?: number | null
          aliquota_pis?: number | null
          base_calculo?: number | null
          certificado_id?: string | null
          cliente_bairro?: string | null
          cliente_cep?: string | null
          cliente_cidade?: string | null
          cliente_cnpj_cpf?: string | null
          cliente_complemento?: string | null
          cliente_email?: string | null
          cliente_endereco?: string | null
          cliente_estado?: string | null
          cliente_ibge?: string | null
          cliente_nome?: string | null
          cliente_nome_fantasia?: string | null
          cliente_numero?: string | null
          cliente_razao_social?: string | null
          cliente_telefone?: string | null
          cliente_tipo_documento?: string | null
          cnae?: string | null
          codigo_tributacao?: string | null
          codigo_verificacao?: string | null
          created_at?: string | null
          data_competencia?: string | null
          data_emissao?: string | null
          id?: string
          iss_retido?: boolean | null
          link_nfse?: string | null
          link_pdf?: string | null
          link_xml?: string | null
          municipio_prestacao?: number | null
          natureza_operacao?: number | null
          numero_nota?: string | null
          numero_rps?: string | null
          protocolo?: string | null
          regime_tributario?: number | null
          retencao_cofins?: number | null
          retencao_csll?: number | null
          retencao_inss?: number | null
          retencao_ir?: number | null
          retencao_pis?: number | null
          serie?: string | null
          servico_cnae?: string | null
          servico_codigo?: string | null
          servico_codigo_tributacao?: string | null
          servico_descricao?: string | null
          servico_discriminacao?: string | null
          servico_item_lista_servico?: string | null
          status?: string | null
          tipo_rps?: string | null
          updated_at?: string | null
          user_id: string
          valor_deducoes?: number | null
          valor_iss?: number | null
          valor_liquido?: number | null
          valor_servico?: number | null
          xml_envio?: string | null
          xml_retorno?: string | null
        }
        Update: {
          aliquota_cofins?: number | null
          aliquota_csll?: number | null
          aliquota_inss?: number | null
          aliquota_ir?: number | null
          aliquota_iss?: number | null
          aliquota_pis?: number | null
          base_calculo?: number | null
          certificado_id?: string | null
          cliente_bairro?: string | null
          cliente_cep?: string | null
          cliente_cidade?: string | null
          cliente_cnpj_cpf?: string | null
          cliente_complemento?: string | null
          cliente_email?: string | null
          cliente_endereco?: string | null
          cliente_estado?: string | null
          cliente_ibge?: string | null
          cliente_nome?: string | null
          cliente_nome_fantasia?: string | null
          cliente_numero?: string | null
          cliente_razao_social?: string | null
          cliente_telefone?: string | null
          cliente_tipo_documento?: string | null
          cnae?: string | null
          codigo_tributacao?: string | null
          codigo_verificacao?: string | null
          created_at?: string | null
          data_competencia?: string | null
          data_emissao?: string | null
          id?: string
          iss_retido?: boolean | null
          link_nfse?: string | null
          link_pdf?: string | null
          link_xml?: string | null
          municipio_prestacao?: number | null
          natureza_operacao?: number | null
          numero_nota?: string | null
          numero_rps?: string | null
          protocolo?: string | null
          regime_tributario?: number | null
          retencao_cofins?: number | null
          retencao_csll?: number | null
          retencao_inss?: number | null
          retencao_ir?: number | null
          retencao_pis?: number | null
          serie?: string | null
          servico_cnae?: string | null
          servico_codigo?: string | null
          servico_codigo_tributacao?: string | null
          servico_descricao?: string | null
          servico_discriminacao?: string | null
          servico_item_lista_servico?: string | null
          status?: string | null
          tipo_rps?: string | null
          updated_at?: string | null
          user_id?: string
          valor_deducoes?: number | null
          valor_iss?: number | null
          valor_liquido?: number | null
          valor_servico?: number | null
          xml_envio?: string | null
          xml_retorno?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notas_fiscais_servico_certificado_id_fkey"
            columns: ["certificado_id"]
            isOneToOne: false
            referencedRelation: "certificados_nfse"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes_admin: {
        Row: {
          created_at: string
          id: string
          lida: boolean
          mensagem: string | null
          tipo: string
          titulo: string
        }
        Insert: {
          created_at?: string
          id?: string
          lida?: boolean
          mensagem?: string | null
          tipo?: string
          titulo: string
        }
        Update: {
          created_at?: string
          id?: string
          lida?: boolean
          mensagem?: string | null
          tipo?: string
          titulo?: string
        }
        Relationships: []
      }
      plano_contas: {
        Row: {
          ativo: boolean
          codigo_conta: string
          codigo_pai: string | null
          created_at: string
          descricao: string
          descricao_reduzida: string | null
          empresa_id: string | null
          id: string
          natureza: string
          nivel: number
          permite_lancamento: boolean
          tipo_conta: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          codigo_conta: string
          codigo_pai?: string | null
          created_at?: string
          descricao: string
          descricao_reduzida?: string | null
          empresa_id?: string | null
          id?: string
          natureza?: string
          nivel?: number
          permite_lancamento?: boolean
          tipo_conta?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          codigo_conta?: string
          codigo_pai?: string | null
          created_at?: string
          descricao?: string
          descricao_reduzida?: string | null
          empresa_id?: string | null
          id?: string
          natureza?: string
          nivel?: number
          permite_lancamento?: boolean
          tipo_conta?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      regua_cobranca: {
        Row: {
          ativo: boolean
          canal: string
          created_at: string
          dias_antes_1: number | null
          dias_antes_2: number | null
          dias_apos_1: number | null
          dias_apos_2: number | null
          dias_apos_3: number | null
          dias_no_vencimento: boolean | null
          id: string
          mensagem_antes: string | null
          mensagem_apos: string | null
          mensagem_vencimento: string | null
          nome: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          canal?: string
          created_at?: string
          dias_antes_1?: number | null
          dias_antes_2?: number | null
          dias_apos_1?: number | null
          dias_apos_2?: number | null
          dias_apos_3?: number | null
          dias_no_vencimento?: boolean | null
          id?: string
          mensagem_antes?: string | null
          mensagem_apos?: string | null
          mensagem_vencimento?: string | null
          nome?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          canal?: string
          created_at?: string
          dias_antes_1?: number | null
          dias_antes_2?: number | null
          dias_apos_1?: number | null
          dias_apos_2?: number | null
          dias_apos_3?: number | null
          dias_no_vencimento?: boolean | null
          id?: string
          mensagem_antes?: string | null
          mensagem_apos?: string | null
          mensagem_vencimento?: string | null
          nome?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          created_at: string | null
          id: string
          key: string
          updated_at: string | null
          user_id: string
          value: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          updated_at?: string | null
          user_id: string
          value?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          user_id?: string
          value?: string | null
        }
        Relationships: []
      }
      transferencias_contas: {
        Row: {
          conta_destino_id: string | null
          conta_origem_id: string | null
          created_at: string
          data_transferencia: string
          descricao: string | null
          id: string
          observacoes: string | null
          updated_at: string
          user_id: string
          valor: number
        }
        Insert: {
          conta_destino_id?: string | null
          conta_origem_id?: string | null
          created_at?: string
          data_transferencia?: string
          descricao?: string | null
          id?: string
          observacoes?: string | null
          updated_at?: string
          user_id: string
          valor: number
        }
        Update: {
          conta_destino_id?: string | null
          conta_origem_id?: string | null
          created_at?: string
          data_transferencia?: string
          descricao?: string | null
          id?: string
          observacoes?: string | null
          updated_at?: string
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "transferencias_contas_conta_destino_id_fkey"
            columns: ["conta_destino_id"]
            isOneToOne: false
            referencedRelation: "bancos_cartoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transferencias_contas_conta_origem_id_fkey"
            columns: ["conta_origem_id"]
            isOneToOne: false
            referencedRelation: "bancos_cartoes"
            referencedColumns: ["id"]
          },
        ]
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
      user_trials: {
        Row: {
          active: boolean
          created_at: string
          id: string
          trial_end: string
          trial_start: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          trial_end?: string
          trial_start?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          trial_end?: string
          trial_start?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      criar_plano_contas_padrao: {
        Args: { p_empresa_id?: string; p_user_id: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      inserir_plano_contas_padrao: {
        Args: { p_user_id: string }
        Returns: number
      }
      refresh_card_dashboard: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      seed_default_categories: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      sincronizar_categorias_plano_contas: {
        Args: { p_empresa_id?: string; p_user_id: string }
        Returns: Json[]
      }
      verificar_ou_criar_plano_padrao: {
        Args: { p_empresa_id?: string; p_user_id: string }
        Returns: number
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
