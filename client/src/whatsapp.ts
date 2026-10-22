import { formatNumber, formatPercent, formatRupiah, type CalcResult } from "@hpp/shared";

export function buildWhatsappSummary(input: {
  label: string;
  weightG: number;
  printHours: number;
  paintCost: number;
  result: CalcResult;
}): string {
  const { label, weightG, printHours, paintCost, result } = input;
  const lines: string[] = [];

  lines.push("*Estimasi HPP Cetak 3D*");
  if (label.trim()) lines.push(label.trim());
  lines.push("");
  lines.push(`Berat model: ${formatNumber(weightG)} g`);
  lines.push(`Waktu cetak: ${formatNumber(printHours)} jam`);
  lines.push("");
  lines.push("*Rincian biaya*");
  lines.push(`- Material: ${formatRupiah(result.material)}`);
  lines.push(`- Penyusutan mesin: ${formatRupiah(result.depreciation)}`);
  lines.push(`- Listrik: ${formatRupiah(result.electricity)}`);
  lines.push(`- Jasa cat: ${formatRupiah(paintCost)}`);
  lines.push(`- Risiko: ${formatRupiah(result.riskAmount)}`);
  lines.push(`*Total HPP: ${formatRupiah(result.totalHpp)}*`);
  lines.push("");
  lines.push("*Pilihan harga jual*");
  for (const row of result.margins) {
    lines.push(
      `- ${formatPercent(row.percent)}: ${formatRupiah(row.sellingPrice)} (bersih ${formatRupiah(row.netProfit)})`,
    );
  }

  return lines.join("\n");
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall back below
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(textarea);
    return copied;
  } catch {
    return false;
  }
}
