"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  Crosshair,
  Eye,
  EyeOff,
  Layers3,
  LocateFixed,
  RotateCcw,
  Sun,
  Search,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import type { User } from "@/lib/auth";
import type { Store, Project } from "@/lib/om";
import { visibleProjects } from "@/lib/om";
import { getOmMapConfig } from "@/lib/om-map-style";
function getGlobeCamera(embedded: boolean) {
  return {
    center: [0, 18] as [number, number],
    zoom: embedded ? 1.15 : 1.35,
    pitch: 0,
    bearing: -18,
  };
}

function applyGlobeAtmosphere(map: maplibregl.Map) {
  try {
    map.setProjection({ type: "globe" });
    map.setSky({
      "sky-color": "#8ecae6",
      "sky-horizon-blend": 0.55,
      "horizon-color": "#1d4ed8",
      "horizon-fog-blend": 0.08,
      "fog-color": "#0b1020",
      "fog-ground-blend": 0.65,
    });
    (map as maplibregl.Map & { setFog?: (options: Record<string, unknown>) => void }).setFog?.({
      range: [0.4, 9],
      color: "#1e3a8a",
      "horizon-blend": 0.12,
      "high-color": "#93c5fd",
      "space-color": "#020617",
      "star-intensity": 0.25,
    });
  } catch {
    // Globe atmosphere is decorative when unsupported.
  }
}
const SITE_CAMERA = { pitch: 58, bearing: -20 };
const INTRO_GLOBE_HOLD_MS = 1600;
const INTRO_PROJECT_DURATION_MS = 6200;
const INTRO_PROJECT_HOLD_MS = 2200;

type LayerEntry = {
  id: string;
  group: "Client Site Locations" | "Map View";
  label: string;
  detail: string;
  color: string;
  project?: Project;
  visible: boolean;
};

type SiteBoundary = {
  id: string;
  name: string;
  match: string[];
  color: string;
  coordinates: [number, number][];
};

const SITE_BOUNDARIES: SiteBoundary[] = [
  {
    id: "ngs-nespak",
    name: "NGS NESPAK",
    color: "#22d3ee",
    match: ["ngs nespak", "ngc nespak", "nespak"],
    coordinates: [
      [74.2815397, 31.4334365],
      [74.281721, 31.4334767],
      [74.2816758, 31.433687],
      [74.2814864, 31.4336541],
      [74.2815397, 31.4334365],
    ],
  },
  {
    id: "ahte-office",
    name: "AHTE Office",
    color: "#10b981",
    match: ["ahte", "ahte office", "al-hussain", "al hussain", "alhussain", "hussain traders"],
    coordinates: [
      [74.2358897, 31.4221032],
      [74.2359042, 31.4219873],
      [74.2361335, 31.4220037],
      [74.236128, 31.4221212],
      [74.2358897, 31.4221032],
    ],
  },
];

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const onAbort = () => {
      clearTimeout(timer);
      resolve();
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getResponsivePadding(): maplibregl.PaddingOptions {
  if (typeof window === "undefined") return { top: 92, right: 92, bottom: 88, left: 352 };
  const isMobile = window.innerWidth < 768;
  return isMobile
    ? { top: 220, right: 28, bottom: 40, left: 28 }
    : { top: 96, right: 112, bottom: 92, left: 368 };
}

function normalizeMatch(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function sourceSafeId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]+/g, "-");
}

function getBoundaryForProject(project: Project, clientName?: string): SiteBoundary | undefined {
  const haystack = normalizeMatch(`${project.name} ${project.address} ${clientName ?? ""}`);
  return SITE_BOUNDARIES.find((boundary) =>
    boundary.match.some((needle) => haystack.includes(normalizeMatch(needle)))
  );
}

function getBoundaryBounds(boundary: SiteBoundary): maplibregl.LngLatBounds {
  const bounds = new maplibregl.LngLatBounds();
  boundary.coordinates.forEach((coordinate) => bounds.extend(coordinate));
  return bounds;
}

function getBoundaryCenter(boundary: SiteBoundary): [number, number] {
  const bounds = getBoundaryBounds(boundary);
  const center = bounds.getCenter();
  return [center.lng, center.lat];
}

