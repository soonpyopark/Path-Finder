import { findOfficeHeadquarters } from "@/lib/dummy-schools";
import { NATIONWIDE_OFFICE_CODE, type EducationOffice } from "@/lib/regions";
import { hasCoordinates, type Institution, type TripSettings, type TripWaypoint } from "@/lib/types";

export function waypointFromInstitution(item: Institution): TripWaypoint | null {
  if (!hasCoordinates(item)) return null;
  return {
    id: item.id,
    name: item.name,
    address: item.address,
    district: item.district,
    lat: item.lat,
    lng: item.lng,
  };
}

export function waypointFromOffice(office: EducationOffice): TripWaypoint {
  const headquarters = findOfficeHeadquarters(office.code);
  const fromHq = headquarters ? waypointFromInstitution(headquarters) : null;
  if (fromHq) return fromHq;

  const suffix = office.code === NATIONWIDE_OFFICE_CODE ? "" : "교육청";
  return {
    id: `region-office-${office.code}`,
    name: `${office.name}${suffix}`.trim(),
    address: "",
    district: "",
    lat: office.center.lat,
    lng: office.center.lng,
  };
}

export function isOfficeDefaultWaypoint(point: TripWaypoint, office: EducationOffice): boolean {
  if (point.id === `region-office-${office.code}`) return true;
  const headquarters = findOfficeHeadquarters(office.code);
  return headquarters?.id === point.id;
}

export function resolvedReturnPoint(settings: TripSettings): TripWaypoint {
  return settings.returnSameAsStart ? settings.startPoint : settings.returnPoint;
}

export function waypointsEqual(left: TripWaypoint, right: TripWaypoint): boolean {
  return Math.abs(left.lat - right.lat) < 1e-5 && Math.abs(left.lng - right.lng) < 1e-5;
}
