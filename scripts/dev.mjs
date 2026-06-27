import { execSync, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const port = process.env.PORT || "3000";

function run(command, options = {}) {
  execSync(command, {
    cwd: projectRoot,
    stdio: "inherit",
    shell: true,
    ...options,
  });
}

async function isDevServerHealthy(targetPort) {
  try {
    const response = await fetch(`http://127.0.0.1:${targetPort}/`, {
      signal: AbortSignal.timeout(2000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

function freePort(targetPort) {
  if (process.platform !== "win32") return;

  try {
    const output = execSync(`netstat -ano | findstr /R /C:":${targetPort} .*LISTENING"`, {
      encoding: "utf8",
      shell: true,
    });

    const pids = new Set(
      output
        .split(/\r?\n/)
        .map((line) => line.trim().split(/\s+/).at(-1))
        .filter((pid) => pid && /^\d+$/.test(pid))
    );

    for (const pid of pids) {
      try {
        execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore", shell: true });
      } catch {
        // Process may already be gone.
      }
    }
  } catch {
    // Port is already free.
  }
}

run("node scripts/ensure-next-cache.mjs");

const alreadyRunning = await isDevServerHealthy(port);
if (alreadyRunning) {
  console.log(`Dev server already running at http://localhost:${port}`);
  process.exit(0);
}

freePort(port);

const nextDev = spawn("npx next dev", [`-p`, port], {
  cwd: projectRoot,
  stdio: "inherit",
  shell: true,
});

const shutdown = (signal) => {
  if (!nextDev.killed) {
    nextDev.kill(signal);
  }
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

nextDev.on("exit", (code, signal) => {
  if (signal === "SIGTERM" || signal === "SIGINT") {
    process.exit(0);
    return;
  }
  process.exit(code ?? 0);
});