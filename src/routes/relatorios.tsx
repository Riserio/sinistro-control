import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { listar, listarHistorico, type SinistroRecord, type AuditEntry } from "@/lib/dataStore";
import type { ModuleKey } from "@/lib/schema";
import { formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileSpreadsheet, Search } from "lucide-react";

export const Route = createFileRoute("/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatório de Alterações | BP Seguradora" },
      { name: "description", content: "Relatório diário das alterações feitas nos sinistros (auditoria)." },
      { property: "og:title", content: "Relatório de Alterações | BP Seguradora" },
      { property: "og:description", content: "Auditoria: o que foi alterado, por quem e quando." },
    ],
  }),
  component: Relatorios,
});

type FiltroModulo = "todos" | ModuleKey;

interface LinhaLog {
  entry: AuditEntry;
  numero_processo: string;
  nome_segurado: string;
}

const hoje = () => new Date().toISOString().slice(0, 10);

const acaoLabel: Record<AuditEntry["acao"], string> = {
  criacao: "Criação",
  edicao: "Edição",
  exclusao: "Exclusão",
};

function Relatorios() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [mapa, setMapa] = useState<Record<string, { numero_processo: string; nome_segurado: string }>>(
    {},
  );
  const [carregando, setCarregando] = useState(true);
  const [de, setDe] = useState(hoje());
  const [ate, setAte] = useState(hoje());
  const [modulo, setModulo] = useState<FiltroModulo>("todos");
  const [busca, setBusca] = useState("");
  const [mostrar, setMostrar] = useState(100);

  useEffect(() => {
    void (async () => {
      setCarregando(true);
      const [casco, integral, hCasco, hIntegral] = await Promise.all([
        listar("casco"),
        listar("integral"),
        listarHistorico("casco"),
        listarHistorico("integral"),
      ]);
      const m: Record<string, { numero_processo: string; nome_segurado: string }> = {};
      const add = (rows: SinistroRecord[]) => {
        for (const r of rows)
          m[r.id] = {
            numero_processo: String(r["numero_processo"] ?? ""),
            nome_segurado: String(r["nome_segurado"] ?? ""),
          };
      };
      add(casco);
      add(integral);
      setMapa(m);
      setLogs(
        [...hCasco, ...hIntegral].sort((a, b) => b.criado_em.localeCompare(a.criado_em)),
      );
      setCarregando(false);
    })();
  }, []);

  const linhas = useMemo<LinhaLog[]>(() => {
    const b = busca.trim().toLowerCase();
    return logs
      .filter((e) => {
        const dia = (e.criado_em || "").slice(0, 10);
        if (dia < de || dia > ate) return false;
        if (modulo !== "todos" && e.modulo !== modulo) return false;
        return true;
      })
      .map((entry) => {
        const info = mapa[entry.record_id] ?? { numero_processo: "", nome_segurado: "" };
        return { entry, ...info };
      })
      .filter((l) => {
        if (!b) return true;
        return (
          l.nome_segurado.toLowerCase().includes(b) ||
          l.numero_processo.toLowerCase().includes(b) ||
          (l.entry.usuario ?? "").toLowerCase().includes(b) ||
          (l.entry.campo_label ?? "").toLowerCase().includes(b)
        );
      });
  }, [logs, mapa, de, ate, modulo, busca]);

  const visiveis = linhas.slice(0, mostrar);

  function exportar() {
    const dados = linhas.map((l) => ({
      "Data/Hora": formatDateTime(l.entry.criado_em),
      Módulo: l.entry.modulo === "casco" ? "Casco - Perda Parcial" : "Indenização Integral",
      "Nº Processo": l.numero_processo,
      Segurado: l.nome_segurado,
      Ação: acaoLabel[l.entry.acao],
      "Campo alterado": l.entry.campo_label,
      "Valor anterior": l.entry.valor_antigo ?? "",
      "Novo valor": l.entry.valor_novo ?? "",
      Usuário: l.entry.usuario,
    }));
    const ws = XLSX.utils.json_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Alterações");
    XLSX.writeFile(wb, `relatorio-alteracoes-${de}_a_${ate}.xlsx`);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Relatório de Alterações</h1>
        <p className="text-sm text-muted-foreground">
          Tudo que foi alterado em cada segurado — campo, valor anterior → novo, autor e data.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4 shadow-sm">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">De</label>
          <Input type="date" value={de} onChange={(e) => setDe(e.target.value)} className="w-40" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Até</label>
          <Input type="date" value={ate} onChange={(e) => setAte(e.target.value)} className="w-40" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Módulo</label>
          <Select value={modulo} onValueChange={(v) => setModulo(v as FiltroModulo)}>
            <SelectTrigger className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="integral">Indenização Integral</SelectItem>
              <SelectItem value="casco">Casco - Perda Parcial</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Buscar</label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Segurado, processo, campo, usuário…"
              className="w-64 pl-8"
            />
          </div>
        </div>
        <div className="ml-auto flex items-end gap-2">
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDe(hoje());
                setAte(hoje());
              }}
            >
              Hoje
            </Button>
          </div>
          <Button size="sm" className="gap-2" onClick={exportar} disabled={linhas.length === 0}>
            <FileSpreadsheet className="h-4 w-4" />
            Exportar Excel
          </Button>
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-sm font-semibold">Alterações no período</h2>
          <Badge variant="secondary">{linhas.length} registro(s)</Badge>
        </div>
        {carregando ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">Carregando…</p>
        ) : linhas.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            Nenhuma alteração no período/filtro selecionado.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Data/Hora</TableHead>
                  <TableHead>Módulo</TableHead>
                  <TableHead>Nº Processo</TableHead>
                  <TableHead>Segurado</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Campo</TableHead>
                  <TableHead>Anterior</TableHead>
                  <TableHead>Novo</TableHead>
                  <TableHead>Usuário</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visiveis.map((l) => (
                  <TableRow key={l.entry.id}>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {formatDateTime(l.entry.criado_em)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {l.entry.modulo === "casco" ? "Casco" : "Integral"}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-medium">
                      {l.numero_processo || "—"}
                    </TableCell>
                    <TableCell className="max-w-48 truncate">{l.nome_segurado || "—"}</TableCell>
                    <TableCell className="whitespace-nowrap text-xs">
                      {acaoLabel[l.entry.acao]}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{l.entry.campo_label}</TableCell>
                    <TableCell className="max-w-40 truncate text-muted-foreground">
                      {l.entry.valor_antigo ?? "—"}
                    </TableCell>
                    <TableCell className="max-w-40 truncate font-medium">
                      {l.entry.valor_novo ?? "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {l.entry.usuario}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {linhas.length > visiveis.length && (
              <div className="flex justify-center border-t px-4 py-2">
                <Button variant="outline" size="sm" onClick={() => setMostrar((m) => m + 100)}>
                  Carregar mais (de {linhas.length})
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
