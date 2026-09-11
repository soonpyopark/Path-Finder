import { createServer } from "node:net";
import { existsSync, rmSync } from "node:fs";
import { execSync, spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PORT = Number(process.env.PORT || 3000);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function listeningPids(port) {
  const pids = new Set();

  if (process.platform === "win32") {
    let output = "";
    try {
      output = execSync("netstat -ano", { encoding: "utf8" });
    } catch {
      return pids;
    }

    for (const line of output.split(/\r?\n/)) {
      if (!/LISTENING/i.test(line)) continue;
      const match = line.match(/:(\d+)\s+\S+\s+LISTENING\s+(\d+)/i);
      if (match && Number(match[1]) === port && match[2] !== "0") {
        pids.add(match[2]);
      }
    }
    return pids;
  }

  try {
    const output = execSync(`lsof -ti tcp:${port}`, { encoding: "utf8" });
    for (const pid of output.split(/\s+/).filter(Boolean)) pids.add(pid);
  } catch {
    return pids;
  }

  return pids;
}

function killPort(port) {
  const pids = listeningPids(port);
  for (const pid of pids) {
    try {
      if (process.platform === "win32") {
        execSync(`taskkill /PID ${pid} /T /F`, { stdio: "ignore" });
      } else {
        execSync(`kill -9 ${pid}`, { stdio: "ignore" });
      }
    } catch {
      // already gone
    }
  }
}

function waitUntilFree(port) {
  return new Promise((resolve) => {
    const probe = createServer();
    probe.once("error", () => {
      setTimeout(() => {
        waitUntilFree(port).then(resolve);
      }, 200);
    });
    probe.once("listening", () => {
      probe.close(() => resolve());
    });
    probe.listen(port, "127.0.0.1");
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function clearNextCache(retries = 8) {
  const nextDir = path.join(ROOT, ".next");
  if (!existsSync(nextDir)) return;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      rmSync(nextDir, { recursive: true, force: true, maxRetries: 10, retryDelay: 150 });
      console.log("Removed .next cache");
      return;
    } catch (error) {
      if (attempt === retries) {
        console.warn("Could not fully remove .next cache; continuing restart.");
        console.warn(error instanceof Error ? error.message : String(error));
        return;
      }
      await sleep(250 * attempt);
    }
  }
}

killPort(PORT);
await waitUntilFree(PORT);
await clearNextCache();
console.log(`Restarting Path Finder on http://localhost:${PORT}`);

const child = spawn("npm", ["run", "dev"], {
  cwd: ROOT,
  stdio: "inherit",
  shell: true,
  env: process.env,
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
