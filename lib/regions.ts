export interface MapCenter {
  lat: number;
  lng: number;
}

export interface EducationOffice {
  code: string;
  name: string;
  shortName: string;
  center: MapCenter;
  mapLevel: number;
  districts: string[];
  aliasCodes?: string[];
  neisCodes?: string[];
}

export const NATIONWIDE_OFFICE_CODE = "ALL";
export const DEFAULT_OFFICE_CODE = "D10";
export const JEONNAM_GWANGJU_OFFICE_CODE = "JG10";
export const JEONNAM_GWANGJU_NEIS_CODES = ["F10", "Q10"] as const;

export const KOREA_CENTER: MapCenter = {
  lat: 36.5,
  lng: 127.8,
};

export const DAEGU_CENTER: MapCenter = {
  lat: 35.858352,
  lng: 128.61484,
};

export const EDUCATION_OFFICES: EducationOffice[] = [
  // Map centers are Kakao Places coordinates of each metropolitan/provincial education office HQ.
  {
    code: NATIONWIDE_OFFICE_CODE,
    name: "전국",
    shortName: "전국",
    center: KOREA_CENTER,
    mapLevel: 13,
    districts: [],
  },
  {
    code: "B10",
    name: "서울특별시",
    shortName: "서울",
    center: { lat: 37.54638, lng: 126.975682 },
    mapLevel: 8,
    districts: [
      "종로구",
      "중구",
      "용산구",
      "성동구",
      "광진구",
      "동대문구",
      "중랑구",
      "성북구",
      "강북구",
      "도봉구",
      "노원구",
      "은평구",
      "서대문구",
      "마포구",
      "양천구",
      "강서구",
      "구로구",
      "금천구",
      "영등포구",
      "동작구",
      "관악구",
      "서초구",
      "강남구",
      "송파구",
      "강동구",
    ],
  },
  {
    code: "C10",
    name: "부산광역시",
    shortName: "부산",
    center: { lat: 35.176216, lng: 129.064736 },
    mapLevel: 8,
    districts: [
      "중구",
      "서구",
      "동구",
      "영도구",
      "부산진구",
      "동래구",
      "남구",
      "북구",
      "해운대구",
      "사하구",
      "금정구",
      "강서구",
      "연제구",
      "수영구",
      "사상구",
      "기장군",
    ],
  },
  {
    code: "D10",
    name: "대구광역시",
    shortName: "대구",
    center: DAEGU_CENTER,
    mapLevel: 3,
    districts: ["중구", "동구", "서구", "남구", "북구", "수성구", "달서구", "달성군", "군위군"],
  },
  {
    code: "E10",
    name: "인천광역시",
    shortName: "인천",
    center: { lat: 37.456278, lng: 126.70311 },
    mapLevel: 8,
    districts: [
      "중구",
      "동구",
      "미추홀구",
      "연수구",
      "남동구",
      "부평구",
      "계양구",
      "서구",
      "강화군",
      "옹진군",
    ],
  },
  {
    code: JEONNAM_GWANGJU_OFFICE_CODE,
    name: "전남광주통합특별시",
    shortName: "전남광주",
    center: { lat: 35.147462, lng: 126.879773 },
    mapLevel: 10,
    aliasCodes: ["F10", "Q10"],
    neisCodes: [...JEONNAM_GWANGJU_NEIS_CODES],
    districts: [
      "동구",
      "서구",
      "남구",
      "북구",
      "광산구",
      "목포시",
      "여수시",
      "순천시",
      "나주시",
      "광양시",
      "무안군",
      "담양군",
      "화순군",
      "해남군",
      "영광군",
      "장성군",
      "완도군",
      "진도군",
      "신안군",
    ],
  },
  {
    code: "G10",
    name: "대전광역시",
    shortName: "대전",
    center: { lat: 36.352443, lng: 127.383875 },
    mapLevel: 8,
    districts: ["동구", "중구", "서구", "유성구", "대덕구"],
  },
  {
    code: "H10",
    name: "울산광역시",
    shortName: "울산",
    center: { lat: 35.562574, lng: 129.302328 },
    mapLevel: 8,
    districts: ["중구", "남구", "동구", "북구", "울주군"],
  },
  {
    code: "I10",
    name: "세종특별자치시",
    shortName: "세종",
    center: { lat: 36.478088, lng: 127.286276 },
    mapLevel: 8,
    districts: ["세종시"],
  },
  {
    code: "J10",
    name: "경기도",
    shortName: "경기",
    center: { lat: 37.289003, lng: 127.054706 },
    mapLevel: 10,
    districts: [
      "수원시",
      "성남시",
      "고양시",
      "용인시",
      "부천시",
      "안산시",
      "안양시",
      "남양주시",
      "화성시",
      "평택시",
      "의정부시",
      "시흥시",
      "파주시",
      "광명시",
      "김포시",
      "군포시",
      "광주시",
      "이천시",
      "양주시",
      "오산시",
      "구리시",
      "안성시",
      "포천시",
      "의왕시",
      "하남시",
      "여주시",
      "양평군",
      "동두천시",
      "과천시",
      "가평군",
      "연천군",
    ],
  },
  {
    code: "K10",
    name: "강원특별자치도",
    shortName: "강원",
    center: { lat: 37.907463, lng: 127.725547 },
    mapLevel: 11,
    districts: ["춘천시", "원주시", "강릉시", "동해시", "태백시", "속초시", "삼척시"],
  },
  {
    code: "M10",
    name: "충청북도",
    shortName: "충북",
    center: { lat: 36.60671, lng: 127.47941 },
    mapLevel: 10,
    districts: ["청주시", "충주시", "제천시"],
  },
  {
    code: "N10",
    name: "충청남도",
    shortName: "충남",
    center: { lat: 36.658, lng: 126.678074 },
    mapLevel: 10,
    districts: ["천안시", "공주시", "보령시", "아산시", "서산시", "논산시", "계룡시", "당진시", "홍성군"],
  },
  {
    code: "P10",
    name: "전북특별자치도",
    shortName: "전북",
    center: { lat: 35.804325, lng: 127.102627 },
    mapLevel: 10,
    districts: ["전주시", "군산시", "익산시", "정읍시", "남원시", "김제시"],
  },
  {
    code: "R10",
    name: "경상북도",
    shortName: "경북",
    center: { lat: 36.579315, lng: 128.513223 },
    mapLevel: 10,
    districts: ["포항시", "경주시", "김천시", "안동시", "구미시", "영주시", "영천시", "상주시", "문경시", "경산시"],
  },
  {
    code: "S10",
    name: "경상남도",
    shortName: "경남",
    center: { lat: 35.234487, lng: 128.688011 },
    mapLevel: 10,
    districts: ["창원시", "진주시", "통영시", "사천시", "김해시", "밀양시", "거제시", "양산시"],
  },
  {
    code: "T10",
    name: "제주특별자치도",
    shortName: "제주",
    center: { lat: 33.490417, lng: 126.497979 },
    mapLevel: 10,
    districts: ["제주시", "서귀포시"],
  },
];

