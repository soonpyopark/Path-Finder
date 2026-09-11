"use client";

import { DAY_COLORS, hasCoordinates, type DailyRoute, type Institution } from "@/lib/types";

interface RouteCardListProps {
  days: DailyRoute[];
  unassigned: Institution[];
  activeDayId: string | null;
  onSelectDay: (id: string) => void;
}

export function RouteCardList({ days, unassigned, activeDayId, onSelectDay }: RouteCardListProps) {
  if (days.length === 0) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-sm text-slate-500">
        좌측에서 기관을 선택한 뒤 동선을 생성하면 일자별 카드가 여기에 표시됩니다.
      </div>
    );
  }

  return (
    <div className="panel-scroll flex h-full gap-3 overflow-x-auto px-4 py-4">
      {days.map((day, index) => {
        const color = DAY_COLORS[index % DAY_COLORS.length];
        const active = day.id === activeDayId;
        return (
          <button
            key={day.id}
            type="button"
            onClick={() => onSelectDay(day.id)}
            className={`w-72 shrink-0 rounded-2xl border bg-white p-4 text-left shadow-sm transition ${
              active ? "border-emerald-500 ring-2 ring-emerald-200" : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">
                {day.dayLabel} ({day.weekday})
              </p>
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {day.stops.length}곳 · {day.totalDistanceKm.toFixed(1)} km
            </p>
            <ol className="mt-3 space-y-1.5">
              {day.stops.map((stop) => (
                <li key={`${day.id}-${stop.institution.id}`} className="flex gap-2 text-sm text-slate-700">
                  <span
                    className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                    style={{ backgroundColor: color }}
                  >
                    {stop.order}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{stop.institution.name}</span>
                    <span className="block truncate text-xs text-slate-400">
                      {stop.institution.district}
                      {stop.distanceFromPrevKm > 0 ? ` · +${stop.distanceFromPrevKm} km` : ""}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </button>
        );
      })}

      {unassigned.length > 0 ? (
        <div className="w-72 shrink-0 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-900">미배정 {unassigned.length}곳</p>
          <p className="mt-1 text-xs text-amber-700">
            출장 일수가 부족하거나 좌표를 찾지 못한 기관입니다. 기간을 늘리거나 주소를 확인해 주세요.
          </p>
          <ul className="mt-3 space-y-1 text-sm text-amber-900">
            {unassigned.map((item) => (
              <li key={item.id} className="truncate">
                {item.name}
                {!hasCoordinates(item) ? " (좌표 없음)" : ""}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
