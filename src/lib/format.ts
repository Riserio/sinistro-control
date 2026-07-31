export const USUARIOS = [
  "Ana Ribeiro",
  "Carlos Mendes",
  "Fernanda Lima",
  "João Pereira",
  "Marina Souza",
];

/** Converte texto/numero para número aceitando pt-BR (1.234,56) e en-US (1234.56). */
export function toNumber(v: unknown): number {
  if (v === null || v === undefined || v === "") return 0;
  if (typeof v === "number") return Number.isNaN(v) ? 0 : v;
  let s = String(v).trim().replace(/[R$\s]/g, "");
  const temVirgula = s.includes(",");
  const temPonto = s.includes(".");
  if (temVirgula && temPonto) {
    // pt-BR: ponto = milhar, vírgula = decimal
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (temVirgula) {
    s = s.replace(",", ".");
  }
  // só ponto (ou nenhum) => já é decimal en-US
  const n = Number(s);
  return Number.isNaN(n) ? 0 : n;
}

export function formatCurrency(v: unknown): string {
  if (v === null || v === undefined || v === "") return "";
  const n = toNumber(v);
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDate(v: unknown): string {
  if (!v) return "";
  const s = String(v);
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  return s;
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

/* -------------------------------- Máscaras -------------------------------- */

const digitos = (v: string) => v.replace(/\D/g, "");

/** CPF (000.000.000-00) ou CNPJ (00.000.000/0000-00), conforme a quantidade de dígitos. */
export function formatCpfCnpj(v: unknown): string {
  const d = digitos(String(v ?? ""));
  if (d.length === 0) return String(v ?? "");
  if (d.length <= 11) {
    return d
      .padStart(0, "")
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1-$2")
      .slice(0, 14);
  }
  return d
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

/** Máscara ao digitar CPF/CNPJ (retorna string formatada progressivamente). */
export function maskCpfCnpjInput(v: string): string {
  return formatCpfCnpj(digitos(v).slice(0, 14));
}

/** Recebe o texto digitado e devolve o valor de exibição (1.234,56) tratando como centavos. */
export function maskMoedaInput(v: string): string {
  const d = digitos(v);
  if (d === "") return "";
  const n = Number(d) / 100;
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Converte o texto exibido (1.234,56) para o valor canônico de armazenamento (1234.56). */
export function moedaParaArmazenamento(exibicao: string): string {
  const d = digitos(exibicao);
  if (d === "") return "";
  return String(Number(d) / 100);
}

/** Converte valor armazenado (1234.56) para exibição de moeda (1.234,56). */
export function moedaParaExibicao(valor: unknown): string {
  if (valor === null || valor === undefined || valor === "") return "";
  return toNumber(valor).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
