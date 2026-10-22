const rupiahFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const plainFormatter = new Intl.NumberFormat("id-ID", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const decimalFormatter = new Intl.NumberFormat("id-ID", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 4,
});

export const formatRupiah = (value: number): string =>
  rupiahFormatter
    .format(Number.isFinite(value) ? value : 0)
    .replace(/\s+/g, "");

export const formatNumber = (value: number): string =>
  plainFormatter.format(Number.isFinite(value) ? value : 0);

export const formatDecimal = (value: number): string =>
  decimalFormatter.format(Number.isFinite(value) ? value : 0);

export const formatPercent = (value: number): string => `${formatDecimal(value)}%`;

export function parseNumber(raw: string): number {
  const trimmed = raw.trim().replace(/\s/g, "");
  if (!trimmed) return 0;

  const cleaned = trimmed.replace(/[^0-9.,-]/g, "");
  if (!cleaned || cleaned === "-") return 0;

  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  let normalized: string;

  if (lastComma >= 0 && lastDot >= 0) {
    const decimalSeparator = lastComma > lastDot ? "," : ".";
    const thousandSeparator = decimalSeparator === "," ? "." : ",";
    normalized = cleaned.split(thousandSeparator).join("");
    if (decimalSeparator === ",") normalized = normalized.replace(",", ".");
  } else if (lastComma >= 0) {
    normalized = isDecimalSeparator(cleaned, ",")
      ? cleaned.replace(",", ".")
      : cleaned.split(",").join("");
  } else if (lastDot >= 0) {
    normalized = isDecimalSeparator(cleaned, ".")
      ? cleaned
      : cleaned.split(".").join("");
  } else {
    normalized = cleaned;
  }

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isDecimalSeparator(value: string, separator: string): boolean {
  const parts = value.split(separator);
  if (parts.length !== 2) return false;
  const [whole, fraction] = parts;
  if (whole === "0") return true;
  return !(fraction.length === 3 && whole.length > 0);
}
