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

function visitTypeLabel(type: Institution["type"]): string {
  if (type === "office") return "직속기관";
  if (type === "school") return "학교";
  return "장소";
}

export async function exportSelectedVisits(selected: Institution[]): Promise<void> {
  if (selected.length === 0) return;

  const rows: Array<Array<string | number>> = [["기관명", "구분", "시군구", "주소"]];
  for (const item of selected) {
    rows.push([item.name, visitTypeLabel(item.type), item.district, item.address]);
  }

  const { downloadWorkbook } = await import("@/lib/excel-file");
  await downloadWorkbook("PathFinder_방문지.xlsx", [
    { name: "방문지", rows, columnWidths: [32, 12, 12, 42] },
  ]);
}

export function downloadVisitTemplate(): void {
  void import("@/lib/excel-file").then(({ downloadWorkbook }) =>
    downloadWorkbook("PathFinder_방문지_템플릿.xlsx", [
    {
      name: "방문지",
      rows: [
        ["기관명", "구분", "시군구", "주소"],
        ["대구고등학교", "학교", "수성구", ""],
        ["대구광역시동부교육지원청", "직속기관", "중구", ""],
        ["스타벅스 대구동성로점", "장소", "중구", "대구광역시 중구 동성로"],
      ],
      columnWidths: [32, 12, 12, 42],
    },
    {
      name: "안내",
      rows: [
        ["Path Finder 방문지 템플릿 작성 방법"],
        [""],
        ["■ 기본"],
        ["1. 실제 방문할 곳은 '방문지' 시트에만 적습니다. 이 안내 시트는 설명용입니다."],
        ["2. 1행(기관명, 구분, 시군구, 주소)은 제목이니 지우거나 바꾸지 마세요."],
        ["3. 2행부터 한 줄에 한 곳씩 적습니다. 샘플 3줄은 지우고 사용해도 됩니다."],
        ["4. 파일을 저장한 뒤 Path Finder의 '엑셀 가져오기'로 올리면 선택 목록에 추가됩니다."],
        [""],
        ["■ 열 작성 방법"],
        ["기관명 (필수) : 공식 명칭을 적습니다. 예) 대구고등학교, 대구광역시군위교육지원청, 스타벅스 대구동성로점"],
        ["구분 (선택) : 학교 / 직속기관 / 장소 중 하나를 적으면 같은 이름을 구분하기 쉽습니다. 비워도 됩니다."],
        ["시군구 (선택) : 남구, 수성구, 군위군처럼 적습니다. 같은 이름이 여러 곳일 때 사용합니다."],
        ["주소 (선택) : 교육청 소속이 아닌 상호·회사·장소는 도로명 주소를 적으면 지도에서 찾습니다."],
        [""],
        ["■ 이렇게 적어도 됩니다"],
        ["- 기관명만 적어도 검색합니다. 예: 대구고등학교"],
        ["- 학교는 나이스·내부 목록에서 찾고, 없으면 상호·주소로 지도 검색합니다."],
        ["- 엑셀에서 기관명 열만 복사해 '붙여넣기'로 넣어도 됩니다. 한 줄에 한 곳입니다."],
        [""],
        ["■ 주의"],
        ["- 빈 줄은 무시됩니다."],
        ["- 이미 선택된 방문지는 다시 가져와도 중복으로 넣지 않고 기존 목록에 이어 붙입니다."],
        ["- Path Finder에서 내보낸 '선택된 방문지' 엑셀과 '일자별 동선' 엑셀도 같은 방식으로 가져올 수 있습니다."],
        ["- 찾지 못한 곳은 화면의 '찾지 못한 곳'에 표시되니, 이름을 고치거나 주소를 보강해 다시 가져오면 됩니다."],
      ],
      columnWidths: [96],
    },
  ]),
  );
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

export async function parseVisitFile(file: File): Promise<VisitRow[]> {
  const { readSheetRecords } = await import("@/lib/excel-file");
  const rows = await readSheetRecords(file);
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
