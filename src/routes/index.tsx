import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { listar, type SinistroRecord } from "@/lib/dataStore";
import { toNumber, formatCurrency } from "@/lib/format";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard de Sinistros | BP Seguradora" },
      {
        name: "description",
        content:
          "Visão consolidada dos sinistros de automóveis da BP Seguradora: totais, valores pagos e pendentes, gráficos por status, contratante e cobertura.",
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

const COLORS = [
  "#2563eb",
  "#16a34a",
  "#f59e0b",
  "#dc2626",
  "#7c3aed",
  "#0891b2",
  "#db2777",
  "#65a30d",
  "#ea580c",
  "#4b5563",
];

type Filtro = "todos" | "casco" | "integral";

const pagoDe = (r: SinistroRecord) =>
  toNumber(r["valor_total_pago_processo"] ?? r["valor_total_pago_negado"]);

function contarPor(rows: SinistroRecord[], key: string) {
  const m = new Map<string, number>();
  for (const r of rows) {
    const v = String(r[key] ?? "").trim() || "(vazio)";
    m.set(v, (m.get(v) ?? 0) + 1);
  }
  return [...m.entries()]
    .map(([nome, valor]) => ({ nome, valor }))
    .sort((a, b) => b.valor - a.valor);
}

function evolucaoMensal(rows: SinistroRecord[]) {
  const m = new Map<string, number>();
  for (const r of rows) {
    const d = String(r["data_aviso"] ?? "");
    const mes = /^(\d{4})-(\d{2})/.exec(d);
    if (!mes) continue;
    const chave = `${mes[1]}-${mes[2]}`;
    m.set(chave, (m.get(chave) ?? 0) + 1);
  }
  return [...m.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([mes, valor]) => ({ mes, valor }));
}

function Dashboard() {
  const [casco, setCasco] = useState<SinistroRecord[]>([]);
  const [integral, setIntegral] = useState<SinistroRecord[]>([]);
  const [filtro, setFiltro] = useState<Filtro>("todos");

  useEffect(() => {
    void listar("casco").then(setCasco);
    void listar("integral").then(setIntegral);
  }, []);

  const rows = useMemo(() => {
    if (filtro === "casco") return casco;
    if (filtro === "integral") return integral;
    return [...casco, ...integral];
  }, [filtro, casco, integral]);

  const pago = rows.reduce((s, r) => s + pagoDe(r), 0);
  const pendente = rows.reduce((s, r) => s + toNumber(r["valor_pendente"]), 0);

  const porContratante = useMemo(() => contarPor(rows, "contratante"), [rows]);
  const porCobertura = useMemo(() => contarPor(rows, "cobertura").slice(0, 8), [rows]);
  const porStatus = useMemo(() => contarPor(rows, "status_processo"), [rows]);
  const evolucao = useMemo(() => evolucaoMensal(rows), [rows]);

  const cards = [
    { label: "Total de sinistros", valor: String(rows.length) },
    { label: "Casco - Perda Parcial", valor: String(casco.length) },
    { label: "Indenização Integral", valor: String(integral.length) },
    { label: "Total pago", valor: formatCurrency(pago) },
    { label: "Total pendente", valor: formatCurrency(pendente) },
  ];

  const vazio = rows.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Visão consolidada dos módulos.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Visão</span>
          <Select value={filtro} onValueChange={(v) => setFiltro(v as Filtro)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Consolidado</SelectItem>
              <SelectItem value="casco">Casco - Perda Parcial</SelectItem>
              <SelectItem value="integral">Indenização Integral</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((c) => (
          <div key={c.label} className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">{c.label}</p>
            <p className="mt-1 text-xl font-semibold">{c.valor}</p>
          </div>
        ))}
      </div>

      {vazio ? (
        <div className="rounded-lg border bg-card p-10 text-center text-sm text-muted-foreground">
          Nenhum sinistro cadastrado ainda. Importe a planilha em <strong>Importar</strong> ou
          cadastre um registro nos módulos para ver os gráficos.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold">Sinistros por Contratante</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={porContratante}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="nome" fontSize={11} />
                <YAxis allowDecimals={false} fontSize={11} />
                <Tooltip />
                <Bar dataKey="valor" name="Sinistros" radius={[4, 4, 0, 0]}>
                  {porContratante.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold">Evolução mensal (por Data do Aviso)</h2>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={evolucao}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="mes" fontSize={11} />
                <YAxis allowDecimals={false} fontSize={11} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="valor"
                  name="Sinistros"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold">Por Cobertura</h2>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={porCobertura}
                  dataKey="valor"
                  nameKey="nome"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={(e) => `${e.nome}: ${e.valor}`}
                  labelLine={false}
                  fontSize={10}
                >
                  {porCobertura.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold">Por Status do Processo</h2>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={porStatus}
                  dataKey="valor"
                  nameKey="nome"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                >
                  {porStatus.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
