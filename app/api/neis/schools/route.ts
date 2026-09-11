import { NextRequest, NextResponse } from "next/server";
import { NATIONWIDE_OFFICE_CODE, getNeisOfficeCodes } from "@/lib/regions";
import { buildSchoolInfoUrl, getNeisHttp } from "@/lib/neis-client";
import { parseNeisSchoolResponse } from "@/lib/neis";
import type { Institution } from "@/lib/types";

export const runtime = "nodejs";

function parsePayload(text: string): Parameters<typeof parseNeisSchoolResponse>[0] | null {
  const trimmed = text.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return null;
  try {
    return JSON.parse(trimmed) as Parameters<typeof parseNeisSchoolResponse>[0];
  } catch {
    return null;
  }
}

async function fetchSchoolsForOffice(
  apiKey: string,
  query: string,
  officeCode?: string,
): Promise<{ items: Institution[]; message?: string; status: number }> {
  const url = buildSchoolInfoUrl({
    apiKey,
    query,
    officeCode,
  });

  let lastStatus = 0;
  let payloadText = "";

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const result = await getNeisHttp(url);
    lastStatus = result.status;
    payloadText = result.text;
    if (parsePayload(result.text)) break;
    if (attempt < 3) {
      await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
    }
  }

  const payload = parsePayload(payloadText);
  if (!payload) {
    return { items: [], status: lastStatus };
  }

  const parsed = parseNeisSchoolResponse(payload);
  return { items: parsed.items, message: parsed.message, status: lastStatus };
}

function mergeSchoolItems(groups: Institution[][]): Institution[] {
  const merged = new Map<string, Institution>();
  for (const group of groups) {
    for (const item of group) {
      const key = item.schoolCode
        ? `${item.officeCode}-${item.schoolCode}`
        : `${item.name}-${item.address}`;
      if (!merged.has(key)) merged.set(key, item);
    }
  }
  return Array.from(merged.values());
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const officeCode = request.nextUrl.searchParams.get("officeCode")?.trim() || "D10";
  const apiKey = process.env.NEXT_PUBLIC_NEIS_API_KEY?.trim();

  if (!apiKey) {
    return NextResponse.json({
      ok: true,
      items: [],
      source: "neis",
      message: "나이스 API 키가 없어 더미 데이터만 사용합니다.",
    });
  }

  if (query.length < 2) {
    return NextResponse.json({
      ok: true,
      items: [],
      source: "neis",
      skipped: true,
    });
  }

  const neisCodes =
    officeCode === NATIONWIDE_OFFICE_CODE ? [undefined] : (getNeisOfficeCodes(officeCode) ?? [officeCode]);

  try {
    const results = await Promise.all(
      neisCodes.map((code) => fetchSchoolsForOffice(apiKey, query, code)),
    );
    const items = mergeSchoolItems(results.map((result) => result.items));
    const failed = results.filter((result) => result.items.length === 0 && !result.message);
    const message = results.find((result) => result.message)?.message;

    if (items.length === 0 && failed.length === results.length) {
      const lastStatus = results[results.length - 1]?.status ?? 0;
      return NextResponse.json({
        ok: false,
        items: [],
        source: "neis",
        message:
          lastStatus === 500
            ? "나이스 서버가 일시적으로 응답하지 않습니다. 학교명을 다시 검색하거나 더미 목록에서 선택해 주세요."
            : `나이스 API가 학교 목록을 반환하지 않았습니다. (HTTP ${lastStatus})`,
      });
    }

    return NextResponse.json({
      ok: true,
      items,
      source: "neis",
      message: items.length > 0 ? undefined : message,
    });
  } catch {
    return NextResponse.json({
      ok: false,
      items: [],
      source: "neis",
      message: "나이스 API에 연결하지 못했습니다.",
    });
  }
}
