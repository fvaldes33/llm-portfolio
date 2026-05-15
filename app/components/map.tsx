import "maplibre-gl/dist/maplibre-gl.css";

import { useMemo, useRef, useState } from "react";
import ReactMap, { type MapRef, Marker } from "react-map-gl/maplibre";
import { useEnv } from "~/hooks/use-env";
import { useIsMobile } from "~/hooks/use-mobile";
import { cn } from "~/lib/utils";
import type { CanvasLocation, CanvasMapBlock } from "~/lib/canvas-document";

function getMapStyle(maptilerKey?: string) {
  return maptilerKey
    ? `https://api.maptiler.com/maps/streets-v2/style.json?key=${maptilerKey}`
    : undefined;
}

export function Map({ block }: { block: CanvasMapBlock }) {
  const { MAPTILER_API_KEY } = useEnv();
  const mapStyle = getMapStyle(MAPTILER_API_KEY);
  const isMobile = useIsMobile();
  const mapRef = useRef<MapRef>(null);
  const [activeLocation, setActiveLocation] = useState<CanvasLocation | null>(
    null,
  );
  const viewState = useMemo(
    () => getInitialViewState(block.locations),
    [block],
  );

  function handleSelect(location: CanvasLocation) {
    setActiveLocation(location);
    // Keep the pin clear of the info card. On desktop the card sits
    // bottom-left, so lift the target up. On mobile the card spans the bottom
    // and the pin gets covered — acceptable, so no offset there.
    mapRef.current?.flyTo({
      center: [location.lng, location.lat],
      offset: isMobile ? [0, 0] : [0, -110],
      duration: 700,
    });
  }

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
      <div className="border-border bg-muted/25 relative aspect-square flex-1 overflow-hidden rounded-[2rem] border sm:aspect-video sm:h-96 sm:min-h-96">
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
          <>
            <ReactMap
              ref={mapRef}
              initialViewState={viewState}
              mapStyle={mapStyle}
              style={{ position: "absolute", inset: 0 }}
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
                    onClick={() => handleSelect(location)}
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
            </ReactMap>

            {activeLocation && (
              <div
                className={cn(
                  "border-border bg-background/95 absolute z-10 rounded-2xl border p-4 shadow-xl backdrop-blur",
                  isMobile
                    ? "inset-x-4 bottom-4"
                    : "bottom-4 left-4 w-80 max-w-[calc(100%-2rem)]",
                )}
              >
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
                    className="text-muted-foreground hover:text-foreground -m-1 shrink-0 p-1"
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>
                <p className="text-muted-foreground mt-3 text-sm leading-6">
                  {activeLocation.story}
                </p>
              </div>
            )}
          </>
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
