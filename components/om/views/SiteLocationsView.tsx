"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  Crosshair,
  Eye,
  EyeOff,
  Globe,
  Layers3,
  LocateFixed,
  Maximize2,
  Menu,
  Minimize2,
  RotateCcw,
  Sun,
  Search,
  PanelRightClose,
} from "lucide-react";
import type { User } from "@/lib/auth";
import type { Store, Project } from "@/lib/om";
import { visibleProjects } from "@/lib/om";
import { getOmMapConfig, type OmMapProvider } from "@/lib/om-map-style";

function getMapAttribution(provider: OmMapProvider): string {
  switch (provider) {
    case "mapbox":
      return "© Mapbox © OpenStreetMap";
    case "maptiler":
      return "© MapTiler © OpenStreetMap contributors";
    case "esri":
      return "Tiles © Esri";
    default:
      return "";
  }
}
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

type OrthomosaicOverlay = {
  /** Path (or URL) to the orthomosaic raster image. */
  url: string;
  /**
   * Image corners in [lng, lat] order, matching MapLibre image-source convention:
   * top-left, top-right, bottom-right, bottom-left.
   */
  coordinates: [
    [number, number],
    [number, number],
    [number, number],
    [number, number]
  ];
};

type SiteBoundary = {
  id: string;
  name: string;
  match: string[];
  color: string;
  coordinates: [number, number][];
  /** Optional georeferenced drone orthomosaic draped over the boundary. */
  orthomosaic?: OrthomosaicOverlay;
};

/**
 * Orthomosaics keyed by boundary id. Declared separately so the SITE_BOUNDARIES
 * list stays focused on geometry while raster assets live next to the public files.
 */
