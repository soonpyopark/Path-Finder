export {};

declare global {
  interface Window {
    kakao?: {
      maps?: {
        load?: (callback: () => void) => void;
        services?: {
          Geocoder: new () => {
            addressSearch: (
              address: string,
              callback: (result: Array<{ x: string; y: string }>, status: string) => void,
            ) => void;
          };
        };
      };
    };
  }
}

declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_KAKAO_MAP_KEY?: string;
    NEXT_PUBLIC_NEIS_API_KEY?: string;
  }
}
