import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { listar, type SinistroRecord } from "@/lib/dataStore";
import type { ModuleKey } from "@/lib/schema";
import { getRegras } from "@/lib/config";
import { formatCurrency, formatDate, toNumber } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SinistroForm } from "@/components/sinistros/SinistroForm";
import { AlertTriangle, Clock, FileWarning, ChevronDown, ChevronRight, Pencil } from "lucide-react";

export const Route = createFileRoute("/alertas")({
  head: () => ({
    meta: [
      { title: "Alertas e Pendências | BP Seguradora" },
      { name: "description", content: "Sinistros com valores pendentes, processos parados e dados incompletos." },
      { property: "og:title", content: "Alertas e Pendências | BP Seguradora" },
      { property: "og:description", content: "Sinistros com valores pendentes e prazos." },
    ],
  }),
  component: Alertas,
});

const PAGINA = 50;

interface Linha {
  modulo: ModuleKey;
  rec: SinistroRecord;
}

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

function Alertas() {
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [limite, setLimite] = useState<Record<string, number>>({});
  const [aberto, setAberto] = useState<Record<string, boolean>>({});
  const [diasParado, setDiasParado] = useState(30);
  const [editando, setEditando] = useState<Linha | null>(null);

  function carregar() {
    void Promise.all([listar("casco"), listar("integral")]).then(([c, i]) => {
      setLinhas([
        ...c.map((rec) => ({ modulo: "casco" as ModuleKey, rec })),
        ...i.map((rec) => ({ modulo: "integral" as ModuleKey, rec })),
      ]);
    });
  }

  useEffect(() => {
    void getRegras().then((r) => setDiasParado(r.dias_parado));
    carregar();
  }, []);

  const pendentes = useMemo(
    () => linhas.filter((l) => toNumber(l.rec["valor_pendente"]) > 0),
    [linhas],
  );
  const parados = useMemo(
    () =>
      linhas.filter((l) => {
        if (finalizado(String(l.rec["status_processo"] ?? ""))) return false;
        const d = diasDesde(String(l.rec["data_aviso"] ?? ""));
        return d !== null && d > diasParado;
      }),
    [linhas, diasParado],
  );
  const incompletos = useMemo(
    () =>
      linhas.filter(
        (l) =>
          !String(l.rec["numero_processo"] ?? "").trim() ||
          !String(l.rec["nome_segurado"] ?? "").trim(),
      ),
    [linhas],
  );

  const grupos = [
    {
      titulo: "Valores pendentes",
      desc: "Sinistros com Valor Pendente maior que zero.",
      icon: AlertTriangle,
      cor: "text-amber-600",
      itens: pendentes,
      coluna: "Pendente",
      valor: (l: Linha) => formatCurrency(toNumber(l.rec["valor_pendente"])),
    },
    {
      titulo: `Processos parados (> ${diasParado} dias)`,
      desc: `Avisados há mais de ${diasParado} dias e ainda não finalizados.`,
      icon: Clock,
      cor: "text-red-600",
      itens: parados,
      coluna: "Parado há",
      valor: (l: Linha) => {
        const d = diasDesde(String(l.rec["data_aviso"] ?? ""));
        return d ? `${d} dias` : "—";
      },
    },
    {
      titulo: "Dados incompletos",
      desc: "Sem Nº Processo ou sem Nome do Segurado.",
      icon: FileWarning,
      cor: "text-violet-600",
      itens: incompletos,
      coluna: "Situação",
      valor: () => "revisar",
    },
  ];

  const cap = (t: string) => limite[t] ?? PAGINA;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Alertas e Pendências</h1>
        <p className="text-sm text-muted-foreground">
          Clique em cada categoria para expandir. Os itens carregam de 50 em 50.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {grupos.map((g) => (
          <button
            key={g.titulo}
            onClick={() => setAberto((p) => ({ ...p, [g.titulo]: !p[g.titulo] }))}
            className="rounded-xl border bg-card p-4 text-left shadow-sm transition-colors hover:bg-muted/50"
          >
            <div className="flex items-center gap-2">
              <g.icon className={`h-4 w-4 ${g.cor}`} />
              <p className="text-xs text-muted-foreground">{g.titulo}</p>
            </div>
            <p className="mt-1 text-2xl font-semibold">{g.itens.length}</p>
          </button>
        ))}
      </div>

      {grupos.map((g) => {
        const isOpen = !!aberto[g.titulo];
        const visiveis = isOpen ? g.itens.slice(0, cap(g.titulo)) : [];
        return (
          <div key={g.titulo} className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <button
              onClick={() => setAberto((p) => ({ ...p, [g.titulo]: !p[g.titulo] }))}
              className="flex w-full items-center gap-2 border-b px-4 py-3 text-left hover:bg-muted/50"
            >
              {isOpen ? (
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <g.icon className={`h-4 w-4 ${g.cor}`} />
              <div>
                <h2 className="text-sm font-semibold">{g.titulo}</h2>
                <p className="text-xs text-muted-foreground">{g.desc}</p>
              </div>
              <Badge variant="secondary" className="ml-auto">
                {g.itens.length}
              </Badge>
            </button>

            {isOpen &&
              (g.itens.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                  Nenhuma pendência nesta categoria.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-20">Módulo</TableHead>
                        <TableHead>Nº Processo</TableHead>
                        <TableHead>Segurado</TableHead>
                        <TableHead>Contratante</TableHead>
                        <TableHead>Aviso</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">{g.coluna}</TableHead>
                        <TableHead className="w-16 text-right">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visiveis.map((l) => (
                        <TableRow key={`${l.modulo}:${l.rec.id}`}>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]">
                              {l.modulo === "casco" ? "Casco" : "Integral"}
                            </Badge>
                          </TableCell>
                          <TableCell className="whitespace-nowrap font-medium">
                            {l.rec["numero_processo"] || "s/ processo"}
                          </TableCell>
                          <TableCell className="max-w-48 truncate">
                            {l.rec["nome_segurado"] || "—"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-muted-foreground">
                            {l.rec["contratante"] || "—"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-muted-foreground">
                            {formatDate(l.rec["data_aviso"]) || "—"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-muted-foreground">
                            {l.rec["status_processo"] || "—"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-right">
                            <Badge>{g.valor(l)}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Editar / corrigir"
                              onClick={() => setEditando(l)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {g.itens.length > visiveis.length && (
                    <div className="flex justify-center border-t px-4 py-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setLimite((p) => ({ ...p, [g.titulo]: (p[g.titulo] ?? PAGINA) + PAGINA }))
                        }
                      >
                        Carregar mais {Math.min(PAGINA, g.itens.length - visiveis.length)} (de{" "}
                        {g.itens.length})
                      </Button>
                    </div>
                  )}
                </div>
              ))}
          </div>
        );
      })}

      <Dialog open={!!editando} onOpenChange={(o) => !o && setEditando(null)}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Corrigir sinistro — {editando?.modulo === "casco" ? "Casco" : "Indenização Integral"}
            </DialogTitle>
          </DialogHeader>
          {editando && (
            <SinistroForm
              modulo={editando.modulo}
              registro={editando.rec}
              onSaved={() => {
                setEditando(null);
                carregar();
              }}
              onCancel={() => setEditando(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
