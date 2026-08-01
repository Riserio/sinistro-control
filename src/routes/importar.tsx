import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { MODULES, type ModuleKey, type FieldDef } from "@/lib/schema";
import { upsertPorProcesso, restaurarBackup, type BackupData } from "@/lib/dataStore";
import { useUsuarioAtual } from "@/components/UserProvider";
import { Button } from "@/components/ui/button";
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
import { Upload, DatabaseBackup, CheckCircle2, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/importar")({
  head: () => ({
    meta: [
      { title: "Importar Planilha | BP Seguradora" },
      { name: "description", content: "Importe CSV/Excel com seleção de aba, mapeamento automático de colunas e upsert por Nº Processo." },
      { property: "og:title", content: "Importar Planilha | BP Seguradora" },
      { property: "og:description", content: "Importação de planilha com upsert por Nº Processo." },
    ],
  }),
  component: Importar,
});

/** Normaliza cabeçalhos/nomes para casar apesar de acento/espaço/maiúsculas. */
function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function mapaCampos(fields: FieldDef[]): Map<string, string> {
  const m = new Map<string, string>();
  for (const f of fields) {
    m.set(norm(f.label), f.key);
    m.set(norm(f.key), f.key);
  }
  return m;
}

/** Escolhe a aba mais provável para o módulo a partir do nome da aba. */
function abaPadrao(nomes: string[], modulo: ModuleKey): string {
  const achar = (pred: (n: string) => boolean) => nomes.find((n) => pred(norm(n)));
  if (modulo === "integral") {
    return achar((n) => n.includes("integral")) ?? nomes[0]!;
  }
  return achar((n) => n.includes("casco") || n.includes("parcial")) ?? nomes[0]!;
}

type Sheets = Record<string, Record<string, unknown>[]>;

