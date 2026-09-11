import { DAEGU_DIRECT_INSTITUTIONS } from "@/lib/daegu-direct-institutions";
import { DEFAULT_OFFICE_CODE, matchesSelectedOffice, NATIONWIDE_OFFICE_CODE } from "@/lib/regions";
import type { Institution } from "@/lib/types";

const CITY_HQ_KEYWORDS = ["본청", "시교육청"];
const PROVINCE_HQ_KEYWORDS = ["본청", "도교육청"];
const HQ_QUERIES = new Set(["본청", "시교육청", "도교육청"]);

export const DUMMY_INSTITUTIONS: Institution[] = [
  ...DAEGU_DIRECT_INSTITUTIONS,
  // HQ coordinates are Kakao Places POIs for the current office buildings.
  {
    id: "dummy-seoul-office",
    name: "서울특별시교육청",
    type: "office",
    address: "서울특별시 용산구 두텁바위로 27",
    district: "용산구",
    officeCode: "B10",
    lat: 37.54638,
    lng: 126.975682,
    source: "dummy",
    keywords: ["용산", "신청사", ...CITY_HQ_KEYWORDS],
  },
  {
    id: "dummy-busan-office",
    name: "부산광역시교육청",
    type: "office",
    address: "부산광역시 부산진구 화지로 12",
    district: "부산진구",
    officeCode: "C10",
    lat: 35.176216,
    lng: 129.064736,
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
    lat: 37.456278,
    lng: 126.70311,
    source: "dummy",
    keywords: CITY_HQ_KEYWORDS,
  },
  {
    id: "dummy-gwangju-office",
    name: "전남광주통합특별시교육청 광주청사",
    type: "office",
    address: "전남광주통합특별시 서구 화운로 93",
    district: "서구",
    officeCode: "F10",
    lat: 35.147462,
    lng: 126.879773,
    source: "dummy",
    keywords: ["광주교육청", "광주광역시교육청", "전남광주", "통합교육청", ...CITY_HQ_KEYWORDS],
  },
  {
    id: "dummy-daejeon-office",
    name: "대전광역시교육청",
    type: "office",
    address: "대전광역시 서구 둔산로 89",
    district: "서구",
    officeCode: "G10",
    lat: 36.352443,
    lng: 127.383875,
    source: "dummy",
    keywords: CITY_HQ_KEYWORDS,
  },
  {
    id: "dummy-ulsan-office",
    name: "울산광역시교육청",
    type: "office",
    address: "울산광역시 중구 북부순환도로 375",
    district: "중구",
    officeCode: "H10",
    lat: 35.562574,
    lng: 129.302328,
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
    lat: 36.478088,
    lng: 127.286276,
    source: "dummy",
    keywords: CITY_HQ_KEYWORDS,
  },
  {
    id: "dummy-gyeonggi-office",
    name: "경기도교육청",
    type: "office",
    address: "경기도 수원시 영통구 도청로 28",
    district: "수원시",
    officeCode: "J10",
    lat: 37.289003,
    lng: 127.054706,
    source: "dummy",
    keywords: ["남부청사", "광교", ...PROVINCE_HQ_KEYWORDS],
  },
  {
    id: "dummy-gangwon-office",
    name: "강원특별자치도교육청",
    type: "office",
    address: "강원특별자치도 춘천시 영서로 2854",
    district: "춘천시",
    officeCode: "K10",
    lat: 37.907463,
    lng: 127.725547,
    source: "dummy",
    keywords: PROVINCE_HQ_KEYWORDS,
  },
  {
    id: "dummy-chungbuk-office",
    name: "충청북도교육청",
    type: "office",
    address: "충청북도 청주시 서원구 청남로 1929",
    district: "청주시",
    officeCode: "M10",
    lat: 36.60671,
    lng: 127.47941,
    source: "dummy",
    keywords: PROVINCE_HQ_KEYWORDS,
  },
  {
    id: "dummy-chungnam-office",
    name: "충청남도교육청",
    type: "office",
    address: "충청남도 홍성군 홍북읍 선화로 22",
    district: "홍성군",
    officeCode: "N10",
    lat: 36.658,
    lng: 126.678074,
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
    lat: 35.804325,
    lng: 127.102627,
    source: "dummy",
    keywords: PROVINCE_HQ_KEYWORDS,
  },
  {
    id: "dummy-jeonnam-office",
    name: "전남광주통합특별시교육청 전남청사",
    type: "office",
    address: "전남광주통합특별시 무안군 삼향읍 어진누리길 10",
    district: "무안군",
    officeCode: "Q10",
    lat: 34.815678,
    lng: 126.469208,
    source: "dummy",
    keywords: ["전남교육청", "전라남도교육청", "전남광주", "통합교육청", "무안청사", "전남청사", ...PROVINCE_HQ_KEYWORDS],
  },
  {
    id: "dummy-gyeongbuk-office",
    name: "경상북도교육청",
    type: "office",
    address: "경상북도 안동시 풍천면 도청대로 511",
    district: "안동시",
    officeCode: "R10",
    lat: 36.579315,
    lng: 128.513223,
    source: "dummy",
    keywords: PROVINCE_HQ_KEYWORDS,
  },
  {
    id: "dummy-gyeongnam-office",
    name: "경상남도교육청",
    type: "office",
    address: "경상남도 창원시 성산구 중앙대로 241",
    district: "창원시",
    officeCode: "S10",
    lat: 35.234487,
    lng: 128.688011,
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
    lat: 33.490417,
    lng: 126.497979,
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

function isHeadquarters(item: Institution): boolean {
  const keywords = item.keywords ?? [];
  const name = item.name;
  if (item.type !== "office" || name.includes("지원청") || keywords.includes("지원청")) return false;
  return (
    keywords.includes("본청") ||
    name.includes("시교육청") ||
    name.includes("도교육청") ||
    name.includes("특별시교육청") ||
    name.includes("자치시교육청") ||
    name.includes("자치도교육청")
  );
}

export function findOfficeHeadquarters(officeCode: string): Institution | undefined {
  if (officeCode === NATIONWIDE_OFFICE_CODE) return undefined;
  return DUMMY_INSTITUTIONS.find(
    (item) => isHeadquarters(item) && matchesSelectedOffice(item.officeCode, officeCode),
  );
}

function matchesHeadquartersQuery(item: Institution, query: string): boolean {
  if (!isHeadquarters(item)) return false;
  const keywords = item.keywords ?? [];
  const name = item.name;

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
