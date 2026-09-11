import type { Institution } from "@/lib/types";

export interface VisitRow {
  name: string;
  type: string;
  district: string;
  address: string;
}

export interface UnmatchedVisit extends VisitRow {
  reason: string;
}

export interface VisitMatchResult {
  matched: Institution[];
  unmatched: UnmatchedVisit[];
}

const NAME_HEADERS = ["기관명", "학교명", "학교", "시설명", "이름", "name"];
const TYPE_HEADERS = ["구분", "유형", "type"];
const DISTRICT_HEADERS = ["시군구", "구", "지역", "district"];
const ADDRESS_HEADERS = ["주소", "address"];

export function downloadVisitTemplate(): void {
  void import("xlsx").then((XLSX) => {
    const workbook = XLSX.utils.book_new();
    const visitSheet = XLSX.utils.aoa_to_sheet([
      ["기관명", "구분", "시군구", "주소"],
      ["대구고등학교", "학교", "남구", ""],
      ["대구광역시동부교육지원청", "직속기관", "중구", ""],
    ]);
    visitSheet["!cols"] = [{ wch: 28 }, { wch: 12 }, { wch: 12 }, { wch: 42 }];

    const guideSheet = XLSX.utils.aoa_to_sheet([
      ["안내"],
      ["1. 방문지 시트에 기관명만 적어도 됩니다."],
      ["2. 같은 이름이 여러 곳이면 시군구 또는 주소를 채워 주세요."],
      ["3. 구분은 학교 / 직속기관 / 장소 중 하나를 쓰면 매칭이 더 정확합니다."],
      ["4. 교육청 소속이 아니어도 상호나 주소를 적으면 지도 검색으로 찾습니다."],
      ["5. Path Finder에서 내보낸 '일자별 동선' 파일도 그대로 가져올 수 있습니다."],
      ["6. 가져오기는 기존 선택에 추가됩니다."],
    ]);
    guideSheet["!cols"] = [{ wch: 72 }];

    XLSX.utils.book_append_sheet(workbook, visitSheet, "방문지");
    XLSX.utils.book_append_sheet(workbook, guideSheet, "안내");
    XLSX.writeFile(workbook, "PathFinder_방문지_템플릿.xlsx");
  });
}

function cellText(value: unknown): string {
  return String(value ?? "").trim();
}

function pickField(row: Record<string, unknown>, headers: string[]): string {
  const entries = Object.entries(row);
  for (const header of headers) {
    const found = entries.find(([key]) => key.trim() === header);
    if (found && cellText(found[1])) return cellText(found[1]);
  }
  return "";
}

function normalizeName(value: string): string {
  return value.replace(/\s+/g, "").replace(/[()[\]·ㆍ.]/g, "").toLowerCase();
}

function preferredSheetName(names: string[]): string | undefined {
  return ["방문지", "일자별 동선", "미배정"].find((name) => names.includes(name)) ?? names[0];
}

export async function parseVisitFile(file: File): Promise<VisitRow[]> {
  const XLSX = await import("xlsx");
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: "array" });
  const sheetName = preferredSheetName(workbook.SheetNames);
  if (!sheetName) return [];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName], {
    defval: "",
  });
  return rows
    .map((row) => ({
      name: pickField(row, NAME_HEADERS),
      type: pickField(row, TYPE_HEADERS),
      district: pickField(row, DISTRICT_HEADERS),
      address: pickField(row, ADDRESS_HEADERS),
    }))
    .filter((row) => row.name.length > 0);
}

export function parseVisitPaste(text: string): VisitRow[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !["기관명", "학교명"].includes(line.split(/\t/)[0] ?? ""))
    .map((line) => {
      const [name, type, district, address] = line.split(/\t|,/).map((part) => part.trim());
      return {
        name: name ?? "",
        type: type ?? "",
        district: district ?? "",
        address: address ?? "",
      };
    })
    .filter((row) => row.name.length > 0);
}

function typeMatches(rowType: string, institution: Institution): boolean {
  if (!rowType) return true;
  if (rowType.includes("직속") || rowType.includes("기관") || rowType.includes("청")) {
    return institution.type === "office";
  }
  if (rowType.includes("학교")) return institution.type === "school";
  return true;
}

function scoreCandidate(row: VisitRow, institution: Institution): number {
  const rowName = normalizeName(row.name);
  const itemName = normalizeName(institution.name);
  if (!rowName || !itemName) return 0;

  let score = 0;
  if (itemName === rowName) score += 100;
  else if (itemName.startsWith(rowName) || rowName.startsWith(itemName)) score += 80;
  else if (itemName.includes(rowName) || rowName.includes(itemName)) score += 50;
  else {
    const keywordHit = (institution.keywords ?? []).some((keyword) =>
      normalizeName(keyword).includes(rowName),
    );
    if (keywordHit) score += 40;
    else return 0;
  }

  if (row.district && institution.district.includes(row.district)) score += 20;
  if (row.address && institution.address.includes(row.address)) score += 20;
  if (typeMatches(row.type, institution)) score += 5;
  return score;
}

export function matchVisitRows(rows: VisitRow[], candidates: Institution[]): VisitMatchResult {
  const matched: Institution[] = [];
  const unmatched: UnmatchedVisit[] = [];
  const usedIds = new Set<string>();

  for (const row of rows) {
    const ranked = candidates
      .map((institution) => ({ institution, score: scoreCandidate(row, institution) }))
      .filter((item) => item.score >= 50)
      .sort((a, b) => b.score - a.score);

    const best = ranked.find((item) => !usedIds.has(item.institution.id)) ?? ranked[0];
    if (!best) {
      unmatched.push({ ...row, reason: "목록에서 찾지 못함" });
      continue;
    }

    if (!usedIds.has(best.institution.id)) {
      matched.push(best.institution);
      usedIds.add(best.institution.id);
    }
  }

  return { matched, unmatched };
}

export function mergeSelected(current: Institution[], incoming: Institution[]): Institution[] {
  const merged = new Map(current.map((item) => [item.id, item]));
  for (const item of incoming) {
    merged.set(item.id, item);
  }
  return Array.from(merged.values());
}
