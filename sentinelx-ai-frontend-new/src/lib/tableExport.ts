/**
 * Shared table export utilities (CSV / PDF) for SOC data grids.
 *
 * Renders arbitrary column/row data into downloadable CSV or PDF files.
 * Used by DNSRecords, MalwareIntelligence, CVEList and APTGroups grids.
 */

export interface TableColumn {
  readonly key: string;
  readonly label: string;
}

type Row = Record<string, unknown>;

/** Quote a CSV field safely. */
function csvCell(value: unknown): string {
  const s = String(value ?? "");
  return `"${s.replace(/"/g, '""')}"`;
}

/** Escape PDF string literals. */
const escPDF = (s: string): string =>
  s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

function sanitize(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 60) || "export";
}

function downloadFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Build a minimal, dependency-free multi-page PDF from row text. */
function createSimplePdf(lines: string[]): string {
  const pageHeight = 760;
  const content = lines
.map((line, i) => {
      const y = pageHeight - (i % 40) * 16;
      return `BT /F1 10 Tf 50 ${y} Td (${escPDF(line.slice(0, 110))}) Tj ET`;
    })
    .join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((obj, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((off) => {
    pdf += `${String(off).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return pdf;
}

/** Export rows as a CSV file. */
export function exportTableCSV(
  columns: TableColumn[],
  rows: Row[],
  title: string,
): void {
  const header = columns.map((c) => csvCell(c.label)).join(",");
  const body = rows
    .map((row) => columns.map((c) => csvCell(row[c.key])).join(","))
    .join("\n");
  const csv = `${header}\n${body}`;
  downloadFile(`table-${sanitize(title)}.csv`, csv, "text/csv");
}

/** Export rows as a PDF file. */
export function exportTablePDF(
  columns: TableColumn[],
  rows: Row[],
  title: string,
): void {
  const lines = [
    `SentinelX AI - ${title}`,
    "==================================",
    `Generated: ${new Date().toLocaleString()}`,
    "==================================",
  ];
  rows.forEach((row, i) => {
    lines.push(`[${i + 1}] ${columns.map((c) => `${c.label}: ${String(row[c.key] ?? "—")}`).join(" | ")}`);
  });
  const pdf = createSimplePdf(lines);
  downloadFile(`table-${sanitize(title)}.pdf`, pdf, "application/pdf");
}
