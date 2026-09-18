import { DAEGU_CENTER, type MapCenter } from "@/lib/regions";
import {
  hasCoordinates,
  type DailyRoute,
  type Institution,
  type RoutePlan,
  type RouteStop,
  type TripSettings,
  type TripWaypoint,
} from "@/lib/types";
import { resolvedReturnPoint } from "@/lib/waypoints";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;
const EARTH_RADIUS_KM = 6371;
const MAX_VISITS_PER_DAY = 12;
const MAX_TRAVELERS = 10;

type GeoInstitution = Institution & { lat: number; lng: number };

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

function clampMaxVisits(value: number): number {
  return Math.max(1, Math.min(MAX_VISITS_PER_DAY, Math.floor(value) || 1));
}

export function clampTravelerCount(value: number): number {
  return Math.max(1, Math.min(MAX_TRAVELERS, Math.floor(value) || 1));
}

export function travelerLabel(travelerIndex: number): string {
  return `출장자 ${travelerIndex + 1}`;
}

export function suggestedVisitsPerDay(
  selectedCount: number,
  startDate: string,
  endDate: string,
  includeWeekends: boolean,
  travelerCount = 1,
): number {
  const dayCount = Math.max(1, workingDates(startDate, endDate, includeWeekends).length);
  if (selectedCount <= 0) return 1;
  return clampMaxVisits(Math.ceil(selectedCount / (dayCount * clampTravelerCount(travelerCount))));
}

export function balancedDaySizes(total: number, dayCount: number, maxPerDay: number): number[] {
  if (total <= 0 || dayCount <= 0) return [];

  const sizes = Array.from({ length: dayCount }, () => 0);
  const usable = Math.min(total, dayCount * maxPerDay);
  const base = Math.floor(usable / dayCount);
  let extra = usable % dayCount;

  for (let index = 0; index < dayCount; index += 1) {
    const size = base + (extra > 0 ? 1 : 0);
    sizes[index] = Math.min(maxPerDay, size);
    if (extra > 0) extra -= 1;
  }

  return sizes.filter((size) => size > 0);
}

function centroidOf(points: GeoInstitution[]): MapCenter {
  if (points.length === 0) return DAEGU_CENTER;
  const lat = points.reduce((sum, item) => sum + item.lat, 0) / points.length;
  const lng = points.reduce((sum, item) => sum + item.lng, 0) / points.length;
  return { lat, lng };
}

function pickSpreadSeeds(
  points: GeoInstitution[],
  count: number,
  startCenter: MapCenter,
): GeoInstitution[] {
  const remaining = [...points];
  const seeds: GeoInstitution[] = [];
  if (remaining.length === 0 || count <= 0) return seeds;

  let nearestIndex = 0;
  let nearestDistance = Number.POSITIVE_INFINITY;
  remaining.forEach((item, index) => {
    const distance = haversineKm(startCenter, item);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  });
  const first = remaining.splice(nearestIndex, 1)[0];
  if (first) seeds.push(first);

  while (seeds.length < count && remaining.length > 0) {
    let farthestIndex = 0;
    let farthestDistance = -1;
    remaining.forEach((item, index) => {
      const distance = Math.min(...seeds.map((seed) => haversineKm(seed, item)));
      if (distance > farthestDistance) {
        farthestDistance = distance;
        farthestIndex = index;
      }
    });
    const next = remaining.splice(farthestIndex, 1)[0];
    if (next) seeds.push(next);
  }

  return seeds;
}

function nearestSeedIndex(item: GeoInstitution, seeds: GeoInstitution[]): number {
  let bestIndex = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  seeds.forEach((seed, index) => {
    const distance = haversineKm(item, seed);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  });
  return bestIndex;
}

