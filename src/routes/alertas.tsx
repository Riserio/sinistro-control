import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/alertas")({
  head: () => ({
    meta: [
      { title: "Alertas e Pendências | BP Seguradora" },
      { name: "description", content: "Sinistros com valores pendentes e prazos em atraso." },
      { property: "og:title", content: "Alertas e Pendências | BP Seguradora" },
      { property: "og:description", content: "Sinistros com valores pendentes e prazos." },
    ],
  }),
  component: () => (
    <div className="rounded-lg border bg-card p-10 text-center">
      <h1 className="text-lg font-semibold">Alertas</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Painel de pendências (valor pendente &gt; 0, processos parados, prazos) na próxima etapa.
      </p>
    </div>
  ),
});
