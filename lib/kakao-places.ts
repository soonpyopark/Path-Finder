import { inferDistrictFromAddress, NATIONWIDE_OFFICE_CODE, type MapCenter } from "@/lib/regions";
import type { Institution } from "@/lib/types";

interface KakaoPlaceDocument {
  id?: string;
  place_name?: string;
  category_name?: string;
  address_name?: string;
  road_address_name?: string;
  x?: string;
  y?: string;
}

interface KakaoAddressDocument {
  address_name?: string;
  x?: string;
  y?: string;
  address?: {
    address_name?: string;
    region_2depth_name?: string;
    region_3depth_name?: string;
  };
  road_address?: {
    address_name?: string;
    building_name?: string;
    region_2depth_name?: string;
  };
}

export interface PlaceSearchOptions {
  center?: MapCenter;
  officeCode?: string;
  district?: string;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export async function waitForKakaoServices(timeoutMs = 6000): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (window.kakao?.maps?.services?.Places && window.kakao.maps.services.Geocoder) {
      return true;
    }
    await wait(120);
  }
  return Boolean(window.kakao?.maps?.services?.Places && window.kakao?.maps?.services?.Geocoder);
}

function inferPlaceType(category?: string): Institution["type"] {
  const value = category ?? "";
  if (value.includes("학교")) return "school";
  if (value.includes("교육청") || value.includes("공공기관")) return "office";
  return "other";
}

function toPlaceInstitution(
  name: string,
  address: string,
  lat: number,
  lng: number,
  id: string,
  category?: string,
  officeCode = NATIONWIDE_OFFICE_CODE,
): Institution {
  return {
    id,
    name: name.trim() || address,
    type: inferPlaceType(category),
    address: address.trim() || name,
    district: inferDistrictFromAddress(address, officeCode),
    officeCode,
    lat,
    lng,
    source: "kakao",
  };
}

function keywordSearch(keyword: string, center?: MapCenter): Promise<KakaoPlaceDocument[]> {
  const kakaoMaps = window.kakao?.maps;
  if (!kakaoMaps?.services?.Places) return Promise.resolve([]);

  return new Promise((resolve) => {
    const places = new kakaoMaps.services.Places();
    const options: { size: number; location?: unknown; radius?: number } = { size: 15 };
    if (center && kakaoMaps.LatLng) {
      options.location = new kakaoMaps.LatLng(center.lat, center.lng);
      options.radius = 20000;
    }

    places.keywordSearch(
      keyword,
      (result, status) => {
        if (status === "OK" && Array.isArray(result)) {
          resolve(result);
          return;
        }
        resolve([]);
      },
      options,
    );
  });
}

function addressSearch(query: string): Promise<KakaoAddressDocument[]> {
  const kakaoMaps = window.kakao?.maps;
  if (!kakaoMaps?.services?.Geocoder) return Promise.resolve([]);

  return new Promise((resolve) => {
    const geocoder = new kakaoMaps.services.Geocoder();
    geocoder.addressSearch(query, (result, status) => {
      if (status === "OK" && Array.isArray(result)) {
        resolve(result as KakaoAddressDocument[]);
        return;
      }
      resolve([]);
    });
  });
}

function mapPlaceDocuments(
  documents: KakaoPlaceDocument[],
  officeCode: string,
): Institution[] {
  return documents.flatMap((item) => {
    const lat = Number(item.y);
    const lng = Number(item.x);
    const address = (item.road_address_name || item.address_name || "").trim();
    const name = (item.place_name || "").trim();
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || (!name && !address)) return [];
    return [
      toPlaceInstitution(
        name,
        address,
        lat,
        lng,
        `kakao-${item.id || `${lng}-${lat}`}`,
        item.category_name,
        officeCode,
      ),
    ];
  });
}

function mapAddressDocuments(
  documents: KakaoAddressDocument[],
  officeCode: string,
): Institution[] {
  return documents.flatMap((item, index) => {
    const lat = Number(item.y);
    const lng = Number(item.x);
    const address =
      item.road_address?.address_name ||
      item.address?.address_name ||
      item.address_name ||
      "";
    const name =
      item.road_address?.building_name?.trim() ||
      item.address?.region_3depth_name?.trim() ||
      address;
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !address) return [];
    return [
      toPlaceInstitution(
        name,
        address,
        lat,
        lng,
        `kakao-addr-${lng}-${lat}-${index}`,
        "주소",
        officeCode,
      ),
    ];
  });
}

export async function searchKakaoPlaces(
  query: string,
  options: PlaceSearchOptions = {},
): Promise<Institution[]> {
  const keyword = query.trim();
  if (keyword.length < 2) return [];
  if (!(await waitForKakaoServices())) return [];

  const officeCode = options.officeCode || NATIONWIDE_OFFICE_CODE;
  const localCenter = officeCode === NATIONWIDE_OFFICE_CODE ? undefined : options.center;
  const [places, addresses] = await Promise.all([
    keywordSearch(keyword, localCenter),
    addressSearch(keyword),
  ]);

  let mappedPlaces = mapPlaceDocuments(places, officeCode);
  if (mappedPlaces.length === 0 && localCenter) {
    mappedPlaces = mapPlaceDocuments(await keywordSearch(keyword), officeCode);
  }

  const mappedAddresses = mapAddressDocuments(addresses, officeCode);
  const merged: Institution[] = [];
  const seen = new Set<string>();

  for (const item of [...mappedPlaces, ...mappedAddresses]) {
    if (options.district && options.district !== "all" && !item.address.includes(options.district) && item.district !== options.district) {
      continue;
    }
    const key = `${item.name}-${item.address}`.replace(/\s+/g, "");
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }

  return merged;
}
