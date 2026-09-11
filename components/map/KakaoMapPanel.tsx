"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CustomOverlayMap, Map, Polyline } from "react-kakao-maps-sdk";
import { useKakaoLoader } from "react-kakao-maps-sdk";
import { MapPinOff } from "lucide-react";
import type { EducationOffice } from "@/lib/regions";
import { DAY_COLORS, hasCoordinates, type DailyRoute, type Institution, type TripWaypoint } from "@/lib/types";
import { waypointsEqual } from "@/lib/waypoints";

interface KakaoMapPanelProps {
  office: EducationOffice;
  selected: Institution[];
  days: DailyRoute[];
  activeDayId: string | null;
  startPoint: TripWaypoint;
  returnPoint: TripWaypoint;
}

export default function KakaoMapPanel({
  office,
  selected,
  days,
  activeDayId,
  startPoint,
  returnPoint,
}: KakaoMapPanelProps) {
  const appkey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY ?? "";

  if (!appkey) {
    return <MapPlaceholder message="카카오맵 키가 없습니다. .env.local에 NEXT_PUBLIC_KAKAO_MAP_KEY를 넣어 주세요." />;
  }

  return (
    <KakaoMapInner
      appkey={appkey}
      office={office}
      selected={selected}
      days={days}
      activeDayId={activeDayId}
      startPoint={startPoint}
      returnPoint={returnPoint}
    />
  );
}

