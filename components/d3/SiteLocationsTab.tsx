"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { sites } from "@/lib/d3-data";

export default function SiteLocationsTab() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          "dark-matter": {
            type: "raster",
            tiles: [
              "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
              "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
              "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
              "https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
            ],
            tileSize: 256,
          },
        },
        layers: [
          {
            id: "dark-matter",
            type: "raster",
            source: "dark-matter",
          },
        ],
      },
      center: [71.5, 30.0],
      zoom: 5,
      minZoom: 2,
      maxZoom: 18,
      attributionControl: false,
    });

    map.on("load", () => {
      try {
        map.setProjection({ type: "globe" });
        map.setSky({});
      } catch {
        // globe/sky not supported
      }

      sites.forEach((site) => {
        const el = document.createElement("div");
        el.style.cssText = `
          width: 28px; height: 28px; border-radius: 50%;
          background: linear-gradient(135deg, #10b981, #059669);
          border: 3px solid rgba(16, 185, 129, 0.6);
          cursor: pointer;
          box-shadow: 0 0 24px rgba(16, 185, 129, 0.5);
          transition: transform 0.2s;
        `;
        el.addEventListener("mouseenter", () => {
          el.style.transform = "scale(1.25)";
        });
        el.addEventListener("mouseleave", () => {
          el.style.transform = "scale(1)";
        });

        const popup = new maplibregl.Popup({
          offset: 25,
          closeButton: true,
          className: "site-popup",
        }).setHTML(`
          <div style="font-family: system-ui, sans-serif; padding: 4px 0;">
            <h3 style="font-weight: 700; margin: 0 0 6px; font-size: 14px;">
              ${site.name}
            </h3>
            <p style="margin: 0; font-size: 12px; color: #666; line-height: 1.6;">
              <strong>Client:</strong> ${site.client}<br>
              <strong>Location:</strong> ${site.location}<br>
              <strong>Capacity:</strong> ${site.capacityMW} MW<br>
              <strong>Panels:</strong> ${site.panelCount.toLocaleString()}<br>
              <strong>Coordinates:</strong> ${site.lat.toFixed(4)}, ${site.lng.toFixed(4)}
            </p>
          </div>
        `);

        new maplibregl.Marker({ element: el })
          .setLngLat([site.lng, site.lat])
          .setPopup(popup)
          .addTo(map);
      });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-2xl mb-1">Site Locations</h2>
          <p className="text-sm text-white/60 max-w-2xl">
            Geospatial overview of all monitored solar assets across Punjab,
            Pakistan. Drag to rotate the globe, scroll to zoom.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-4">
        <div
          ref={mapContainerRef}
          className="lg:col-span-3 h-[520px] rounded-2xl overflow-hidden border border-white/10"
        />

        <div className="space-y-3">
          {sites.map((site) => (
            <div
              key={site.id}
              className="rounded-2xl bg-white/5 border border-white/10 p-4 transition hover:bg-white/[0.07]"
            >
              <h3 className="font-display font-bold text-sm mb-2 text-brand-400 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-500 inline-block shrink-0" />
                {site.name}
              </h3>
              <dl className="space-y-1 text-xs">
                {[
                  ["Client", site.client],
                  ["Location", site.location],
                  ["Capacity", `${site.capacityMW} MW`],
                  ["Panels", site.panelCount.toLocaleString()],
                  ["Commissioned", site.commissioned],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-2">
                    <dt className="text-white/50">{k}</dt>
                    <dd className="text-white/80 text-right">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
