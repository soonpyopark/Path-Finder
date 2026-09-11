"use client";

import { useMemo, useState } from "react";
import { MapPin, Route, X } from "lucide-react";
import { DAY_COLORS, hasCoordinates, type DailyRoute, type Institution } from "@/lib/types";

interface RouteCardListProps {
  days: DailyRoute[];
  unassigned: Institution[];
  activeDayId: string | null;
  onSelectDay: (id: string) => void;
}

export function RouteCardList({ days, unassigned, activeDayId, onSelectDay }: RouteCardListProps) {
  const [showAll, setShowAll] = useState(false);
  const assignedCount = days.reduce((sum, day) => sum + day.stops.length, 0);
  const totalDistance = Number(days.reduce((sum, day) => sum + day.totalDistanceKm, 0).toFixed(1));
  const activeDay = days.find((day) => day.id === activeDayId) ?? days[0] ?? null;
  const showingUnassigned = activeDayId === "unassigned";

  const summary = useMemo(
    () =>
      days.length === 0
        ? "아직 생성된 동선이 없습니다."
        : `${days.length}일 · ${assignedCount}곳 · ${totalDistance} km`,
    [assignedCount, days.length, totalDistance],
  );

  if (days.length === 0 && unassigned.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
        <Route className="h-6 w-6 text-slate-400" />
        <p className="text-sm text-slate-500">좌측에서 기관을 선택한 뒤 동선을 생성하면 일자별 결과가 여기에 표시됩니다.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-slate-50">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-2.5">
        <div>
          <p className="text-xs font-semibold tracking-wide text-slate-500">동선 결과</p>
          <p className="text-sm font-semibold text-slate-900">{summary}</p>
        </div>
        {days.length > 0 ? (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
          >
            전체 보기
          </button>
        ) : null}
      </div>

      <div className="panel-scroll min-w-0 overflow-x-auto overscroll-x-contain">
        <div className="flex w-max min-w-full gap-2 px-4 py-3 pe-6">
        {days.map((day, index) => {
          const color = DAY_COLORS[index % DAY_COLORS.length];
          const active = !showingUnassigned && day.id === (activeDay?.id ?? "");
          return (
            <button
              key={day.id}
              type="button"
              onClick={() => onSelectDay(day.id)}
              className={`shrink-0 rounded-xl border px-3 py-2 text-left transition ${
                active ? "border-emerald-500 bg-white ring-2 ring-emerald-100" : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="whitespace-nowrap text-sm font-semibold text-slate-900">
                  {day.dayLabel} ({day.weekday})
                </span>
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {day.stops.length}곳 · {day.totalDistanceKm.toFixed(1)} km
              </p>
            </button>
          );
        })}
        {unassigned.length > 0 ? (
          <button
            type="button"
            onClick={() => onSelectDay("unassigned")}
            className={`shrink-0 rounded-xl border px-3 py-2 text-left ${
              showingUnassigned
                ? "border-amber-400 bg-amber-50 ring-2 ring-amber-100"
                : "border-amber-200 bg-amber-50 hover:border-amber-300"
            }`}
          >
            <p className="text-sm font-semibold text-amber-900">미배정</p>
            <p className="mt-1 text-xs text-amber-700">{unassigned.length}곳</p>
          </button>
        ) : null}
        </div>
      </div>

      <div className="min-h-0 min-w-0 flex-1 overflow-hidden px-4 pb-4">
        {showingUnassigned ? (
          <UnassignedDetail items={unassigned} />
        ) : activeDay ? (
          <DayDetail day={activeDay} color={DAY_COLORS[days.findIndex((item) => item.id === activeDay.id) % DAY_COLORS.length]} />
        ) : null}
      </div>

      {showAll ? (
        <AllDaysModal
          days={days}
          unassigned={unassigned}
          summary={summary}
          onClose={() => setShowAll(false)}
        />
      ) : null}
    </div>
  );
}

function DayDetail({ day, color }: { day: DailyRoute; color: string }) {
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">
            {day.dayLabel} ({day.weekday})
          </p>
          <p className="text-xs text-slate-500">{day.date}</p>
        </div>
        <p className="shrink-0 text-sm font-semibold text-slate-700">
          {day.stops.length}곳 · {day.totalDistanceKm.toFixed(1)} km
        </p>
      </div>
      <ol className="panel-scroll min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {day.stops.map((stop) => (
          <li key={`${day.id}-${stop.institution.id}`} className="flex gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
            <span
              className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: color }}
            >
              {stop.order}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between gap-2">
                <span className="truncate font-medium text-slate-900">{stop.institution.name}</span>
                <span className="shrink-0 text-xs font-medium text-slate-500">
                  {stop.order === 1 ? "시작" : `+${stop.distanceFromPrevKm} km`}
                </span>
              </span>
              <span className="mt-0.5 flex items-start gap-1 text-xs text-slate-500">
                <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                <span className="min-w-0">
                  {stop.institution.type === "office" ? "직속기관 · " : "학교 · "}
                  {stop.institution.district} · {stop.institution.address}
                </span>
              </span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function UnassignedDetail({ items }: { items: Institution[] }) {
  return (
    <div className="flex h-full min-h-0 flex-col rounded-2xl border border-amber-200 bg-amber-50">
      <div className="border-b border-amber-200 px-4 py-3">
        <p className="text-sm font-semibold text-amber-900">미배정 {items.length}곳</p>
        <p className="mt-1 text-xs text-amber-700">
          출장 일수가 부족하거나 좌표를 찾지 못한 기관입니다. 기간을 늘리거나 주소를 확인해 주세요.
        </p>
      </div>
      <ul className="panel-scroll min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {items.map((item) => (
          <li key={item.id} className="rounded-xl bg-white px-3 py-2.5 text-sm text-amber-950">
            <p className="font-medium">{item.name}</p>
            <p className="mt-0.5 text-xs text-amber-800">
              {item.district} · {item.address}
              {!hasCoordinates(item) ? " · 좌표 없음" : " · 일정 초과"}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AllDaysModal({
  days,
  unassigned,
  summary,
  onClose,
}: {
  days: DailyRoute[];
  unassigned: Institution[];
  summary: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-xs font-semibold tracking-wide text-slate-500">전체 동선</p>
            <p className="text-base font-semibold text-slate-900">{summary}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            aria-label="닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="panel-scroll space-y-4 overflow-y-auto p-5">
          {days.map((day, index) => (
            <section key={day.id} className="rounded-2xl border border-slate-200 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-semibold text-slate-900">
                  {index + 1}일차 · {day.dayLabel} ({day.weekday})
                </p>
                <p className="text-sm text-slate-500">
                  {day.stops.length}곳 · {day.totalDistanceKm.toFixed(1)} km
                </p>
              </div>
              <ol className="space-y-2">
                {day.stops.map((stop) => (
                  <li key={`${day.id}-${stop.institution.id}`} className="flex gap-3 text-sm">
                    <span
                      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: DAY_COLORS[index % DAY_COLORS.length] }}
                    >
                      {stop.order}
                    </span>
                    <span>
                      <span className="font-medium text-slate-900">{stop.institution.name}</span>
                      <span className="mt-0.5 block text-xs text-slate-500">
                        {stop.institution.district} · {stop.institution.address}
                        {stop.order === 1 ? " · 시작" : ` · +${stop.distanceFromPrevKm} km`}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          ))}
          {unassigned.length > 0 ? (
            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="mb-2 font-semibold text-amber-900">미배정 {unassigned.length}곳</p>
              <ul className="space-y-1 text-sm text-amber-950">
                {unassigned.map((item) => (
                  <li key={item.id}>
                    {item.name} · {item.district}
                    {!hasCoordinates(item) ? " · 좌표 없음" : ""}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
