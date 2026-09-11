"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { KakaoMapDynamic } from "@/components/map/KakaoMapDynamic";
import { RouteCardList } from "@/components/routes/RouteCardList";
import { ControlPanel } from "@/components/sidebar/ControlPanel";
import { searchDummyInstitutions } from "@/lib/dummy-schools";
import { ensureCoordinates } from "@/lib/geocode";
import { DEFAULT_OFFICE_CODE, getEducationOffice, NATIONWIDE_OFFICE_CODE } from "@/lib/regions";
import { addDaysISO, buildRoutePlan, todayISO } from "@/lib/route-optimizer";
import type { Institution, RoutePlan, TripSettings } from "@/lib/types";

interface NeisSearchResponse {
  ok: boolean;
  items?: Institution[];
  message?: string;
  skipped?: boolean;
}

function mergeInstitutions(dummy: Institution[], remote: Institution[]): Institution[] {
  const merged = new Map<string, Institution>();

  for (const item of [...dummy, ...remote]) {
    const key = item.schoolCode
      ? `${item.officeCode}-${item.schoolCode}`
      : `${item.name}-${item.address}`;
    if (!merged.has(key)) merged.set(key, item);
  }

  return Array.from(merged.values());
}

export function PathFinderApp() {
  const [officeCode, setOfficeCode] = useState(DEFAULT_OFFICE_CODE);
  const [district, setDistrict] = useState("all");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Institution[]>(() =>
    searchDummyInstitutions("", DEFAULT_OFFICE_CODE, "all"),
  );
  const [selected, setSelected] = useState<Institution[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState<string>();
  const [isGenerating, setIsGenerating] = useState(false);
  const [plan, setPlan] = useState<RoutePlan | null>(null);
  const [activeDayId, setActiveDayId] = useState<string | null>(null);
  const [settings, setSettings] = useState<TripSettings>(() => ({
    visitsPerDay: 4,
    startDate: todayISO(),
    endDate: addDaysISO(todayISO(), 4),
    includeWeekends: false,
  }));

  const office = useMemo(() => getEducationOffice(officeCode), [officeCode]);

  const runSearch = useCallback(async (nextQuery: string, nextOffice: string, nextDistrict: string) => {
    const dummy = searchDummyInstitutions(nextQuery, nextOffice, nextDistrict);
    setResults(dummy);

    const keyword = nextQuery.trim();
    if (keyword.length < 2) {
      setSearchMessage(undefined);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    try {
      const params = new URLSearchParams();
      params.set("q", keyword);
      params.set("officeCode", nextOffice || NATIONWIDE_OFFICE_CODE);
      const response = await fetch(`/api/neis/schools?${params.toString()}`);
      const payload = (await response.json()) as NeisSearchResponse;
      if (payload.skipped) {
        setSearchMessage(undefined);
        return;
      }
      const remote = payload.items ?? [];
      const filtered = remote.filter(
        (item) => nextDistrict === "all" || item.district === nextDistrict,
      );
      setResults(mergeInstitutions(dummy, filtered));
      const neisEmpty = filtered.length === 0;
      setSearchMessage(
        neisEmpty && dummy.length > 0
          ? undefined
          : payload.ok
            ? payload.message
            : payload.message ?? "나이스 검색에 실패했습니다.",
      );
    } catch {
      setSearchMessage("나이스 API 검색에 실패해 더미 데이터만 표시합니다.");
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

  const generateRoute = async () => {
    if (selected.length === 0) return;
    setIsGenerating(true);
    try {
      const withCoords = await ensureCoordinates(selected);
      setSelected(withCoords);
      const nextPlan = buildRoutePlan(withCoords, settings, office.center);
      setPlan(nextPlan);
      setActiveDayId(nextPlan.days[0]?.id ?? null);
    } finally {
      setIsGenerating(false);
    }
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
        searchMessage={searchMessage}
        onOfficeChange={handleOfficeChange}
        onDistrictChange={setDistrict}
        onQueryChange={setQuery}
        onToggleInstitution={toggleInstitution}
        onRemoveInstitution={(id) => setSelected((current) => current.filter((item) => item.id !== id))}
        onClearSelected={() => setSelected([])}
        onSettingsChange={(patch) => setSettings((current) => ({ ...current, ...patch }))}
        onGenerate={() => {
          void generateRoute();
        }}
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
        <section className="h-[260px] border-t border-slate-200 bg-slate-50">
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
