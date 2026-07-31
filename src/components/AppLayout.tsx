import { Link, Outlet } from "@tanstack/react-router";
import {
  LayoutDashboard,
  CarFront,
  ShieldCheck,
  Workflow,
  BellRing,
  Upload,
  Info,
} from "lucide-react";
import { useUsuarioAtual } from "./UserProvider";
import { USUARIOS } from "@/lib/format";
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

export function AppLayout() {
  const { usuario, setUsuario } = useUsuarioAtual();

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
              {label}
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
            <span className="hidden text-xs text-muted-foreground sm:inline">Usuário atual</span>
            <Select value={usuario} onValueChange={setUsuario}>
              <SelectTrigger className="w-56">
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
