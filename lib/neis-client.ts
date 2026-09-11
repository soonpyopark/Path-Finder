import { request as httpsRequest } from "node:https";
import { URL } from "node:url";

export interface NeisHttpResult {
  ok: boolean;
  status: number;
  text: string;
}

export function getNeisHttp(url: string): Promise<NeisHttpResult> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = httpsRequest(
      {
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        port: parsed.port || 443,
        path: `${parsed.pathname}${parsed.search}`,
        method: "GET",
        headers: {
          Accept: "*/*",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) PathFinder/1.0",
        },
      },
      (response) => {
        const chunks: Buffer[] = [];
        response.on("data", (chunk) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });
        response.on("end", () => {
          const status = response.statusCode ?? 0;
          resolve({
            ok: status >= 200 && status < 300,
            status,
            text: Buffer.concat(chunks).toString("utf8"),
          });
        });
      },
    );

    req.on("error", reject);
    req.setTimeout(12000, () => {
      req.destroy(new Error("NEIS request timed out"));
    });
    req.end();
  });
}

export function buildSchoolInfoUrl(options: {
  apiKey: string;
  query: string;
  officeCode?: string;
  page?: number;
  size?: number;
}): string {
  const params = new URLSearchParams();
  params.set("KEY", options.apiKey);
  params.set("Type", "json");
  params.set("pIndex", String(options.page ?? 1));
  params.set("pSize", String(options.size ?? 50));
  params.set("SCHUL_NM", options.query);
  if (options.officeCode) {
    params.set("ATPT_OFCDC_SC_CODE", options.officeCode);
  }

  return `https://open.neis.go.kr/hub/schoolInfo?${params.toString()}`;
}
