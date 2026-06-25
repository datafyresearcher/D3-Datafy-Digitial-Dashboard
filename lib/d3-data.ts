/**
 * Mock data for the D³ Portal tabs (Maps, Defects, Report, SCADA).
 * In production this would be fetched from an API / SCADA historian.
 */

export type Site = {
  id: string;
  name: string;
  client: string;
  location: string;
  lat: number;
  lng: number;
  /** nominal DC capacity in MW */
  capacityMW: number;
  panelCount: number;
  commissioned: string;
  /** commissioning reference point for the panel array marker cluster */
  centerLat: number;
  centerLng: number;
};

export type DefectType =
  | "Hotspot"
  | "Bypass Diode"
  | "Cell Crack"
  | "String Imbalance"
  | "Soiling"
  | "PID";

export type Severity = "Critical" | "Major" | "Minor";

export type Panel = {
  id: string;
  siteId: string;
  block: string;
  row: number;
  col: number;
  status: "Healthy" | "Defective";
  defectType?: DefectType;
  /** temperature difference vs. healthy neighbours in °C */
  tempDiff?: number;
  severity?: Severity;
  /** estimated power loss for this panel in Watts */
  powerLossW?: number;
  lat: number;
  lng: number;
};

export type ScadaPoint = {
  date: string;
  /** daily energy yield in kWh */
  power: number;
  /** plane-of-array irradiance, daily avg W/m² */
  irradiance: number;
  /** module temperature daily avg °C */
  moduleTemp: number;
  /** ambient temperature daily avg °C */
  ambientTemp: number;
  /** performance ratio % */
  performanceRatio: number;
};

export const sites: Site[] = [
  {
    id: "site-qa",
    name: "Quaid-e-Azam Solar Park",
    client: "Quaid-e-Azam Solar Power",
    location: "Bahawalpur, Punjab",
    lat: 29.3858,
    lng: 71.6908,
    capacityMW: 100,
    panelCount: 411200,
    commissioned: "May 2015",
    centerLat: 29.3858,
    centerLng: 71.6908,
  },
  {
    id: "site-jzs",
    name: "JZS Solar Farm",
    client: "JZS Farm",
    location: "Sahiwal, Punjab",
    lat: 30.6662,
    lng: 73.0223,
    capacityMW: 20,
    panelCount: 82240,
    commissioned: "Aug 2019",
    centerLat: 30.6662,
    centerLng: 73.0223,
  },
  {
    id: "site-nestle",
    name: "Nestlé Sheikhupura Plant",
    client: "Nestlé",
    location: "Sheikhupura, Punjab",
    lat: 31.516,
    lng: 74.0167,
    capacityMW: 4.5,
    panelCount: 11250,
    commissioned: "Mar 2021",
    centerLat: 31.516,
    centerLng: 74.0167,
  },
];

/* ----------------------------- Defect catalogue ---------------------------- */

const DEFECT_BLUEPRINT: { type: DefectType; tempDiff: number; severity: Severity; powerLossW: number }[] = [
  { type: "Hotspot", tempDiff: 24.5, severity: "Critical", powerLossW: 320 },
  { type: "Hotspot", tempDiff: 19.8, severity: "Critical", powerLossW: 285 },
  { type: "Bypass Diode", tempDiff: 16.2, severity: "Major", powerLossW: 410 },
  { type: "Bypass Diode", tempDiff: 14.1, severity: "Major", powerLossW: 405 },
  { type: "Cell Crack", tempDiff: 11.7, severity: "Major", powerLossW: 180 },
  { type: "Cell Crack", tempDiff: 9.4, severity: "Minor", powerLossW: 95 },
  { type: "String Imbalance", tempDiff: 7.9, severity: "Minor", powerLossW: 150 },
  { type: "Soiling", tempDiff: 6.2, severity: "Minor", powerLossW: 70 },
  { type: "PID", tempDiff: 13.6, severity: "Major", powerLossW: 260 },
  { type: "PID", tempDiff: 21.3, severity: "Critical", powerLossW: 310 },
];

/** Deterministic pseudo-random so the data is stable across renders. */
function seeded(n: number) {
  const x = Math.sin(n * 99.13) * 43758.5453;
  return x - Math.floor(x);
}

/** Build the full panel array for a site, marking a sample as defective. */
function buildPanels(site: Site): Panel[] {
  const panels: Panel[] = [];
  const defectiveCount = Math.max(
    8,
    Math.round(site.panelCount * 0.012 * (site.id === "site-qa" ? 1.4 : 0.8))
  );
  const defectiveIndex = new Set<number>();
  let seed = 0;
  while (defectiveIndex.size < Math.min(defectiveCount, 40)) {
    seed += 1;
    const idx = Math.floor(seeded(site.id.length + seed) * site.panelCount);
    defectiveIndex.add(idx);
  }

  // For the map we only need a small, plottable sample around the site centre.
  const plotSample = 120;
  let defectCursor = 0;
  for (let i = 0; i < plotSample; i++) {
    const isDefective = defectiveIndex.has(i);
    const blueprint = isDefective
      ? DEFECT_BLUEPRINT[defectCursor % DEFECT_BLUEPRINT.length]
      : null;
    if (isDefective) defectCursor += 1;

    const block = `Block ${String.fromCharCode(65 + (i % 6))}`;
    const row = Math.floor(i / 12) + 1;
    const col = (i % 12) + 1;
    const jitterLat = (seeded(i + 1) - 0.5) * 0.004;
    const jitterLng = (seeded(i + 2) - 0.5) * 0.004;

    panels.push({
      id: `${site.id}-P-${String(i + 1).padStart(4, "0")}`,
      siteId: site.id,
      block,
      row,
      col,
      status: isDefective ? "Defective" : "Healthy",
      defectType: blueprint?.type,
      tempDiff: blueprint?.tempDiff,
      severity: blueprint?.severity,
      powerLossW: blueprint?.powerLossW,
      lat: site.centerLat + jitterLat,
      lng: site.centerLng + jitterLng,
    });
  }
  return panels;
}

