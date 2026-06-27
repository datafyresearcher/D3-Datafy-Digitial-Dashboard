import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const projectRoot = process.cwd();
const nextPath = path.join(projectRoot, ".next");
const externalCache = path.join(
  process.env.LOCALAPPDATA || os.tmpdir(),
  "vibe-next"
);

const probeFiles = [
  "server/font-manifest.json",
  "app-build-manifest.json",
  "build-manifest.json",
  "server/app-paths-manifest.json",
  "server/middleware-manifest.json",
];

function run(command) {
  execSync(command, { stdio: "pipe", shell: true });
}

function getItemInfo(targetPath) {
  try {
    const output = execSync(
      `powershell -NoProfile -Command "$item = Get-Item -LiteralPath '${targetPath.replace(/'/g, "''")}' -Force; Write-Output ($item.Attributes.ToString()); Write-Output ($item.LinkType); Write-Output ($item.Target -join '|')"`,
      { encoding: "utf8" }
    ).trim();

    const [attributes = "", linkType = "", target = ""] = output.split(/\r?\n/);
    return { attributes, linkType, target };
  } catch {
    return { attributes: "", linkType: "", target: "" };
  }
}

function removePath(targetPath) {
  if (!fs.existsSync(targetPath)) return;
  run(`cmd /c rmdir /s /q "${targetPath}"`);
}

function hasBrokenReparsePoint(targetPath) {
  if (!fs.existsSync(targetPath)) return false;

  const { attributes } = getItemInfo(targetPath);
  if (!attributes.includes("ReparsePoint")) return false;

  try {
    fs.readlinkSync(targetPath);
    return false;
  } catch (error) {
    return (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error.code === "EINVAL" || error.code === "UNKNOWN")
    );
  }
}

function shouldRemoveNextCache() {
  if (!fs.existsSync(nextPath)) return false;

  const { linkType } = getItemInfo(nextPath);
  if (linkType === "Junction") {
    return true;
  }

  if (hasBrokenReparsePoint(nextPath)) {
    return true;
  }

  for (const relativePath of probeFiles) {
    const absolutePath = path.join(nextPath, relativePath);
    if (hasBrokenReparsePoint(absolutePath)) {
      return true;
    }
  }

  return false;
}

if (process.platform === "win32") {
  if (shouldRemoveNextCache()) {
    console.log("Removing corrupted .next cache...");
    removePath(nextPath);
    removePath(externalCache);
  }
}