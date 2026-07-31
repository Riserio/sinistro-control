import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/importar")({
  head: () => ({
    meta: [
      { title: "Importar Planilha | BP Seguradora" },
      { name: "description", content: "Importe CSV/Excel com mapeamento de colunas e upsert." },
      { property: "og:title", content: "Importar Planilha | BP Seguradora" },
      { property: "og:description", content: "Importação de planilha com upsert por Nº Processo." },
    ],
  }),
  component: () => (
    <div className="rounded-lg border bg-card p-10 text-center">
      <h1 className="text-lg font-semibold">Importar</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Importação de CSV/Excel com mapeamento de colunas e upsert por Nº Processo na próxima
        etapa.
      </p>
    </div>
  ),
});
