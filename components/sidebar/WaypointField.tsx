"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapPin, Search } from "lucide-react";
import { searchDummyInstitutions } from "@/lib/dummy-schools";
import { searchKakaoPlaces } from "@/lib/kakao-places";
import type { EducationOffice } from "@/lib/regions";
import type { Institution, TripWaypoint } from "@/lib/types";
import { waypointFromInstitution, waypointFromOffice } from "@/lib/waypoints";

interface WaypointFieldProps {
  label: string;
  value: TripWaypoint;
  office: EducationOffice;
  onChange: (point: TripWaypoint) => void;
}

function mergeWaypointResults(groups: Institution[][]): Institution[] {
  const merged: Institution[] = [];
  const seen = new Set<string>();
  for (const item of groups.flat()) {
    const key = `${item.id}|${item.name}|${item.address}`.replace(/\s+/g, "");
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }
  return merged.slice(0, 8);
}

export function WaypointField({ label, value, office, onChange }: WaypointFieldProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Institution[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, []);

  useEffect(() => {
    const keyword = query.trim();
    if (keyword.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }

    let cancelled = false;
    setSearching(true);
    const timer = window.setTimeout(() => {
      void (async () => {
        const dummy = searchDummyInstitutions(keyword, office.code);
        const places = await searchKakaoPlaces(keyword, {
          center: office.center,
          officeCode: office.code,
        });
        if (cancelled) return;
        setResults(mergeWaypointResults([dummy, places]));
        setSearching(false);
      })();
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [office.center, office.code, query]);

  const subtitle = useMemo(() => {
    if (!value) return "";
    const parts = [value.district, value.address].filter(Boolean);
    return parts.join(" · ");
  }, [value]);

  if (!value) return null;

  const selectPoint = (item: Institution) => {
    const next = waypointFromInstitution(item);
    if (!next) return;
    onChange(next);
    setQuery("");
    setResults([]);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-slate-400">{label}</p>
        <button
          type="button"
          onClick={() => {
            onChange(waypointFromOffice(office));
            setQuery("");
            setResults([]);
            setOpen(false);
          }}
          className="text-[11px] text-emerald-300 hover:text-emerald-200"
        >
          교육청으로
        </button>
      </div>
      <div className="rounded-lg border border-white/10 bg-[#0b1a2e] px-3 py-2">
        <p className="truncate text-sm font-medium text-white">{value.name}</p>
        {subtitle ? <p className="truncate text-[11px] text-slate-400">{subtitle}</p> : null}
      </div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="검색해서 변경"
          className="w-full rounded-lg border border-white/10 bg-[#0b1a2e] py-2 pl-8 pr-3 text-xs text-white outline-none ring-emerald-400 placeholder:text-slate-500 focus:ring-2"
        />
        {open && query.trim().length >= 2 ? (
          <div className="panel-scroll absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-white/10 bg-[#10233d] shadow-lg">
            {searching ? (
              <p className="px-3 py-2 text-xs text-slate-400">검색 중...</p>
            ) : results.length === 0 ? (
              <p className="px-3 py-2 text-xs text-slate-400">검색 결과가 없습니다.</p>
            ) : (
              results.map((item) => (
                <button
                  key={`${item.id}-${item.address}`}
                  type="button"
                  onClick={() => selectPoint(item)}
                  className="flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-white/5"
                >
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" />
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-medium text-white">{item.name}</span>
                    <span className="block truncate text-[11px] text-slate-400">
                      {item.district} · {item.address}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