export function getEducationOffice(code: string): EducationOffice {
  return (
    EDUCATION_OFFICES.find(
      (office) => office.code === code || office.aliasCodes?.includes(code),
    ) ?? getDefaultOffice()
  );
}

export function getNeisOfficeCodes(code: string): string[] | undefined {
  if (code === NATIONWIDE_OFFICE_CODE) return undefined;
  const office = getEducationOffice(code);
  return office.neisCodes ?? [office.code];
}

export function matchesSelectedOffice(itemOfficeCode: string, selectedCode: string): boolean {
  if (selectedCode === NATIONWIDE_OFFICE_CODE) return true;
  const selectedCodes = getNeisOfficeCodes(selectedCode) ?? [selectedCode];
  const itemOffice = getEducationOffice(itemOfficeCode);
  const itemCodes = [
    itemOfficeCode,
    itemOffice.code,
    ...(itemOffice.aliasCodes ?? []),
    ...(itemOffice.neisCodes ?? []),
  ];
  return selectedCodes.some((code) => itemCodes.includes(code));
}

export function getDefaultOffice(): EducationOffice {
  return EDUCATION_OFFICES.find((office) => office.code === DEFAULT_OFFICE_CODE) ?? EDUCATION_OFFICES[3];
}

export const DAEGU_DISTRICTS = getDefaultOffice().districts;

export function inferDistrictFromAddress(address: string, officeCode?: string): string {
  const office = officeCode ? getEducationOffice(officeCode) : undefined;
  const districts = office?.districts?.length
    ? office.districts
    : EDUCATION_OFFICES.flatMap((item) => item.districts);

  const found = districts.find((district) => address.includes(district));
  if (found) return found;

  if (office && office.code !== NATIONWIDE_OFFICE_CODE) {
    return office.shortName;
  }

  return "기타";
}
