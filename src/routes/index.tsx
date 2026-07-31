import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { listar, type SinistroRecord } from "@/lib/dataStore";
import { toNumber, formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard de Sinistros | BP Seguradora" },
      {
        name: "description",
        content:
          "Visão consolidada dos sinistros de automóveis da BP Seguradora: totais, valores pagos e pendentes.",
      },
      { property: "og:title", content: "Dashboard de Sinistros | BP Seguradora" },
      {
        property: "og:description",
        content: "Indicadores consolidados de sinistros de automóveis.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [casco, setCasco] = useState<SinistroRecord[]>([]);
  const [integral, setIntegral] = useState<SinistroRecord[]>([]);

  useEffect(() => {
    void listar("casco").then(setCasco);
    void listar("integral").then(setIntegral);
  }, []);

  const todos = [...casco, ...integral];
  const pago = todos.reduce(
    (s, r) => s + toNumber(r["valor_total_pago_processo"] ?? r["valor_total_pago_negado"]),
    0,
  );
  const pendente = todos.reduce((s, r) => s + toNumber(r["valor_pendente"]), 0);

  const cards = [
    { label: "Total de sinistros", valor: String(todos.length) },
    { label: "Casco - Perda Parcial", valor: String(casco.length) },
    { label: "Indenização Integral", valor: String(integral.length) },
    { label: "Total pago", valor: formatCurrency(pago) },
    { label: "Total pendente", valor: formatCurrency(pendente) },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visão consolidada dos módulos.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((c) => (
          <div key={c.label} className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">{c.label}</p>
            <p className="mt-1 text-xl font-semibold">{c.valor}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-sm font-semibold">Próximos passos</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Gráficos por status, contratante, cobertura e evolução mensal virão na próxima etapa.
          Comece cadastrando sinistros no módulo Casco.
        </p>
        <Button asChild className="mt-4" size="sm">
          <Link to="/casco">Ir para Casco - Perda Parcial</Link>
        </Button>
      </div>
    </div>
  );
}
