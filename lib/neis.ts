import { inferDistrictFromAddress } from "@/lib/regions";
import type { Institution } from "@/lib/types";

export const DEFAULT_NEIS_OFFICE_CODE = "D10";

interface NeisSchoolRow {
  ATPT_OFCDC_SC_CODE?: string;
  SD_SCHUL_CODE?: string;
  SCHUL_NM?: string;
  SCHUL_KND_SC_NM?: string;
  LCTN_SC_NM?: string;
  ORG_RDNMA?: string;
  ORG_RDNDA?: string;
}

interface NeisSchoolResponse {
  schoolInfo?: [
    { head?: Array<{ RESULT?: { CODE?: string; MESSAGE?: string } }> },
    { row?: NeisSchoolRow[] },
  ];
  RESULT?: {
    CODE?: string;
    MESSAGE?: string;
  };
}

function inferType(kind?: string): Institution["type"] {
  if (!kind) return "school";
  if (kind.includes("교육청") || kind.includes("기관")) return "office";
  return "school";
}

export function mapNeisRows(rows: NeisSchoolRow[]): Institution[] {
  return rows
    .filter((row) => Boolean(row.SCHUL_NM))
    .map((row) => {
      const address = [row.ORG_RDNMA, row.ORG_RDNDA].filter(Boolean).join(" ").trim();
      const officeCode = row.ATPT_OFCDC_SC_CODE ?? DEFAULT_NEIS_OFFICE_CODE;
      const locationHint = `${row.LCTN_SC_NM ?? ""} ${address}`;

      return {
        id: `neis-${officeCode}-${row.SD_SCHUL_CODE ?? row.SCHUL_NM}`,
        name: row.SCHUL_NM ?? "이름 없는 학교",
        type: inferType(row.SCHUL_KND_SC_NM),
        address: address || "주소 정보 없음",
        district: inferDistrictFromAddress(locationHint, officeCode),
        officeCode,
        lat: null,
        lng: null,
        schoolCode: row.SD_SCHUL_CODE,
        source: "neis" as const,
      };
    });
}

export function parseNeisSchoolResponse(payload: NeisSchoolResponse): {
  items: Institution[];
  message?: string;
} {
  const resultCode = payload.RESULT?.CODE ?? payload.schoolInfo?.[0]?.head?.[0]?.RESULT?.CODE;
  const resultMessage =
    payload.RESULT?.MESSAGE ?? payload.schoolInfo?.[0]?.head?.[0]?.RESULT?.MESSAGE;

  if (resultCode && resultCode !== "INFO-000") {
    return { items: [], message: resultMessage ?? "나이스 API에서 학교 정보를 찾지 못했습니다." };
  }

  const rows = payload.schoolInfo?.[1]?.row ?? [];
  return { items: mapNeisRows(rows) };
}