const panelCache: Record<string, Panel[]> = {};
export function getPanels(siteId: string): Panel[] {
  if (!panelCache[siteId]) {
    const site = sites.find((s) => s.id === siteId)!;
    panelCache[siteId] = buildPanels(site);
  }
  return panelCache[siteId];
}

/** Plant-wide defective tally (larger than the plottable sample). */
export function getDefectiveSummary(siteId: string) {
  const site = sites.find((s) => s.id === siteId)!;
  const total = site.panelCount;
  const defective = Math.round(total * (site.id === "site-qa" ? 0.014 : 0.009));
  const healthy = total - defective;
  return { total, defective, healthy };
}

/* -------------------------------- SCADA ---------------------------------- */

export function getScada(siteId: string): ScadaPoint[] {
  const site = sites.find((s) => s.id === siteId)!;
  const factor = site.capacityMW; // larger plants produce more kWh
  const out: ScadaPoint[] = [];
  const today = new Date("2026-06-20T00:00:00Z");
  for (let d = 29; d >= 0; d--) {
    const date = new Date(today);
    date.setDate(today.getDate() - d);
    const wave = Math.sin(d / 3.2) * 0.12 + 1;
    const dust = d > 20 ? (d - 20) * 0.012 : 0; // gradual soiling late in month
    out.push({
      date: date.toISOString().slice(0, 10),
      power: Math.round(factor * 4.8 * 1000 * wave * (1 - dust)),
      irradiance: Math.round(620 * wave + 40),
      moduleTemp: Math.round((38 + Math.sin(d / 2) * 6) * 10) / 10,
      ambientTemp: Math.round((31 + Math.sin(d / 2) * 4) * 10) / 10,
      performanceRatio: Math.round((86 - dust * 100 + Math.sin(d / 4) * 3) * 10) / 10,
    });
  }
  return out;
}

/* ------------------------------- Report ---------------------------------- */

export function getReportMetrics(siteId: string) {
  const site = sites.find((s) => s.id === siteId)!;
  const summary = getDefectiveSummary(siteId);
  const panels = getPanels(siteId);
  const sample = panels.filter((p) => p.status === "Defective");

  // Extrapolate the sampled power loss to plant scale.
  const sampleLossW = sample.reduce((sum, p) => sum + (p.powerLossW ?? 0), 0);
  const avgLossPerPanelW = sample.length ? sampleLossW / sample.length : 200;
  const totalPowerLossKW = (summary.defective * avgLossPerPanelW) / 1000;

  // Energy / revenue impact (4.5 peak-sun-hours, $0.12/kWh).
  const annualEnergyLossKWh = totalPowerLossKW * 4.5 * 365;
  const annualRevenueLossUSD = Math.round(annualEnergyLossKWh * 0.12);
  const annualYieldKWh = site.capacityMW * 1000 * 4.5 * 365;

  const byType: Record<string, number> = {};
  const bySeverity: Record<Severity, number> = { Critical: 0, Major: 0, Minor: 0 };
  for (const p of sample) {
    if (p.defectType) byType[p.defectType] = (byType[p.defectType] ?? 0) + 1;
    if (p.severity) bySeverity[p.severity] += 1;
  }
  // scale counts to plant total
  const scale = summary.defective / Math.max(sample.length, 1);
  for (const k of Object.keys(byType)) byType[k] = Math.round(byType[k] * scale);
  (Object.keys(bySeverity) as Severity[]).forEach((k) => (bySeverity[k] = Math.round(bySeverity[k] * scale)));

  const healthScore = Math.round(
    100 - (summary.defective / summary.total) * 100 * 8 // defects weighted heavily
  );

  return {
    site,
    summary,
    totalPowerLossKW: Math.round(totalPowerLossKW * 10) / 10,
    annualEnergyLossKWh: Math.round(annualEnergyLossKWh),
    annualRevenueLossUSD,
    annualYieldKWh: Math.round(annualYieldKWh),
    byType,
    bySeverity,
    healthScore,
    inspectionDate: "Jun 18, 2026",
  };
}

export const SEVERITY_COLORS: Record<Severity, string> = {
  Critical: "#ef4444",
  Major: "#f59e0b",
  Minor: "#eab308",
};

export const DEFECT_COLORS: Record<DefectType, string> = {
  Hotspot: "#ef4444",
  "Bypass Diode": "#f97316",
  "Cell Crack": "#f59e0b",
  "String Imbalance": "#8b5cf6",
  Soiling: "#06b6d4",
  PID: "#ec4899",
};
