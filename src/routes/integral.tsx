import { createFileRoute } from "@tanstack/react-router";
import { SinistroTable } from "@/components/sinistros/SinistroTable";

export const Route = createFileRoute("/integral")({
  head: () => ({
    meta: [
      { title: "Indenização Integral | BP Seguradora" },
      {
        name: "description",
        content:
          "Controle de sinistros de Indenização Integral com filtros, auditoria e exportação.",
      },
      { property: "og:title", content: "Indenização Integral | BP Seguradora" },
      {
        property: "og:description",
        content: "Gestão de sinistros de indenização integral com auditoria por campo.",
      },
    ],
  }),
  component: () => <SinistroTable modulo="integral" />,
});
