import type { StyleSpecification } from "maplibre-gl";

export type OmMapProvider = "mapbox" | "maptiler" | "esri";

export type OmMapConfig = {
  style: StyleSpecification;
  provider: OmMapProvider;
  label: string;
  /** Max zoom when fitting site boundaries / close-up project focus */
  maxSiteZoom: number;
  /** Hard cap on map zoom (prevents empty tile requests) */
  maxMapZoom: number;
};

/** Esri World Imagery is reliable only to ~zoom 17 in many regions (Pakistan included). */
const ESRI_SATELLITE_MAX_ZOOM = 17;

const ESRI_HYBRID_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    satellite: {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      maxzoom: ESRI_SATELLITE_MAX_ZOOM,
      attribution: "Tiles © Esri",
    },
    labels: {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png",
        "https://b.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png",
        "https://c.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png",
        "https://d.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      maxzoom: 20,
    },
  },
  layers: [
    { id: "satellite", type: "raster", source: "satellite", maxzoom: 22 },
    { id: "labels", type: "raster", source: "labels", maxzoom: 22 },
  ],
};

/** MapLibre cannot load Mapbox vector style JSON reliably — use raster tile endpoints instead. */
function mapboxHybridStyle(token: string): StyleSpecification {
  return {
    version: 8,
    sources: {
      "mapbox-satellite-streets": {
        type: "raster",
        tiles: [
          `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/tiles/256/{z}/{x}/{y}?access_token=${token}`,
        ],
        tileSize: 256,
        maxzoom: 22,
        attribution: "© Mapbox © OpenStreetMap",
      },
    },
    layers: [{ id: "mapbox-satellite-streets", type: "raster", source: "mapbox-satellite-streets" }],
  };
}

function maptilerStyle(key: string): StyleSpecification {
  return {
    version: 8,
    sources: {
      satellite: {
        type: "raster",
        tiles: [`https://api.maptiler.com/tiles/satellite-v2/{z}/{x}/{y}.jpg?key=${key}`],
        tileSize: 256,
        maxzoom: 20,
        attribution: "© MapTiler © OpenStreetMap contributors",
      },
    },
    layers: [{ id: "satellite", type: "raster", source: "satellite" }],
  };
}

/**
 * Resolves the O&M GIS basemap.
 * Priority: Mapbox token → MapTiler key → Esri World Imagery (free fallback).
 */
export function getOmMapConfig(): OmMapConfig {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim();
  if (mapboxToken) {
    return {
      style: mapboxHybridStyle(mapboxToken),
      provider: "mapbox",
      label: "Mapbox Satellite Streets",
      maxSiteZoom: 19,
      maxMapZoom: 20,
    };
  }

  const maptilerKey =
    process.env.NEXT_PUBLIC_MAPTILER_API_KEY?.trim() ??
    process.env.NEXT_PUBLIC_MAPLIBRE_API_KEY?.trim();
  if (maptilerKey) {
    return {
      style: maptilerStyle(maptilerKey),
      provider: "maptiler",
      label: "MapTiler Satellite Hybrid",
      maxSiteZoom: 19,
      maxMapZoom: 20,
    };
  }

  return {
    style: ESRI_HYBRID_STYLE,
    provider: "esri",
    label: "Esri World Imagery + Carto Labels (free)",
    maxSiteZoom: ESRI_SATELLITE_MAX_ZOOM,
    maxMapZoom: ESRI_SATELLITE_MAX_ZOOM + 1,
  };
}