const ORTHOMOSAICS: Partial<Record<string, OrthomosaicOverlay>> = {
  "ahte-office": {
    url: "/AHTE-site.png",
    // Corners derived from the AHTE boundary polygon (slightly inset so the
    // outline still draws on top of the drape). Order: TL, TR, BR, BL.
    coordinates: [
      [74.2359, 31.42211],
      [74.23612, 31.42211],
      [74.23612, 31.42199],
      [74.2359, 31.42199],
    ],
  },
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
    orthomosaic: ORTHOMOSAICS["ahte-office"],
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

function NorthArrowIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true">
      <text x="8" y="6.5" textAnchor="middle" fontSize="6.5" fontWeight="800" fill="currentColor">
        N
      </text>
      <path
        d="M8 7.5v5.5M8 13l-2.25-2.25M8 13l2.25-2.25"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
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
  if (typeof window === "undefined") return { top: 92, right: 92, bottom: 88, left: 48 };
  const isMobile = window.innerWidth < 768;
  return isMobile
    ? { top: 120, right: 28, bottom: 40, left: 28 }
    : { top: 96, right: 80, bottom: 92, left: 48 };
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
  focusProjectId,
}: {
  user: User;
  store: Store;
  embedded?: boolean;
  focusProjectId?: string;
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRefs = useRef<Record<string, maplibregl.Marker>>({});
  const introTimeoutRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [visibleProjectIds, setVisibleProjectIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [panelCollapsed, setPanelCollapsed] = useState(embedded || Boolean(focusProjectId));
  const [globeEnabled, setGlobeEnabled] = useState(true);

  useEffect(() => {
    if (focusProjectId) setPanelCollapsed(true);
  }, [focusProjectId]);
  const [fullWindow, setFullWindow] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const mapConfig = useMemo(() => getOmMapConfig(), []);
  const projects = useMemo(() => {
    const base = visibleProjects(user);
    if (!focusProjectId) return base;
    return base.filter((p) => p.id === focusProjectId);
  }, [user, store, focusProjectId]);
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

    setGlobeEnabled(true);
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

    setGlobeEnabled(false);
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
    setGlobeEnabled(false);
    setActiveProjectId(project.id);
    try {
      map.setProjection({ type: "mercator" });
    } catch {
      // Keep current projection when mercator is unavailable.
    }
    const boundary = getBoundaryForProject(project, clientById.get(project.clientId));

    if (boundary) {
      map.fitBounds(getBoundaryBounds(boundary), {
        padding: { top: 150, right: 80, bottom: 130, left: 80 },
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
            padding: { top: 150, right: 80, bottom: 130, left: 80 },
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
        setGlobeEnabled(false);
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

  const resetNorth = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    map.easeTo({
      bearing: 0,
      duration: 600,
      essential: true,
    });
  }, []);

  const toggleGlobeView = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    clearIntro();
    if (globeEnabled) {
      setGlobeEnabled(false);
      setActiveProjectId("all-sites");
      try {
        map.setProjection({ type: "mercator" });
      } catch {
        // Keep current projection when mercator is unavailable.
      }
      if (bounds && !bounds.isEmpty()) {
        focusAllSites(1100);
      }
      return;
    }

    focusGlobeView(1100);
  }, [bounds, focusAllSites, focusGlobeView, globeEnabled]);

  const toggleProjectVisibility = (projectId: string) => {
    setVisibleProjectIds((current) => {
      const next = new Set(current);
      const marker = markerRefs.current[projectId];
      const boundaryLayerId = `site-boundary-${sourceSafeId(projectId)}`;
      const boundaryOutlineId = `site-boundary-outline-${sourceSafeId(projectId)}`;
      const orthomosaicLayerId = `site-orthomosaic-${sourceSafeId(projectId)}`;
      if (next.has(projectId)) {
        next.delete(projectId);
        if (marker) marker.getElement().style.display = "none";
        if (mapRef.current?.getLayer(boundaryLayerId)) mapRef.current.setLayoutProperty(boundaryLayerId, "visibility", "none");
        if (mapRef.current?.getLayer(boundaryOutlineId)) mapRef.current.setLayoutProperty(boundaryOutlineId, "visibility", "none");
        if (mapRef.current?.getLayer(orthomosaicLayerId)) mapRef.current.setLayoutProperty(orthomosaicLayerId, "visibility", "none");
      } else {
        next.add(projectId);
        if (marker) marker.getElement().style.display = "block";
        if (mapRef.current?.getLayer(boundaryLayerId)) mapRef.current.setLayoutProperty(boundaryLayerId, "visibility", "visible");
        if (mapRef.current?.getLayer(boundaryOutlineId)) mapRef.current.setLayoutProperty(boundaryOutlineId, "visibility", "visible");
        if (mapRef.current?.getLayer(orthomosaicLayerId)) mapRef.current.setLayoutProperty(orthomosaicLayerId, "visibility", "visible");
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
      attributionControl: false,
    });

    mapRef.current = map;
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 140, unit: "metric" }), "bottom-right");
    const loadingFallback = window.setTimeout(() => setLoading(false), 9000);

    map.once("load", () => {
      applyGlobeAtmosphere(map);

      projects.forEach((project) => {
        const clientName = clientById.get(project.clientId) ?? "Client site";
        const boundary = getBoundaryForProject(project, clientName);
        const markerCoordinate = getProjectCenter(project, clientName);
        const hasOrtho = !!boundary?.orthomosaic;
        const suppressVectorBoundary = hasOrtho && !!focusProjectId;
        const hideProjectLabel = hasOrtho && !!focusProjectId;

        let labelCoordinate = markerCoordinate;
        if (hasOrtho && boundary?.orthomosaic) {
          // Offset the label position north of the orthomosaic rectangle so the project name
          // pill never overlaps the actual AHTE-site photo content.
          const ocoords = boundary.orthomosaic.coordinates;
          const topLat = Math.max(ocoords[0][1], ocoords[1][1]);
          const midLng = (ocoords[0][0] + ocoords[1][0]) / 2;
          labelCoordinate = [midLng, topLat + 0.00007];
        }

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

          if (!suppressVectorBoundary) {
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
          }

          // Georeferenced drone orthomosaic draped over the site boundary.
          // Added as an image source so it warps to the real-world footprint.
          // In project-specific ortho view we show the image clean (no vector box on top of it).
          if (boundary.orthomosaic) {
            const overlaySourceId = `site-orthomosaic-source-${safeProjectId}`;
            const overlayLayerId = `site-orthomosaic-${safeProjectId}`;
            if (!map.getSource(overlaySourceId)) {
              map.addSource(overlaySourceId, {
                type: "image",
                url: boundary.orthomosaic.url,
                coordinates: boundary.orthomosaic.coordinates,
              });
            }
            if (!map.getLayer(overlayLayerId)) {
              if (!suppressVectorBoundary && map.getLayer(outlineLayerId)) {
                // Insert below outline only when outline will exist (multi-site view)
                map.addLayer(
                  {
                    id: overlayLayerId,
                    type: "raster",
                    source: overlaySourceId,
                    paint: {
                      "raster-opacity": 1,
                      "raster-fade-duration": 0,
                    },
                  },
                  outlineLayerId
                );
              } else {
                map.addLayer({
                  id: overlayLayerId,
                  type: "raster",
                  source: overlaySourceId,
                  paint: {
                    "raster-opacity": 1,
                    "raster-fade-duration": 0,
                  },
                });
              }
            }
          }

          if (!suppressVectorBoundary) {
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
        }

        if (!hideProjectLabel) {
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
            .setLngLat(labelCoordinate)
            .setPopup(popup)
            .addTo(map);
        }
      });

      window.clearTimeout(loadingFallback);
      setLoading(false);

      if (focusProjectId && projects[0]) {
        // Project-specific view: focus directly on the site so the orthomosaic image is immediately visible (no vector boundary box or name label on top of the image)
        const proj = projects[0];
        setActiveProjectId(proj.id);
        try {
          map.setProjection({ type: "mercator" });
        } catch {}
        const b = getBoundaryForProject(proj, clientById.get(proj.clientId));
        if (b) {
          map.fitBounds(getBoundaryBounds(b), {
            padding: { top: 28, right: 28, bottom: 52, left: 28 },
            maxZoom: mapConfig.maxSiteZoom,
            pitch: SITE_CAMERA.pitch,
            bearing: SITE_CAMERA.bearing,
            duration: 620,
            essential: true,
          });
        } else {
          map.flyTo({
            center: [proj.lng, proj.lat],
            zoom: 16.2,
            pitch: 52,
            bearing: -18,
            duration: 620,
            essential: true,
          });
        }
      } else if (embedded) {
        focusGlobeView(900);
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
  }, [clientById, embedded, focusAllSites, focusGlobeView, focusProject, focusProjectId, mapConfig, projects, runIntroTour]);

  useEffect(() => {
    mapRef.current?.resize();
  }, [panelCollapsed, fullWindow]);

  useEffect(() => {
    if (!fullWindow) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFullWindow(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [fullWindow]);

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
        fullWindow
          ? "fixed inset-0 z-[100] h-screen bg-slate-950"
          : embedded
          ? "h-[min(520px,55vh)] min-h-[400px] rounded-2xl overflow-hidden border border-om"
          : "-m-5 h-[calc(100vh-73px)] min-h-[680px] lg:-m-8"
      }
    >
      <div
        className={`om-geospatial-layout${embedded ? " om-geospatial-layout--embedded" : ""}${
          fullWindow ? " om-geospatial-layout--fullwindow" : ""
        }`}
      >
        <style>{`
          @keyframes om-geospatial-spin {
            to { transform: rotate(360deg); }
          }

          .om-geospatial-layout {
            display: flex;
            width: 100%;
            height: 100%;
            min-height: 680px;
            overflow: hidden;
            background: #020617;
          }

          .om-geospatial-layout--embedded {
            min-height: 400px;
          }

          .om-geospatial-layout--fullwindow {
            min-height: 100vh;
          }

          .om-geospatial-map-area {
            position: relative;
            flex: 1;
            min-width: 0;
            min-height: inherit;
            overflow: hidden;
          }

          .om-geospatial-map-area > .h-full {
            height: 100%;
          }

          .om-geospatial-map-area .maplibregl-map {
            width: 100% !important;
            height: 100% !important;
            font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          }

          .om-geospatial-map-area .maplibregl-ctrl-bottom-right {
            bottom: 40px;
            right: 8px;
            z-index: 5;
          }

          .om-geospatial-map-footer {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            z-index: 12;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            min-height: 34px;
            padding: 6px 12px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            background: rgba(2, 6, 23, 0.94);
            backdrop-filter: blur(12px);
            pointer-events: auto;
          }

          .om-geospatial-map-footer-attrib {
            flex: 1;
            min-width: 0;
            color: #cbd5e1;
            font-size: 10px;
            line-height: 1.35;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .om-geospatial-map-footer-basemap {
            color: #f8fafc;
            font-weight: 700;
          }

          .om-geospatial-map-footer-replay {
            display: inline-flex;
            flex-shrink: 0;
            align-items: center;
            gap: 6px;
            border: 1px solid rgba(255, 255, 255, 0.22);
            border-radius: 8px;
            background: rgba(15, 23, 42, 0.88);
            color: #f8fafc;
            padding: 6px 10px;
            font-size: 11px;
            font-weight: 800;
            cursor: pointer;
            transition: background 160ms ease, border-color 160ms ease;
          }

          .om-geospatial-map-footer-replay:hover {
            background: rgba(30, 41, 59, 0.95);
            border-color: rgba(45, 212, 191, 0.45);
          }

          .om-geospatial-sidebar {
            flex-shrink: 0;
            display: flex;
            border-left: 1px solid rgba(255, 255, 255, 0.12);
            background: rgba(15, 23, 42, 0.96);
            color: #f8fafc;
          }

          .om-geospatial-sidebar--collapsed {
            width: 48px;
          }

          .om-geospatial-sidebar--expanded {
            width: min(348px, 42vw);
          }

          .om-geospatial-sidebar-rail {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            gap: 10px;
            width: 48px;
            flex-shrink: 0;
            padding: 12px 7px;
            height: 100%;
            border-right: 1px solid rgba(255, 255, 255, 0.08);
            background: #020617;
          }

          .om-geospatial-rail-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            border: none;
            border-radius: 4px;
            background: transparent;
            color: #f8fafc;
            cursor: pointer;
            transition: background 160ms ease, color 160ms ease, opacity 160ms ease;
          }

          .om-geospatial-rail-btn:hover {
            background: rgba(255, 255, 255, 0.08);
            color: #ffffff;
          }

          .om-geospatial-rail-btn.is-active {
            color: #60a5fa;
          }

          .om-geospatial-rail-btn--menu {
            margin-top: auto;
          }

          .om-geospatial-panel {
            display: flex;
            flex-direction: column;
            flex: 1;
            min-width: 0;
            height: 100%;
            overflow: auto;
            color: #f8fafc;
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
            right: 16px;
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

          .om-geospatial-layout--embedded .om-geospatial-sidebar--expanded {
            width: min(260px, 42vw);
          }

          .om-geospatial-layout--embedded .om-geospatial-facts {
            display: none;
          }

          .om-geospatial-layout--embedded .om-geospatial-map-footer {
            padding: 5px 10px;
            gap: 8px;
          }

          .om-geospatial-layout--embedded .om-geospatial-map-footer-replay {
            padding: 5px 8px;
            font-size: 10px;
          }

          @media (max-width: 767px) {
            .om-geospatial-layout {
              flex-direction: column;
            }

            .om-geospatial-sidebar {
              border-left: none;
              border-top: 1px solid rgba(255, 255, 255, 0.12);
            }

            .om-geospatial-sidebar--collapsed {
              width: 100%;
              height: 48px;
            }

            .om-geospatial-sidebar--expanded {
              width: 100%;
              max-height: 42%;
            }

            .om-geospatial-sidebar-rail {
              flex-direction: row;
              width: 100%;
              height: auto;
              padding: 6px 10px;
              border-right: none;
              border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            }

            .om-geospatial-rail-btn--menu {
              margin-top: 0;
              margin-left: auto;
            }

            .om-geospatial-facts {
              display: none;
            }

            .om-geospatial-row {
              grid-template-columns: minmax(0, 1fr) 38px;
            }

            .om-geospatial-map-footer {
              flex-wrap: wrap;
              row-gap: 6px;
            }

            .om-geospatial-map-footer-attrib {
              white-space: normal;
            }
          }
        `}</style>

        <div className="om-geospatial-map-area">
          <div ref={mapContainerRef} className="h-full w-full" />

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

          <div className="om-geospatial-map-footer">
            <div className="om-geospatial-map-footer-attrib" title={`${mapConfig.label} · ${getMapAttribution(mapConfig.provider)} | MapLibre`}>
              {embedded ? (
                <>
                  <span className="om-geospatial-map-footer-basemap">{mapConfig.label}</span>
                  {" · "}
                </>
              ) : null}
              {getMapAttribution(mapConfig.provider)} | MapLibre
            </div>
            <button type="button" className="om-geospatial-map-footer-replay" onClick={runIntroTour}>
              <RotateCcw className="h-3.5 w-3.5" />
              Replay slow tour
            </button>
          </div>

          {loading && (
            <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-slate-950/50">
              <div className="h-11 w-11 rounded-full border-4 border-white/25 border-l-emerald-300 animate-[om-geospatial-spin_1s_linear_infinite]" />
            </div>
          )}
        </div>

        <aside
          className={`om-geospatial-sidebar${
            panelCollapsed ? " om-geospatial-sidebar--collapsed" : " om-geospatial-sidebar--expanded"
          }`}
          aria-label="Geospatial layer controls"
        >
          <div className="om-geospatial-sidebar-rail">
            <button
              type="button"
              className={`om-geospatial-rail-btn${fullWindow ? " is-active" : ""}`}
              onClick={() => setFullWindow((current) => !current)}
              title={fullWindow ? "Exit full window view" : "Open full window view"}
              aria-label={fullWindow ? "Exit full window view" : "Open full window view"}
              aria-pressed={fullWindow}
            >
              {fullWindow ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
            <button
              type="button"
              className="om-geospatial-rail-btn"
              onClick={resetNorth}
              title="Reset map to north"
              aria-label="Reset map to north"
            >
              <NorthArrowIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={`om-geospatial-rail-btn${globeEnabled ? " is-active" : ""}`}
              onClick={toggleGlobeView}
              title={globeEnabled ? "Turn globe view off" : "Turn globe view on"}
              aria-label={globeEnabled ? "Turn globe view off" : "Turn globe view on"}
              aria-pressed={globeEnabled}
            >
              <Globe className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="om-geospatial-rail-btn"
              onClick={() => setPanelCollapsed(false)}
              title="Open layer list"
              aria-label="Open layer list"
              aria-expanded={!panelCollapsed}
            >
              <Layers3 className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="om-geospatial-rail-btn om-geospatial-rail-btn--menu"
              onClick={() => setPanelCollapsed((current) => !current)}
              title={panelCollapsed ? "Open layers menu" : "Close layers menu"}
              aria-label={panelCollapsed ? "Open layers menu" : "Close layers menu"}
              aria-expanded={!panelCollapsed}
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>

          {!panelCollapsed ? (
            <div className="om-geospatial-panel">
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
                  title="Collapse panel"
                  aria-label="Collapse Geospatial Layers panel"
                >
                  <PanelRightClose className="h-4 w-4" />
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
                          activeProjectId === entry.id || (entry.id === "globe-view" && globeEnabled)
                            ? " is-active"
                            : ""
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
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
