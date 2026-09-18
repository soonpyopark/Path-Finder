"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Building2,
  CalendarRange,
  ClipboardPaste,
  Download,
  FileSpreadsheet,
  MapPin,
  RotateCcw,
  Route,
  School,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { DAEGU_OFFICE_SEARCH_SHORTCUTS } from "@/lib/daegu-direct-institutions";
import {
  EDUCATION_OFFICES,
  NATIONWIDE_OFFICE_CODE,
  type EducationOffice,
} from "@/lib/regions";
import type { Institution, TripSettings } from "@/lib/types";
import { WaypointField } from "@/components/sidebar/WaypointField";
import type { UnmatchedVisit } from "@/lib/visit-excel";
import {
  DEFAULT_PANEL_THEME,
  PANEL_THEMES,
  PANEL_THEME_STORAGE_KEY,
  isPanelThemeId,
  type PanelThemeId,
} from "@/lib/panel-themes";

interface ControlPanelProps {
  office: EducationOffice;
  district: string;
  query: string;
  results: Institution[];
  selected: Institution[];
  settings: TripSettings;
  isSearching: boolean;
  isGenerating: boolean;
  canExport: boolean;
  isImporting: boolean;
  importMessage?: string;
  unmatched: UnmatchedVisit[];
  searchMessage?: string;
  onOfficeChange: (code: string) => void;
  onDistrictChange: (district: string) => void;
  onQueryChange: (query: string) => void;
  onToggleInstitution: (institution: Institution) => void;
  onRemoveInstitution: (id: string) => void;
  onClearSelected: () => void;
  onSelectAllResults: () => void;
  onDeselectResults: () => void;
  onDownloadTemplate: () => void;
  onImportFile: (file: File) => void;
  onImportPaste: (text: string) => void;
  onSettingsChange: (patch: Partial<TripSettings>) => void;
  onGenerate: () => void;
  onExport: () => void;
  onReset: () => void;
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
  canExport,
  isImporting,
  importMessage,
  unmatched,
  searchMessage,
  onOfficeChange,
  onDistrictChange,
  onQueryChange,
  onToggleInstitution,
  onRemoveInstitution,
  onClearSelected,
  onSelectAllResults,
  onDeselectResults,
  onDownloadTemplate,
  onImportFile,
  onImportPaste,
  onSettingsChange,
  onGenerate,
  onExport,
  onReset,
}: ControlPanelProps) {
  const selectedIds = useMemo(() => new Set(selected.map((item) => item.id)), [selected]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [helpOpen, setHelpOpen] = useState(false);
  const [panelTheme, setPanelTheme] = useState<PanelThemeId>(DEFAULT_PANEL_THEME);
  const allResultsSelected =
    results.length > 0 && results.every((item) => selectedIds.has(item.id));

  useEffect(() => {
    const stored = window.localStorage.getItem(PANEL_THEME_STORAGE_KEY);
    if (isPanelThemeId(stored)) setPanelTheme(stored);
  }, []);

  const selectPanelTheme = (id: PanelThemeId) => {
    setPanelTheme(id);
    window.localStorage.setItem(PANEL_THEME_STORAGE_KEY, id);
  };

  return (
    <aside
      data-theme={panelTheme}
      className="sidebar-panel flex max-h-[60vh] w-full shrink-0 flex-col text-slate-100 md:h-full md:max-h-none md:w-[320px] md:min-w-[320px] lg:w-[380px] lg:min-w-[380px]"
    >
      <div className="border-b border-white/10 px-5 py-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              title="새로고침"
              className="truncate text-xs font-semibold tracking-wide text-[var(--panel-brand)] transition hover:text-white"
            >
              Path Finder v1.0.3
            </button>
            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              className="shrink-0 rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-slate-100 transition hover:bg-white/20"
            >
              사용 방법
            </button>
          </div>
          <div className="flex shrink-0 items-center gap-1.5" role="radiogroup" aria-label="왼쪽 화면 색상">
            {PANEL_THEMES.map((theme) => {
              const selectedTheme = theme.id === panelTheme;
              return (
                <button
                  key={theme.id}
                  type="button"
                  role="radio"
                  aria-checked={selectedTheme}
                  aria-label={theme.label}
                  title={theme.label}
                  onClick={() => selectPanelTheme(theme.id)}
                  className={`h-4 w-4 rounded-full border transition ${
                    selectedTheme ? "border-white ring-2 ring-white/70" : "border-white/40 hover:border-white"
                  }`}
                  style={{ backgroundColor: theme.swatch }}
                />
              );
            })}
          </div>
        </div>
        <h1 className="mt-1 text-xl font-bold tracking-tighter text-yellow-300">출장, 최적의 동선을 알려줘!</h1>
        <p className="mt-2 text-sm text-slate-300">
          학교·교육청 기관뿐 아니라 상호나 도로명 주소로도 방문지를 넣을 수 있습니다.
        </p>
      </div>

      <div className="panel-scroll flex-1 space-y-5 overflow-y-auto px-5 py-5">
        <section className="space-y-2">
          <label className="block text-xs font-semibold leading-4 text-slate-300">지역 (교육청)</label>
          <select
            value={office.code}
            onChange={(event) => onOfficeChange(event.target.value)}
            className="w-full rounded-lg border border-white/20 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-emerald-400 focus:ring-2"
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
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-semibold text-slate-300">방문지 검색</label>
            {results.length > 0 ? (
              <button
                type="button"
                onClick={allResultsSelected ? onDeselectResults : onSelectAllResults}
                className="text-xs text-emerald-300 hover:text-emerald-200"
              >
                {allResultsSelected ? "결과에서 해제" : "검색 결과 모두 선택"}
              </button>
            ) : null}
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-yellow-900/60" />
            <input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="학교·기관명, 상호 또는 도로명 주소"
              className="w-full rounded-lg border border-yellow-200/60 bg-yellow-100 py-2 pl-9 pr-3 text-sm text-slate-900 outline-none ring-emerald-400 placeholder:text-yellow-900/50 focus:ring-2"
            />
          </div>
          {office.code === "D10" ? (
            <div className="flex flex-wrap gap-1.5">
              {DAEGU_OFFICE_SEARCH_SHORTCUTS.map((shortcut) => (
                <ShortcutChip
                  key={shortcut}
                  label={shortcut}
                  active={query === shortcut}
                  onClick={() => onQueryChange(query === shortcut ? "" : shortcut)}
                />
              ))}
            </div>
          ) : null}
          {/* Same column count and gap as the action bar at the bottom of the panel.
              When the panel narrows, the template button takes a row of its own so the
              other two wrap together instead of leaving one alone on the second row. */}
          <div className="grid grid-cols-3 gap-2 md:grid-cols-2 lg:grid-cols-3">
            <button
              type="button"
              onClick={onDownloadTemplate}
              className="inline-flex min-w-0 items-center justify-center gap-1 rounded-md bg-sky-200/90 px-1.5 py-1.5 text-[11px] font-semibold text-sky-950 hover:bg-sky-100 md:col-span-2 lg:col-span-1"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">템플릿 다운로드</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="inline-flex min-w-0 items-center justify-center gap-1 rounded-md bg-rose-200/90 px-1.5 py-1.5 text-[11px] font-semibold text-rose-950 hover:bg-rose-100 disabled:opacity-50"
            >
              <Upload className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{isImporting ? "가져오는 중" : "엑셀 가져오기"}</span>
            </button>
            <button
              type="button"
              onClick={() => setPasteOpen((open) => !open)}
              className={`inline-flex min-w-0 items-center justify-center gap-1 rounded-md px-1.5 py-1.5 text-[11px] font-semibold text-emerald-950 ${
                pasteOpen ? "bg-emerald-100" : "bg-emerald-200/90 hover:bg-emerald-100"
              }`}
            >
              <ClipboardPaste className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">붙여넣기</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onImportFile(file);
                event.target.value = "";
              }}
            />
          </div>
          {pasteOpen ? (
            <div className="space-y-2">
              <textarea
                value={pasteText}
                onChange={(event) => setPasteText(event.target.value)}
                rows={4}
                placeholder={"이름이나 주소를 한 줄에 하나씩 붙여 넣으세요.\n엑셀에서 기관명·주소 열을 복사해도 됩니다."}
                className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-white outline-none ring-emerald-400 placeholder:text-slate-500 focus:ring-2"
              />
              <button
                type="button"
                disabled={isImporting || pasteText.trim().length === 0}
                onClick={() => {
                  onImportPaste(pasteText);
                  setPasteText("");
                  setPasteOpen(false);
                }}
                className="rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-950 disabled:bg-slate-600 disabled:text-slate-300"
              >
                목록에 추가
              </button>
            </div>
          ) : null}
          {importMessage ? <p className="text-xs text-emerald-300">{importMessage}</p> : null}
          {searchMessage ? <p className="text-xs text-amber-300">{searchMessage}</p> : null}
          <div className="panel-scroll max-h-64 space-y-1 overflow-y-auto rounded-lg border border-white/10 bg-black/20 p-2">
            {isSearching ? (
              <p className="px-2 py-3 text-sm text-slate-400">검색 중...</p>
            ) : results.length === 0 ? (
              <p className="px-2 py-3 text-sm text-slate-400">
                {query.trim() ? "검색 결과가 없습니다." : "학교·기관명이나 주소를 검색하세요."}
              </p>
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
                    ) : item.type === "school" ? (
                      <School className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                    ) : (
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                    )}
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{item.name}</span>
                      <span className="block truncate text-xs text-slate-400">
                        {item.source === "kakao"
                          ? "장소 · "
                          : item.type === "office"
                            ? "직속기관 · "
                            : ""}
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
          <div className="panel-scroll max-h-36 space-y-1 overflow-y-auto">
            {selected.length === 0 ? (
              <p className="rounded-lg border border-dashed border-white/15 px-3 py-4 text-sm text-slate-400">
              검색 결과에서 방문할 곳을 선택하세요.
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
          {unmatched.length > 0 ? (
            <div className="rounded-lg border border-amber-400/30 bg-amber-500/10 p-3">
              <p className="text-xs font-semibold text-amber-200">찾지 못한 {unmatched.length}곳</p>
              <ul className="panel-scroll mt-2 max-h-24 space-y-1 overflow-y-auto text-xs text-amber-100">
                {unmatched.map((item) => (
                  <li key={`${item.name}-${item.district}-${item.address}`} className="truncate">
                    {item.name}
                    {item.district ? ` · ${item.district}` : ""}
                    {item.reason ? ` (${item.reason})` : ""}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        <section className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300">
            <CalendarRange className="h-4 w-4" />
            출장 설정
          </p>
          <WaypointField
            label="출발지"
            value={settings.startPoint}
            office={office}
            onChange={(startPoint) =>
              onSettingsChange({
                startPoint,
                returnPoint: settings.returnSameAsStart ? startPoint : settings.returnPoint,
              })
            }
          />
          <button
            type="button"
            onClick={() =>
              onSettingsChange({
                returnSameAsStart: !settings.returnSameAsStart,
                returnPoint: settings.startPoint,
              })
            }
            aria-pressed={settings.returnSameAsStart}
            className={`w-full rounded-lg px-3 py-2 text-left text-xs ${
              settings.returnSameAsStart
                ? "bg-emerald-500/20 text-emerald-200"
                : "bg-black/20 text-slate-300"
            }`}
          >
            {settings.returnSameAsStart ? "복귀지점 = 출발지와 같음" : "복귀지점 따로 지정"}
          </button>
          {settings.returnSameAsStart ? null : (
            <WaypointField
              label="복귀지점"
              value={settings.returnPoint}
              office={office}
              onChange={(returnPoint) => onSettingsChange({ returnPoint, returnSameAsStart: false })}
            />
          )}
          <div className="grid grid-cols-[72px_minmax(0,1fr)_auto] items-end gap-2">
            <label className="block min-w-0 text-[11px] leading-4 text-slate-400">
              출장 인원(명)
              <input
                type="number"
                min={1}
                max={10}
                value={settings.travelerCount}
                title="2명 이상이면 방문지를 가까운 곳끼리 나눠 사람별 동선을 만듭니다"
                onChange={(event) =>
                  onSettingsChange({ travelerCount: Number(event.target.value) || 1 })
                }
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#0b1a2e] px-3 py-2 text-sm text-white outline-none ring-emerald-400 focus:ring-2"
              />
            </label>
            <label className="block min-w-0 text-[11px] leading-4 text-slate-400">
              1인 일 최대 방문지 수
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
            <button
              type="button"
              onClick={() => onSettingsChange({ includeWeekends: !settings.includeWeekends })}
              aria-pressed={settings.includeWeekends}
              className={`inline-flex h-[38px] shrink-0 items-center justify-center whitespace-nowrap rounded-lg px-3 text-sm ${
                settings.includeWeekends ? "bg-emerald-500/20 text-emerald-200" : "bg-black/20 text-slate-300"
              }`}
            >
              {settings.includeWeekends ? "주말 포함" : "주말 제외"}
            </button>
          </div>
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
        </section>
      </div>

      <div className="grid grid-cols-3 gap-2 border-t border-white/10 px-5 py-4">
        <button
          type="button"
          onClick={onGenerate}
          disabled={isGenerating || selected.length === 0}
          className="inline-flex min-w-0 items-center justify-center gap-1 rounded-xl bg-green-500 px-2 py-3 text-xs font-semibold text-slate-950 transition hover:bg-green-400 disabled:cursor-not-allowed disabled:bg-green-500/35 disabled:text-slate-200 sm:text-sm"
        >
          <Route className="h-4 w-4 shrink-0" />
          <span className="truncate">{isGenerating ? "생성 중" : "동선생성"}</span>
        </button>
        <button
          type="button"
          onClick={onExport}
          disabled={!canExport}
          className="inline-flex min-w-0 items-center justify-center gap-1 rounded-xl bg-blue-500 px-2 py-3 text-xs font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:bg-blue-500/35 disabled:text-slate-200 sm:text-sm"
        >
          <Download className="h-4 w-4 shrink-0" />
          <span className="truncate">내보내기</span>
        </button>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex min-w-0 items-center justify-center gap-1 rounded-xl bg-rose-500 px-2 py-3 text-xs font-semibold text-slate-950 transition hover:bg-rose-400 sm:text-sm"
        >
          <RotateCcw className="h-4 w-4 shrink-0" />
          <span className="truncate">초기화</span>
        </button>
      </div>

      {helpOpen ? <HelpModal onClose={() => setHelpOpen(false)} /> : null}
    </aside>
  );
}

const HELP_STEPS = [
  {
    title: "1. 지역과 시·군·구를 고릅니다",
    body: "지역(교육청)을 바꾸면 지도와 검색 범위가 함께 옮겨갑니다. 시·군·구 칩을 누르면 그 자치구 안에서만 검색합니다.",
  },
  {
    title: "2. 방문지를 담습니다",
    body: "학교·기관명뿐 아니라 상호나 도로명 주소로도 찾을 수 있습니다. 검색 결과를 누르면 아래 선택 목록에 담기고, '검색 결과 모두 선택'으로 한 번에 담을 수도 있습니다.",
  },
  {
    title: "3. 엑셀로 한꺼번에 넣습니다",
    body: "'템플릿 다운로드'로 받은 양식에 방문지를 적어 '엑셀 가져오기'로 올리거나, 목록을 복사해 '붙여넣기'로 넣습니다. 찾지 못한 항목은 따로 알려 드립니다.",
  },
  {
    title: "4. 출장 조건을 정합니다",
    body: "출발지는 기본이 선택한 교육청이며 검색해서 바꿀 수 있습니다. 복귀지점이 다르면 '복귀지점 따로 지정'을 누르세요. 출장 인원, 1인 일 최대 방문지 수, 주말 포함 여부, 기간도 여기서 정합니다.",
  },
  {
    title: "5. 동선을 만들고 확인합니다",
    body: "'동선생성'을 누르면 출발지에서 시작해 복귀지점으로 끝나는 가장 짧은 순서로 날짜별 일정이 만들어집니다. 출장 인원이 2명 이상이면 방문지를 가까운 곳끼리 나눠 사람별 일정을 만들고, 출장자 칩으로 골라 볼 수 있습니다. 날짜 탭을 누르면 지도가 그날 동선으로 이동합니다.",
  },
  {
    title: "6. 결과를 저장합니다",
    body: "'내보내기'로 요약과 날짜별 방문 순서를 엑셀로 받습니다. 처음부터 다시 하려면 '초기화'를 누르세요.",
  },
];

function HelpModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-modal-title"
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white text-slate-800 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-xs font-semibold tracking-wide text-slate-500">사용 방법</p>
            <p id="help-modal-title" className="text-base font-semibold text-slate-900">
              출장 동선, 이렇게 만듭니다
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="panel-scroll space-y-4 overflow-y-auto px-5 py-4">
          {HELP_STEPS.map((step) => (
            <section key={step.title}>
              <p className="text-sm font-semibold text-slate-900">{step.title}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">{step.body}</p>
            </section>
          ))}
          <p className="rounded-xl bg-slate-100 px-4 py-3 text-xs leading-5 text-slate-600">
            이동 거리는 출발지 → 방문지 → 복귀지점을 직선으로 이은 값이라 실제 주행 거리와는 차이가 있습니다.
            지도 아래 결과 패널은 ‘접기’로 숨겨 지도를 크게 볼 수 있습니다.
          </p>
        </div>
        <div className="flex justify-end border-t border-slate-200 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
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
      className={`rounded-full border px-2.5 py-1.5 text-xs font-semibold ${
        active
          ? "border-emerald-300 bg-emerald-500 text-slate-950"
          : "border-emerald-300/50 bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/30"
      }`}
    >
      {label}
    </button>
  );
}

function ShortcutChip({
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
      className={`rounded-full px-2.5 py-1.5 text-xs font-semibold ${
        active
          ? "bg-amber-400 text-slate-950"
          : "border border-amber-300/50 bg-amber-400/20 text-amber-100 hover:bg-amber-400/30"
      }`}
    >
      {label}
    </button>
  );
}
