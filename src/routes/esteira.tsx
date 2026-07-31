import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { listar, atualizar, type SinistroRecord } from "@/lib/dataStore";
import type { ModuleKey } from "@/lib/schema";
import { useUsuarioAtual } from "@/components/UserProvider";
import { formatCurrency, toNumber } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/esteira")({
  head: () => ({
    meta: [
      { title: "Esteira do Sinistro | BP Seguradora" },
      { name: "description", content: "Workflow visual das etapas do sinistro em formato kanban." },
      { property: "og:title", content: "Esteira do Sinistro | BP Seguradora" },
      { property: "og:description", content: "Workflow visual das etapas do sinistro." },
    ],
  }),
  component: Esteira,
});

const ETAPAS = [
  "Avisado",
  "Registrado",
  "Em Análise",
  "Em Processo de Pagamento",
  "Finalizado",
] as const;
type Etapa = (typeof ETAPAS)[number];

/** Status canônico gravado quando o card é movido para a etapa. */
const STATUS_DA_ETAPA: Record<Etapa, string> = {
  Avisado: "AVISADO",
  Registrado: "REGISTRADO",
  "Em Análise": "EM ANÁLISE",
  "Em Processo de Pagamento": "EM PROCESSO DE PAGAMENTO",
  Finalizado: "FINALIZADO - PAGO",
};

function etapaDoStatus(status: string, temRegistro: boolean): Etapa {
  const s = (status ?? "").toUpperCase();
  if (
    s.includes("FINALIZADO") ||
    s.includes("PAGO") ||
    s.includes("NEGADO") ||
    s.includes("CANCELADO")
  )
    return "Finalizado";
  if (s.includes("PROCESSO DE PAGAMENTO") || s.includes("EM PROCESSO")) return "Em Processo de Pagamento";
  if (s.includes("ANÁLISE") || s.includes("ANALISE")) return "Em Análise";
  if (s.includes("REGISTRADO") || temRegistro) return "Registrado";
  return "Avisado";
}

interface Card {
  modulo: ModuleKey;
  rec: SinistroRecord;
  etapa: Etapa;
}

const CORES_ETAPA: Record<Etapa, string> = {
  Avisado: "border-t-slate-400",
  Registrado: "border-t-blue-400",
  "Em Análise": "border-t-amber-400",
  "Em Processo de Pagamento": "border-t-violet-400",
  Finalizado: "border-t-green-500",
};

function Esteira() {
  const { usuario } = useUsuarioAtual();
  const [casco, setCasco] = useState<SinistroRecord[]>([]);
  const [integral, setIntegral] = useState<SinistroRecord[]>([]);
  const [filtro, setFiltro] = useState<"todos" | ModuleKey>("todos");
  const [arrastando, setArrastando] = useState<string | null>(null);

  const recarregar = () => {
    void listar("casco").then(setCasco);
    void listar("integral").then(setIntegral);
  };
  useEffect(recarregar, []);

  const cards = useMemo<Card[]>(() => {
    const base: Card[] = [];
    const add = (modulo: ModuleKey, rows: SinistroRecord[]) => {
      for (const rec of rows) {
        const temRegistro = Boolean(rec["data_registro"] ?? rec["data_registro_reabertura"]);
        base.push({
          modulo,
          rec,
          etapa: etapaDoStatus(String(rec["status_processo"] ?? ""), temRegistro),
        });
      }
    };
    if (filtro === "todos" || filtro === "casco") add("casco", casco);
    if (filtro === "todos" || filtro === "integral") add("integral", integral);
    return base;
  }, [filtro, casco, integral]);

  async function mover(modulo: ModuleKey, rec: SinistroRecord, destino: Etapa) {
    const temRegistro = Boolean(rec["data_registro"] ?? rec["data_registro_reabertura"]);
    const atual = etapaDoStatus(String(rec["status_processo"] ?? ""), temRegistro);
    if (atual === destino) return;
    await atualizar(
      modulo,
      rec.id,
      { ...rec, status_processo: STATUS_DA_ETAPA[destino] },
      usuario,
    );
    toast.success(`Movido para "${destino}"`, {
      description: `${rec["numero_processo"] || "Sinistro"} • registrado no histórico por ${usuario}.`,
    });
    recarregar();
  }

  const chaveCard = (c: Card) => `${c.modulo}:${c.rec.id}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Esteira do Sinistro</h1>
          <p className="text-sm text-muted-foreground">
            Arraste um card entre as etapas para atualizar o status (gravado no histórico).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Módulo</span>
          <Select value={filtro} onValueChange={(v) => setFiltro(v as "todos" | ModuleKey)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="casco">Casco - Perda Parcial</SelectItem>
              <SelectItem value="integral">Indenização Integral</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {ETAPAS.map((etapa) => {
          const doGrupo = cards.filter((c) => c.etapa === etapa);
          return (
            <div
              key={etapa}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const data = e.dataTransfer.getData("text/plain");
                const [modulo, id] = data.split(":") as [ModuleKey, string];
                const card = cards.find((c) => c.modulo === modulo && c.rec.id === id);
                if (card) void mover(modulo, card.rec, etapa);
                setArrastando(null);
              }}
              className={`flex min-h-64 flex-col rounded-lg border border-t-4 bg-muted/30 ${CORES_ETAPA[etapa]}`}
            >
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-xs font-semibold">{etapa}</span>
                <Badge variant="secondary">{doGrupo.length}</Badge>
              </div>
              <div className="flex flex-1 flex-col gap-2 p-2">
                {doGrupo.map((c) => (
                  <div
                    key={chaveCard(c)}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", chaveCard(c));
                      setArrastando(chaveCard(c));
                    }}
                    onDragEnd={() => setArrastando(null)}
                    className={`cursor-grab rounded-md border bg-card p-2 text-xs shadow-sm active:cursor-grabbing ${
                      arrastando === chaveCard(c) ? "opacity-50" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {c.rec["numero_processo"] || "s/ processo"}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {c.modulo === "casco" ? "Casco" : "Integral"}
                      </Badge>
                    </div>
                    <p className="mt-1 truncate text-muted-foreground">
                      {c.rec["nome_segurado"] || "—"}
                    </p>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>{c.rec["contratante"] || "—"}</span>
                      <span>
                        {formatCurrency(
                          toNumber(
                            c.rec["valor_total_pago_processo"] ??
                              c.rec["valor_total_pago_negado"] ??
                              c.rec["valor_avisado_sinistro"],
                          ),
                        )}
                      </span>
                    </div>
                  </div>
                ))}
                {doGrupo.length === 0 && (
                  <div className="rounded-md border border-dashed p-4 text-center text-[11px] text-muted-foreground">
                    Solte aqui
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
