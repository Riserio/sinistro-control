export type FieldType = "text" | "textarea" | "date" | "currency" | "number";

export type FieldSection =
  | "Identificação"
  | "Segurado"
  | "Sinistro"
  | "Valores"
  | "Pagamento"
  | "Status";

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  section: FieldSection;
  options?: string[];
  /** exibida por padrão na tabela */
  defaultVisible?: boolean;
}

export const CONTRATANTES = ["BP STIP", "BP TRUCK", "SEGURADO"];

export const STATUS_PROCESSO = [
  "AVISADO",
  "REGISTRADO",
  "EM ANÁLISE",
  "EM PROCESSO DE PAGAMENTO",
  "FINALIZADO - PAGO",
  "NEGADO",
  "CANCELADO",
];

export const COBERTURAS = [
  "FURTO",
  "ROUBO",
  "CASCO - COLISÃO",
  "CASCO - INCÊNDIO",
  "RCF - DANOS MATERIAIS",
  "RCF - DANOS CORPORAIS",
  "APP - MORTE",
  "ASSISTÊNCIA 24H",
];

export const SIM_NAO = ["SIM", "NÃO"];

export const TIPO_CONTRATACAO = ["MENSAL", "ANUAL", "AVULSO", "FROTA"];

export const STATUS_STAR = ["ABERTO", "EM ANDAMENTO", "PENDENTE", "ENCERRADO"];

const f = (
  key: string,
  label: string,
  type: FieldType,
  section: FieldSection,
  extra: Partial<FieldDef> = {},
): FieldDef => ({ key, label, type, section, ...extra });

export const CASCO_FIELDS: FieldDef[] = [
  f("numero", "Nº", "text", "Identificação", { defaultVisible: true }),
  f("status_star", "Status Star", "text", "Identificação", {
    options: STATUS_STAR,
    defaultVisible: true,
  }),
  f("data_aviso", "Data do Aviso", "date", "Identificação", { defaultVisible: true }),
  f("data_registro_reabertura", "Data de Registro/Reabertura", "date", "Identificação"),
  f("numero_processo", "Nº Processo", "text", "Identificação", { defaultVisible: true }),
  f("numero_comunicado", "Nº Comunicado", "text", "Identificação"),
  f("contratante", "Contratante", "text", "Identificação", {
    options: CONTRATANTES,
    defaultVisible: true,
  }),
  f("numero_produto", "Nº Produto", "text", "Identificação"),
  f("cobertura", "Cobertura", "text", "Identificação", {
    options: COBERTURAS,
    defaultVisible: true,
  }),
  f("tipo_contratacao", "Tipo de Contratação", "text", "Identificação", {
    options: TIPO_CONTRATACAO,
  }),
  f("descricao_cobertura_servico", "Descrição Cobertura/Serviço", "textarea", "Identificação"),

  f("nome_segurado", "Nome do Segurado", "text", "Segurado", { defaultVisible: true }),
  f("cpf_cnpj", "CPF/CNPJ", "text", "Segurado"),
  f("data_nascimento", "Data Nasc.", "date", "Segurado"),
  f("placa", "Placa", "text", "Segurado", { defaultVisible: true }),
  f("obito", "Óbito", "text", "Segurado", { options: SIM_NAO }),
  f("causa", "Causa", "text", "Segurado"),
  f("covid", "Covid", "text", "Segurado", { options: SIM_NAO }),

  f("valor_fipe_cobertura", "Valor Fipe/Cobertura", "currency", "Sinistro"),
  f("numero_apolice", "Nº Apólice", "text", "Sinistro"),
  f("franquia", "Franquia", "currency", "Sinistro"),
  f("data_contratacao_item", "Data Contratação Item", "date", "Sinistro"),
  f("data_sinistro", "Data do Sinistro (Ocorrência)", "date", "Sinistro", {
    defaultVisible: true,
  }),
  f("tempo_coberto_dias", "Tempo Coberto (Dias)", "number", "Sinistro"),
  f("terceiro", "Terceiro", "text", "Sinistro", { options: SIM_NAO }),
  f("nome_terceiro", "Nome Terceiro", "text", "Sinistro"),
  f("placa_terceiro", "Placa Terceiro", "text", "Sinistro"),
  f("abertura_realizada", "Abertura Realizada", "text", "Sinistro", { options: SIM_NAO }),

  f("valor_avisado_sinistro", "Valor Avisado do Sinistro", "currency", "Valores"),
  f("reestimativa_positiva", "Reestimativa Positiva", "currency", "Valores"),
  f("data_reestimativa_positiva", "Data da Reestimativa Positiva", "date", "Valores"),
  f("reestimativa_negativa", "Reestimativa Negativa", "currency", "Valores"),
  f("data_reestimativa_negativa", "Data da Reestimativa Negativa", "date", "Valores"),
  f("tipo_processo", "Tipo de Processo", "text", "Valores"),

  f("valor_oficina_indenizacao", "Valor Oficina/Indenização", "currency", "Pagamento"),
  f(
    "data_pagamento_oficina_indenizacao",
    "Data de Pagamento Oficina/Indenização",
    "date",
    "Pagamento",
  ),
  f("valor_pecas_i", "Valor Peças I", "currency", "Pagamento"),
  f("data_pagamento_pecas_i", "Data Pagamento Peças I", "date", "Pagamento"),
  f("valor_pecas_ii", "Valor Peças II", "currency", "Pagamento"),
  f("data_pagamento_pecas_ii", "Data Pagamento Peças II", "date", "Pagamento"),
  f("complemento_pagamento", "Complemento Pagamento", "currency", "Pagamento"),
  f("data_pagamento_complemento", "Data do Pagamento Complemento", "date", "Pagamento"),
  f("valor_total_pago_processo", "Valor Total Pago Processo", "currency", "Pagamento", {
    defaultVisible: true,
  }),
  f("valor_pendente", "Valor Pendente", "currency", "Pagamento", { defaultVisible: true }),

  f("data_finalizacao_star", "Data Finalização Star", "date", "Status"),
  f("status_processo", "Status do Processo", "text", "Status", {
    options: STATUS_PROCESSO,
    defaultVisible: true,
  }),
  f("observacoes_processo", "Observações Processo", "textarea", "Status"),
];

