import ExcelJS from "exceljs";

export type ExcelCell = string | number;

export interface ExcelSheetSpec {
  name: string;
  rows: ExcelCell[][];
  columnWidths?: number[];
}

function cellToText(value: unknown): string {
  if (value == null || value === "") return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object" && value !== null) {
    if ("text" in value) return String((value as { text: unknown }).text ?? "").trim();
    if ("result" in value) return String((value as { result: unknown }).result ?? "").trim();
    if ("richText" in value) {
      const parts = (value as { richText: Array<{ text?: string }> }).richText;
      return parts.map((part) => part.text ?? "").join("").trim();
    }
  }
  return String(value).trim();
}

function splitDelimitedLine(line: string): string[] {
  if (line.includes("\t")) return line.split("\t").map((part) => part.trim());

  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  cells.push(current.trim());
  return cells;
}

function parseCsv(text: string): Record<string, unknown>[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const headers = splitDelimitedLine(lines[0] ?? "");
  return lines.slice(1).map((line) => {
    const cells = splitDelimitedLine(line);
    const row: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      row[header] = cells[index] ?? "";
    });
    return row;
  });
}

export async function downloadWorkbook(filename: string, sheets: ExcelSheetSpec[]): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  for (const spec of sheets) {
    const worksheet = workbook.addWorksheet(spec.name);
    for (const row of spec.rows) {
      worksheet.addRow(row);
    }
    spec.columnWidths?.forEach((width, index) => {
      worksheet.getColumn(index + 1).width = width;
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([new Uint8Array(buffer as ArrayBuffer)], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function readSheetRecords(file: File): Promise<Record<string, unknown>[]> {
  const lowerName = file.name.toLowerCase();
  if (lowerName.endsWith(".csv")) {
    return parseCsv(await file.text());
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());
  const preferredNames = ["방문지", "일자별 동선", "미배정"];
  const worksheet =
    preferredNames.map((name) => workbook.getWorksheet(name)).find((sheet) => Boolean(sheet)) ??
    workbook.worksheets[0];
  if (!worksheet) return [];

  const headers: string[] = [];
  worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell, colNumber) => {
    headers[colNumber - 1] = cellToText(cell.value);
  });

  const records: Record<string, unknown>[] = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const record: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      if (!header) return;
      record[header] = cellToText(row.getCell(index + 1).value);
    });
    records.push(record);
  });
  return records;
}
