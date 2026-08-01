import { useEffect, useState } from "react";
import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  CarFront,
  ShieldCheck,
  Workflow,
  BellRing,
  Upload,
  Settings,
  Info,
  Download,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { toast } from "sonner";
import { toNumber } from "@/lib/format";
import { listar, exportarBackup } from "@/lib/dataStore";
import { getSessao, sair, getRegras, type Sessao } from "@/lib/config";
import { BP_LOGO } from "@/lib/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/integral", label: "Indenização Integral", icon: ShieldCheck },
  { to: "/casco", label: "Casco - Perda Parcial", icon: CarFront },
  { to: "/esteira", label: "Esteira", icon: Workflow },
  { to: "/alertas", label: "Alertas", icon: BellRing },
  { to: "/importar", label: "Importar", icon: Upload },
] as const;

const finalizado = (s: string) => {
  const u = (s ?? "").toUpperCase();
  return (
    u.includes("FINALIZADO") ||
    u.includes("PAGO") ||
    u.includes("NEGADO") ||
    u.includes("CANCELADO")
  );
};

function diasDesde(data: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(data ?? "");
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Math.floor((Date.now() - d.getTime()) / 86_400_000);
}

function LogoBP({ colapsada }: { colapsada: boolean }) {
  const [erro, setErro] = useState(false);
  if (erro) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
          BP
        </div>
        {!colapsada && <p className="text-sm font-semibold">BP Seguradora</p>}
      </div>
    );
  }
  return (
    <img
      src={BP_LOGO}
      alt="BP Seguradora"
      onError={() => setErro(true)}
      className={colapsada ? "h-8 w-8 object-contain" : "h-9 w-auto object-contain"}
    />
  );
}