export const INTEGRAL_FIELDS: FieldDef[] = [
  f("numero", "Nº", "text", "Identificação", { defaultVisible: true }),
  f("status_star", "Status Star", "text", "Identificação", {
    options: STATUS_STAR,
    defaultVisible: true,
  }),
  f("data_aviso", "Data do Aviso", "date", "Identificação", { defaultVisible: true }),
  f("data_registro", "Data do Registro", "date", "Identificação"),
  f("numero_processo", "Nº Processo", "text", "Identificação", { defaultVisible: true }),
  f("numero_comunicado", "Nº Comunicado", "text", "Identificação"),
  f("contratante", "Contratante", "text", "Identificação", {
    options: CONTRATANTES,
    defaultVisible: true,
  }),
  f("numero_produto", "Nº Produto", "text", "Identificação"),
  f("cobertura", "Cobertura", "text", "Identificação", {
    options: COBERTURAS,
    defaultVisible: true,
  }),
  f("tipo_contratacao", "Tipo de Contratação", "text", "Identificação", {
    options: TIPO_CONTRATACAO,
  }),
  f("descricao_cobertura_servico", "Descrição Cobertura/Serviço", "textarea", "Identificação"),

  f("nome_segurado", "Nome do Segurado", "text", "Segurado", { defaultVisible: true }),
  f("cpf_cnpj", "CPF/CNPJ", "text", "Segurado"),
  f("placa", "Placa", "text", "Segurado", { defaultVisible: true }),
  f("data_nascimento", "Data Nasc.", "date", "Segurado"),
  f("obito", "Óbito", "text", "Segurado", { options: SIM_NAO }),
  f("causa", "Causa", "text", "Segurado"),
  f("covid", "Covid", "text", "Segurado", { options: SIM_NAO }),

  f("numero_apolice", "Nº Apólice", "text", "Sinistro"),
  f("franquia", "Franquia", "currency", "Sinistro"),
  f("data_contratacao_item", "Data Contratação Item", "date", "Sinistro"),
  f("data_sinistro", "Data do Sinistro (Ocorrência)", "date", "Sinistro", {
    defaultVisible: true,
  }),
  f("tempo_coberto_dias", "Tempo Coberto (Dias)", "number", "Sinistro"),
  f("terceiro", "Terceiro", "text", "Sinistro", { options: SIM_NAO }),
  f("nome_terceiro", "Nome Terceiro", "text", "Sinistro"),
  f("placa_terceiro", "Placa Terceiro", "text", "Sinistro"),
  f("abertura_realizada", "Abertura Realizada", "text", "Sinistro", { options: SIM_NAO }),

  f("valor_fipe_cobertura", "Valor Fipe/Cobertura", "currency", "Valores"),
  f("desconto_premio", "Desconto Prêmio", "currency", "Valores"),
  f("desconto_desagio_contrato", "Desconto Deságio/Contrato", "currency", "Valores"),
  f("desconto_autuacao", "Desconto Autuação", "currency", "Valores"),
  f("reavaliacao", "Reavaliação", "currency", "Valores"),
  f("valor_total_sinistro", "Valor Total Sinistro", "currency", "Valores"),
  f("reavaliacao_negativa", "Reavaliação Negativa", "currency", "Valores"),
  f("data_reavaliacao", "Data Reavaliação", "date", "Valores"),
  f("reavaliacao_positiva", "Reavaliação Positiva", "currency", "Valores"),
  f("data_reavaliacao_positiva", "Data Reavaliação Positiva", "date", "Valores"),
  f("tipo_processo", "Tipo de Processo", "text", "Valores"),
  f("tipo_processo_ii", "Tipo de Processo II", "text", "Valores"),

  f("data_finalizacao_pag_neg", "Data Finalização (Pag ou Neg)", "date", "Pagamento"),
  f("valor_financiamento", "Valor Financiamento", "currency", "Pagamento"),
  f("data_pagamento", "Data Pagamento", "date", "Pagamento"),
  f("valor_residual_instantaneo", "Valor Residual & Instantâneo", "currency", "Pagamento"),
  f("data_pagamento_negativa", "Data do Pagamento/Negativa", "date", "Pagamento"),
  f("valor_total_pago_negado", "Valor Total Pago/Negado", "currency", "Pagamento", {
    defaultVisible: true,
  }),
  f("valor_real_pago", "Valor Real Pago", "currency", "Pagamento"),
  f("complemento_pagamento", "Complemento Pagamento", "currency", "Pagamento"),
  f("data_pagamento_cancelamento", "Data Pagamento/Cancelamento", "date", "Pagamento"),
  f("valor_pendente", "Valor Pendente", "currency", "Pagamento", { defaultVisible: true }),

  f("status_processo", "Status do Processo", "text", "Status", {
    options: STATUS_PROCESSO,
    defaultVisible: true,
  }),
  f("salvado", "Salvado", "text", "Status", { options: SIM_NAO }),
  f("status_salvado", "Status Salvado", "text", "Status"),
  f("data_aviso_salvado", "Data Aviso Salvado", "date", "Status"),
  f("valor_lancamento", "Valor do Lançamento", "currency", "Status"),
  f("valor_venda", "Valor Venda", "currency", "Status"),
  f("data_recebimento_cancelamento", "Data Recebimento/Cancelamento", "date", "Status"),
  f("reavaliacao_salvado", "Reavaliação Salvado", "currency", "Status"),
  f("data_reavaliacao_salvado", "Data Reavaliação Salvado", "date", "Status"),
];

export const SECTIONS: FieldSection[] = [
  "Identificação",
  "Segurado",
  "Sinistro",
  "Valores",
  "Pagamento",
  "Status",
];

export const MODULES = {
  casco: { label: "Casco - Perda Parcial", fields: CASCO_FIELDS },
  integral: { label: "Indenização Integral", fields: INTEGRAL_FIELDS },
} as const;

export type ModuleKey = keyof typeof MODULES;
