/**
 * Camada de dados isolada.
 *
 * Hoje: localStorage (modo demonstração).
 * Amanhã: basta reescrever as funções abaixo usando o cliente Supabase —
 * a assinatura (async) e os tipos permanecem iguais, sem mexer nas telas.
 */
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

const KEY = (m: ModuleKey) => `bp_sinistros_${m}`;
const AUDIT_KEY = "bp_sinistros_audit";

const isBrowser = () => typeof window !== "undefined";

function read<T>(key: string): T[] {
  if (!isBrowser()) return [];
  try {
    return JSON.parse(window.localStorage.getItem(key) ?? "[]") as T[];
  } catch {
    return [];
  }
}

function write<T>(key: string, rows: T[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(key, JSON.stringify(rows));
}

const uid = () =>
  isBrowser() && window.crypto?.randomUUID
    ? window.crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

const norm = (v: unknown) => (v === null || v === undefined || v === "" ? "" : String(v));

/* ---------------------------------- CRUD --------------------------------- */

export async function listar(modulo: ModuleKey): Promise<SinistroRecord[]> {
  return read<SinistroRecord>(KEY(modulo));
}

export async function obter(modulo: ModuleKey, id: string): Promise<SinistroRecord | null> {
  return read<SinistroRecord>(KEY(modulo)).find((r) => r.id === id) ?? null;
}

export async function criar(
  modulo: ModuleKey,
  dados: Record<string, unknown>,
  usuario: string,
): Promise<SinistroRecord> {
  const now = new Date().toISOString();
  const record: SinistroRecord = {
    ...(dados as Record<string, string>),
    id: uid(),
    created_at: now,
    created_by: usuario,
    updated_at: now,
    updated_by: usuario,
  };
  const rows = read<SinistroRecord>(KEY(modulo));
  rows.unshift(record);
  write(KEY(modulo), rows);

  registrarHistorico([
    {
      id: uid(),
      modulo,
      record_id: record.id,
      campo: "_registro",
      campo_label: "Registro criado",
      valor_antigo: null,
      valor_novo: norm(record['numero_processo']) || "—",
      acao: "criacao",
      usuario,
      criado_em: now,
    },
  ]);
  return record;
}

export async function atualizar(
  modulo: ModuleKey,
  id: string,
  dados: Record<string, unknown>,
  usuario: string,
): Promise<SinistroRecord | null> {
  const rows = read<SinistroRecord>(KEY(modulo));
  const idx = rows.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  const anterior = rows[idx]!;
  const now = new Date().toISOString();
  const fields = MODULES[modulo].fields;

  const entradas: AuditEntry[] = [];
  for (const field of fields) {
    const antes = norm(anterior[field.key]);
    const depois = norm((dados as Record<string, unknown>)[field.key]);
    if (antes !== depois) {
      entradas.push({
        id: uid(),
        modulo,
        record_id: id,
        campo: field.key,
        campo_label: field.label,
        valor_antigo: antes || null,
        valor_novo: depois || null,
        acao: "edicao",
        usuario,
        criado_em: now,
      });
    }
  }

  const atualizado: SinistroRecord = {
    ...anterior,
    ...(dados as Record<string, string>),
    id,
    created_at: anterior.created_at,
    created_by: anterior.created_by,
    updated_at: now,
    updated_by: usuario,
  };
  rows[idx] = atualizado;
  write(KEY(modulo), rows);
  if (entradas.length) registrarHistorico(entradas);
  return atualizado;
}

export async function excluir(modulo: ModuleKey, id: string, usuario: string): Promise<void> {
  const rows = read<SinistroRecord>(KEY(modulo));
  const alvo = rows.find((r) => r.id === id);
  write(
    KEY(modulo),
    rows.filter((r) => r.id !== id),
  );
  registrarHistorico([
    {
      id: uid(),
      modulo,
      record_id: id,
      campo: "_registro",
      campo_label: "Registro excluído",
      valor_antigo: norm(alvo?.['numero_processo']) || "—",
      valor_novo: null,
      acao: "exclusao",
      usuario,
      criado_em: new Date().toISOString(),
    },
  ]);
}

/* -------------------------------- Histórico ------------------------------- */

export function registrarHistorico(entradas: AuditEntry[]) {
  const all = read<AuditEntry>(AUDIT_KEY);
  write(AUDIT_KEY, [...entradas, ...all]);
}

export async function listarHistorico(
  modulo: ModuleKey,
  recordId?: string,
): Promise<AuditEntry[]> {
  return read<AuditEntry>(AUDIT_KEY)
    .filter((e) => e.modulo === modulo && (!recordId || e.record_id === recordId))
    .sort((a, b) => b.criado_em.localeCompare(a.criado_em));
}

/* ------------------------------ Importação -------------------------------- */

/** Upsert pelo Nº Processo (usado depois pela tela de Importar). */
export async function upsertPorProcesso(
  modulo: ModuleKey,
  linhas: Record<string, unknown>[],
  usuario: string,
): Promise<{ criados: number; atualizados: number }> {
  let criados = 0;
  let atualizados = 0;
  for (const linha of linhas) {
    const proc = norm(linha['numero_processo']);
    const existente = proc
      ? read<SinistroRecord>(KEY(modulo)).find((r) => norm(r['numero_processo']) === proc)
      : undefined;
    if (existente) {
      await atualizar(modulo, existente.id, { ...existente, ...linha }, usuario);
      atualizados++;
    } else {
      await criar(modulo, linha, usuario);
      criados++;
    }
  }
  return { criados, atualizados };
}
