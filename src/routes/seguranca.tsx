import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  getSessao,
  listarUsuarios,
  salvarUsuario,
  listarSolicitacoesPendentes,
  decidirSolicitacao,
  type Usuario,
  type SolicitacaoAcesso,
} from "@/lib/config";
import { formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Shield,
  ShieldCheck,
  KeyRound,
  Smartphone,
  Search,
  ChevronDown,
  ChevronRight,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/seguranca")({
  head: () => ({
    meta: [
      { title: "Segurança e Acesso | BP Seguradora" },
      { name: "description", content: "Aprovação de acessos e método de verificação em duas etapas por usuário." },
    ],
  }),
  component: Seguranca,
});

type Metodo = {
  valor: string;
  label: string;
  icon: typeof KeyRound;
  emBreve?: boolean;
};

const METODOS: Metodo[] = [
  { valor: "palavra_chave", label: "Palavra-chave", icon: KeyRound },
  { valor: "autorizacao", label: "Aprovação por dispositivo", icon: Smartphone },
];

function metodoDe(fator: string): Metodo {
  return METODOS.find((m) => m.valor === fator) ?? METODOS[0];
}

function Seguranca() {
  const [admin, setAdmin] = useState<boolean | null>(null);
  const [pendentes, setPendentes] = useState<SolicitacaoAcesso[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [busca, setBusca] = useState("");
  const [aberto, setAberto] = useState(true);

  function carregar() {
    void listarSolicitacoesPendentes().then(setPendentes);
    void listarUsuarios().then(setUsuarios);
  }

  useEffect(() => {
    void getSessao().then((s) => setAdmin(s?.perfil === "admin"));
    carregar();
  }, []);

  async function decidir(id: string, aprovar: boolean) {
    await decidirSolicitacao(id, aprovar);
    toast.success(aprovar ? "Acesso aprovado." : "Acesso negado.");
    void listarSolicitacoesPendentes().then(setPendentes);
  }

  async function trocarMetodo(u: Usuario, valor: string) {
    const m = METODOS.find((x) => x.valor === valor);
    if (m?.emBreve) return;
    const atualizado = { ...u, fator: valor as Usuario["fator"] };
    setUsuarios((prev) => prev.map((x) => (x.id === u.id ? atualizado : x)));
    try {
      await salvarUsuario(atualizado);
      toast.success(`${u.nome}: 2º fator alterado para "${m?.label}".`);
    } catch {
      toast.error("Não foi possível salvar o método.");
      carregar();
    }
  }

  const filtrados = useMemo(() => {
    const b = busca.trim().toLowerCase();
    if (!b) return usuarios;
    return usuarios.filter(
      (u) => u.nome.toLowerCase().includes(b) || u.email.toLowerCase().includes(b),
    );
  }, [usuarios, busca]);

  if (admin === false) {
    return (
      <div className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground shadow-sm">
        Esta área é restrita a administradores.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-xl font-semibold">Segurança e Acesso</h1>
          <p className="text-sm text-muted-foreground">Controle as políticas de segurança.</p>
        </div>
      </div>

      {/* Solicitações de acesso aguardando aprovação */}
      {pendentes.length > 0 && (
        <div className="space-y-2 rounded-xl border border-amber-300 bg-amber-50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-900">
            <Smartphone className="h-4 w-4" />
            {pendentes.length} solicitação(ões) de acesso aguardando aprovação
          </div>
          {pendentes.map((s) => (
            <div
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{s.email}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {s.nome} · IP {s.ip || "—"} · {formatDateTime(s.criado_em)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 border-red-300 text-red-600 hover:bg-red-50"
                  onClick={() => void decidir(s.id, false)}
                >
                  <X className="h-4 w-4" />
                  Negar
                </Button>
                <Button size="sm" className="gap-1" onClick={() => void decidir(s.id, true)}>
                  <Check className="h-4 w-4" />
                  Aprovar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Método de verificação em duas etapas por usuário */}
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <button
          onClick={() => setAberto((a) => !a)}
          className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/50"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-semibold">
              Método de verificação em duas etapas por usuário
            </h2>
            <p className="text-xs text-muted-foreground">
              Cada usuário pode usar um método diferente para o segundo fator de login.
            </p>
          </div>
          {aberto ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {aberto && (
          <div className="space-y-3 border-t p-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar usuário..."
                className="pl-8"
              />
            </div>

            <div className="space-y-2">
              {filtrados.map((u) => {
                const atual = metodoDe(u.fator);
                return (
                  <div
                    key={u.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{u.nome}</p>
                      <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                    </div>
                    <Select value={u.fator} onValueChange={(v) => void trocarMetodo(u, v)}>
                      <SelectTrigger className="w-64">
                        <span className="flex items-center gap-2">
                          <atual.icon className="h-4 w-4 text-muted-foreground" />
                          <SelectValue />
                        </span>
                      </SelectTrigger>
                      <SelectContent>
                        {METODOS.map((m) => (
                          <SelectItem key={m.valor} value={m.valor} disabled={m.emBreve}>
                            <span className="flex items-center gap-2">
                              <m.icon className="h-4 w-4" />
                              {m.label}
                              {m.emBreve && (
                                <Badge variant="secondary" className="ml-1 text-[9px]">
                                  em breve
                                </Badge>
                              )}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
              {filtrados.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Nenhum usuário encontrado.
                </p>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Para o método Palavra-chave, defina a palavra de cada usuário na tela Configurações →
              Usuários.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