function KakaoMapInner({
  appkey,
  office,
  selected,
  days,
  activeDayId,
  startPoint,
  returnPoint,
}: KakaoMapPanelProps & { appkey: string }) {
  const [loading, error] = useKakaoLoader({
    appkey,
    libraries: ["services"],
  });
  const [map, setMap] = useState<kakao.maps.Map | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  const activeDay = days.find((day) => day.id === activeDayId) ?? days[0];

  const focusPoints = useMemo(() => {
    const stops = activeDay?.stops.flatMap((stop) =>
      hasCoordinates(stop.institution)
        ? [{ lat: stop.institution.lat, lng: stop.institution.lng }]
        : [],
    );
    if (!stops?.length) return [];
    return [
      { lat: startPoint.lat, lng: startPoint.lng },
      ...stops,
      { lat: returnPoint.lat, lng: returnPoint.lng },
    ];
  }, [activeDay, startPoint, returnPoint]);

  const focusKey = focusPoints.map((point) => `${point.lat},${point.lng}`).join("|");

  useEffect(() => {
    const node = frameRef.current;
    if (!map || !node) return undefined;
    const observer = new ResizeObserver(() => {
      map.relayout();
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [map]);

  useEffect(() => {
    if (!map || focusPoints.length === 0) return;
    const bounds = new kakao.maps.LatLngBounds();
    focusPoints.forEach((point) => {
      bounds.extend(new kakao.maps.LatLng(point.lat, point.lng));
    });
    map.setBounds(bounds, 48, 48, 48, 48);
    // focusKey keeps this from refiring when the same coordinates arrive in a new array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, focusKey]);

  if (error) {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return (
      <MapPlaceholder
        message="카카오맵을 불러오지 못했습니다."
        hint={`지금 주소는 ${origin} 입니다. 카카오디벨로퍼스 → 앱 → 플랫폼 키 → JavaScript 키 → JavaScript SDK 도메인에 이 주소를 그대로 등록하세요. Preview URL(…-xxxx.vercel.app)은 배포마다 바뀌므로 카카오가 막습니다. REST 키가 아닌 JavaScript 키를 쓰고, 카카오맵 사용 설정은 ON 이어야 합니다.`}
      />
    );
  }

  if (loading) {
    return <MapPlaceholder message="지도를 불러오는 중입니다." />;
  }

  const overlayStops = activeDay?.stops.filter((stop) => hasCoordinates(stop.institution)) ?? [];
  const selectedPins = selected.filter(hasCoordinates);
  const firstStop = overlayStops[0]?.institution;
  const lastStop = overlayStops[overlayStops.length - 1]?.institution;
  const sameDepot = waypointsEqual(startPoint, returnPoint);

  const commuteOut =
    firstStop && hasCoordinates(firstStop)
      ? [
          { lat: startPoint.lat, lng: startPoint.lng },
          { lat: firstStop.lat, lng: firstStop.lng },
        ]
      : [];
  const commuteBack =
    lastStop && hasCoordinates(lastStop)
      ? [
          { lat: lastStop.lat, lng: lastStop.lng },
          { lat: returnPoint.lat, lng: returnPoint.lng },
        ]
      : [];
  const activeColor = DAY_COLORS[Math.max(0, days.findIndex((day) => day.id === activeDay?.id)) % DAY_COLORS.length];

  return (
    <div ref={frameRef} className="h-full w-full">
    <Map
      key={office.code}
      center={office.center}
      isPanto
      level={office.mapLevel}
      className="h-full w-full"
      onCreate={setMap}
    >
      {days.map((day, dayIndex) => {
        const path = day.stops.flatMap((stop) =>
          hasCoordinates(stop.institution)
            ? [{ lat: stop.institution.lat, lng: stop.institution.lng }]
            : [],
        );
        if (path.length < 2) return null;
        const isActive = !activeDay || day.id === activeDay.id;
        return (
          <Polyline
            key={day.id}
            path={path}
            strokeWeight={isActive ? 6 : 4}
            strokeColor={DAY_COLORS[dayIndex % DAY_COLORS.length]}
            strokeOpacity={isActive ? 0.9 : 0.35}
            strokeStyle="solid"
          />
        );
      })}

      {activeDay && commuteOut.length === 2 ? (
        <Polyline
          path={commuteOut}
          strokeWeight={4}
          strokeColor={activeColor}
          strokeOpacity={0.7}
          strokeStyle="dash"
        />
      ) : null}
      {activeDay && commuteBack.length === 2 ? (
        <Polyline
          path={commuteBack}
          strokeWeight={4}
          strokeColor={activeColor}
          strokeOpacity={0.7}
          strokeStyle="dash"
        />
      ) : null}

      {selectedPins.map((item) => (
        <CustomOverlayMap key={`sel-${item.id}`} position={{ lat: item.lat, lng: item.lng }} xAnchor={0.5} yAnchor={1.35}>
          <div className="rounded-full bg-slate-800 px-2 py-1 text-[10px] font-medium text-white shadow">
            {item.name}
          </div>
        </CustomOverlayMap>
      ))}

      {overlayStops.map((stop) => {
        if (!hasCoordinates(stop.institution)) return null;
        return (
          <CustomOverlayMap
            key={`stop-${stop.institution.id}`}
            position={{ lat: stop.institution.lat, lng: stop.institution.lng }}
            xAnchor={0.5}
            yAnchor={0.5}
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-slate-950 shadow">
              {stop.order}
            </div>
          </CustomOverlayMap>
        );
      })}

      <CustomOverlayMap position={{ lat: startPoint.lat, lng: startPoint.lng }} xAnchor={0.5} yAnchor={1.15}>
        <div className="rounded-full bg-slate-900 px-2 py-1 text-[10px] font-semibold text-white shadow">
          {sameDepot ? "출발·복귀" : "출발"}
        </div>
      </CustomOverlayMap>
      {sameDepot ? null : (
        <CustomOverlayMap position={{ lat: returnPoint.lat, lng: returnPoint.lng }} xAnchor={0.5} yAnchor={1.15}>
          <div className="rounded-full bg-indigo-700 px-2 py-1 text-[10px] font-semibold text-white shadow">
            복귀
          </div>
        </CustomOverlayMap>
      )}
    </Map>
    </div>
  );
}

function MapPlaceholder({ message, hint }: { message: string; hint?: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-slate-200 text-slate-600">
      <MapPinOff className="h-8 w-8" />
      <p className="max-w-lg px-6 text-center text-sm font-medium">{message}</p>
      {hint ? <p className="max-w-lg px-6 text-center text-xs leading-5 text-slate-500">{hint}</p> : null}
    </div>
  );
}