export function AppLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [pronto, setPronto] = useState(false);
  const [alertas, setAlertas] = useState(0);
  const [colapsada, setColapsada] = useState(false);

  useEffect(() => {
    void getSessao().then((s) => {
      setSessao(s);
      setPronto(true);
      if (!s && pathname !== "/login") void navigate({ to: "/login" });
    });
  }, [pathname, navigate]);


  useEffect(() => {
    const v = window.localStorage.getItem("bp_sidebar_colapsada");
    if (v) setColapsada(v === "1");
  }, []);

  useEffect(() => {
    if (!sessao) return;
    void Promise.all([getRegras(), listar("casco"), listar("integral")]).then(([reg, c, i]) => {
      const limite = reg.dias_parado;

      const todos = [...c, ...i];
      const atencao = todos.filter((r) => {
        const pendente = toNumber(r["valor_pendente"]) > 0;
        const dias = diasDesde(String(r["data_aviso"] ?? ""));
        const parado =
          !finalizado(String(r["status_processo"] ?? "")) && dias !== null && dias > limite;
        const incompleto =
          !String(r["numero_processo"] ?? "").trim() || !String(r["nome_segurado"] ?? "").trim();
        return pendente || parado || incompleto;
      });
      setAlertas(atencao.length);
    });
  }, [sessao]);

  function toggle() {
    setColapsada((c) => {
      const n = !c;
      window.localStorage.setItem("bp_sidebar_colapsada", n ? "1" : "0");
      return n;
    });
  }

  function baixarBackup() {
    const data = exportarBackup();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backup-sinistros-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup gerado.", {
      description: `${data.casco.length + data.integral.length} sinistro(s) e histórico salvos no arquivo .json.`,
    });
  }

  function logout() {
    sair();
    setSessao(null);
    toast.success("Sessão encerrada.");
    void navigate({ to: "/login" });
  }

  // Tela de login: sem o layout (sidebar/topo).
  if (pathname === "/login") return <Outlet />;
  if (!pronto || !sessao) return null;

  return (
    <div className="min-h-screen bg-muted/40">
      <aside
        className={`fixed bottom-3 left-3 top-3 z-30 hidden flex-col rounded-2xl border bg-card shadow-xl transition-[width] duration-200 md:flex ${
          colapsada ? "w-16" : "w-60"
        }`}
      >
        {/* Topo: logo + botão recolher/expandir */}
        <div
          className={`border-b ${
            colapsada
              ? "flex flex-col items-center gap-2 px-2 py-3"
              : "flex h-16 items-center justify-between px-3"
          }`}
        >
          <LogoBP colapsada={colapsada} />
          <button
            onClick={toggle}
            title={colapsada ? "Expandir menu" : "Recolher menu"}
            className="rounded-md border p-1.5 text-muted-foreground hover:bg-muted"
          >
            {colapsada ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              title={colapsada ? label : undefined}
              activeOptions={{ exact: to === "/" }}
              activeProps={{ className: "bg-primary/10 text-primary font-medium" }}
              inactiveProps={{ className: "text-muted-foreground hover:bg-muted" }}
              className={`relative flex items-center rounded-md py-2 text-sm transition-colors ${
                colapsada ? "justify-center px-2" : "gap-3 px-3"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!colapsada && <span className="flex-1 truncate">{label}</span>}
              {to === "/alertas" && alertas > 0 && (
                <Badge
                  className={`bg-orange-500 text-white ${
                    colapsada
                      ? "absolute right-1 top-1 h-4 min-w-4 px-1 text-[9px]"
                      : "h-5 px-1.5 text-[10px]"
                  }`}
                >
                  {alertas}
                </Badge>
              )}
            </Link>
          ))}
        </nav>

        {/* Rodapé: Configurações + Sair */}
        <div className="space-y-1 border-t p-2">
          <Link
            to="/configuracoes"
            title={colapsada ? "Configurações" : undefined}
            activeProps={{ className: "bg-primary/10 text-primary font-medium" }}
            inactiveProps={{ className: "text-muted-foreground hover:bg-muted" }}
            className={`flex items-center rounded-md py-2 text-sm transition-colors ${
              colapsada ? "justify-center px-2" : "gap-3 px-3"
            }`}
          >
            <Settings className="h-4 w-4 shrink-0" />
            {!colapsada && <span>Configurações</span>}
          </Link>
          <button
            onClick={logout}
            title={colapsada ? "Sair" : undefined}
            className={`flex w-full items-center rounded-md py-2 text-sm text-muted-foreground hover:bg-muted ${
              colapsada ? "justify-center px-2" : "gap-3 px-3"
            }`}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!colapsada && <span>Sair</span>}
          </button>
        </div>
      </aside>

      <div
        className={`flex min-h-screen flex-col transition-[padding] duration-200 ${
          colapsada ? "md:pl-24" : "md:pl-64"
        }`}
      >
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b bg-card px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-2 overflow-x-auto md:hidden">
            {[...NAV, { to: "/configuracoes", label: "Configurações" }].map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact: to === "/" }}
                activeProps={{ className: "bg-primary/10 text-primary" }}
                className="whitespace-nowrap rounded-md px-2 py-1 text-xs text-muted-foreground"
              >
                {label}
              </Link>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-3">
            <Button variant="outline" size="sm" className="gap-2" onClick={baixarBackup}>
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Backup</span>
            </Button>
            <div className="hidden text-right sm:block">
              <p className="text-xs font-medium leading-tight">{sessao.nome}</p>
              <p className="text-[11px] capitalize leading-tight text-muted-foreground">
                {sessao.perfil}
              </p>
            </div>
            <Button variant="ghost" size="icon" title="Sair" onClick={logout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <div className="flex items-center gap-2 border-b bg-amber-50 px-4 py-2 text-xs text-amber-900 md:px-6">
          <Info className="h-3.5 w-3.5 shrink-0" />
          <span>
            Modo demonstração — dados salvos apenas neste navegador. Login, 2º fator e histórico
            compartilhado serão realmente aplicados com o backend.
          </span>
        </div>

        <main className="min-w-0 flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