function clusterByProximity(
  points: GeoInstitution[],
  sizes: number[],
  startCenter: MapCenter,
): GeoInstitution[][] {
  const clusters: GeoInstitution[][] = Array.from({ length: sizes.length }, () => []);
  if (points.length === 0 || sizes.length === 0) return clusters;

  const seeds = pickSpreadSeeds(points, sizes.length, startCenter);
  if (seeds.length === 0) return clusters;

  for (const item of points) {
    clusters[nearestSeedIndex(item, seeds)]?.push(item);
  }

  rebalanceClusterSizes(clusters, sizes);
  refineClusterSwaps(clusters);
  return clusters.filter((cluster) => cluster.length > 0);
}

function rebalanceClusterSizes(clusters: GeoInstitution[][], sizes: number[]): void {
  const maxPasses = clusters.reduce((sum, cluster) => sum + cluster.length, 0) * 3;

  for (let pass = 0; pass < maxPasses; pass += 1) {
    const underIndex = clusters.findIndex((cluster, index) => cluster.length < (sizes[index] ?? 0));
    if (underIndex < 0) break;

    const destination = clusters[underIndex] ?? [];
    const destCenter = destination.length > 0 ? centroidOf(destination) : null;
    let bestSource = -1;
    let bestPoint = -1;
    let bestDistance = Number.POSITIVE_INFINITY;

    clusters.forEach((source, sourceIndex) => {
      if (source.length <= (sizes[sourceIndex] ?? 0)) return;
      const center = destCenter ?? centroidOf(source);
      source.forEach((item, pointIndex) => {
        const distance = haversineKm(item, center);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestSource = sourceIndex;
          bestPoint = pointIndex;
        }
      });
    });

    if (bestSource < 0 || bestPoint < 0) break;
    const moved = clusters[bestSource]?.splice(bestPoint, 1)[0];
    if (moved) destination.push(moved);
  }
}

function refineClusterSwaps(clusters: GeoInstitution[][]): void {
  const centers = clusters.map((cluster) => centroidOf(cluster));
  let improved = true;
  let guard = 0;

  while (improved && guard < 40) {
    improved = false;
    guard += 1;

    for (let i = 0; i < clusters.length; i += 1) {
      for (let j = i + 1; j < clusters.length; j += 1) {
        const left = clusters[i] ?? [];
        const right = clusters[j] ?? [];
        const leftCenter = centers[i];
        const rightCenter = centers[j];
        if (!leftCenter || !rightCenter) continue;

        for (let a = 0; a < left.length; a += 1) {
          for (let b = 0; b < right.length; b += 1) {
            const pointA = left[a];
            const pointB = right[b];
            if (!pointA || !pointB) continue;
            const current = haversineKm(pointA, leftCenter) + haversineKm(pointB, rightCenter);
            const swapped = haversineKm(pointA, rightCenter) + haversineKm(pointB, leftCenter);
            if (swapped + 0.01 < current) {
              left[a] = pointB;
              right[b] = pointA;
              centers[i] = centroidOf(left);
              centers[j] = centroidOf(right);
              improved = true;
            }
          }
        }
      }
    }
  }
}

function pathLength(points: GeoInstitution[]): number {
  let total = 0;
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    if (previous && current) total += haversineKm(previous, current);
  }
  return total;
}

function nearestNeighborFrom(points: GeoInstitution[], startIndex: number): GeoInstitution[] {
  const remaining = [...points];
  const ordered: GeoInstitution[] = [];
  const first = remaining.splice(startIndex, 1)[0];
  if (!first) return ordered;
  ordered.push(first);

  while (remaining.length > 0) {
    const current = ordered[ordered.length - 1];
    if (!current) break;
    let bestIndex = 0;
    let bestDistance = Number.POSITIVE_INFINITY;
    remaining.forEach((item, index) => {
      const distance = haversineKm(current, item);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    });
    const next = remaining.splice(bestIndex, 1)[0];
    if (!next) break;
    ordered.push(next);
  }

  return ordered;
}

function twoOptPath(points: GeoInstitution[]): GeoInstitution[] {
  if (points.length < 4) return points;

  const route = [...points];
  let improved = true;
  let guard = 0;

  while (improved && guard < 80) {
    improved = false;
    guard += 1;
    for (let i = 0; i < route.length - 2; i += 1) {
      for (let k = i + 2; k < route.length; k += 1) {
        const candidate = route.slice(0, i + 1).concat(route.slice(i + 1, k + 1).reverse(), route.slice(k + 1));
        if (pathLength(candidate) + 0.001 < pathLength(route)) {
          route.splice(0, route.length, ...candidate);
          improved = true;
        }
      }
    }
  }

  return route;
}

