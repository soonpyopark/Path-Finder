import { DAEGU_CENTER, type MapCenter } from "@/lib/regions";
import {
  hasCoordinates,
  type DailyRoute,
  type Institution,
  type RoutePlan,
  type RouteStop,
  type TripSettings,
} from "@/lib/types";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;
const EARTH_RADIUS_KM = 6371;

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

export function haversineKm(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): number {
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

function parseISODate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

export function formatISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayISO(): string {
  return formatISODate(new Date());
}

export function addDaysISO(isoDate: string, days: number): string {
  const date = parseISODate(isoDate);
  date.setDate(date.getDate() + days);
  return formatISODate(date);
}

export function formatKoreanDate(isoDate: string): { dayLabel: string; weekday: string } {
  const date = parseISODate(isoDate);
  const weekday = WEEKDAYS[date.getDay()] ?? "";
  return {
    dayLabel: `${date.getMonth() + 1}월 ${date.getDate()}일`,
    weekday,
  };
}

export function workingDates(startDate: string, endDate: string, includeWeekends: boolean): string[] {
  const dates: string[] = [];
  const cursor = parseISODate(startDate);
  const last = parseISODate(endDate);

  if (Number.isNaN(cursor.getTime()) || Number.isNaN(last.getTime()) || cursor > last) {
    return dates;
  }

  while (cursor <= last) {
    const day = cursor.getDay();
    if (includeWeekends || (day !== 0 && day !== 6)) {
      dates.push(formatISODate(cursor));
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

function nearestNeighborOrder(
  institutions: Institution[],
  startCenter: MapCenter = DAEGU_CENTER,
): Institution[] {
  const remaining = institutions.filter(hasCoordinates);
  const ordered: Institution[] = [];
  let current: MapCenter = startCenter;

  while (remaining.length > 0) {
    let bestIndex = 0;
    let bestDistance = Number.POSITIVE_INFINITY;

    remaining.forEach((institution, index) => {
      const distance = haversineKm(current, {
        lat: institution.lat,
        lng: institution.lng,
      });
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    });

    const [next] = remaining.splice(bestIndex, 1);
    if (!next) break;
    ordered.push(next);
    current = { lat: next.lat as number, lng: next.lng as number };
  }

  return ordered;
}

function buildStops(institutions: Institution[]): RouteStop[] {
  let previous: { lat: number; lng: number } | null = null;

  return institutions.map((institution, index) => {
    let distanceFromPrevKm = 0;
    if (previous && hasCoordinates(institution)) {
      distanceFromPrevKm = haversineKm(previous, institution);
    }
    if (hasCoordinates(institution)) {
      previous = { lat: institution.lat, lng: institution.lng };
    }

    return {
      order: index + 1,
      institution,
      distanceFromPrevKm: Number(distanceFromPrevKm.toFixed(2)),
    };
  });
}

export function buildRoutePlan(
  institutions: Institution[],
  settings: TripSettings,
  startCenter: MapCenter = DAEGU_CENTER,
): RoutePlan {
  const withCoords = nearestNeighborOrder(institutions, startCenter);
  const withoutCoords = institutions.filter((item) => !hasCoordinates(item));
  const dates = workingDates(settings.startDate, settings.endDate, settings.includeWeekends);
  const visitsPerDay = Math.max(1, Math.min(12, Math.floor(settings.visitsPerDay) || 1));

  const days: DailyRoute[] = [];
  let cursor = 0;

  for (const date of dates) {
    if (cursor >= withCoords.length) break;
    const chunk = withCoords.slice(cursor, cursor + visitsPerDay);
    cursor += visitsPerDay;
    const stops = buildStops(chunk);
    const totalDistanceKm = Number(
      stops.reduce((sum, stop) => sum + stop.distanceFromPrevKm, 0).toFixed(2),
    );
    const labels = formatKoreanDate(date);

    days.push({
      id: `day-${date}`,
      date,
      dayLabel: labels.dayLabel,
      weekday: labels.weekday,
      stops,
      totalDistanceKm,
    });
  }

  return {
    days,
    unassigned: [...withCoords.slice(cursor), ...withoutCoords],
    generatedAt: new Date().toISOString(),
  };
}
