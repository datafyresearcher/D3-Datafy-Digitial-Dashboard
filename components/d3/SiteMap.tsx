"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { SEVERITY_COLORS, DEFECT_COLORS, type Panel, type Site } from "@/lib/d3-data";

// Fix Leaflet's default icon paths under bundlers.
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function SiteMap({
  site,
  panels,
}: {
  site: Site;
  panels: Panel[];
}) {
  useEffect(() => {
    // Ensure Leaflet picks up container sizing after mount.
    window.dispatchEvent(new Event("resize"));
  }, [site.id]);

  return (
    <MapContainer
      key={site.id}
      center={[site.centerLat, site.centerLng]}
      zoom={16}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%", borderRadius: "1rem" }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Site centre marker */}
      <CircleMarker
        center={[site.centerLat, site.centerLng]}
        radius={14}
        pathOptions={{ color: "#10b981", fillColor: "#10b981", fillOpacity: 0.25, weight: 2 }}
      >
        <Tooltip direction="top" offset={[0, -8]} opacity={1}>
          <strong>{site.name}</strong>
        </Tooltip>
        <Popup>
          <div style={{ fontSize: 12 }}>
            <strong>{site.name}</strong>
            <br />
            {site.client}
            <br />
            {site.location} · {site.capacityMW} MW
          </div>
        </Popup>
      </CircleMarker>

      {/* Panel markers */}
      {panels.map((p) => {
        const isDef = p.status === "Defective";
        const color = isDef
          ? p.severity
            ? SEVERITY_COLORS[p.severity]
            : DEFECT_COLORS[p.defectType ?? "Hotspot"]
          : "#34d399";
        return (
          <CircleMarker
            key={p.id}
            center={[p.lat, p.lng]}
            radius={isDef ? 6 : 3.5}
            pathOptions={{ color, fillColor: color, fillOpacity: isDef ? 0.9 : 0.6, weight: 1 }}
          >
            {isDef && (
              <Popup>
                <div style={{ fontSize: 12, lineHeight: 1.5 }}>
                  <strong>{p.id}</strong>
                  <br />
                  {p.block} · Row {p.row}, Col {p.col}
                  <br />
                  Defect: <strong>{p.defectType}</strong>
                  <br />
                  ΔT: {p.tempDiff} °C · {p.severity}
                  <br />
                  Loss: {p.powerLossW} W
                </div>
              </Popup>
            )}
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
