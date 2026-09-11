import type { MapCenter } from "@/lib/regions";

export type { MapCenter };
export { DAEGU_CENTER, DAEGU_DISTRICTS, DEFAULT_OFFICE_CODE } from "@/lib/regions";

export type InstitutionType = "school" | "office" | "other";
export type InstitutionSource = "dummy" | "neis" | "kakao";

export interface Institution {
  id: string;
  name: string;
  type: InstitutionType;
  address: string;
  district: string;
  officeCode: string;
  lat: number | null;
  lng: number | null;
  schoolCode?: string;
  source: InstitutionSource;
  keywords?: string[];
}

export interface TripWaypoint {
  id: string;
  name: string;
  address: string;
  district: string;
  lat: number;
  lng: number;
}

export interface TripSettings {
  visitsPerDay: number;
  startDate: string;
  endDate: string;
  includeWeekends: boolean;
  startPoint: TripWaypoint;
  returnPoint: TripWaypoint;
  returnSameAsStart: boolean;
}

export interface RouteStop {
  order: number;
  institution: Institution;
  distanceFromPrevKm: number;
}

export interface DailyRoute {
  id: string;
  date: string;
  dayLabel: string;
  weekday: string;
  stops: RouteStop[];
  totalDistanceKm: number;
  commuteToReturnKm: number;
}

export interface RoutePlan {
  days: DailyRoute[];
  unassigned: Institution[];
  generatedAt: string;
}

export const DAY_COLORS = [
  "#2563eb",
  "#059669",
  "#d97706",
  "#dc2626",
  "#7c3aed",
  "#0891b2",
  "#db2777",
  "#4f46e5",
] as const;

export function hasCoordinates(
  institution: Institution,
): institution is Institution & { lat: number; lng: number } {
  return institution.lat !== null && institution.lng !== null;
}
