/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Camada de dados — agora ligada ao backend (Lovable Cloud / PostgreSQL).
 *
 * As assinaturas foram mantidas para que as telas não precisem mudar.
 * O carimbo de "quem criou/editou e quando" e a auditoria campo a campo são
 * feitos por TRIGGERS no banco, com base no usuário autenticado.
 */
import { supabase } from "@/integrations/supabase/client";
import type { ModuleKey } from "./schema";
import { MODULES } from "./schema";

export interface SinistroRecord {
  id: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
  [key: string]: string | number | null | undefined;
}

export interface AuditEntry {
  id: string;
  modulo: ModuleKey;
  record_id: string;
  campo: string;
  campo_label: string;
  valor_antigo: string | null;
  valor_novo: string | null;
  acao: "criacao" | "edicao" | "exclusao";
  usuario: string;
  criado_em: string;
}

const TABELA: Record<ModuleKey, string> = {
  casco: "sinistros_casco_perda_parcial",
  integral: "sinistros_indenizacao_integral",
};

const sb = supabase as any;

const RESERVADOS = new Set(["id", "created_at", "created_by", "updated_at", "updated_by"]);

/** Converte os valores do formulário para os tipos das colunas do banco. */
function sanitizar(modulo: ModuleKey, dados: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const field of MODULES[modulo].fields) {
    if (!(field.key in dados)) continue;
    const raw = dados[field.key];
    const s = raw === null || raw === undefined ? "" : String(raw).trim();
    if (s === "") {
      out[field.key] = null;
      continue;
    }
    if (field.type === "currency" || field.type === "number") {
      const n = Number(
        s.replace(/[^\d,.-]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", "."),
      );
      out[field.key] = Number.isFinite(n) ? n : null;
    } else if (field.type === "date") {
      const iso = /^\d{4}-\d{2}-\d{2}/.exec(s);
      if (iso) {
        out[field.key] = iso[0];
      } else {
        const br = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s);
        out[field.key] = br ? `${br[3]}-${br[2]}-${br[1]}` : null;
      }
    } else {
      out[field.key] = s;
    }
  }
  return out;
}

function labelDe(modulo: ModuleKey, campo: string): string {
  return MODULES[modulo].fields.find((f) => f.key === campo)?.label ?? campo;
}

function normalizarRegistro(r: Record<string, unknown>): SinistroRecord {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(r)) out[k] = v === null ? "" : v;
  return out as SinistroRecord;
}

/* ---------------------------------- CRUD --------------------------------- */

export async function listar(modulo: ModuleKey): Promise<SinistroRecord[]> {
  const { data, error } = await sb
    .from(TABELA[modulo])
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[dataStore.listar]", error);
    return [];
  }
  return (data ?? []).map(normalizarRegistro);
}

export async function obter(modulo: ModuleKey, id: string): Promise<SinistroRecord | null> {
  const { data, error } = await sb.from(TABELA[modulo]).select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return normalizarRegistro(data);
}

export async function criar(
  modulo: ModuleKey,
  dados: Record<string, unknown>,
  _usuario: string,
): Promise<SinistroRecord> {
  void _usuario;
  const { data, error } = await sb
    .from(TABELA[modulo])
    .insert(sanitizar(modulo, dados))
    .select()
    .single();
  if (error) throw new Error(error.message);
  return normalizarRegistro(data);
}

export async function atualizar(
  modulo: ModuleKey,
  id: string,
  dados: Record<string, unknown>,
  _usuario: string,
): Promise<SinistroRecord | null> {
  void _usuario;
  const { data, error } = await sb
    .from(TABELA[modulo])
    .update(sanitizar(modulo, dados))
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? normalizarRegistro(data) : null;
}

