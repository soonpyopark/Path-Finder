"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { KakaoMapDynamic } from "@/components/map/KakaoMapDynamic";
import { RouteCardList } from "@/components/routes/RouteCardList";
import { ControlPanel } from "@/components/sidebar/ControlPanel";
import { DUMMY_INSTITUTIONS, searchDummyInstitutions } from "@/lib/dummy-schools";
import { DAEGU_OFFICE_SEARCH_SHORTCUTS } from "@/lib/daegu-direct-institutions";
import { ensureCoordinates } from "@/lib/geocode";
import { searchKakaoPlaces } from "@/lib/kakao-places";
import { exportRoutePlanToExcel } from "@/lib/export-excel";
import { DEFAULT_OFFICE_CODE, getEducationOffice, NATIONWIDE_OFFICE_CODE } from "@/lib/regions";
import { addDaysISO, buildRoutePlan, suggestedVisitsPerDay, todayISO } from "@/lib/route-optimizer";
import type { Institution, RoutePlan, TripSettings } from "@/lib/types";
import {
  downloadVisitTemplate,
  matchVisitRows,
  mergeSelected,
  parseVisitFile,
  parseVisitPaste,
  type UnmatchedVisit,
  type VisitRow,
} from "@/lib/visit-excel";

function createDefaultSettings(selectedCount = 0): TripSettings {
  const startDate = todayISO();
  const endDate = addDaysISO(startDate, 6);
  return {
    startDate,
    endDate,
    includeWeekends: false,
    visitsPerDay: suggestedVisitsPerDay(selectedCount, startDate, endDate, false),
  };
}

interface NeisSearchResponse {
  ok: boolean;
  items?: Institution[];
  message?: string;
  skipped?: boolean;
}

function mergeInstitutions(...groups: Institution[][]): Institution[] {
  const merged = new Map<string, Institution>();
  const fingerprints = new Set<string>();

  for (const item of groups.flat()) {
    const key = item.schoolCode
      ? `${item.officeCode}-${item.schoolCode}`
      : item.id;
    const fingerprint = `${item.name}-${item.address}`.replace(/\s+/g, "").toLowerCase();
    if (merged.has(key) || fingerprints.has(fingerprint)) continue;
    merged.set(key, item);
    fingerprints.add(fingerprint);
  }

  return Array.from(merged.values());
}

