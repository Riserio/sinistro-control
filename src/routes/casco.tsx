import { createFileRoute } from "@tanstack/react-router";
import { SinistroTable } from "@/components/sinistros/SinistroTable";

export const Route = createFileRoute("/casco")({
  head: () => ({
    meta: [
      { title: "Casco - Perda Parcial | BP Seguradora" },
      {
        name: "description",
        content:
          "Controle de sinistros de Casco - Perda Parcial: cadastro, filtros, histórico de alterações e exportação.",
      },
      { property: "og:title", content: "Casco - Perda Parcial | BP Seguradora" },
      {
        property: "og:description",
        content: "Gestão de sinistros de casco com auditoria por campo.",
      },
    ],
  }),
  component: () => <SinistroTable modulo="casco" />,
});