export async function excluir(modulo: ModuleKey, id: string, _usuario: string): Promise<void> {
  void _usuario;
  const { error } = await sb.from(TABELA[modulo]).delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/* -------------------------------- Histórico ------------------------------- */

export async function listarHistorico(
  modulo: ModuleKey,
  recordId?: string,
): Promise<AuditEntry[]> {
  let q = sb
    .from("audit_log")
    .select("*")
    .eq("modulo", modulo)
    .order("criado_em", { ascending: false })
    .limit(500);
  if (recordId) q = q.eq("record_id", recordId);
  const { data, error } = await q;
  if (error) {
    console.error("[dataStore.listarHistorico]", error);
    return [];
  }
  return (data ?? []).map((e: any) => ({
    ...e,
    campo_label: e.campo.startsWith("_") ? e.campo_label : labelDe(modulo, e.campo),
  })) as AuditEntry[];
}

/* ------------------------------ Importação -------------------------------- */

/** Upsert pelo Nº Processo. */
export async function upsertPorProcesso(
  modulo: ModuleKey,
  linhas: Record<string, unknown>[],
  _usuario: string,
): Promise<{ criados: number; atualizados: number }> {
  void _usuario;
  const { data: existentes } = await sb
    .from(TABELA[modulo])
    .select("id, numero_processo");
  const mapa = new Map<string, string>();
  for (const r of (existentes ?? []) as { id: string; numero_processo: string | null }[]) {
    const p = String(r.numero_processo ?? "").trim();
    if (p) mapa.set(p, r.id);
  }

  let criados = 0;
  let atualizados = 0;
  const novos: Record<string, unknown>[] = [];

  for (const linha of linhas) {
    const dados = sanitizar(modulo, linha);
    const proc = String(linha["numero_processo"] ?? "").trim();
    const idExistente = proc ? mapa.get(proc) : undefined;
    if (idExistente) {
      const { error } = await sb.from(TABELA[modulo]).update(dados).eq("id", idExistente);
      if (!error) atualizados++;
    } else {
      novos.push(dados);
      if (proc) mapa.set(proc, "novo");
    }
  }

  for (let i = 0; i < novos.length; i += 200) {
    const lote = novos.slice(i, i + 200);
    const { error } = await sb.from(TABELA[modulo]).insert(lote);
    if (!error) criados += lote.length;
    else console.error("[dataStore.upsertPorProcesso]", error);
  }

  return { criados, atualizados };
}

/* -------------------------------- Backup ---------------------------------- */

export interface BackupData {
  versao: number;
  exportado_em: string;
  casco: SinistroRecord[];
  integral: SinistroRecord[];
  audit: AuditEntry[];
}

/** Snapshot completo (ambos os módulos + histórico) direto do banco. */
export async function exportarBackup(): Promise<BackupData> {
  const [casco, integral, hist1, hist2] = await Promise.all([
    listar("casco"),
    listar("integral"),
    listarHistorico("casco"),
    listarHistorico("integral"),
  ]);
  return {
    versao: 2,
    exportado_em: new Date().toISOString(),
    casco,
    integral,
    audit: [...hist1, ...hist2],
  };
}

/**
 * Restaura um backup .json (inclusive os gerados no modo demonstração) para o
 * banco, fazendo upsert por Nº Processo — nada é sobrescrito silenciosamente:
 * as alterações geram histórico normalmente.
 */
export async function restaurarBackup(
  data: Partial<BackupData>,
): Promise<{ casco: number; integral: number }> {
  let casco = 0;
  let integral = 0;
  if (Array.isArray(data.casco) && data.casco.length) {
    const r = await upsertPorProcesso("casco", data.casco as Record<string, unknown>[], "");
    casco = r.criados + r.atualizados;
  }
  if (Array.isArray(data.integral) && data.integral.length) {
    const r = await upsertPorProcesso(
      "integral",
      data.integral as Record<string, unknown>[],
      "",
    );
    integral = r.criados + r.atualizados;
  }
  return { casco, integral };
}

/** Apaga todos os sinistros dos dois módulos (usado na tela Importar). */
export async function limparBase(): Promise<void> {
  await sb.from(TABELA["casco"]).delete().not("id", "is", null);
  await sb.from(TABELA["integral"]).delete().not("id", "is", null);
}
