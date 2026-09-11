import type { EducationOffice } from "@/lib/regions";
import { hasCoordinates, type Institution, type RoutePlan, type TripSettings } from "@/lib/types";

function typeLabel(type: Institution["type"]): string {
  if (type === "office") return "직속기관";
  if (type === "school") return "학교";
  return "기타";
}

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fileStamp(isoDate: string): string {
  return isoDate.replace(/-/g, "");
}

export async function exportRoutePlanToExcel(options: {
  office: EducationOffice;
  settings: TripSettings;
  selectedCount: number;
  plan: RoutePlan;
}): Promise<void> {
  const { office, settings, selectedCount, plan } = options;
  const assignedCount = plan.days.reduce((sum, day) => sum + day.stops.length, 0);
  const totalDistanceKm = Number(
    plan.days.reduce((sum, day) => sum + day.totalDistanceKm, 0).toFixed(2),
  );

  const summaryRows = [
    ["항목", "내용"],
    ["지역", office.name],
    ["출장 기간", `${settings.startDate} ~ ${settings.endDate}`],
    ["주말", settings.includeWeekends ? "포함" : "제외"],
    ["일 최대 방문 가능 기관(학교) 수", settings.visitsPerDay],
    ["선택 기관 수", selectedCount],
    ["배정 기관 수", assignedCount],
    ["미배정 기관 수", plan.unassigned.length],
    ["총 이동거리(km)", totalDistanceKm],
    ["생성일시", formatDateTime(plan.generatedAt)],
  ];

  const routeRows: Array<Array<string | number>> = [
    [
      "일자",
      "요일",
      "일차",
      "방문순번",
      "기관명",
      "구분",
      "시군구",
      "주소",
      "이전구간(km)",
      "일자 합계(km)",
    ],
  ];

  plan.days.forEach((day, dayIndex) => {
    day.stops.forEach((stop) => {
      routeRows.push([
        day.date,
        day.weekday,
        dayIndex + 1,
        stop.order,
        stop.institution.name,
        typeLabel(stop.institution.type),
        stop.institution.district,
        stop.institution.address,
        stop.distanceFromPrevKm,
        day.totalDistanceKm,
      ]);
    });
  });

  const unassignedRows: Array<Array<string | number>> = [["기관명", "구분", "시군구", "주소", "사유"]];
  if (plan.unassigned.length === 0) {
    unassignedRows.push(["미배정 기관 없음", "", "", "", ""]);
  } else {
    for (const item of plan.unassigned) {
      unassignedRows.push([
        item.name,
        typeLabel(item.type),
        item.district,
        item.address,
        hasCoordinates(item) ? "출장 일수 부족" : "좌표 없음",
      ]);
    }
  }

  const filename = `PathFinder_동선_${office.shortName}_${fileStamp(settings.startDate)}.xlsx`;
  const { downloadWorkbook } = await import("@/lib/excel-file");
  await downloadWorkbook(filename, [
    { name: "요약", rows: summaryRows, columnWidths: [22, 36] },
    {
      name: "일자별 동선",
      rows: routeRows,
      columnWidths: [12, 8, 8, 10, 28, 12, 12, 42, 14, 14],
    },
    { name: "미배정", rows: unassignedRows, columnWidths: [28, 12, 12, 42, 16] },
  ]);
}
