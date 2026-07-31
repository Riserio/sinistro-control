import { useEffect, useMemo, useState } from "react";
import type { ModuleKey } from "@/lib/schema";
import { MODULES, CONTRATANTES, COBERTURAS, STATUS_PROCESSO } from "@/lib/schema";
import type { SinistroRecord } from "@/lib/dataStore";
import { listar, excluir } from "@/lib/dataStore";
import { useUsuarioAtual } from "@/components/UserProvider";
import { cellValue, exportarExcel, exportarPDF } from "@/lib/exporters";
import { formatDateTime } from "@/lib/format";
import { SinistroForm } from "./SinistroForm";
import { HistoricoTimeline } from "./HistoricoTimeline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowUpDown,
  Columns3,
  FileSpreadsheet,
  FileText,
  Pencil,
  Plus,
  Search,
  Trash2,
  History,
} from "lucide-react";
import { toast } from "sonner";

const TODOS = "__todos__";
const PAGE_SIZES = [10, 25, 50, 100];

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  const s = status.toUpperCase();
  if (s.includes("PAGO")) return "default";
  if (s.includes("NEGADO") || s.includes("CANCELADO")) return "destructive";
  if (s.includes("PROCESSO") || s.includes("ANÁLISE")) return "secondary";
  return "outline";
}

