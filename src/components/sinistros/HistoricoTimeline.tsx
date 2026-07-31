import { useEffect, useState } from "react";
import type { ModuleKey } from "@/lib/schema";
import type { AuditEntry } from "@/lib/dataStore";
import { listarHistorico } from "@/lib/dataStore";
import { formatDateTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, PlusCircle, Pencil, Trash2 } from "lucide-react";

export function HistoricoTimeline({
  modulo,
  recordId,
}: {
  modulo: ModuleKey;
  recordId: string;
}) {
  const [entradas, setEntradas] = useState<AuditEntry[]>([]);

  useEffect(() => {
    void listarHistorico(modulo, recordId).then(setEntradas);
  }, [modulo, recordId]);

  if (!entradas.length) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Nenhuma alteração registrada para este sinistro.
      </p>
    );
  }

  return (
    <ol className="relative space-y-4 border-l pl-6">
      {entradas.map((e) => {
        const Icon =
          e.acao === "criacao" ? PlusCircle : e.acao === "exclusao" ? Trash2 : Pencil;
        return (
          <li key={e.id} className="relative">
            <span className="absolute -left-[31px] flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Icon className="h-3 w-3" />
            </span>
            <div className="rounded-md border bg-card p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium">{e.campo_label}</span>
                <Badge variant="secondary" className="text-[10px]">
                  {e.acao === "criacao"
                    ? "Criação"
                    : e.acao === "exclusao"
                      ? "Exclusão"
                      : "Edição"}
                </Badge>
              </div>
              {e.acao === "edicao" && (
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded bg-muted px-1.5 py-0.5 text-muted-foreground line-through">
                    {e.valor_antigo ?? "vazio"}
                  </span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 font-medium text-primary">
                    {e.valor_novo ?? "vazio"}
                  </span>
                </div>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                {e.usuario} · {formatDateTime(e.criado_em)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
