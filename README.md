# Sinistro Control

Crie um sistema web interno de CONTROLE DE SINISTROS para uma seguradora de automóveis (BP Seguradora). Idioma: português do Brasil. Substitui uma planilha Excel editada diariamente por vários colaboradores, hoje sem controle de quem edita e com risco de perda de dados. Use Supabase (banco PostgreSQL + Auth) e uma UI limpa, moderna e profissional (shadcn/ui + Tailwind), com tema claro.

CONTEXTO E OBJETIVO
- Vários colaboradores alimentam a planilha todos os dias. Precisamos de: login por usuário, histórico de quem criou/editou cada registro e cada campo (auditoria), evitar perda de dados, e uma "esteira" (workflow) clara do sinistro.

AUTENTICAÇÃO E USUÁRIOS
- Login com email/senha (Supabase Auth). Tela de login protegida — só usuários autenticados acessam.
- Tabela de perfis (profiles) com nome completo e email.
- Toda criação/edição registra automaticamente: usuário responsável, data e hora.

DOIS MÓDULOS (duas tabelas principais no banco). Cada sinistro é uma linha. Campos:

MÓDULO 1 — "INDENIZAÇÃO INTEGRAL" (tabela sinistros_indenizacao_integral):
Nº, Status Star, Data do Aviso, Data do Registro, Nº Processo, Nº Comunicado, Contratante, Nº Produto, Cobertura, Tipo de Contratação, Descrição Cobertura/Serviço, Nome do Segurado, CPF/CNPJ, Placa, Data Nasc., Óbito, Causa, Covid, Nº Apólice, Franquia, Data Contratação Item, Data do Sinistro (Ocorrência), Tempo Coberto (Dias), Terceiro, Nome Terceiro, Placa Terceiro, Abertura Realizada, Valor Fipe/Cobertura, Desconto Prêmio, Desconto Deságio/Contrato, Desconto Autuação, Reavaliação, Valor Total Sinistro, Reavaliação Negativa, Data Reavaliação, Reavaliação Positiva, Data Reavaliação Positiva, Tipo de Processo, Tipo de Processo II, Data Finalização (Pag ou Neg), Valor Financiamento, Data Pagamento, Valor Residual & Instantâneo, Data do Pagamento/Negativa, Valor Total Pago/Negado, Valor Real Pago, Complemento Pagamento, Data Pagamento/Cancelamento, Valor Pendente, Status do Processo, Salvado, Status Salvado, Data Aviso Salvado, Valor do Lançamento, Valor Venda, Data Recebimento/Cancelamento, Reavaliação Salvado, Data Reavaliação Salvado.

MÓDULO 2 — "CASCO - PERDA PARCIAL" (tabela sinistros_casco_perda_parcial):
Nº, Status Star, Data do Aviso, Data de Registro/Reabertura, Nº Processo, Nº Comunicado, Contratante, Nº Produto, Cobertura, Tipo de Contratação, Descrição Cobertura/Serviço, Nome do Segurado, CPF/CNPJ, Data Nasc., Placa, Óbito, Causa, Covid, Valor Fipe/Cobertura, Nº Apólice, Franquia, Data Contratação Item, Data do Sinistro (Ocorrência), Tempo Coberto (Dias), Terceiro, Nome Terceiro, Placa Terceiro, Abertura Realizada, Valor Avisado do Sinistro, Reestimativa Positiva, Data da Reestimativa Positiva, Reestimativa Negativa, Data da Reestimativa Negativa, Tipo de Processo, Valor Oficina/Indenização, Data de Pagamento Oficina/Indenização, Valor Peças I, Data Pagamento Peças I, Valor Peças II, Data Pagamento Peças II, Complemento Pagamento, Data do Pagamento Complemento, Valor Total Pago Processo, Valor Pendente, Data Finalização Star, Status do Processo, Observações Processo.

Campos de data devem ser tipo date; campos de valor tipo numérico (moeda R$); demais texto. Alguns campos usam valores fixos: Contratante (BP STIP, BP TRUCK, SEGURADO), Status do Processo (ex: FINALIZADO - PAGO, EM PROCESSO DE PAGAMENTO, NEGADO, CANCELADO), Cobertura (FURTO, ROUBO, CASCO - COLISÃO, RCF - DANOS MATERIAIS, etc.). Use campos de texto livres por enquanto, mas mostre os valores mais comuns como sugestões.

FUNCIONALIDADES PRINCIPAIS
1. Tabela interativa por módulo: listar todos os sinistros com busca, filtros (por Status, Contratante, Cobertura, período de datas), ordenação e paginação. Colunas com scroll horizontal já que são muitas. Permitir escolher/fixar quais colunas exibir.
2. Cadastrar novo sinistro e editar existente por formulário organizado em seções (Identificação, Segurado, Sinistro, Valores, Pagamento, Status). Ao salvar, gravar automaticamente quem editou e quando.
3. AUDITORIA: para cada registro, uma aba/timeline "Histórico" mostrando cada alteração — qual campo mudou, valor antigo → valor novo, quem alterou e data/hora. Nunca sobrescrever silenciosamente: manter log completo (tabela de audit_log).
4. ESTEIRA / WORKFLOW VISUAL: uma visão kanban/etapas mostrando o sinistro avançando pelas fases: Avisado → Registrado → Em Análise → Em Processo de Pagamento → Finalizado (Pago/Negado/Cancelado). Derivar a etapa a partir do Status do Processo e permitir arrastar/mudar etapa.
5. DASHBOARD com indicadores: total de sinistros, por status, valores totais pagos, valores pendentes, sinistros por contratante, por cobertura, e evolução por mês (gráficos de barra/pizza/linha). Separar por módulo e visão consolidada.
6. ALERTAS E PENDÊNCIAS: painel destacando sinistros com valor pendente > 0, sinistros parados há muito tempo sem finalização, e prazos. Mostrar contadores no topo.
7. EXPORTAR: botão para exportar a tabela filtrada em Excel (.xlsx) e PDF.
8. IMPORTAR: tela para importar dados de um arquivo CSV/Excel, com mapeamento de colunas, para popular o sistema e permitir reimportar uma versão atualizada da planilha depois (fazer upsert pelo Nº Processo, sem duplicar).

Comece criando a estrutura do banco (as duas tabelas + profiles + audit_log), a autenticação, o layout com menu lateral (Dashboard, Indenização Integral, Casco - Perda Parcial, Esteira, Alertas, Importar), e a tabela + formulário do módulo Casco - Perda Parcial primeiro (é o maior). Depois seguimos iterando.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d4969f6b-385f-4bf4-9a8e-69e038fc7866).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
