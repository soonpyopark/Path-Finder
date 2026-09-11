"use client";

import dynamic from "next/dynamic";

export const KakaoMapDynamic = dynamic(() => import("@/components/map/KakaoMapPanel"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-slate-200 text-sm text-slate-500">
      지도를 준비하는 중입니다.
    </div>
  ),
});
