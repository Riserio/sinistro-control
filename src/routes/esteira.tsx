import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/esteira")({
  head: () => ({
    meta: [
      { title: "Esteira do Sinistro | BP Seguradora" },
      { name: "description", content: "Workflow visual das etapas do sinistro." },
      { property: "og:title", content: "Esteira do Sinistro | BP Seguradora" },
      { property: "og:description", content: "Workflow visual das etapas do sinistro." },
    ],
  }),
  component: () => (
    <div className="rounded-lg border bg-card p-10 text-center">
      <h1 className="text-lg font-semibold">Esteira</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Kanban de etapas (Avisado → Registrado → Em Análise → Em Processo de Pagamento →
        Finalizado) será construído na próxima etapa.
      </p>
    </div>
  ),
});
