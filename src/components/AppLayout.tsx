import { useEffect, useState } from "react";
import { Link, Outlet } from "@tanstack/react-router";
import {
  LayoutDashboard,
  CarFront,
  ShieldCheck,
  Workflow,
  BellRing,
  Upload,
  Info,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { useUsuarioAtual } from "./UserProvider";
import { USUARIOS, toNumber } from "@/lib/format";
import { listar, exportarBackup } from "@/lib/dataStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/casco", label: "Casco - Perda Parcial", icon: CarFront },
  { to: "/integral", label: "Indenização Integral", icon: ShieldCheck },
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

export function AppLayout() {
  const { usuario, setUsuario } = useUsuarioAtual();
  const [alertas, setAlertas] = useState(0);

  useEffect(() => {
    void Promise.all([listar("casco"), listar("integral")]).then(([c, i]) => {
      const todos = [...c, ...i];
      const atencao = todos.filter((r) => {
        const pendente = toNumber(r["valor_pendente"]) > 0;
        const dias = diasDesde(String(r["data_aviso"] ?? ""));
        const parado = !finalizado(String(r["status_processo"] ?? "")) && dias !== null && dias > 30;
        const incompleto =
          !String(r["numero_processo"] ?? "").trim() ||
          !String(r["nome_segurado"] ?? "").trim();
        return pendente || parado || incompleto;
      });
      setAlertas(atencao.length);
    });
  }, []);

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

  return (
    <div className="flex min-h-screen bg-muted/40">
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-card md:flex">
        <div className="flex h-16 items-center gap-2 border-b px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
            BP
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold">BP Seguradora</p>
            <p className="text-xs text-muted-foreground">Controle de Sinistros</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              activeProps={{ className: "bg-primary/10 text-primary font-medium" }}
              inactiveProps={{ className: "text-muted-foreground hover:bg-muted" }}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors"
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1">{label}</span>
              {to === "/alertas" && alertas > 0 && (
                <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
                  {alertas}
                </Badge>
              )}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b bg-card px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-2 overflow-x-auto md:hidden">
            {NAV.map(({ to, label }) => (
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
            <span className="hidden text-xs text-muted-foreground sm:inline">Usuário atual</span>
            <Select value={usuario} onValueChange={setUsuario}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {USUARIOS.map((u) => (
                  <SelectItem key={u} value={u}>
                    {u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </header>

        <div className="flex items-center gap-2 border-b bg-amber-50 px-4 py-2 text-xs text-amber-900 md:px-6">
          <Info className="h-3.5 w-3.5 shrink-0" />
          <span>
            Modo demonstração — dados salvos apenas neste navegador. Login e histórico
            compartilhado serão ativados com o backend.
          </span>
        </div>

        <main className="min-w-0 flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
