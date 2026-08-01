import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { listar, type SinistroRecord } from "@/lib/dataStore";
import type { ModuleKey } from "@/lib/schema";
import { getRegras } from "@/lib/config";
import { formatCurrency, formatDate, toNumber } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, FileWarning } from "lucide-react";

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
  const [diasParado, setDiasParado] = useState(30);

  useEffect(() => {
    void getRegras().then((r) => setDiasParado(r.dias_parado));
  }, []);


  useEffect(() => {
    void Promise.all([listar("casco"), listar("integral")]).then(([c, i]) => {
      setLinhas([
        ...c.map((rec) => ({ modulo: "casco" as ModuleKey, rec })),
        ...i.map((rec) => ({ modulo: "integral" as ModuleKey, rec })),
      ]);
    });
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
      badge: (l: Linha) => formatCurrency(toNumber(l.rec["valor_pendente"])),
    },
    {
      titulo: `Processos parados (> ${diasParado} dias)`,
      desc: `Avisados há mais de ${diasParado} dias e ainda não finalizados.`,
      icon: Clock,
      cor: "text-red-600",
      itens: parados,
      badge: (l: Linha) => {
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
      badge: () => "revisar",
    },
  ];

  const cap = (t: string) => limite[t] ?? PAGINA;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Alertas e Pendências</h1>
        <p className="text-sm text-muted-foreground">
          Pontos que precisam de atenção nos dois módulos.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {grupos.map((g) => (
          <div key={g.titulo} className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <g.icon className={`h-4 w-4 ${g.cor}`} />
              <p className="text-xs text-muted-foreground">{g.titulo}</p>
            </div>
            <p className="mt-1 text-2xl font-semibold">{g.itens.length}</p>
          </div>
        ))}
      </div>

      {grupos.map((g) => {
        const visiveis = g.itens.slice(0, cap(g.titulo));
        return (
          <div key={g.titulo} className="rounded-xl border bg-card shadow-sm">
            <div className="flex items-center gap-2 border-b px-4 py-3">
              <g.icon className={`h-4 w-4 ${g.cor}`} />
              <div>
                <h2 className="text-sm font-semibold">{g.titulo}</h2>
                <p className="text-xs text-muted-foreground">{g.desc}</p>
              </div>
              <Badge variant="secondary" className="ml-auto">
                {g.itens.length}
              </Badge>
            </div>
            {g.itens.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                Nenhuma pendência nesta categoria.
              </p>
            ) : (
              <div className="divide-y">
                {visiveis.map((l) => (
                  <div
                    key={`${l.modulo}:${l.rec.id}`}
                    className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 text-sm"
                  >
                    <Badge variant="outline" className="text-[10px]">
                      {l.modulo === "casco" ? "Casco" : "Integral"}
                    </Badge>
                    <span className="font-medium">{l.rec["numero_processo"] || "s/ processo"}</span>
                    <span className="text-muted-foreground">{l.rec["nome_segurado"] || "—"}</span>
                    <span className="text-muted-foreground">{l.rec["contratante"] || ""}</span>
                    <span className="text-muted-foreground">
                      Aviso: {formatDate(l.rec["data_aviso"]) || "—"}
                    </span>
                    <span className="text-muted-foreground">{l.rec["status_processo"] || "—"}</span>
                    <Badge className="ml-auto">{g.badge(l)}</Badge>
                  </div>
                ))}

                {g.itens.length > visiveis.length && (
                  <div className="flex justify-center px-4 py-2">
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
            )}
          </div>
        );
      })}
    </div>
  );
}