function heldKarpPath(points: GeoInstitution[], startIndex: number): GeoInstitution[] {
  const count = points.length;
  const dist: number[][] = Array.from({ length: count }, (_, from) =>
    Array.from({ length: count }, (_, to) => {
      if (from === to) return 0;
      const left = points[from];
      const right = points[to];
      return left && right ? haversineKm(left, right) : 0;
    }),
  );

  const subsetCount = 1 << count;
  const inf = Number.POSITIVE_INFINITY;
  const dp = Array.from({ length: subsetCount }, () => Array.from({ length: count }, () => inf));
  const parent = Array.from({ length: subsetCount }, () => Array.from({ length: count }, () => -1));
  dp[1 << startIndex][startIndex] = 0;

  for (let mask = 0; mask < subsetCount; mask += 1) {
    for (let last = 0; last < count; last += 1) {
      const currentCost = dp[mask]?.[last];
      if (currentCost === undefined || currentCost === inf || (mask & (1 << last)) === 0) continue;
      for (let next = 0; next < count; next += 1) {
        if ((mask & (1 << next)) !== 0) continue;
        const nextMask = mask | (1 << next);
        const nextCost = currentCost + (dist[last]?.[next] ?? inf);
        const row = dp[nextMask];
        if (row && nextCost < (row[next] ?? inf)) {
          row[next] = nextCost;
          const parentRow = parent[nextMask];
          if (parentRow) parentRow[next] = last;
        }
      }
    }
  }

  const fullMask = subsetCount - 1;
  let endIndex = startIndex;
  let bestCost = inf;
  (dp[fullMask] ?? []).forEach((cost, index) => {
    if (cost < bestCost) {
      bestCost = cost;
      endIndex = index;
    }
  });

  const order: number[] = [];
  let mask = fullMask;
  let current = endIndex;
  while (current >= 0) {
    order.push(current);
    const previous = parent[mask]?.[current] ?? -1;
    mask ^= 1 << current;
    current = previous;
  }
  order.reverse();
  return order.map((index) => points[index]).filter((item): item is GeoInstitution => Boolean(item));
}

function tourLength(
  path: GeoInstitution[],
  startPoint: TripWaypoint,
  returnPoint: TripWaypoint,
): number {
  if (path.length === 0) return 0;
  const first = path[0];
  const last = path[path.length - 1];
  if (!first || !last) return 0;
  return haversineKm(startPoint, first) + pathLength(path) + haversineKm(last, returnPoint);
}

function orientPathTowardReturn(path: GeoInstitution[], returnPoint: TripWaypoint): GeoInstitution[] {
  if (path.length < 2) return path;
  const first = path[0];
  const last = path[path.length - 1];
  if (!first || !last) return path;
  if (haversineKm(returnPoint, last) <= haversineKm(returnPoint, first)) return path;
  return [...path].reverse();
}

function shortestVisitOrder(
  points: GeoInstitution[],
  startPoint: TripWaypoint,
  returnPoint: TripWaypoint,
): GeoInstitution[] {
  if (points.length <= 1) return points;

  let best = points;
  let bestLength = Number.POSITIVE_INFINITY;

  for (let startIndex = 0; startIndex < points.length; startIndex += 1) {
    const candidate =
      points.length <= MAX_VISITS_PER_DAY
        ? heldKarpPath(points, startIndex)
        : twoOptPath(nearestNeighborFrom(points, startIndex));
    const length = tourLength(candidate, startPoint, returnPoint);
    const last = candidate[candidate.length - 1];
    const bestLast = best[best.length - 1];
    const closerReturn =
      last && bestLast
        ? haversineKm(returnPoint, last) + 0.001 < haversineKm(returnPoint, bestLast)
        : false;
    if (length + 0.001 < bestLength || (Math.abs(length - bestLength) <= 0.001 && closerReturn)) {
      bestLength = length;
      best = candidate;
    }
  }

  return orientPathTowardReturn(best, returnPoint);
}

