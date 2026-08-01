/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Usuários, 2º fator, sessão e regras — agora no backend real.
 *
 * Autenticação: Supabase Auth (e-mail + senha).
 * Perfis, 2º fator e regras: tabelas `profiles` e `config_regras` com RLS.
 */
import { supabase } from "@/integrations/supabase/client";
import {
  criarUsuarioFn,
  atualizarUsuarioFn,
  excluirUsuarioFn,
  validarIpFn,
  validarPalavraChaveFn,
} from "@/lib/usuarios.functions";

export type Fator = "palavra_chave" | "autorizacao" | "ip";
export type Perfil = "admin" | "editor" | "visualizador";

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  senha: string;
  fator: Fator;
  palavra_chave?: string | undefined;
  ip_permitido?: string | undefined;
  perfil: Perfil;
  ativo: boolean;
}

export interface Regras {
  dias_parado: number;
}

export interface Sessao {
  usuario_id: string;
  nome: string;
  email: string;
  perfil: Perfil;
  em: string;
}

export interface SolicitacaoAcesso {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  status: string;
  ip: string | null;
  criado_em: string;
}

export const FATORES: { valor: Fator; label: string; ajuda: string }[] = [
  {
    valor: "palavra_chave",
    label: "Palavra-chave",
    ajuda: "No login, além da senha, o usuário digita uma palavra-chave definida aqui.",
  },
  {
    valor: "autorizacao",
    label: "Autorização do administrador",
    ajuda: "O acesso fica pendente até um administrador autorizar aquele login.",
  },
  {
    valor: "ip",
    label: "IP autorizado",
    ajuda:
      "O acesso só é liberado quando o IP de origem da requisição (lido no servidor) bate com o IP cadastrado.",
  },
];

const sb = supabase as any;
const F_KEY = "bp_fator_ok";
const isBrowser = () => typeof window !== "undefined";

/* ------------------------------- Conversões ------------------------------- */

function paraUsuario(p: any): Usuario {
  return {
    id: p.id,
    nome: p.nome ?? "",
    email: p.email ?? "",
    senha: "",
    fator: (p.fator ?? "palavra_chave") as Fator,
    palavra_chave: p.palavra_chave ?? "",
    ip_permitido: p.ip_permitido ?? "",
    perfil: (p.perfil ?? "visualizador") as Perfil,
    ativo: p.ativo ?? true,
  };
}

/* -------------------------------- Usuários -------------------------------- */

export async function listarUsuarios(): Promise<Usuario[]> {
  const { data, error } = await sb.from("profiles").select("*").order("criado_em");
  if (error) {
    console.error("[config.listarUsuarios]", error);
    return [];
  }
  return (data ?? []).map(paraUsuario);
}

export async function salvarUsuario(u: Usuario): Promise<Usuario> {
  if (u.id) {
    await atualizarUsuarioFn({
      data: {
        id: u.id,
        nome: u.nome,
        perfil: u.perfil,
        fator: u.fator,
        palavra_chave: u.palavra_chave ?? "",
        ip_permitido: u.ip_permitido ?? "",
        ativo: u.ativo,
        senha: u.senha ?? "",
      },
    });
    return u;
  }
  const criado = await criarUsuarioFn({
    data: {
      nome: u.nome,
      email: u.email,
      senha: u.senha,
      perfil: u.perfil,
      fator: u.fator,
      palavra_chave: u.palavra_chave ?? "",
      ip_permitido: u.ip_permitido ?? "",
      ativo: u.ativo,
    },
  });
  return { ...u, id: criado.id, senha: "" };
}

export async function excluirUsuario(id: string): Promise<void> {
  await excluirUsuarioFn({ data: { id } });
}

/* ------------------------------ Autenticação ------------------------------ */

/** Etapa 1: e-mail + senha. Retorna o perfil (com o 2º fator a aplicar). */
export async function autenticar(email: string, senha: string): Promise<Usuario | null> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password: senha,
  });
  if (error || !data.user) return null;

  // Garante o perfil no primeiro acesso (o primeiro usuário vira admin).
  const { data: perfil } = await sb.rpc("bootstrap_profile", { _nome: null });
  const p = Array.isArray(perfil) ? perfil[0] : perfil;
  if (!p) {
    await supabase.auth.signOut();
    return null;
  }
  const usuario = paraUsuario(p);
  if (!usuario.ativo) {
    await supabase.auth.signOut();
    throw new Error("Usuário inativo. Procure um administrador.");
  }
  limparFator();
  return usuario;
}

