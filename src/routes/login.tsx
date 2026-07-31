import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { autenticar, entrar, getSessao, FATORES, type Usuario } from "@/lib/config";
import { BP_LOGO } from "@/lib/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Info, ShieldCheck, KeyRound, MapPin, Clock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Acesso | BP Seguradora" },
      { name: "description", content: "Login do sistema de controle de sinistros da BP Seguradora." },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [etapa, setEtapa] = useState<"credenciais" | "fator">("credenciais");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [chave, setChave] = useState("");
  const [ip, setIp] = useState("");

  useEffect(() => {
    if (getSessao()) void navigate({ to: "/" });
  }, [navigate]);

  function verificarCredenciais(e: React.FormEvent) {
    e.preventDefault();
    const u = autenticar(email, senha);
    if (!u) {
      toast.error("E-mail ou senha inválidos.");
      return;
    }
    setUsuario(u);
    setEtapa("fator");
  }

  function concluir(u: Usuario) {
    entrar(u);
    toast.success(`Bem-vindo, ${u.nome}.`);
    void navigate({ to: "/" });
  }

  function verificarFator(e: React.FormEvent) {
    e.preventDefault();
    if (!usuario) return;
    if (usuario.fator === "palavra_chave") {
      if ((chave || "").trim() !== (usuario.palavra_chave || "").trim()) {
        toast.error("Palavra-chave incorreta.");
        return;
      }
      concluir(usuario);
    } else if (usuario.fator === "ip") {
      if ((ip || "").trim() !== (usuario.ip_permitido || "").trim()) {
        toast.error("IP não corresponde ao IP autorizado para este usuário.");
        return;
      }
      concluir(usuario);
    }
  }

  const fatorInfo = usuario ? FATORES.find((f) => f.valor === usuario.fator) : undefined;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-sm space-y-4">
        <div className="flex flex-col items-center gap-2">
          <img src={BP_LOGO} alt="BP Seguradora" className="h-12 w-auto object-contain" />
          <p className="text-sm text-muted-foreground">Controle de Sinistros</p>
        </div>

        <div className="flex items-start gap-2 rounded-lg border bg-amber-50 p-3 text-xs text-amber-900">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            Modo demonstração — este login é apenas visual (sem segurança real). Acesso padrão:{" "}
            <strong>admin@bp.com</strong> / <strong>admin123</strong>, palavra-chave{" "}
            <strong>bp2024</strong>. Não use senhas reais.
          </span>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          {etapa === "credenciais" ? (
            <form onSubmit={verificarCredenciais} className="space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <h1 className="text-base font-semibold">Entrar</h1>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs text-muted-foreground">
                  E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@bp.com"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="senha" className="text-xs text-muted-foreground">
                  Senha
                </Label>
                <Input
                  id="senha"
                  type="password"
                  autoComplete="current-password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Continuar
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {usuario?.fator === "palavra_chave" && <KeyRound className="h-4 w-4 text-primary" />}
                {usuario?.fator === "ip" && <MapPin className="h-4 w-4 text-primary" />}
                {usuario?.fator === "autorizacao" && <Clock className="h-4 w-4 text-primary" />}
                <h1 className="text-base font-semibold">Verificação em duas etapas</h1>
              </div>
              <p className="text-xs text-muted-foreground">{fatorInfo?.ajuda}</p>

              {usuario?.fator === "palavra_chave" && (
                <form onSubmit={verificarFator} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="chave" className="text-xs text-muted-foreground">
                      Palavra-chave
                    </Label>
                    <Input
                      id="chave"
                      type="password"
                      value={chave}
                      onChange={(e) => setChave(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Acessar
                  </Button>
                </form>
              )}

              {usuario?.fator === "ip" && (
                <form onSubmit={verificarFator} className="space-y-3">
                  <p className="rounded-md bg-muted p-2 text-xs">
                    IP autorizado para este usuário: <strong>{usuario.ip_permitido || "—"}</strong>
                  </p>
                  <div className="space-y-1.5">
                    <Label htmlFor="ip" className="text-xs text-muted-foreground">
                      IP de origem (simulado na demonstração)
                    </Label>
                    <Input
                      id="ip"
                      value={ip}
                      onChange={(e) => setIp(e.target.value)}
                      placeholder={usuario.ip_permitido || "0.0.0.0"}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Verificar e acessar
                  </Button>
                </form>
              )}

              {usuario?.fator === "autorizacao" && (
                <div className="space-y-3">
                  <p className="rounded-md bg-muted p-2 text-xs">
                    Acesso pendente de autorização de um administrador. No sistema real, o admin
                    aprova este login; aqui você pode simular a aprovação.
                  </p>
                  <Button className="w-full" onClick={() => usuario && concluir(usuario)}>
                    Simular autorização e acessar
                  </Button>
                </div>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => {
                  setEtapa("credenciais");
                  setUsuario(null);
                  setChave("");
                  setIp("");
                }}
              >
                Voltar
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
