import { DAEGU_DIRECT_INSTITUTIONS } from "@/lib/daegu-direct-institutions";
import { DEFAULT_OFFICE_CODE, matchesSelectedOffice } from "@/lib/regions";
import type { Institution } from "@/lib/types";

const CITY_HQ_KEYWORDS = ["본청", "시교육청"];
const PROVINCE_HQ_KEYWORDS = ["본청", "도교육청"];
const HQ_QUERIES = new Set(["본청", "시교육청", "도교육청"]);

export const DUMMY_INSTITUTIONS: Institution[] = [
  ...DAEGU_DIRECT_INSTITUTIONS,
  {
    id: "dummy-seoul-office",
    name: "서울특별시교육청",
    type: "office",
    address: "서울특별시 종로구 송월길 48",
    district: "종로구",
    officeCode: "B10",
    lat: 37.5729,
    lng: 126.9618,
    source: "dummy",
    keywords: CITY_HQ_KEYWORDS,
  },
  {
    id: "dummy-busan-office",
    name: "부산광역시교육청",
    type: "office",
    address: "부산광역시 연제구 중앙대로 2222",
    district: "연제구",
    officeCode: "C10",
    lat: 35.176,
    lng: 129.075,
    source: "dummy",
    keywords: CITY_HQ_KEYWORDS,
  },
  {
    id: "dummy-incheon-office",
    name: "인천광역시교육청",
    type: "office",
    address: "인천광역시 남동구 정각로 9",
    district: "남동구",
    officeCode: "E10",
    lat: 37.4485,
    lng: 126.7313,
    source: "dummy",
    keywords: CITY_HQ_KEYWORDS,
  },
  {
    id: "dummy-gwangju-office",
    name: "전남광주통합특별시교육청 광주청사",
    type: "office",
    address: "광주광역시 서구 화운로 117",
    district: "서구",
    officeCode: "F10",
    lat: 35.1522,
    lng: 126.8513,
    source: "dummy",
    keywords: ["광주교육청", "광주광역시교육청", "전남광주", "통합교육청", ...CITY_HQ_KEYWORDS],
  },
  {
    id: "dummy-daejeon-office",
    name: "대전광역시교육청",
    type: "office",
    address: "대전광역시 서구 청사로 130",
    district: "서구",
    officeCode: "G10",
    lat: 36.3575,
    lng: 127.3812,
    source: "dummy",
    keywords: CITY_HQ_KEYWORDS,
  },
  {
    id: "dummy-ulsan-office",
    name: "울산광역시교육청",
    type: "office",
    address: "울산광역시 남구 꽃대나리로 196",
    district: "남구",
    officeCode: "H10",
    lat: 35.5388,
    lng: 129.3301,
    source: "dummy",
    keywords: CITY_HQ_KEYWORDS,
  },
  {
    id: "dummy-sejong-office",
    name: "세종특별자치시교육청",
    type: "office",
    address: "세종특별자치시 한누리대로 2154",
    district: "세종시",
    officeCode: "I10",
    lat: 36.4796,
    lng: 127.2892,
    source: "dummy",
    keywords: CITY_HQ_KEYWORDS,
  },
  {
    id: "dummy-gyeonggi-office",
    name: "경기도교육청",
    type: "office",
    address: "경기도 수원시 영통구 도청로 30",
    district: "수원시",
    officeCode: "J10",
    lat: 37.2749,
    lng: 127.0095,
    source: "dummy",
    keywords: PROVINCE_HQ_KEYWORDS,
  },
  {
    id: "dummy-gangwon-office",
    name: "강원특별자치도교육청",
    type: "office",
    address: "강원특별자치도 춘천시 춘의로 111",
    district: "춘천시",
    officeCode: "K10",
    lat: 37.8813,
    lng: 127.73,
    source: "dummy",
    keywords: PROVINCE_HQ_KEYWORDS,
  },
  {
    id: "dummy-chungbuk-office",
    name: "충청북도교육청",
    type: "office",
    address: "충청북도 청주시 흥덕구 공단로 87",
    district: "청주시",
    officeCode: "M10",
    lat: 36.6424,
    lng: 127.489,
    source: "dummy",
    keywords: PROVINCE_HQ_KEYWORDS,
  },
  {
    id: "dummy-chungnam-office",
    name: "충청남도교육청",
    type: "office",
    address: "충청남도 홍성군 홍북읍 충남대로 21",
    district: "홍성군",
    officeCode: "N10",
    lat: 36.659,
    lng: 126.673,
    source: "dummy",
    keywords: PROVINCE_HQ_KEYWORDS,
  },
  {
    id: "dummy-jeonbuk-office",
    name: "전북특별자치도교육청",
    type: "office",
    address: "전북특별자치도 전주시 완산구 홍산로 111",
    district: "전주시",
    officeCode: "P10",
    lat: 35.821,
    lng: 127.1089,
    source: "dummy",
    keywords: PROVINCE_HQ_KEYWORDS,
  },
  {
    id: "dummy-jeonnam-office",
    name: "전남광주통합특별시교육청 무안청사",
    type: "office",
    address: "전남광주통합특별시 무안군 삼향읍 남악로 38",
    district: "무안군",
    officeCode: "Q10",
    lat: 34.8161,
    lng: 126.4629,
    source: "dummy",
    keywords: ["전남교육청", "전라남도교육청", "전남광주", "통합교육청", ...PROVINCE_HQ_KEYWORDS],
  },
  {
    id: "dummy-gyeongbuk-office",
    name: "경상북도교육청",
    type: "office",
    address: "경상북도 안동시 서동문로 121",
    district: "안동시",
    officeCode: "R10",
    lat: 36.5684,
    lng: 128.7294,
    source: "dummy",
    keywords: PROVINCE_HQ_KEYWORDS,
  },
  {
    id: "dummy-gyeongnam-office",
    name: "경상남도교육청",
    type: "office",
    address: "경상남도 창원시 의창구 중앙대로 136",
    district: "창원시",
    officeCode: "S10",
    lat: 35.2272,
    lng: 128.6811,
    source: "dummy",
    keywords: PROVINCE_HQ_KEYWORDS,
  },
  {
    id: "dummy-jeju-office",
    name: "제주특별자치도교육청",
    type: "office",
    address: "제주특별자치도 제주시 문연로 5",
    district: "제주시",
    officeCode: "T10",
    lat: 33.489,
    lng: 126.4983,
    source: "dummy",
    keywords: PROVINCE_HQ_KEYWORDS,
  },
];