/** Valida a palavra-chave cadastrada no perfil (conferida no servidor). */
export async function conferirPalavraChave(_u: Usuario, valor: string): Promise<boolean> {
  const r = await validarPalavraChaveFn({ data: { valor } });
  return r.ok;
}

/**
 * Valida o IP de origem no SERVIDOR (server function), comparando com o IP
 * cadastrado no perfil. Limitação: o IP é lido dos cabeçalhos de proxy
 * (x-forwarded-for), o padrão possível em ambiente serverless.
 */
export async function conferirIp(): Promise<{ ok: boolean; ip: string }> {
  return await validarIpFn();
}

/** Registra/consulta a solicitação de acesso do fator "autorizacao". */
export async function solicitarAutorizacao(u: Usuario): Promise<SolicitacaoAcesso | null> {
  const { data: existente } = await sb
    .from("solicitacoes_acesso")
    .select("*")
    .eq("user_id", u.id)
    .eq("status", "pendente")
    .order("criado_em", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existente) return existente as SolicitacaoAcesso;

  const { data: aprovada } = await sb
    .from("solicitacoes_acesso")
    .select("*")
    .eq("user_id", u.id)
    .eq("status", "aprovado")
    .gte("aprovado_em", new Date(Date.now() - 12 * 3_600_000).toISOString())
    .limit(1)
    .maybeSingle();
  if (aprovada) return aprovada as SolicitacaoAcesso;

  const { data, error } = await sb
    .from("solicitacoes_acesso")
    .insert({ user_id: u.id, nome: u.nome, email: u.email })
    .select()
    .maybeSingle();
  if (error) {
    console.error("[config.solicitarAutorizacao]", error);
    return null;
  }
  return data as SolicitacaoAcesso;
}

export async function statusSolicitacao(id: string): Promise<string> {
  const { data } = await sb.from("solicitacoes_acesso").select("status").eq("id", id).maybeSingle();
  return (data?.status as string) ?? "pendente";
}

export async function listarSolicitacoesPendentes(): Promise<SolicitacaoAcesso[]> {
  const { data } = await sb
    .from("solicitacoes_acesso")
    .select("*")
    .eq("status", "pendente")
    .order("criado_em", { ascending: false });
  return (data ?? []) as SolicitacaoAcesso[];
}

export async function decidirSolicitacao(id: string, aprovar: boolean): Promise<void> {
  const { data: sessao } = await supabase.auth.getUser();
  await sb
    .from("solicitacoes_acesso")
    .update({
      status: aprovar ? "aprovado" : "negado",
      aprovado_por: sessao.user?.id ?? null,
      aprovado_em: new Date().toISOString(),
    })
    .eq("id", id);
}

/* --------------------------------- Sessão --------------------------------- */

/** Marca que o 2º fator foi cumprido nesta sessão do navegador. */
export function marcarFatorOk(usuarioId: string) {
  if (isBrowser()) window.sessionStorage.setItem(F_KEY, usuarioId);
}
function limparFator() {
  if (isBrowser()) window.sessionStorage.removeItem(F_KEY);
}
function fatorOk(usuarioId: string) {
  return isBrowser() && window.sessionStorage.getItem(F_KEY) === usuarioId;
}

export function entrar(u: Usuario) {
  marcarFatorOk(u.id);
  if (isBrowser()) window.localStorage.setItem("bp_usuario_atual", u.nome);
}

export async function getSessao(): Promise<Sessao | null> {
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return null;
  if (!fatorOk(user.id)) return null;

  const { data: p } = await sb.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (!p || p.ativo === false) return null;
  if (isBrowser()) window.localStorage.setItem("bp_usuario_atual", p.nome ?? p.email ?? "");
  return {
    usuario_id: user.id,
    nome: p.nome ?? p.email ?? "",
    email: p.email ?? user.email ?? "",
    perfil: (p.perfil ?? "visualizador") as Perfil,
    em: new Date().toISOString(),
  };
}

export async function sair() {
  limparFator();
  await supabase.auth.signOut();
}

/* --------------------------------- Regras --------------------------------- */

export async function getRegras(): Promise<Regras> {
  const { data } = await sb
    .from("config_regras")
    .select("dias_parado")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return { dias_parado: data?.dias_parado ?? 30 };
}

export async function setRegras(r: Regras): Promise<void> {
  const { data } = await sb.from("config_regras").select("id").limit(1).maybeSingle();
  if (data?.id) {
    await sb
      .from("config_regras")
      .update({ dias_parado: r.dias_parado, updated_at: new Date().toISOString() })
      .eq("id", data.id);
  } else {
    await sb.from("config_regras").insert({ dias_parado: r.dias_parado });
  }
}
