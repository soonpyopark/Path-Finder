"use client";

import { useMemo } from "react";
import {
  Building2,
  CalendarRange,
  MapPin,
  Route,
  School,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { DAEGU_OFFICE_SEARCH_SHORTCUTS } from "@/lib/daegu-direct-institutions";
import {
  EDUCATION_OFFICES,
  NATIONWIDE_OFFICE_CODE,
  type EducationOffice,
} from "@/lib/regions";
import type { Institution, TripSettings } from "@/lib/types";

interface ControlPanelProps {
  office: EducationOffice;
  district: string;
  query: string;
  results: Institution[];
  selected: Institution[];
  settings: TripSettings;
  isSearching: boolean;
  isGenerating: boolean;
  searchMessage?: string;
  onOfficeChange: (code: string) => void;
  onDistrictChange: (district: string) => void;
  onQueryChange: (query: string) => void;
  onToggleInstitution: (institution: Institution) => void;
  onRemoveInstitution: (id: string) => void;
  onClearSelected: () => void;
  onSettingsChange: (patch: Partial<TripSettings>) => void;
  onGenerate: () => void;
}

export function ControlPanel({
  office,
  district,
  query,
  results,
  selected,
  settings,
  isSearching,
  isGenerating,
  searchMessage,
  onOfficeChange,
  onDistrictChange,
  onQueryChange,
  onToggleInstitution,
  onRemoveInstitution,
  onClearSelected,
  onSettingsChange,
  onGenerate,
}: ControlPanelProps) {
  const selectedIds = useMemo(() => new Set(selected.map((item) => item.id)), [selected]);

  return (
    <aside className="flex h-full w-full flex-col bg-[#10233d] text-slate-100 lg:w-[380px] lg:min-w-[380px]">
      <div className="border-b border-white/10 px-5 py-5">
        <p className="text-xs font-semibold tracking-[0.2em] text-emerald-300">PATH FINDER 1.0.0</p>
        <h1 className="mt-1 text-xl font-bold">출장·배달 동선 최적화</h1>
        <p className="mt-2 text-sm text-slate-300">
          기본 지역은 대구이며, 전국 교육청 단위로 학교·기관을 검색할 수 있습니다.
        </p>
      </div>

      <div className="panel-scroll flex-1 space-y-5 overflow-y-auto px-5 py-5">
        <section className="space-y-2">
          <label className="text-xs font-semibold text-slate-300">지역 (교육청)</label>
          <select
            value={office.code}
            onChange={(event) => onOfficeChange(event.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none ring-emerald-400 focus:ring-2"
          >
            {EDUCATION_OFFICES.map((item) => (
              <option key={item.code} value={item.code} className="text-slate-900">
                {item.name}
                {item.code === "D10" ? " (기본)" : ""}
              </option>
            ))}
          </select>
        </section>

        {office.districts.length > 0 && office.code !== NATIONWIDE_OFFICE_CODE ? (
          <section className="space-y-2">
            <p className="text-xs font-semibold text-slate-300">시·군·구</p>
            <div className="flex flex-wrap gap-1.5">
              <DistrictChip
                label="전체"
                active={district === "all"}
                onClick={() => onDistrictChange("all")}
              />
              {office.districts.map((item) => (
                <DistrictChip
                  key={item}
                  label={item}
                  active={district === item}
                  onClick={() => onDistrictChange(item)}
                />
              ))}
            </div>
          </section>
        ) : null}

        <section className="space-y-2">
          <label className="text-xs font-semibold text-slate-300">학교 / 기관 검색</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder={`${office.shortName} 학교·직속기관명`}
              className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm outline-none ring-emerald-400 placeholder:text-slate-500 focus:ring-2"
            />
          </div>
          {office.code === "D10" ? (
            <div className="flex flex-wrap gap-1.5">
              {DAEGU_OFFICE_SEARCH_SHORTCUTS.map((shortcut) => (
                <DistrictChip
                  key={shortcut}
                  label={shortcut}
                  active={query === shortcut}
                  onClick={() => onQueryChange(query === shortcut ? "" : shortcut)}
                />
              ))}
            </div>
          ) : null}
          {searchMessage ? <p className="text-xs text-amber-300">{searchMessage}</p> : null}
          <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-white/10 bg-black/20 p-2">
            {isSearching ? (
              <p className="px-2 py-3 text-sm text-slate-400">검색 중...</p>
            ) : results.length === 0 ? (
              <p className="px-2 py-3 text-sm text-slate-400">검색 결과가 없습니다.</p>
            ) : (
              results.map((item) => {
                const checked = selectedIds.has(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onToggleInstitution(item)}
                    className={`flex w-full items-start gap-2 rounded-md px-2 py-2 text-left text-sm transition ${
                      checked ? "bg-emerald-500/20" : "hover:bg-white/5"
                    }`}
                  >
                    {item.type === "office" ? (
                      <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />
                    ) : (
                      <School className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                    )}
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{item.name}</span>
                      <span className="block truncate text-xs text-slate-400">
                        {item.type === "office" ? "직속기관 · " : ""}
                        {item.district} · {item.address}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-300">선택된 방문지 {selected.length}곳</p>
            {selected.length > 0 ? (
              <button
                type="button"
                onClick={onClearSelected}
                className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white"
              >
                <Trash2 className="h-3.5 w-3.5" />
                비우기
              </button>
            ) : null}
          </div>
          <div className="max-h-36 space-y-1 overflow-y-auto">
            {selected.length === 0 ? (
              <p className="rounded-lg border border-dashed border-white/15 px-3 py-4 text-sm text-slate-400">
                검색 결과에서 방문할 기관을 선택하세요.
              </p>
            ) : (
              selected.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 rounded-md bg-white/5 px-3 py-2 text-sm"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-300" />
                    <span className="truncate">{item.name}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemoveInstitution(item.id)}
                    className="text-slate-400 hover:text-white"
                    aria-label={`${item.name} 제거`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300">
            <CalendarRange className="h-4 w-4" />
            출장 설정
          </p>
          <label className="block text-xs text-slate-400">
            일 방문 기관(학교) 수
            <input
              type="number"
              min={1}
              max={12}
              value={settings.visitsPerDay}
              onChange={(event) =>
                onSettingsChange({ visitsPerDay: Number(event.target.value) || 1 })
              }
              className="mt-1 w-full rounded-lg border border-white/10 bg-[#0b1a2e] px-3 py-2 text-sm text-white outline-none ring-emerald-400 focus:ring-2"
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-xs text-slate-400">
              시작일
              <input
                type="date"
                value={settings.startDate}
                onChange={(event) => onSettingsChange({ startDate: event.target.value })}
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#0b1a2e] px-3 py-2 text-sm text-white outline-none ring-emerald-400 focus:ring-2"
              />
            </label>
            <label className="block text-xs text-slate-400">
              종료일
              <input
                type="date"
                value={settings.endDate}
                onChange={(event) => onSettingsChange({ endDate: event.target.value })}
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#0b1a2e] px-3 py-2 text-sm text-white outline-none ring-emerald-400 focus:ring-2"
              />
            </label>
          </div>
          <button
            type="button"
            onClick={() => onSettingsChange({ includeWeekends: !settings.includeWeekends })}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm ${
              settings.includeWeekends ? "bg-emerald-500/20 text-emerald-200" : "bg-black/20 text-slate-300"
            }`}
          >
            주말 포함
            <span className="text-xs">{settings.includeWeekends ? "포함" : "제외"}</span>
          </button>
        </section>
      </div>

      <div className="border-t border-white/10 p-5">
        <button
          type="button"
          onClick={onGenerate}
          disabled={isGenerating || selected.length === 0}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
        >
          <Route className="h-4 w-4" />
          {isGenerating ? "동선 생성 중..." : "동선 생성"}
        </button>
      </div>
    </aside>
  );
}

function DistrictChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-2.5 py-1 text-xs ${
        active ? "bg-emerald-500 text-slate-950" : "bg-white/5 text-slate-300 hover:bg-white/10"
      }`}
    >
      {label}
    </button>
  );
}