export function PathFinderApp() {
  const [officeCode, setOfficeCode] = useState(DEFAULT_OFFICE_CODE);
  const [district, setDistrict] = useState("all");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Institution[]>([]);
  const [selected, setSelected] = useState<Institution[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState<string>();
  const [isGenerating, setIsGenerating] = useState(false);
  const [plan, setPlan] = useState<RoutePlan | null>(null);
  const [activeDayId, setActiveDayId] = useState<string | null>(null);
  const [settings, setSettings] = useState<TripSettings>(createDefaultSettings);
  const [isImporting, setIsImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<string>();
  const [unmatched, setUnmatched] = useState<UnmatchedVisit[]>([]);

  const office = useMemo(() => getEducationOffice(officeCode), [officeCode]);

  useEffect(() => {
    setSettings((current) => {
      const visitsPerDay = suggestedVisitsPerDay(
        selected.length,
        current.startDate,
        current.endDate,
        current.includeWeekends,
      );
      if (visitsPerDay === current.visitsPerDay) return current;
      return { ...current, visitsPerDay };
    });
  }, [selected.length, settings.startDate, settings.endDate, settings.includeWeekends]);

  const runSearch = useCallback(async (nextQuery: string, nextOffice: string, nextDistrict: string) => {
    const keyword = nextQuery.trim();
    const isShortcut = DAEGU_OFFICE_SEARCH_SHORTCUTS.includes(
      keyword as (typeof DAEGU_OFFICE_SEARCH_SHORTCUTS)[number],
    );

    if (!keyword) {
      setResults([]);
      setSearchMessage(undefined);
      setIsSearching(false);
      return;
    }

    if (isShortcut) {
      setResults(searchDummyInstitutions(keyword, nextOffice, nextDistrict));
      setSearchMessage(undefined);
      setIsSearching(false);
      return;
    }

    if (keyword.length < 2) {
      setResults([]);
      setSearchMessage(undefined);
      setIsSearching(false);
      return;
    }

    const dummy = searchDummyInstitutions(keyword, nextOffice, nextDistrict);
    setResults(dummy);

    setIsSearching(true);
    const officeCenter = getEducationOffice(nextOffice).center;

    try {
      const params = new URLSearchParams();
      params.set("q", keyword);
      params.set("officeCode", nextOffice || NATIONWIDE_OFFICE_CODE);

      const [neisPayload, kakaoItems] = await Promise.all([
        fetch(`/api/neis/schools?${params.toString()}`)
          .then(async (response) => (await response.json()) as NeisSearchResponse)
          .catch(() => ({ ok: false, items: [], message: "나이스 API 검색에 실패했습니다." }) as NeisSearchResponse),
        searchKakaoPlaces(keyword, { center: officeCenter, officeCode: nextOffice }),
      ]);

      const remote = neisPayload.items ?? [];
      const filtered = remote.filter(
        (item) => nextDistrict === "all" || item.district === nextDistrict,
      );
      const merged = mergeInstitutions(dummy, filtered, kakaoItems);
      setResults(merged);

      if (merged.length > 0) {
        setSearchMessage(undefined);
        return;
      }

      if (neisPayload.skipped && kakaoItems.length === 0) {
        setSearchMessage("상호나 도로명 주소로도 검색할 수 있습니다.");
        return;
      }

      setSearchMessage(
        neisPayload.message ?? "검색 결과가 없습니다. 상호나 도로명 주소를 입력해 보세요.",
      );
    } catch {
      setSearchMessage("검색에 실패했습니다. 상호나 도로명 주소로 다시 시도해 보세요.");
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void runSearch(query, officeCode, district);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [query, officeCode, district, runSearch]);

  const handleOfficeChange = (code: string) => {
    setOfficeCode(code);
    setDistrict("all");
  };

  const toggleInstitution = (institution: Institution) => {
    setSelected((current) => {
      if (current.some((item) => item.id === institution.id)) {
        return current.filter((item) => item.id !== institution.id);
      }
      return [...current, institution];
    });
  };

  const fetchNeisByName = useCallback(async (name: string, nextOffice: string): Promise<Institution[]> => {
    if (name.trim().length < 2) return [];
    try {
      const params = new URLSearchParams();
      params.set("q", name.trim());
      params.set("officeCode", nextOffice || NATIONWIDE_OFFICE_CODE);
      const response = await fetch(`/api/neis/schools?${params.toString()}`);
      const payload = (await response.json()) as NeisSearchResponse;
      return payload.items ?? [];
    } catch {
      return [];
    }
  }, []);

  const importVisitRows = async (rows: VisitRow[]) => {
    if (rows.length === 0) {
      setImportMessage("가져올 기관명이 없습니다.");
      return;
    }

    setIsImporting(true);
    try {
      let remaining = rows;
      const collected: Institution[] = [];

      const dummyMatch = matchVisitRows(remaining, DUMMY_INSTITUTIONS);
      collected.push(...dummyMatch.matched);
      remaining = dummyMatch.unmatched;

      const extraCandidates: Institution[] = [];
      for (const row of remaining) {
        extraCandidates.push(...(await fetchNeisByName(row.name, officeCode)));
      }

      const neisMatch = matchVisitRows(remaining, extraCandidates);
      collected.push(...neisMatch.matched);
      remaining = neisMatch.unmatched;

      const stillUnmatched: UnmatchedVisit[] = [];
      const officeCenter = getEducationOffice(officeCode).center;
      for (const row of remaining) {
        const query = [row.name, row.address].filter(Boolean).join(" ");
        const places = await searchKakaoPlaces(query, { center: officeCenter, officeCode });
        const placeMatch = matchVisitRows([row], places);
        if (placeMatch.matched[0]) {
          collected.push(placeMatch.matched[0]);
        } else if (places[0] && !row.address) {
          collected.push({ ...places[0], name: row.name || places[0].name });
        } else if (places[0] && row.address) {
          collected.push(places[0]);
        } else {
          stillUnmatched.push(row);
        }
      }

      setSelected((current) => mergeSelected(current, collected));
      setUnmatched(stillUnmatched);
      setImportMessage(
        stillUnmatched.length > 0
          ? `${collected.length}곳 추가 · ${stillUnmatched.length}곳은 찾지 못했습니다.`
          : `${collected.length}곳을 선택 목록에 추가했습니다.`,
      );
    } finally {
      setIsImporting(false);
    }
  };

  const generateRoute = async () => {
    if (selected.length === 0) return;
    setIsGenerating(true);
    try {
      const withCoords = await ensureCoordinates(selected);
      setSelected(withCoords);
      const nextSettings = {
        ...settings,
        visitsPerDay: suggestedVisitsPerDay(
          withCoords.length,
          settings.startDate,
          settings.endDate,
          settings.includeWeekends,
        ),
      };
      setSettings(nextSettings);
      const nextPlan = buildRoutePlan(withCoords, nextSettings, office.center);
      setPlan(nextPlan);
      setActiveDayId(nextPlan.days[0]?.id ?? null);
    } finally {
      setIsGenerating(false);
    }
  };

  const exportPlan = async () => {
    if (!plan) return;
    await exportRoutePlanToExcel({
      office,
      settings,
      selectedCount: selected.length,
      plan,
    });
  };

  const resetAll = () => {
    setOfficeCode(DEFAULT_OFFICE_CODE);
    setDistrict("all");
    setQuery("");
    setSelected([]);
    setSearchMessage(undefined);
    setIsGenerating(false);
    setPlan(null);
    setActiveDayId(null);
    setSettings(createDefaultSettings());
    setResults([]);
    setIsImporting(false);
    setImportMessage(undefined);
    setUnmatched([]);
  };

  return (
    <div className="flex min-h-screen flex-col lg:h-screen lg:flex-row lg:overflow-hidden">
      <ControlPanel
        office={office}
        district={district}
        query={query}
        results={results}
        selected={selected}
        settings={settings}
        isSearching={isSearching}
        isGenerating={isGenerating}
        canExport={Boolean(plan && plan.days.length > 0)}
        isImporting={isImporting}
        importMessage={importMessage}
        unmatched={unmatched}
        searchMessage={searchMessage}
        onOfficeChange={handleOfficeChange}
        onDistrictChange={setDistrict}
        onQueryChange={setQuery}
        onToggleInstitution={toggleInstitution}
        onRemoveInstitution={(id) => setSelected((current) => current.filter((item) => item.id !== id))}
        onClearSelected={() => setSelected([])}
        onSelectAllResults={() => setSelected((current) => mergeSelected(current, results))}
        onDeselectResults={() => {
          const ids = new Set(results.map((item) => item.id));
          setSelected((current) => current.filter((item) => !ids.has(item.id)));
        }}
        onDownloadTemplate={downloadVisitTemplate}
        onImportFile={(file) => {
          void parseVisitFile(file).then((rows) => importVisitRows(rows));
        }}
        onImportPaste={(text) => {
          void importVisitRows(parseVisitPaste(text));
        }}
        onSettingsChange={(patch) => setSettings((current) => ({ ...current, ...patch }))}
        onGenerate={() => {
          void generateRoute();
        }}
        onExport={() => {
          void exportPlan();
        }}
        onReset={resetAll}
      />

      <main className="flex min-h-[70vh] flex-1 flex-col bg-[#eef3f8] lg:min-h-0">
        <section className="relative min-h-[360px] flex-1">
          <KakaoMapDynamic
            office={office}
            selected={selected}
            days={plan?.days ?? []}
            activeDayId={activeDayId}
          />
        </section>
        <section className="flex h-[42vh] min-h-[320px] max-h-[460px] flex-col border-t border-slate-200 bg-slate-50">
          <RouteCardList
            days={plan?.days ?? []}
            unassigned={plan?.unassigned ?? []}
            activeDayId={activeDayId}
            onSelectDay={setActiveDayId}
          />
        </section>
      </main>
    </div>
  );
}
