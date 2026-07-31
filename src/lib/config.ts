/**
 * Configuração de usuários, regras de alerta e sessão (modo demonstração).
 *
 * ATENÇÃO: em modo demonstração isto vive no localStorage do navegador e NÃO
 * é seguro (senhas em texto, 2º fator e IP não são realmente impostos). A
 * versão real usa o backend (Supabase Auth + regras no servidor). A assinatura
 * das funções foi pensada para trocar a implementação sem mexer nas telas.
 */

export type Fator = "palavra_chave" | "autorizacao" | "ip";
export type Perfil = "admin" | "editor" | "visualizador";

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  senha: string;
  fator: Fator;
  palavra_chave?: string;
  ip_permitido?: string;
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
    ajuda: "O acesso só é liberado a partir do endereço IP cadastrado.",
  },
];

const U_KEY = "bp_usuarios";
const R_KEY = "bp_regras";
const S_KEY = "bp_sessao";

const isBrowser = () => typeof window !== "undefined";
const uid = () =>
  isBrowser() && window.crypto?.randomUUID
    ? window.crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

function read<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const v = window.localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write<T>(key: string, value: T) {
  if (isBrowser()) window.localStorage.setItem(key, JSON.stringify(value));
}

const ADMIN_PADRAO: Usuario = {
  id: "admin-demo",
  nome: "Administrador",
  email: "admin@bp.com",
  senha: "admin123",
  fator: "palavra_chave",
  palavra_chave: "bp2024",
  perfil: "admin",
  ativo: true,
};

/* -------------------------------- Usuários -------------------------------- */

export function listarUsuarios(): Usuario[] {
  const us = read<Usuario[]>(U_KEY, []);
  if (us.length === 0) {
    write(U_KEY, [ADMIN_PADRAO]);
    return [ADMIN_PADRAO];
  }
  return us;
}

export function salvarUsuario(u: Usuario): Usuario {
  const us = listarUsuarios();
  const registro: Usuario = { ...u, id: u.id || uid() };
  const idx = us.findIndex((x) => x.id === registro.id);
  if (idx >= 0) us[idx] = registro;
  else us.push(registro);
  write(U_KEY, us);
  return registro;
}

export function excluirUsuario(id: string) {
  write(
    U_KEY,
    listarUsuarios().filter((u) => u.id !== id),
  );
}

export function autenticar(email: string, senha: string): Usuario | null {
  const u = listarUsuarios().find(
    (x) => x.email.trim().toLowerCase() === email.trim().toLowerCase() && x.ativo,
  );
  if (!u || u.senha !== senha) return null;
  return u;
}

/* --------------------------------- Regras --------------------------------- */

export function getRegras(): Regras {
  return read<Regras>(R_KEY, { dias_parado: 30 });
}
export function setRegras(r: Regras) {
  write(R_KEY, r);
}

/* --------------------------------- Sessão --------------------------------- */

export function getSessao(): Sessao | null {
  return read<Sessao | null>(S_KEY, null);
}
export function entrar(u: Usuario) {
  const s: Sessao = {
    usuario_id: u.id,
    nome: u.nome,
    email: u.email,
    perfil: u.perfil,
    em: new Date().toISOString(),
  };
  write(S_KEY, s);
  if (isBrowser()) window.localStorage.setItem("bp_usuario_atual", u.nome);
}
export function sair() {
  if (isBrowser()) window.localStorage.removeItem(S_KEY);
}
