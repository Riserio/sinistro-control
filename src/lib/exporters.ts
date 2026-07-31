import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { FieldDef } from "./schema";
import type { SinistroRecord } from "./dataStore";
import { formatCurrency, formatDate, formatCpfCnpj } from "./format";

export function cellValue(record: SinistroRecord, field: FieldDef): string {
  const raw = record[field.key];
  if (raw === null || raw === undefined || raw === "") return "";
  if (field.type === "currency") return formatCurrency(raw);
  if (field.type === "date") return formatDate(raw);
  if (field.key === "cpf_cnpj") return formatCpfCnpj(raw);
  return String(raw);
}

export function exportarExcel(
  rows: SinistroRecord[],
  fields: FieldDef[],
  nomeArquivo: string,
) {
  const data = rows.map((r) => {
    const obj: Record<string, string> = {};
    for (const f of fields) obj[f.label] = cellValue(r, f);
    return obj;
  });
  const ws = XLSX.utils.json_to_sheet(data, { header: fields.map((f) => f.label) });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sinistros");
  XLSX.writeFile(wb, `${nomeArquivo}.xlsx`);
}

export function exportarPDF(
  rows: SinistroRecord[],
  fields: FieldDef[],
  titulo: string,
  nomeArquivo: string,
) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  doc.setFontSize(14);
  doc.text(titulo, 40, 34);
  doc.setFontSize(9);
  doc.text(
    `Gerado em ${new Date().toLocaleString("pt-BR")} — ${rows.length} registro(s)`,
    40,
    50,
  );
  autoTable(doc, {
    startY: 62,
    head: [fields.map((f) => f.label)],
    body: rows.map((r) => fields.map((f) => cellValue(r, f))),
    styles: { fontSize: 6, cellPadding: 3, overflow: "linebreak" },
    headStyles: { fillColor: [23, 43, 77], fontSize: 6 },
  });
  doc.save(`${nomeArquivo}.pdf`);
}
