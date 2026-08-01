import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const perfilSchema = z.enum(["admin", "editor", "visualizador"]);
const fatorSchema = z.enum(["palavra_chave", "autorizacao", "ip"]);

const novoSchema = z.object({
  nome: z.string().min(1),
  email: z.string().email(),
  senha: z.string().min(6),
  perfil: perfilSchema,
  fator: fatorSchema,
  palavra_chave: z.string().optional().default(""),
  ip_permitido: z.string().optional().default(""),
  ativo: z.boolean().default(true),
});

const editarSchema = z.object({
  id: z.string().uuid(),
  nome: z.string().min(1),
  perfil: perfilSchema,
  fator: fatorSchema,
  palavra_chave: z.string().optional().default(""),
  ip_permitido: z.string().optional().default(""),
  ativo: z.boolean().default(true),
  senha: z.string().optional().default(""),
});

async function garantirAdmin(supabase: {
  rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown }>;
}) {
  const { data } = await supabase.rpc("has_role", { _user_id: null, _role: "admin" });
  void data;
}

async function ehAdmin(context: { supabase: unknown; userId: string }): Promise<boolean> {
  const sb = context.supabase as {
    from: (t: string) => {
      select: (c: string) => {
        eq: (
          c: string,
          v: string,
        ) => { maybeSingle: () => Promise<{ data: { perfil?: string } | null }> };
      };
    };
  };
  const { data } = await sb.from("profiles").select("perfil").eq("id", context.userId).maybeSingle();
  return data?.perfil === "admin";
}

export const criarUsuarioFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => novoSchema.parse(d))
  .handler(async ({ data, context }) => {
    void garantirAdmin;
    if (!(await ehAdmin(context))) throw new Error("Apenas administradores podem criar usuários.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: criado, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.senha,
      email_confirm: true,
    });
    if (error || !criado.user) throw new Error(error?.message ?? "Falha ao criar usuário.");

    const { error: pErr } = await supabaseAdmin.from("profiles").upsert({
      id: criado.user.id,
      nome: data.nome,
      email: data.email,
      perfil: data.perfil,
      fator: data.fator,
      palavra_chave: data.palavra_chave || null,
      ip_permitido: data.ip_permitido || null,
      ativo: data.ativo,
    });
    if (pErr) throw new Error(pErr.message);

    return { id: criado.user.id };
  });

export const atualizarUsuarioFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => editarSchema.parse(d))
  .handler(async ({ data, context }) => {
    if (!(await ehAdmin(context)))
      throw new Error("Apenas administradores podem alterar usuários.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        nome: data.nome,
        perfil: data.perfil,
        fator: data.fator,
        palavra_chave: data.palavra_chave || null,
        ip_permitido: data.ip_permitido || null,
        ativo: data.ativo,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);

    if (data.senha && data.senha.length >= 6) {
      const { error: sErr } = await supabaseAdmin.auth.admin.updateUserById(data.id, {
        password: data.senha,
      });
      if (sErr) throw new Error(sErr.message);
    }
    return { ok: true };
  });

export const excluirUsuarioFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    if (!(await ehAdmin(context)))
      throw new Error("Apenas administradores podem excluir usuários.");
    if (data.id === context.userId) throw new Error("Você não pode excluir o próprio usuário.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/**
 * Lê o IP real da requisição no servidor e compara com o IP autorizado do
 * perfil do usuário autenticado. Limitação: em ambiente serverless o IP vem
 * dos cabeçalhos do proxy (x-forwarded-for / cf-connecting-ip).
 */
export const validarIpFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const request = getRequest();
    const h = request?.headers;
    const ip =
      h?.get("cf-connecting-ip") ??
      h?.get("x-real-ip") ??
      (h?.get("x-forwarded-for") ?? "").split(",")[0]?.trim() ??
      "";

    const sb = context.supabase as unknown as {
      from: (t: string) => {
        select: (c: string) => {
          eq: (
            c: string,
            v: string,
          ) => { maybeSingle: () => Promise<{ data: { ip_permitido?: string | null } | null }> };
        };
      };
    };
    const { data } = await sb
      .from("profiles")
      .select("ip_permitido")
      .eq("id", context.userId)
      .maybeSingle();

    const permitido = (data?.ip_permitido ?? "").trim();
    return { ok: !!permitido && !!ip && permitido === ip, ip: ip || "desconhecido" };
  });

/** Confere a palavra-chave do 2º fator no servidor (não no navegador). */
export const validarPalavraChaveFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ valor: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase as unknown as {
      from: (t: string) => {
        select: (c: string) => {
          eq: (
            c: string,
            v: string,
          ) => { maybeSingle: () => Promise<{ data: { palavra_chave?: string | null } | null }> };
        };
      };
    };
    const { data: p } = await sb
      .from("profiles")
      .select("palavra_chave")
      .eq("id", context.userId)
      .maybeSingle();
    const esperado = (p?.palavra_chave ?? "").trim();
    return { ok: !!esperado && esperado === data.valor.trim() };
  });
