import "maplibre-gl/dist/maplibre-gl.css";

import { useMemo, useState } from "react";
import ReactMap, { Marker, Popup } from "react-map-gl/maplibre";
import { useEnv } from "~/hooks/use-env";
import type { CanvasLocation, CanvasMapBlock } from "~/lib/canvas-document";

function getMapStyle(maptilerKey?: string) {
  return maptilerKey
    ? `https://api.maptiler.com/maps/streets-v2/style.json?key=${maptilerKey}`
    : undefined;
}

export function Map({ block }: { block: CanvasMapBlock }) {
  const { MAPTILER_API_KEY } = useEnv();
  const mapStyle = getMapStyle(MAPTILER_API_KEY);
  const [activeLocation, setActiveLocation] = useState<CanvasLocation | null>(
    null,
  );
  const viewState = useMemo(
    () => getInitialViewState(block.locations),
    [block],
  );

  return (
    <div className="flex flex-1 flex-col gap-4">
      {(block.title || block.description) && (
        <div>
          {block.title && (
            <h2 className="text-2xl font-black">{block.title}</h2>
          )}
          {block.description && (
            <p className="text-muted-foreground mt-1 text-sm">
              {block.description}
            </p>
          )}
        </div>
      )}
      <div className="border-border bg-muted/25 relative min-h-[24rem] flex-1 overflow-hidden rounded-[2rem] border">
        {!mapStyle && (
          <div className="absolute inset-0 grid place-items-center p-6 text-center">
            <div>
              <p className="font-semibold">MapTiler key missing</p>
              <p className="text-muted-foreground mt-2 text-sm leading-6">
                Add MAPTILER_API_KEY to your environment to render the map.
              </p>
            </div>
          </div>
        )}
        {mapStyle && (
          <ReactMap
            initialViewState={viewState}
            mapStyle={mapStyle}
            style={{ width: "100%", height: "100%" }}
            cooperativeGestures
            attributionControl={false}
          >
            {block.locations.map((location) => (
              <Marker
                key={location.id}
                latitude={location.lat}
                longitude={location.lng}
                anchor="bottom"
              >
                <button
                  type="button"
                  onClick={() => setActiveLocation(location)}
                  className="group relative grid place-items-center focus:outline-none"
                  aria-label={location.label}
                >
                  <span className="bg-primary/20 group-hover:bg-primary/30 group-focus-visible:ring-primary/50 absolute size-9 rounded-full transition-colors group-focus-visible:ring-4" />
                  <span className="bg-primary relative size-3 rounded-full shadow-md" />
                  <span className="bg-background/90 text-foreground border-border absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full border px-2 py-0.5 text-xs font-semibold whitespace-nowrap shadow-sm">
                    {location.label}
                  </span>
                </button>
              </Marker>
            ))}

            {activeLocation && (
              <Popup
                latitude={activeLocation.lat}
                longitude={activeLocation.lng}
                anchor="top"
                closeButton={false}
                closeOnClick={false}
                offset={18}
                onClose={() => setActiveLocation(null)}
                className="franco-map-popup"
              >
                <div className="max-w-72 p-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-foreground text-sm font-semibold">
                        {activeLocation.label}
                      </p>
                      {activeLocation.sublabel && (
                        <p className="text-muted-foreground mt-0.5 text-xs font-medium tracking-wider uppercase">
                          {activeLocation.sublabel}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveLocation(null)}
                      className="text-muted-foreground hover:text-foreground"
                      aria-label="Close popup"
                    >
                      ×
                    </button>
                  </div>
                  <p className="text-muted-foreground mt-3 text-sm leading-6">
                    {activeLocation.story}
                  </p>
                </div>
              </Popup>
            )}
          </ReactMap>
        )}
      </div>
    </div>
  );
}

function getInitialViewState(locations: CanvasLocation[]) {
  if (locations.length === 0) {
    return { latitude: 33.6, longitude: -79.2, zoom: 4.5 };
  }

  const avgLat =
    locations.reduce((sum, location) => sum + location.lat, 0) /
    locations.length;
  const avgLng =
    locations.reduce((sum, location) => sum + location.lng, 0) /
    locations.length;

  return {
    latitude: avgLat,
    longitude: avgLng,
    zoom: locations.length > 1 ? 4.35 : 9,
  };
}