function buildStops(institutions: Institution[], startPoint: TripWaypoint): RouteStop[] {
  let previous: { lat: number; lng: number } | null = startPoint;

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

function compareByOfficeDistance(left: GeoInstitution[], right: GeoInstitution[], startCenter: MapCenter): number {
  return haversineKm(centroidOf(left), startCenter) - haversineKm(centroidOf(right), startCenter);
}

export function buildRoutePlan(
  institutions: Institution[],
  settings: TripSettings,
  startCenter: MapCenter = DAEGU_CENTER,
): RoutePlan {
  const startPoint = settings.startPoint ?? {
    id: "fallback-start",
    name: "출발지",
    address: "",
    district: "",
    lat: startCenter.lat,
    lng: startCenter.lng,
  };
  const returnPoint = settings.startPoint ? resolvedReturnPoint(settings) : startPoint;
  const depotCenter = { lat: startPoint.lat, lng: startPoint.lng };
  const geoPoints = institutions.filter(hasCoordinates);
  const withoutCoords = institutions.filter((item) => !hasCoordinates(item));
  const dates = workingDates(settings.startDate, settings.endDate, settings.includeWeekends);
  const maxPerDay = clampMaxVisits(settings.visitsPerDay);

  if (dates.length === 0 || geoPoints.length === 0) {
    return {
      days: [],
      unassigned: [...geoPoints, ...withoutCoords],
      generatedAt: new Date().toISOString(),
    };
  }

  const travelerCount = clampTravelerCount(settings.travelerCount ?? 1);
  const perTravelerCapacity = dates.length * maxPerDay;
  const capacity = perTravelerCapacity * travelerCount;
  const ranked = [...geoPoints].sort(
    (left, right) => haversineKm(centroidOf(geoPoints), left) - haversineKm(centroidOf(geoPoints), right),
  );
  const kept = ranked.slice(0, capacity);
  const overflow = ranked.slice(capacity);

  // Each traveler gets a territory of nearby visits, then plans their own days inside it.
  const territorySizes = balancedDaySizes(kept.length, travelerCount, perTravelerCapacity);
  const territories = (
    travelerCount > 1 ? clusterByProximity(kept, territorySizes, depotCenter) : [kept]
  ).sort((left, right) => compareByOfficeDistance(left, right, depotCenter));

  const days: DailyRoute[] = territories.flatMap((territory, travelerIndex) => {
    const dayCount = Math.min(dates.length, Math.max(1, Math.ceil(territory.length / maxPerDay)));
    const sizes = balancedDaySizes(territory.length, dayCount, maxPerDay);
    const assigned = clusterByProximity(territory, sizes, depotCenter).sort((left, right) =>
      compareByOfficeDistance(left, right, depotCenter),
    );

    return assigned.map((cluster, dayIndex) => {
      const date = dates[dayIndex] ?? "";
      const ordered = shortestVisitOrder(cluster, startPoint, returnPoint);
      const stops = buildStops(ordered, startPoint);
      const lastStop = ordered[ordered.length - 1];
      const commuteToReturnKm = lastStop ? Number(haversineKm(lastStop, returnPoint).toFixed(2)) : 0;
      const labels = formatKoreanDate(date);

      return {
        id: `day-${travelerIndex + 1}-${date}`,
        date,
        dayLabel: labels.dayLabel,
        weekday: labels.weekday,
        travelerIndex,
        travelerLabel: travelerLabel(travelerIndex),
        stops,
        commuteToReturnKm,
        totalDistanceKm: Number(
          (stops.reduce((sum, stop) => sum + stop.distanceFromPrevKm, 0) + commuteToReturnKm).toFixed(2),
        ),
      };
    });
  });

  return {
    days,
    unassigned: [...overflow, ...withoutCoords],
    generatedAt: new Date().toISOString(),
  };
}
