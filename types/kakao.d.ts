export {};

interface KakaoPlaces {
  keywordSearch: (
    keyword: string,
    callback: (result: Array<Record<string, string>>, status: string) => void,
    options?: { size?: number; location?: unknown; radius?: number },
  ) => void;
}

interface KakaoGeocoder {
  addressSearch: (
    address: string,
    callback: (result: Array<{ x: string; y: string } & Record<string, unknown>>, status: string) => void,
  ) => void;
}

declare global {
  interface Window {
    kakao?: {
      maps?: {
        load?: (callback: () => void) => void;
        LatLng?: new (lat: number, lng: number) => unknown;
        services?: {
          Places: new () => KakaoPlaces;
          Geocoder: new () => KakaoGeocoder;
        };
      };
    };
  }
}

declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_KAKAO_MAP_KEY?: string;
    NEIS_API_KEY?: string;
    NEXT_PUBLIC_NEIS_API_KEY?: string;
  }
}