export function SinistroTable({ modulo }: { modulo: ModuleKey }) {
  const fields = MODULES[modulo].fields;
  const label = MODULES[modulo].label;
  const { usuario } = useUsuarioAtual();

  const [rows, setRows] = useState<SinistroRecord[]>([]);
  const [busca, setBusca] = useState("");
  const [fStatus, setFStatus] = useState(TODOS);
  const [fContratante, setFContratante] = useState(TODOS);
  const [fCobertura, setFCobertura] = useState(TODOS);
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [ordem, setOrdem] = useState<{ campo: string; dir: "asc" | "desc" }>({
    campo: "data_aviso",
    dir: "desc",
  });
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(25);
  const [visiveis, setVisiveis] = useState<string[]>(
    fields.filter((f) => f.defaultVisible).map((f) => f.key),
  );
  const [dialog, setDialog] = useState<{ mode: "novo" | "editar"; record?: SinistroRecord } | null>(
    null,
  );

  const carregar = () => void listar(modulo).then(setRows);
  useEffect(carregar, [modulo]);

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    const out = rows.filter((r) => {
      if (q && !fields.some((f) => String(r[f.key] ?? "").toLowerCase().includes(q))) return false;
      if (fStatus !== TODOS && String(r["status_processo"] ?? "") !== fStatus) return false;
      if (fContratante !== TODOS && String(r["contratante"] ?? "") !== fContratante) return false;
      if (fCobertura !== TODOS && String(r["cobertura"] ?? "") !== fCobertura) return false;
      const data = String(r["data_sinistro"] ?? r["data_aviso"] ?? "");
      if (de && (!data || data < de)) return false;
      if (ate && (!data || data > ate)) return false;
      return true;
    });
    out.sort((a, b) => {
      const av = String(a[ordem.campo] ?? "");
      const bv = String(b[ordem.campo] ?? "");
      const cmp = av.localeCompare(bv, "pt-BR", { numeric: true });
      return ordem.dir === "asc" ? cmp : -cmp;
    });
    return out;
  }, [rows, busca, fStatus, fContratante, fCobertura, de, ate, ordem, fields]);

  useEffect(() => setPagina(1), [busca, fStatus, fContratante, fCobertura, de, ate, porPagina]);

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / porPagina));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const visiveisFields = fields.filter((f) => visiveis.includes(f.key));
  const pageRows = filtradas.slice((paginaAtual - 1) * porPagina, paginaAtual * porPagina);

  const remover = async (r: SinistroRecord) => {
    if (!window.confirm("Excluir este sinistro? A ação ficará registrada no histórico.")) return;
    await excluir(modulo, r.id, usuario);
    carregar();
    toast.success("Sinistro excluído");
  };

  const limparFiltros = () => {
    setBusca("");
    setFStatus(TODOS);
    setFContratante(TODOS);
    setFCobertura(TODOS);
    setDe("");
    setAte("");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{label}</h1>
          <p className="text-sm text-muted-foreground">
            {filtradas.length} de {rows.length} sinistro(s)
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              exportarExcel(filtradas, visiveisFields, `sinistros-${modulo}`)
            }
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportarPDF(filtradas, visiveisFields, label, `sinistros-${modulo}`)}
          >
            <FileText className="mr-2 h-4 w-4" /> PDF
          </Button>
          <Button size="sm" onClick={() => setDialog({ mode: "novo" })}>
            <Plus className="mr-2 h-4 w-4" /> Novo sinistro
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Buscar em todos os campos..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <Select value={fStatus} onValueChange={setFStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos os status</SelectItem>
              {STATUS_PROCESSO.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={fContratante} onValueChange={setFContratante}>
            <SelectTrigger>
              <SelectValue placeholder="Contratante" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos os contratantes</SelectItem>
              {CONTRATANTES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={fCobertura} onValueChange={setFCobertura}>
            <SelectTrigger>
              <SelectValue placeholder="Cobertura" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todas as coberturas</SelectItem>
              {COBERTURAS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-end gap-2 md:col-span-2">
            <div className="flex-1">
              <Label className="mb-1 block text-[11px] text-muted-foreground">De</Label>
              <Input type="date" value={de} onChange={(e) => setDe(e.target.value)} />
            </div>
            <div className="flex-1">
              <Label className="mb-1 block text-[11px] text-muted-foreground">Até</Label>
              <Input type="date" value={ate} onChange={(e) => setAte(e.target.value)} />
            </div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" onClick={limparFiltros}>
            Limpar filtros
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns3 className="mr-2 h-4 w-4" /> Colunas ({visiveisFields.length})
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-72 p-0">
              <ScrollArea className="h-80">
                <div className="space-y-1 p-2">
                  {fields.map((f) => (
                    <label
                      key={f.key}
                      className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted"
                    >
                      <Checkbox
                        checked={visiveis.includes(f.key)}
                        onCheckedChange={(c) =>
                          setVisiveis((prev) =>
                            c ? [...prev, f.key] : prev.filter((k) => k !== f.key),
                          )
                        }
                      />
                      {f.label}
                    </label>
                  ))}
                </div>
              </ScrollArea>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {visiveisFields.map((f) => (
                  <TableHead key={f.key} className="whitespace-nowrap">
                    <button
                      className="flex items-center gap-1 hover:text-foreground"
                      onClick={() =>
                        setOrdem((o) =>
                          o.campo === f.key
                            ? { campo: f.key, dir: o.dir === "asc" ? "desc" : "asc" }
                            : { campo: f.key, dir: "asc" },
                        )
                      }
                    >
                      {f.label}
                      <ArrowUpDown className="h-3 w-3 opacity-50" />
                    </button>
                  </TableHead>
                ))}
                <TableHead className="whitespace-nowrap">Última edição</TableHead>
                <TableHead className="sticky right-0 bg-card text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={visiveisFields.length + 2}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    Nenhum sinistro encontrado.
                  </TableCell>
                </TableRow>
              )}
              {pageRows.map((r) => (
                <TableRow key={r.id}>
                  {visiveisFields.map((f) => (
                    <TableCell key={f.key} className="whitespace-nowrap text-sm">
                      {f.key === "status_processo" && r[f.key] ? (
                        <Badge variant={statusVariant(String(r[f.key]))}>{String(r[f.key])}</Badge>
                      ) : (
                        cellValue(r, f)
                      )}
                    </TableCell>
                  ))}
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {r.updated_by} · {formatDateTime(r.updated_at)}
                  </TableCell>
                  <TableCell className="sticky right-0 bg-card text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Editar / Histórico"
                        onClick={() => setDialog({ mode: "editar", record: r })}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Excluir"
                        onClick={() => void remover(r)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t p-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            Itens por página
            <Select value={String(porPagina)} onValueChange={(v) => setPorPagina(Number(v))}>
              <SelectTrigger className="h-8 w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZES.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Página {paginaAtual} de {totalPaginas}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={paginaAtual <= 1}
              onClick={() => setPagina(paginaAtual - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={paginaAtual >= totalPaginas}
              onClick={() => setPagina(paginaAtual + 1)}
            >
              Próxima
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={!!dialog} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialog?.record ? "Editar sinistro" : "Novo sinistro"} — {label}
            </DialogTitle>
            <DialogDescription>
              {dialog?.record
                ? `Criado por ${dialog.record.created_by} em ${formatDateTime(dialog.record.created_at)}`
                : `Será registrado em nome de ${usuario}.`}
            </DialogDescription>
          </DialogHeader>

          {dialog?.mode === "editar" && dialog.record ? (
            <Tabs defaultValue="dados">
              <TabsList>
                <TabsTrigger value="dados">Dados</TabsTrigger>
                <TabsTrigger value="historico">
                  <History className="mr-1.5 h-3.5 w-3.5" /> Histórico
                </TabsTrigger>
              </TabsList>
              <TabsContent value="dados" className="mt-4">
                <SinistroForm
                  modulo={modulo}
                  registro={dialog.record}
                  onSaved={() => {
                    setDialog(null);
                    carregar();
                  }}
                  onCancel={() => setDialog(null)}
                />
              </TabsContent>
              <TabsContent value="historico" className="mt-4">
                <HistoricoTimeline modulo={modulo} recordId={dialog.record.id} />
              </TabsContent>
            </Tabs>
          ) : (
            dialog && (
              <SinistroForm
                modulo={modulo}
                onSaved={() => {
                  setDialog(null);
                  carregar();
                }}
                onCancel={() => setDialog(null)}
              />
            )
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