function getProjectCenter(project: Project, clientName?: string): [number, number] {
  const boundary = getBoundaryForProject(project, clientName);
  return boundary ? getBoundaryCenter(boundary) : [project.lng, project.lat];
}

function projectBounds(projects: Project[], clientById: Map<string, string>): maplibregl.LngLatBounds | null {
  if (!projects.length) return null;
  const bounds = new maplibregl.LngLatBounds();
  projects.forEach((project) => {
    const boundary = getBoundaryForProject(project, clientById.get(project.clientId));
    if (boundary) {
      boundary.coordinates.forEach((coordinate) => bounds.extend(coordinate));
    } else {
      bounds.extend([project.lng, project.lat]);
    }
  });
  return bounds;
}

export default function SiteLocationsView({
  user,
  store,
  embedded = false,
}: {
  user: User;
  store: Store;
  embedded?: boolean;
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRefs = useRef<Record<string, maplibregl.Marker>>({});
  const introTimeoutRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [visibleProjectIds, setVisibleProjectIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const mapConfig = useMemo(() => getOmMapConfig(), []);
  const projects = useMemo(() => visibleProjects(user), [user, store]);
  const projectKey = useMemo(() => projects.map((project) => project.id).join("|"), [projects]);
  const totalCapacity = projects.reduce((sum, project) => sum + project.sizeKWp, 0);
  const totalPanels = projects.reduce((sum, project) => sum + project.panelCount, 0);

  const clientById = useMemo(
    () => new Map(store.clients.map((client) => [client.id, client.company])),
    [store.clients]
  );
  const bounds = useMemo(() => projectBounds(projects, clientById), [clientById, projects]);

  const filteredProjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((project) => {
      const clientName = clientById.get(project.clientId) ?? "";
      return (
        project.name.toLowerCase().includes(q) ||
        project.address.toLowerCase().includes(q) ||
        clientName.toLowerCase().includes(q)
      );
    });
  }, [projects, searchQuery, clientById]);

  const layerEntries = useMemo<LayerEntry[]>(
    () => [
      ...filteredProjects.map((project) => ({
        id: project.id,
        group: "Client Site Locations" as const,
        label: project.name,
        detail: `${clientById.get(project.clientId) ?? "Client site"} · ${project.sizeKWp.toLocaleString()} kWp`,
        color: project.status === "Under Maintenance" ? "#f59e0b" : "#10b981",
        project,
        visible: visibleProjectIds.has(project.id),
      })),
      {
        id: "all-sites",
        group: "Map View",
        label: "All Sites",
        detail: "Fit every visible client project",
        color: "#ffffff",
        visible: true,
      },
      {
        id: "globe-view",
        group: "Map View",
        label: "Globe View",
        detail: "Full 3D satellite globe with atmosphere",
        color: "#60a5fa",
        visible: true,
      },
    ],
    [clientById, filteredProjects, visibleProjectIds]
  );

  const clearIntro = () => {
    if (introTimeoutRef.current !== null) {
      window.clearTimeout(introTimeoutRef.current);
      introTimeoutRef.current = null;
    }
    abortRef.current?.abort();
  };

  const focusGlobeView = useCallback((duration = 1300) => {
    const map = mapRef.current;
    if (!map) return;

    setActiveProjectId("globe-view");
    applyGlobeAtmosphere(map);
    map.setPadding({ top: 0, right: 0, bottom: 0, left: 0 });

    const camera = getGlobeCamera(embedded);
    map.easeTo({
      center: camera.center,
      zoom: camera.zoom,
      pitch: camera.pitch,
      bearing: camera.bearing,
      duration,
      essential: true,
    });
  }, [embedded]);

  const focusAllSites = useCallback((duration = 1600) => {
    const map = mapRef.current;
    if (!map || !bounds || bounds.isEmpty()) return;

    setActiveProjectId("all-sites");
    try {
      map.setProjection({ type: "mercator" });
    } catch {
      // Keep current projection when mercator is unavailable.
    }

    map.fitBounds(bounds, {
      padding: getResponsivePadding(),
      maxZoom: projects.length === 1 ? 13.4 : 7,
      pitch: SITE_CAMERA.pitch,
      bearing: SITE_CAMERA.bearing,
      duration,
      essential: true,
    });
  }, [bounds, projects.length]);

  const openProjectPopup = (project: Project) => {
    const map = mapRef.current;
    const marker = markerRefs.current[project.id];
    if (!map || !marker) return;
    marker.getPopup()?.addTo(map);
  };

  const focusProject = useCallback((project: Project, duration = 1500) => {
    const map = mapRef.current;
    if (!map) return;

    clearIntro();
    setActiveProjectId(project.id);
    try {
      map.setProjection({ type: "mercator" });
    } catch {
      // Keep current projection when mercator is unavailable.
    }
    const boundary = getBoundaryForProject(project, clientById.get(project.clientId));

    if (boundary) {
      map.fitBounds(getBoundaryBounds(boundary), {
        padding: { top: 150, right: 180, bottom: 130, left: 380 },
        maxZoom: mapConfig.maxSiteZoom,
        pitch: SITE_CAMERA.pitch,
        bearing: SITE_CAMERA.bearing,
        duration,
        essential: true,
      });
    } else {
      map.flyTo({
        center: [project.lng, project.lat],
        zoom: Math.min(13.5, mapConfig.maxSiteZoom),
        pitch: SITE_CAMERA.pitch,
        bearing: SITE_CAMERA.bearing,
        duration,
        essential: true,
      });
    }
    window.setTimeout(() => openProjectPopup(project), Math.min(900, duration));
  }, [clientById, mapConfig.maxSiteZoom]);

  const runIntroTour = useCallback(() => {
    const map = mapRef.current;
    if (!map || projects.length === 0) return;

    clearIntro();
    setActiveProjectId(null);
    focusGlobeView(1200);

    const abort = new AbortController();
    abortRef.current = abort;

    introTimeoutRef.current = window.setTimeout(async () => {
      introTimeoutRef.current = null;
      if (abort.signal.aborted) return;

      for (const project of projects) {
        if (abort.signal.aborted) return;
        setActiveProjectId(project.id);
        const boundary = getBoundaryForProject(project, clientById.get(project.clientId));
        if (boundary) {
          map.fitBounds(getBoundaryBounds(boundary), {
            padding: { top: 150, right: 180, bottom: 130, left: 380 },
            maxZoom: mapConfig.maxSiteZoom,
            pitch: SITE_CAMERA.pitch,
            bearing: SITE_CAMERA.bearing,
            duration: INTRO_PROJECT_DURATION_MS,
            essential: true,
          });
        } else {
          map.flyTo({
            center: [project.lng, project.lat],
            zoom: Math.min(13.3, mapConfig.maxSiteZoom),
            pitch: SITE_CAMERA.pitch,
            bearing: SITE_CAMERA.bearing,
            duration: INTRO_PROJECT_DURATION_MS,
            essential: true,
          });
        }
        await sleep(INTRO_PROJECT_DURATION_MS + INTRO_PROJECT_HOLD_MS, abort.signal);
      }

      if (!abort.signal.aborted) {
        focusAllSites(2600);
      }
    }, INTRO_GLOBE_HOLD_MS);
  }, [clientById, focusAllSites, focusGlobeView, mapConfig.maxSiteZoom, projects]);

  const focusEntry = (entry: LayerEntry) => {
    if (entry.id === "globe-view") {
      clearIntro();
      focusGlobeView();
      return;
    }

    if (entry.id === "all-sites") {
      clearIntro();
      focusAllSites();
      return;
    }

    if (entry.project) {
      focusProject(entry.project);
    }
  };

  const toggleProjectVisibility = (projectId: string) => {
    setVisibleProjectIds((current) => {
      const next = new Set(current);
      const marker = markerRefs.current[projectId];
      const boundaryLayerId = `site-boundary-${sourceSafeId(projectId)}`;
      const boundaryOutlineId = `site-boundary-outline-${sourceSafeId(projectId)}`;
      if (next.has(projectId)) {
        next.delete(projectId);
        if (marker) marker.getElement().style.display = "none";
        if (mapRef.current?.getLayer(boundaryLayerId)) mapRef.current.setLayoutProperty(boundaryLayerId, "visibility", "none");
        if (mapRef.current?.getLayer(boundaryOutlineId)) mapRef.current.setLayoutProperty(boundaryOutlineId, "visibility", "none");
      } else {
        next.add(projectId);
        if (marker) marker.getElement().style.display = "block";
        if (mapRef.current?.getLayer(boundaryLayerId)) mapRef.current.setLayoutProperty(boundaryLayerId, "visibility", "visible");
        if (mapRef.current?.getLayer(boundaryOutlineId)) mapRef.current.setLayoutProperty(boundaryOutlineId, "visibility", "visible");
      }
      return next;
    });
  };

  useEffect(() => {
    setVisibleProjectIds(new Set(projects.map((project) => project.id)));
  }, [projectKey, projects]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current || projects.length === 0) return;

    const initialCamera = getGlobeCamera(embedded);
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: mapConfig.style,
      center: initialCamera.center,
      zoom: initialCamera.zoom,
      pitch: initialCamera.pitch,
      bearing: initialCamera.bearing,
      maxZoom: mapConfig.maxMapZoom,
    });

    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl(), "top-right");
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 140, unit: "metric" }), "bottom-right");
    const loadingFallback = window.setTimeout(() => setLoading(false), 9000);

    map.once("load", () => {
      applyGlobeAtmosphere(map);

      projects.forEach((project) => {
        const clientName = clientById.get(project.clientId) ?? "Client site";
        const boundary = getBoundaryForProject(project, clientName);
        const markerCoordinate = getProjectCenter(project, clientName);

        if (boundary) {
          const safeProjectId = sourceSafeId(project.id);
          const sourceId = `site-boundary-source-${safeProjectId}`;
          const fillLayerId = `site-boundary-${safeProjectId}`;
          const outlineLayerId = `site-boundary-outline-${safeProjectId}`;
          const polygon = {
            type: "Feature",
            properties: { name: boundary.name, projectId: project.id },
            geometry: {
              type: "Polygon",
              coordinates: [boundary.coordinates],
            },
          };

          if (!map.getSource(sourceId)) {
            map.addSource(sourceId, {
              type: "geojson",
              data: polygon as GeoJSON.Feature,
            });
          }

          if (!map.getLayer(fillLayerId)) {
            map.addLayer({
              id: fillLayerId,
              type: "fill",
              source: sourceId,
              paint: {
                "fill-color": boundary.color,
                "fill-opacity": 0.3,
              },
            });
          }

          if (!map.getLayer(outlineLayerId)) {
            map.addLayer({
              id: outlineLayerId,
              type: "line",
              source: sourceId,
              paint: {
                "line-color": boundary.color,
                "line-width": 4,
                "line-opacity": 0.95,
              },
            });
          }
        }

        const el = document.createElement("button");
        el.type = "button";
        el.className = `om-site-label${project.status === "Under Maintenance" ? " is-maintenance" : ""}`;
        el.innerHTML = `<span>${escapeHtml(project.name)}</span>`;
        el.addEventListener("click", () => focusProject(project));

        const popup = new maplibregl.Popup({
          closeButton: true,
          closeOnMove: false,
          maxWidth: "320px",
          className: "om-site-popup",
        }).setHTML(`
          <div>
            <h3>${escapeHtml(project.name)}</h3>
            <p><strong>Client:</strong> ${escapeHtml(clientName)}</p>
            <p><strong>Location:</strong> ${escapeHtml(project.address)}</p>
            ${boundary ? `<p><strong>Boundary:</strong> ${escapeHtml(boundary.name)}</p>` : ""}
            <p><strong>Capacity:</strong> ${project.sizeKWp.toLocaleString()} kWp</p>
            <p><strong>Panels:</strong> ${project.panelCount.toLocaleString()}</p>
            <p><strong>Status:</strong> ${escapeHtml(project.status)}</p>
          </div>
        `);

        markerRefs.current[project.id] = new maplibregl.Marker({ element: el, anchor: "center" })
          .setLngLat(markerCoordinate)
          .setPopup(popup)
          .addTo(map);
      });

      window.clearTimeout(loadingFallback);
      setLoading(false);
      if (embedded) {
        focusAllSites(900);
      } else {
        runIntroTour();
      }
    });

    map.on("error", (event) => {
      console.error("MapLibre error:", event.error);
    });

    return () => {
      window.clearTimeout(loadingFallback);
      clearIntro();
      Object.values(markerRefs.current).forEach((marker) => marker.remove());
      markerRefs.current = {};
      map.remove();
      mapRef.current = null;
    };
  }, [clientById, embedded, focusAllSites, focusProject, mapConfig, projects, runIntroTour]);

  useEffect(() => {
    mapRef.current?.resize();
  }, [panelCollapsed]);

  useEffect(() => {
    if (!embedded || !mapContainerRef.current || !mapRef.current) return;
    const map = mapRef.current;
    const resize = () => map.resize();
    const observer = new ResizeObserver(resize);
    observer.observe(mapContainerRef.current);
    resize();
    return () => observer.disconnect();
  }, [embedded, loading]);

  useEffect(() => {
    Object.entries(markerRefs.current).forEach(([projectId, marker]) => {
      const el = marker.getElement();
      const active = activeProjectId === projectId;
      el.classList.toggle("is-active", active);
      el.style.display = visibleProjectIds.has(projectId) ? "inline-flex" : "none";

      const boundaryLayerId = `site-boundary-${sourceSafeId(projectId)}`;
      const boundaryOutlineId = `site-boundary-outline-${sourceSafeId(projectId)}`;
      const visibility = visibleProjectIds.has(projectId) ? "visible" : "none";
      if (mapRef.current?.getLayer(boundaryLayerId)) mapRef.current.setLayoutProperty(boundaryLayerId, "visibility", visibility);
      if (mapRef.current?.getLayer(boundaryOutlineId)) mapRef.current.setLayoutProperty(boundaryOutlineId, "visibility", visibility);
    });
  }, [activeProjectId, visibleProjectIds]);

  const groupedEntries = layerEntries.reduce<Record<LayerEntry["group"], LayerEntry[]>>(
    (acc, entry) => {
      acc[entry.group].push(entry);
      return acc;
    },
    { "Client Site Locations": [], "Map View": [] }
  );

  return (
    <div
      className={
        embedded
          ? "h-[min(520px,55vh)] min-h-[400px] rounded-2xl overflow-hidden border border-om"
          : "-m-5 h-[calc(100vh-73px)] min-h-[680px] lg:-m-8"
      }
    >
      <div className={`om-geospatial-container${embedded ? " om-geospatial-container--embedded" : ""}`}>
        <style>{`
          @keyframes om-geospatial-spin {
            to { transform: rotate(360deg); }
          }

          .om-geospatial-container {
            position: relative;
            width: 100%;
            height: 100%;
            min-height: 680px;
            overflow: hidden;
            background: #020617;
          }

          .om-geospatial-container--embedded {
            min-height: 400px;
          }

          .om-geospatial-container > .h-full {
            height: 100%;
          }

          .om-geospatial-container .maplibregl-map {
            width: 100% !important;
            height: 100% !important;
            font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          }

          .om-geospatial-panel {
            position: absolute;
            top: 16px;
            left: 16px;
            z-index: 12;
            width: min(300px, calc(100vw - 32px));
            max-height: calc(100% - 32px);
            overflow: auto;
            border: 1px solid rgba(255, 255, 255, 0.18);
            border-radius: 8px;
            background: rgba(15, 23, 42, 0.82);
            box-shadow: 0 22px 55px rgba(2, 6, 23, 0.42);
            color: #f8fafc;
            backdrop-filter: blur(16px);
          }

          .om-geospatial-panel-header {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            padding: 14px 14px 10px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.12);
          }

          .om-geospatial-panel-header-copy {
            flex: 1;
            min-width: 0;
          }

          .om-geospatial-panel-minimize {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 30px;
            height: 30px;
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 6px;
            background: rgba(255, 255, 255, 0.08);
            color: #cbd5e1;
            cursor: pointer;
            flex-shrink: 0;
            transition: background 160ms ease, border-color 160ms ease, color 160ms ease;
          }

          .om-geospatial-panel-minimize:hover {
            background: rgba(255, 255, 255, 0.15);
            border-color: rgba(255, 255, 255, 0.26);
            color: #f8fafc;
          }

          .om-geospatial-panel-expand {
            position: absolute;
            top: 16px;
            left: 16px;
            z-index: 12;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            border: 1px solid rgba(255, 255, 255, 0.18);
            border-radius: 8px;
            background: rgba(15, 23, 42, 0.88);
            color: #f8fafc;
            padding: 10px 12px;
            font-size: 12px;
            font-weight: 800;
            box-shadow: 0 18px 42px rgba(2, 6, 23, 0.32);
            backdrop-filter: blur(16px);
            cursor: pointer;
            transition: background 160ms ease, border-color 160ms ease;
          }

          .om-geospatial-panel-expand:hover {
            background: rgba(30, 41, 59, 0.95);
            border-color: rgba(45, 212, 191, 0.45);
          }

          .om-geospatial-search {
            padding: 10px 12px 8px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          }

          .om-geospatial-search-label {
            display: flex;
            align-items: center;
            gap: 6px;
            margin: 0 0 8px;
            color: #bae6fd;
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
          }

          .om-geospatial-search-field {
            position: relative;
          }

          .om-geospatial-search-icon {
            position: absolute;
            left: 10px;
            top: 50%;
            transform: translateY(-50%);
            width: 14px;
            height: 14px;
            color: #94a3b8;
            pointer-events: none;
          }

          .om-geospatial-search-input {
            width: 100%;
            padding: 8px 10px 8px 32px;
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 6px;
            background: rgba(255, 255, 255, 0.06);
            color: #f8fafc;
            font-size: 12px;
            outline: none;
          }

          .om-geospatial-search-input::placeholder {
            color: #94a3b8;
          }

          .om-geospatial-search-input:focus {
            border-color: rgba(45, 212, 191, 0.55);
            background: rgba(255, 255, 255, 0.1);
          }

          .om-geospatial-search-hint {
            margin-top: 6px;
            color: #94a3b8;
            font-size: 10px;
            line-height: 1.3;
          }

          .om-geospatial-panel-title {
            font-size: 13px;
            font-weight: 800;
            letter-spacing: 0;
            text-transform: uppercase;
          }

          .om-geospatial-panel-subtitle {
            margin-top: 2px;
            font-size: 12px;
            color: #cbd5e1;
            line-height: 1.3;
          }

          .om-geospatial-group {
            padding: 10px 10px 12px;
          }

          .om-geospatial-group + .om-geospatial-group {
            border-top: 1px solid rgba(255, 255, 255, 0.1);
          }

          .om-geospatial-group-title {
            margin: 0 4px 7px;
            color: #bae6fd;
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0;
          }

          .om-geospatial-row {
            display: grid;
            grid-template-columns: minmax(0, 1fr) 34px;
            gap: 6px;
            align-items: stretch;
            margin-top: 6px;
          }

          .om-geospatial-toggle,
          .om-geospatial-focus {
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 6px;
            color: #f8fafc;
            background: rgba(255, 255, 255, 0.08);
            cursor: pointer;
            transition: background 160ms ease, border-color 160ms ease, transform 160ms ease;
          }

          .om-geospatial-toggle:hover,
          .om-geospatial-focus:hover {
            background: rgba(255, 255, 255, 0.15);
            border-color: rgba(255, 255, 255, 0.26);
          }

          .om-geospatial-toggle.is-active {
            border-color: rgba(45, 212, 191, 0.58);
            background: rgba(20, 184, 166, 0.18);
          }

          .om-geospatial-toggle.is-hidden {
            opacity: 0.58;
          }

          .om-geospatial-toggle {
            min-width: 0;
            display: flex;
            align-items: center;
            gap: 9px;
            padding: 8px;
            text-align: left;
          }

          .om-geospatial-swatch {
            width: 12px;
            height: 32px;
            border-radius: 4px;
            flex: 0 0 12px;
            box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.4);
          }

          .om-geospatial-copy {
            min-width: 0;
            flex: 1;
          }

          .om-geospatial-name {
            display: flex;
            align-items: center;
            gap: 6px;
            min-width: 0;
            font-size: 13px;
            font-weight: 800;
            line-height: 1.2;
          }

          .om-geospatial-name span {
            min-width: 0;
            white-space: normal;
          }

          .om-geospatial-detail {
            margin-top: 3px;
            color: #cbd5e1;
            font-size: 11px;
            line-height: 1.25;
          }

          .om-geospatial-focus {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 44px;
            padding: 0;
          }

          .om-geospatial-facts {
            position: absolute;
            top: 16px;
            right: 58px;
            z-index: 10;
            max-width: 320px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            background: rgba(15, 23, 42, 0.82);
            box-shadow: 0 18px 42px rgba(2, 6, 23, 0.26);
            padding: 14px;
            color: #f8fafc;
            backdrop-filter: blur(14px);
          }

          .om-site-label {
            max-width: 165px;
            min-height: 32px;
            align-items: center;
            justify-content: center;
            padding: 4px 10px;
            border-radius: 999px;
            color: #ffffff;
            font-size: 12px;
            font-weight: 800;
            line-height: 1.15;
            text-align: center;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
            white-space: normal;
            pointer-events: auto;
            cursor: pointer;
            background: rgba(5, 150, 105, 0.88);
            border: 1px solid rgba(236, 253, 245, 0.82);
            box-shadow: 0 8px 18px rgba(2, 6, 23, 0.28);
            transition: transform 180ms ease, box-shadow 180ms ease, background 180ms ease;
          }

          .om-site-label.is-maintenance {
            background: rgba(217, 119, 6, 0.9);
            border-color: rgba(254, 243, 199, 0.88);
          }

          .om-site-label.is-active {
            transform: scale(1.12);
            box-shadow: 0 0 0 8px rgba(16, 185, 129, 0.18), 0 14px 32px rgba(2, 6, 23, 0.36);
          }

          .om-site-popup h3 {
            margin: 0 0 8px;
            color: #0f172a;
            font-size: 15px;
            font-weight: 800;
          }

          .om-site-popup p {
            margin: 6px 0 0;
            color: #334155;
            font-size: 12px;
            line-height: 1.4;
          }

          .om-geospatial-replay {
            position: absolute;
            right: 58px;
            bottom: 20px;
            z-index: 10;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            border: 1px solid rgba(255, 255, 255, 0.22);
            border-radius: 8px;
            background: rgba(15, 23, 42, 0.82);
            color: #f8fafc;
            padding: 10px 12px;
            font-size: 13px;
            font-weight: 800;
            box-shadow: 0 18px 42px rgba(2, 6, 23, 0.26);
            backdrop-filter: blur(14px);
          }

          .om-geospatial-container--embedded .om-geospatial-panel {
            width: min(260px, calc(100% - 24px));
            max-height: calc(100% - 24px);
          }

          .om-geospatial-container--embedded .om-geospatial-facts {
            display: none;
          }

          .om-geospatial-container--embedded .om-geospatial-replay {
            right: 12px;
            bottom: 12px;
            padding: 8px 10px;
            font-size: 11px;
          }

          .om-geospatial-basemap-badge {
            position: absolute;
            bottom: 12px;
            left: 12px;
            z-index: 10;
            max-width: min(280px, calc(100% - 24px));
            border: 1px solid rgba(255, 255, 255, 0.16);
            border-radius: 6px;
            background: rgba(15, 23, 42, 0.82);
            color: #cbd5e1;
            padding: 6px 10px;
            font-size: 10px;
            line-height: 1.35;
            backdrop-filter: blur(12px);
          }

          .om-geospatial-basemap-badge strong {
            color: #f8fafc;
            font-weight: 700;
          }

          @media (max-width: 767px) {
            .om-geospatial-panel {
              top: 10px;
              left: 10px;
              right: 10px;
              width: auto;
              max-height: 42%;
            }

            .om-geospatial-facts {
              display: none;
            }

            .om-geospatial-row {
              grid-template-columns: minmax(0, 1fr) 38px;
            }

            .om-geospatial-replay {
              right: 12px;
              bottom: 12px;
            }
          }
        `}</style>

        <div ref={mapContainerRef} className="h-full w-full" />

        {panelCollapsed ? (
          <button
            type="button"
            className="om-geospatial-panel-expand"
            onClick={() => setPanelCollapsed(false)}
            title="Expand Geospatial Layers"
            aria-label="Expand Geospatial Layers"
          >
            <PanelLeftOpen className="h-4 w-4 text-emerald-300" />
            <span>Geospatial Layers</span>
          </button>
        ) : (
          <aside className="om-geospatial-panel" aria-label="Geospatial layer controls">
            <div className="om-geospatial-panel-header">
              <Crosshair className="h-5 w-5 text-emerald-300 shrink-0" />
              <div className="om-geospatial-panel-header-copy">
                <div className="om-geospatial-panel-title">Geospatial Layers</div>
                <div className="om-geospatial-panel-subtitle">Toggle sites or focus the client location view.</div>
              </div>
              <button
                type="button"
                className="om-geospatial-panel-minimize"
                onClick={() => setPanelCollapsed(true)}
                title="Minimize panel"
                aria-label="Minimize Geospatial Layers panel"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            </div>

            <div className="om-geospatial-search">
              <p className="om-geospatial-search-label">
                <Search className="h-3.5 w-3.5" />
                Search Projects
              </p>
              <div className="om-geospatial-search-field">
                <Search className="om-geospatial-search-icon" />
                <input
                  type="search"
                  className="om-geospatial-search-input"
                  placeholder="Search by name, client, or location…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && filteredProjects[0]) {
                      focusProject(filteredProjects[0]);
                    }
                  }}
                />
              </div>
              {searchQuery.trim() && (
                <p className="om-geospatial-search-hint">
                  {filteredProjects.length} match{filteredProjects.length === 1 ? "" : "es"}
                  {filteredProjects.length > 0 ? " — press Enter to focus first result" : ""}
                </p>
              )}
            </div>

            {(["Client Site Locations", "Map View"] as const).map((group) => (
              <div className="om-geospatial-group" key={group}>
                <div className="om-geospatial-group-title">{group}</div>
                {group === "Client Site Locations" && searchQuery.trim() && groupedEntries[group].length === 0 && (
                  <p className="px-2 pb-2 text-[11px] text-slate-400">No projects match your search.</p>
                )}
                {groupedEntries[group].map((entry) => (
                  <div className="om-geospatial-row" key={entry.id}>
                    <button
                      type="button"
                      className={`om-geospatial-toggle${entry.visible ? "" : " is-hidden"}${
                        activeProjectId === entry.id ? " is-active" : ""
                      }`}
                      onClick={() =>
                        entry.project ? toggleProjectVisibility(entry.project.id) : focusEntry(entry)
                      }
                      aria-pressed={entry.visible}
                    >
                      <span className="om-geospatial-swatch" style={{ backgroundColor: entry.color }} />
                      <span className="om-geospatial-copy">
                        <span className="om-geospatial-name">
                          {entry.project ? <Sun className="h-4 w-4" /> : <Layers3 className="h-4 w-4" />}
                          <span>{entry.label}</span>
                          {entry.project ? (
                            entry.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />
                          ) : null}
                        </span>
                        <span className="om-geospatial-detail">{entry.detail}</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      className="om-geospatial-focus"
                      onClick={() => focusEntry(entry)}
                      title={`Focus ${entry.label}`}
                      aria-label={`Focus ${entry.label}`}
                    >
                      <LocateFixed className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </aside>
        )}

        <div className="om-geospatial-facts">
          <div className="text-[13px] font-extrabold uppercase text-sky-600">O&amp;M Site Facts</div>
          <div className="mt-1.5 text-sm leading-snug">
            {projects.length} monitored site{projects.length === 1 ? "" : "s"};{" "}
            {totalCapacity.toLocaleString()} kWp installed capacity.
          </div>
          <div className="mt-2 text-xs text-slate-300">
            {totalPanels.toLocaleString()} panels under client-visible monitoring.
          </div>
          <div className="mt-2 pt-2 border-t border-om text-[11px] text-slate-400">
            Basemap: <span className="text-slate-200">{mapConfig.label}</span>
            {mapConfig.provider === "esri" && (
              <span className="block mt-1 text-amber-300/90">
                Add <code className="text-[10px]">NEXT_PUBLIC_MAPBOX_TOKEN</code> to .env.local for HD zoom on site boundaries.
              </span>
            )}
          </div>
        </div>

        <div className="om-geospatial-basemap-badge">
          Basemap: <strong>{mapConfig.label}</strong>
          {mapConfig.provider === "esri" && (
            <span className="block text-amber-300/90 mt-0.5">
              Set NEXT_PUBLIC_MAPBOX_TOKEN in .env.local for high-detail site zoom.
            </span>
          )}
        </div>

        <button type="button" className="om-geospatial-replay" onClick={runIntroTour}>
          <RotateCcw className="h-4 w-4" />
          Replay slow tour
        </button>

        {loading && (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-slate-950/50">
            <div className="h-11 w-11 rounded-full border-4 border-white/25 border-l-emerald-300 animate-[om-geospatial-spin_1s_linear_infinite]" />
          </div>
        )}

      </div>
    </div>
  );
}