function institutionListRank(item: Institution): number {
  const keywords = item.keywords ?? [];
  const name = item.name;
  if (name.includes("지원청") || keywords.includes("지원청")) return 1;
  if (name.includes("도서관") || keywords.includes("도서관")) return 3;
  if (name.includes("수련원") || keywords.includes("수련원")) return 4;
  if (item.id === "dge-hq" || (name.includes("교육청") && !name.includes("지원청"))) return 0;
  return 2;
}

function matchesHeadquartersQuery(item: Institution, query: string): boolean {
  const keywords = item.keywords ?? [];
  const name = item.name;
  if (name.includes("지원청")) return false;

  const isHq =
    keywords.includes("본청") ||
    name.includes("시교육청") ||
    name.includes("도교육청") ||
    name.includes("특별시교육청") ||
    name.includes("자치시교육청") ||
    name.includes("자치도교육청");
  if (!isHq) return false;

  if (query === "본청") return true;
  if (query === "시교육청") {
    return keywords.includes("시교육청") || name.includes("시교육청") || name.includes("특별시교육청");
  }
  if (query === "도교육청") {
    return keywords.includes("도교육청") || name.includes("도교육청") || name.includes("자치도교육청");
  }
  return false;
}

export function searchDummyInstitutions(
  query: string,
  officeCode: string = DEFAULT_OFFICE_CODE,
  district?: string,
): Institution[] {
  const normalized = query.trim().toLowerCase();

  return DUMMY_INSTITUTIONS.map((item, index) => ({ item, index }))
    .filter(({ item }) => {
      if (HQ_QUERIES.has(normalized)) {
        return matchesHeadquartersQuery(item, normalized);
      }

      const matchesOffice = matchesSelectedOffice(item.officeCode, officeCode);
      const matchesDistrict = !district || district === "all" || item.district === district;
      if (!matchesOffice || !matchesDistrict) return false;
      if (!normalized) return true;

      const haystack = [
        item.name,
        item.address,
        item.district,
        ...(item.keywords ?? []),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalized);
    })
    .sort((left, right) => {
      const rankDiff = institutionListRank(left.item) - institutionListRank(right.item);
      if (rankDiff !== 0) return rankDiff;
      return left.index - right.index;
    })
    .map(({ item }) => item);
}