function Importar() {
  const { usuario } = useUsuarioAtual();
  const [modulo, setModulo] = useState<ModuleKey>("casco");
  const [sheets, setSheets] = useState<Sheets | null>(null);
  const [abaSel, setAbaSel] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{ criados: number; atualizados: number } | null>(
    null,
  );
  const [importando, setImportando] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const backupRef = useRef<HTMLInputElement>(null);

  const fields = MODULES[modulo].fields;

  async function lerArquivo(file: File) {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    if (wb.SheetNames.length === 0) {
      toast.error("Arquivo sem abas legíveis.");
      return;
    }
    const map: Sheets = {};
    for (const name of wb.SheetNames) {
      map[name] = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[name]!, {
        defval: "",
        raw: false,
      });
    }
    setResultado(null);
    setSheets(map);
    setAbaSel(abaPadrao(wb.SheetNames, modulo));
    toast.success(`${wb.SheetNames.length} aba(s) encontrada(s).`, {
      description: wb.SheetNames.join(" • "),
    });
  }

  const preview = useMemo(() => {
    if (!sheets || !abaSel || !sheets[abaSel]) return null;
    const json = sheets[abaSel];
    if (json.length === 0) return { colunas: [] as string[], mapeadas: {}, linhas: [] };
    const colunas = Object.keys(json[0]!);
    const mapa = mapaCampos(fields);
    const mapeadas: Record<string, string | null> = {};
    for (const col of colunas) mapeadas[col] = mapa.get(norm(col)) ?? null;
    const linhas = json.map((raw) => {
      const rec: Record<string, unknown> = {};
      for (const col of colunas) {
        const key = mapeadas[col];
        if (key) rec[key] = raw[col];
      }
      return rec;
    });
    return { colunas, mapeadas, linhas };
  }, [sheets, abaSel, fields]);

  async function confirmarImportacao() {
    if (!preview) return;
    setImportando(true);
    try {
      const validas = preview.linhas.filter((l) =>
        Object.values(l).some((v) => String(v ?? "").trim() !== ""),
      );
      const r = await upsertPorProcesso(modulo, validas, usuario);
      setResultado(r);
      toast.success("Importação concluída.", {
        description: `${r.criados} criado(s), ${r.atualizados} atualizado(s).`,
      });
    } finally {
      setImportando(false);
    }
  }

  async function restaurar(file: File) {
    try {
      const texto = await file.text();
      const data = JSON.parse(texto) as Partial<BackupData>;
      const r = await restaurarBackup(data);
      toast.success("Backup restaurado no banco.", {
        description: `Casco: ${r.casco} • Integral: ${r.integral}. Recarregue as telas.`,
      });
    } catch {
      toast.error("Backup inválido. Selecione um arquivo .json gerado pelo botão Backup.");
    }
  }

  async function limparTudo() {
    const ok = window.confirm(
      "Limpar TODOS os sinistros (Casco e Indenização Integral) do banco? Esta ação não pode ser desfeita.",
    );
    if (!ok) return;
    await limparBase();
    toast.success("Base limpa.", { description: "Recarregando a aplicação…" });
    setTimeout(() => window.location.reload(), 600);
  }


  const colsMapeadas = preview ? preview.colunas.filter((c) => preview.mapeadas[c]) : [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Importar</h1>
        <p className="text-sm text-muted-foreground">
          Envie a planilha (CSV ou Excel). Se o arquivo tiver várias abas, escolha qual aba
          importar para cada módulo. O sistema faz <strong>upsert por Nº Processo</strong>: se o
          processo já existe, atualiza (registrando no histórico); se não, cria.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Módulo de destino</label>
            <Select value={modulo} onValueChange={(v) => setModulo(v as ModuleKey)}>
              <SelectTrigger className="w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="casco">Casco - Perda Parcial</SelectItem>
                <SelectItem value="integral">Indenização Integral</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {sheets && (
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Aba da planilha</label>
              <Select value={abaSel ?? undefined} onValueChange={setAbaSel}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Escolha a aba" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(sheets).map((name) => (
                    <SelectItem key={name} value={name}>
                      {name} ({sheets[name]!.length})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void lerArquivo(f);
              e.target.value = "";
            }}
          />
          <Button onClick={() => fileRef.current?.click()} className="gap-2">
            <Upload className="h-4 w-4" />
            Selecionar arquivo
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Dica: sua planilha tem as abas <strong>INDENIZAÇÃO INTEGRAL</strong> e{" "}
          <strong>CASCO - PERDA PARCIAL</strong>. Importe cada aba para o módulo correspondente. Os
          cabeçalhos são reconhecidos ignorando acentos, espaços e maiúsculas.
        </p>
      </div>

      {preview && (
        <div className="space-y-3 rounded-lg border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">
              Pré-visualização — aba “{abaSel}” ({preview.linhas.length} linha(s))
            </h2>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{colsMapeadas.length} coluna(s) reconhecida(s)</Badge>
              <Button size="sm" onClick={() => void confirmarImportacao()} disabled={importando}>
                {importando ? "Importando…" : `Importar para ${MODULES[modulo].label}`}
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {colsMapeadas.map((c) => (
                    <TableHead key={c} className="whitespace-nowrap">
                      {fields.find((f) => f.key === preview.mapeadas[c])?.label ?? c}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.linhas.slice(0, 5).map((linha, i) => (
                  <TableRow key={i}>
                    {colsMapeadas.map((c) => {
                      const key = preview.mapeadas[c]!;
                      return (
                        <TableCell key={c} className="whitespace-nowrap text-xs">
                          {String(linha[key] ?? "")}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {preview.colunas.some((c) => !preview.mapeadas[c]) && (
            <p className="text-xs text-muted-foreground">
              Colunas ignoradas (sem correspondência):{" "}
              {preview.colunas.filter((c) => !preview.mapeadas[c]).join(", ")}
            </p>
          )}
          {colsMapeadas.length === 0 && (
            <p className="text-xs text-amber-700">
              Nenhuma coluna reconhecida nesta aba — verifique se a aba selecionada corresponde ao
              módulo de destino.
            </p>
          )}
        </div>
      )}

      {resultado && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          <CheckCircle2 className="h-5 w-5" />
          Importação concluída: <strong>{resultado.criados}</strong> criado(s),{" "}
          <strong>{resultado.atualizados}</strong> atualizado(s).
        </div>
      )}

      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center gap-2">
          <DatabaseBackup className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Restaurar backup</h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Selecione um arquivo <strong>.json</strong> gerado pelo botão <strong>Backup</strong> (no
          topo) para restaurar todos os dados e o histórico.
        </p>
        <input
          ref={backupRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void restaurar(f);
            e.target.value = "";
          }}
        />
        <Button variant="outline" size="sm" className="mt-3 gap-2" onClick={() => backupRef.current?.click()}>
          <Upload className="h-4 w-4" />
          Selecionar backup (.json)
        </Button>
      </div>

      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
        <h2 className="text-sm font-semibold text-destructive">Manutenção (modo demonstração)</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Remove todos os registros e o histórico salvos neste navegador, para recomeçar os testes
          do zero. Faça um <strong>Backup</strong> antes se quiser guardar o que já cadastrou.
        </p>
        <Button variant="destructive" size="sm" className="mt-3 gap-2" onClick={limparTudo}>
          <Trash2 className="h-4 w-4" />
          Limpar dados (demo)
        </Button>
      </div>
    </div>
  );
}
