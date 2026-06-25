"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Expand, Layers, Locate, MapPin, Minimize2, Search, X, Navigation } from "lucide-react";
import dynamic from "next/dynamic";
import type { Issue } from "@/lib/types";
import { CATEGORY_ICONS } from "@/lib/types";

/* ─── Dynamic imports for Leaflet (SSR-safe) ─── */
const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((m) => m.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((m) => m.Popup),
  { ssr: false }
);

interface Props {
  issues: Issue[];
  onSelectIssue: (issue: Issue) => void;
  focusIssueId?: string | null;
  className?: string;
}

function getSeverityColor(s: string) {
  if (s === "critical") return "#ef4444";
  if (s === "high") return "#f97316";
  if (s === "medium") return "#eab308";
  return "#22c55e";
}

const defaultCenter: [number, number] = [28.6139, 77.209];

interface SearchPlace {
  id: string;
  name: string;
  address: string;
  location: { lat: number; lng: number };
}

/* ─── Tile layer configs ─── */
const TILE_LAYERS = {
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution:
      '&copy; <a href="https://www.esri.com/">Esri</a>',
  },
};


/* ─── Actual map controller using useMap ─── */
const MapControllerInner = dynamic(
  () =>
    import("react-leaflet").then((mod) => {
      const { useMap: useLeafletMap } = mod;

      function Controller({
        target,
        onConsumed,
        isFullscreen,
      }: {
        target: { lat: number; lng: number; zoom: number } | null;
        onConsumed: () => void;
        isFullscreen?: boolean;
      }) {
        const map = useLeafletMap();

        // Recalculate tile grid when container size changes (e.g. fullscreen toggle)
        useEffect(() => {
          if (!map) return;
          // Small delay to let CSS transition / layout settle
          const timer = setTimeout(() => map.invalidateSize(), 200);
          return () => clearTimeout(timer);
        }, [map, isFullscreen]);

        useEffect(() => {
          if (!map || !target) return;
          map.flyTo([target.lat, target.lng], target.zoom, {
            duration: 0.8,
          });
          onConsumed();
        }, [map, target, onConsumed]);

        return null;
      }

      return Controller;
    }),
  { ssr: false }
);

/* ─── Custom Leaflet icons (created client-side only) ─── */
function useLeafletIcons() {
  const [icons, setIcons] = useState<{
    createSeverityIcon: (severity: string, emoji: string, focused: boolean) => L.DivIcon;
    createUserIcon: () => L.DivIcon;
    createSearchIcon: () => L.DivIcon;
  } | null>(null);

  useEffect(() => {
    import("leaflet").then((L) => {
      const createSeverityIcon = (severity: string, emoji: string, focused: boolean) =>
        L.divIcon({
          className: "custom-marker",
          html: `
            <div style="
              width: 32px;
              height: 32px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              background: ${getSeverityColor(severity)};
              border: 2px solid rgba(255,255,255,0.8);
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              cursor: pointer;
              transition: transform 0.15s;
              ${focused ? "transform: scale(1.2); box-shadow: 0 0 0 4px rgba(99,102,241,0.4), 0 2px 8px rgba(0,0,0,0.3);" : ""}
            ">
              <span style="font-size: 14px; line-height: 1;">${emoji}</span>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -18],
        });

      const createUserIcon = () =>
        L.divIcon({
          className: "user-location-marker",
          html: `
            <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
              <div style="
                position: absolute;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                background: rgba(59, 130, 246, 0.25);
                animation: leaflet-ping 2s ease-out infinite;
              "></div>
              <div style="
                position: relative;
                width: 16px;
                height: 16px;
                border-radius: 50%;
                background: #3b82f6;
                border: 2px solid white;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                z-index: 10;
              "></div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

      const createSearchIcon = () =>
        L.divIcon({
          className: "search-marker",
          html: `
            <div style="
              width: 36px;
              height: 36px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              background: #3b82f6;
              border: 2px solid white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              color: white;
            ">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
          popupAnchor: [0, -20],
        });

      setIcons({ createSeverityIcon, createUserIcon, createSearchIcon });
    });
  }, []);

  return icons;
}

/* ─── Leaflet Map View ─── */
function LeafletMapView({
  issues,
  onSelectIssue,
  userLocation,
  searchPlaces,
  initialCenter,
  initialZoom,
  cameraTarget,
  onCameraConsumed,
  focusIssueId,
  mapType,
  isFullscreen,
}: {
  issues: Issue[];
  onSelectIssue: (issue: Issue) => void;
  userLocation: { lat: number; lng: number } | null;
  searchPlaces: SearchPlace[];
  initialCenter: [number, number];
  initialZoom: number;
  cameraTarget: { lat: number; lng: number; zoom: number } | null;
  onCameraConsumed: () => void;
  focusIssueId?: string | null;
  mapType: "roadmap" | "satellite";
  isFullscreen?: boolean;
}) {
  const icons = useLeafletIcons();
  const tile = mapType === "satellite" ? TILE_LAYERS.satellite : TILE_LAYERS.dark;

  return (
    <MapContainer
      center={initialCenter}
      zoom={initialZoom}
      scrollWheelZoom
      zoomControl={false}
      attributionControl={false}
      style={{ height: "100%", width: "100%", background: "#1a1a2e" }}
    >
      <TileLayer url={tile.url} attribution={tile.attribution} />
      <MapControllerInner target={cameraTarget} onConsumed={onCameraConsumed} isFullscreen={isFullscreen} />

      {/* User location marker */}
      {userLocation && icons && (
        <Marker
          position={[userLocation.lat, userLocation.lng]}
          icon={icons.createUserIcon()}
          zIndexOffset={1000}
        />
      )}

      {/* Search place markers */}
      {searchPlaces.map((place) =>
        icons ? (
          <Marker
            key={place.id}
            position={[place.location.lat, place.location.lng]}
            icon={icons.createSearchIcon()}
            zIndexOffset={800}
          >
            <Popup>
              <div style={{ minWidth: 140 }}>
                <strong style={{ fontSize: 13 }}>{place.name}</strong>
                <p style={{ fontSize: 11, color: "#888", margin: "4px 0 0" }}>
                  {place.address}
                </p>
              </div>
            </Popup>
          </Marker>
        ) : null
      )}

      {/* Issue markers */}
      {issues.map((issue) =>
        icons ? (
          <Marker
            key={issue.id}
            position={[issue.latitude, issue.longitude]}
            icon={icons.createSeverityIcon(
              issue.severity,
              CATEGORY_ICONS[issue.category],
              focusIssueId === issue.id
            )}
            zIndexOffset={focusIssueId === issue.id ? 900 : 100}
            eventHandlers={{
              click: () => onSelectIssue(issue),
            }}
          >
            <Popup>
              <div style={{ minWidth: 160 }}>
                <strong style={{ fontSize: 13 }}>{issue.title}</strong>
                <p style={{ fontSize: 11, color: "#888", margin: "4px 0 2px" }}>
                  {issue.address}
                </p>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    textTransform: "capitalize",
                    color: getSeverityColor(issue.severity),
                  }}
                >
                  {issue.severity}
                </span>
              </div>
            </Popup>
          </Marker>
        ) : null
      )}
    </MapContainer>
  );
}

/* ─── Main MapPage export ─── */
export default function MapPage({
  issues,
  onSelectIssue,
  focusIssueId,
  className = "",
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [userAccuracy, setUserAccuracy] = useState<number | null>(null);
  const [locationMessage, setLocationMessage] = useState(
    "Allow location permission to show your position."
  );
  const [mapType, setMapType] = useState<"roadmap" | "satellite">("roadmap");
  const [searchPlaces, setSearchPlaces] = useState<SearchPlace[]>([]);
  const [searchStatus, setSearchStatus] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const centeredOnFirstLocationRef = useRef(false);

  // Camera target — set to trigger a programmatic pan, cleared once consumed
  const [cameraTarget, setCameraTarget] = useState<{
    lat: number;
    lng: number;
    zoom: number;
  } | null>(null);

  const initialCenter = useMemo(
    (): [number, number] =>
      issues[0] ? [issues[0].latitude, issues[0].longitude] : defaultCenter,
    // Only compute once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const consumeCamera = useCallback(() => setCameraTarget(null), []);

  /* ─── Fly to focused issue ─── */
  const prevFocusRef = useRef<string | null>(null);
  useEffect(() => {
    if (!focusIssueId || focusIssueId === prevFocusRef.current) return;
    prevFocusRef.current = focusIssueId;
    const issue = issues.find((i) => i.id === focusIssueId);
    if (issue) {
      setCameraTarget({ lat: issue.latitude, lng: issue.longitude, zoom: 16 });
    }
  }, [focusIssueId, issues]);

  /* ─── Live user location via watchPosition ─── */
  const locateUser = () => {
    if (!navigator.geolocation) {
      setLocationMessage("Location is not supported in this browser.");
      return;
    }

    setLocationMessage("Requesting your location...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setUserLocation(next);
        setUserAccuracy(pos.coords.accuracy);
        setLocationMessage(`Using your live browser location (+/-${Math.round(pos.coords.accuracy)}m).`);
        centeredOnFirstLocationRef.current = true;
        setCameraTarget({ ...next, zoom: 15 });
      },
      (error) => {
        setLocationMessage(
          error.code === error.PERMISSION_DENIED
            ? "Allow location permission to show your position."
            : "Could not get a fresh location fix."
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const next = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setUserLocation(next);
        setUserAccuracy(pos.coords.accuracy);
        setLocationMessage(`Using your live browser location (+/-${Math.round(pos.coords.accuracy)}m).`);
        if (!centeredOnFirstLocationRef.current) {
          centeredOnFirstLocationRef.current = true;
          setCameraTarget({ ...next, zoom: 15 });
        }
      },
      (error) => {
        setLocationMessage(
          error.code === error.PERMISSION_DENIED
            ? "Allow location permission to show your position."
            : "Could not get a fresh location fix."
        );
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  /* ─── Issue text filter ─── */
  const filteredIssues = useMemo(
    () =>
      searchQuery
        ? issues.filter(
            (i) =>
              i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              i.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
              i.category.replace("_", " ").includes(searchQuery.toLowerCase()) ||
              i.status.replace("_", " ").includes(searchQuery.toLowerCase())
          )
        : issues,
    [issues, searchQuery]
  );

  /* ─── Search: server-side Nominatim search via /api/places ─── */
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchPlacesApi = useCallback(async (query?: string) => {
    const q = (query ?? searchQuery).trim();
    if (!q) return;

    setSearchStatus("Searching across India...");

    try {
      const res = await fetch(
        `/api/places?q=${encodeURIComponent(q)}`
      );
      if (!res.ok) throw new Error("Search request failed");

      const data: { results: SearchPlace[] } = await res.json();
      const places = data.results || [];

      setSearchPlaces(places);
      if (places[0]) {
        setCameraTarget({ ...places[0].location, zoom: 16 });
        setSearchStatus(`${places.length} result${places.length === 1 ? "" : "s"} found`);
      } else {
        const matched = filteredIssues;
        if (matched[0]) {
          setCameraTarget({ lat: matched[0].latitude, lng: matched[0].longitude, zoom: 16 });
          onSelectIssue(matched[0]);
          setSearchStatus("Showing matching issue on map.");
        } else {
          setSearchStatus("No locations found. Try a different search.");
        }
      }
    } catch {
      const matched = filteredIssues;
      if (matched[0]) {
        setCameraTarget({ lat: matched[0].latitude, lng: matched[0].longitude, zoom: 16 });
        onSelectIssue(matched[0]);
        setSearchStatus("Showing matching issue on map.");
      } else {
        setSearchStatus("Search failed. Try a more specific term.");
      }
    }
  }, [searchQuery, filteredIssues, onSelectIssue]);

  // Auto-search as user types (debounced)
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (value.trim().length >= 3) {
      searchDebounceRef.current = setTimeout(() => {
        void searchPlacesApi(value);
      }, 500);
    } else {
      setSearchPlaces([]);
      setSearchStatus("");
    }
  }, [searchPlacesApi]);

  const openFirstSearchResult = () => {
    void searchPlacesApi();
  };

  const mapContent = (
    <div
      className={`relative overflow-hidden bg-card shadow-sm flex flex-col ${
        isFullscreen
          ? "fixed inset-0 z-[9999] h-dvh rounded-none"
          : `h-[380px] rounded-2xl border border-border/60 ${className}`
      }`}
    >
      {/* Fullscreen minimize — pinned top-right, always visible */}
      {isFullscreen && (
        <button
          onClick={() => setIsFullscreen(false)}
          className="fixed top-4 right-4 z-[10000] w-11 h-11 rounded-full bg-background/90 border border-border shadow-xl flex items-center justify-center backdrop-blur-md"
          aria-label="Exit full screen map"
        >
          <Minimize2 className="w-5 h-5" />
        </button>
      )}
      {/* Search bar */}
      <div className="absolute top-0 left-0 right-0 z-[500] p-4">
        <div
          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl glass-strong shadow-lg transition-all ${
            searchFocused ? "ring-2 ring-primary/30" : ""
          }`}
        >
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search any address, landmark, city..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") openFirstSearchResult();
            }}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSearchPlaces([]);
                setSearchStatus("");
              }}
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          )}
          <button
            onClick={openFirstSearchResult}
            className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-primary-foreground"
            aria-label="Search map"
          >
            <Search className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Search dropdown */}
        {searchQuery && (
          <div className="mt-2 max-h-48 overflow-y-auto rounded-xl glass-strong shadow-lg">
            {filteredIssues.slice(0, 3).map((issue) => (
              <button
                key={issue.id}
                onClick={() => {
                  setCameraTarget({ lat: issue.latitude, lng: issue.longitude, zoom: 16 });
                  onSelectIssue(issue);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-primary/10"
              >
                <MapPin className="h-3.5 w-3.5 text-primary" />
                <span className="min-w-0 flex-1 truncate">{issue.title}</span>
              </button>
            ))}
            {searchPlaces.map((place) => (
              <div
                key={place.id}
                className="flex items-center gap-2 border-t border-border/30 px-3 py-2 text-xs"
              >
                <button
                  onClick={() => {
                    setCameraTarget({ ...place.location, zoom: 15 });
                  }}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left hover:text-primary"
                >
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-nagrik-blue" />
                  <span className="min-w-0 flex-1 truncate">{place.address}</span>
                </button>
                <a
                  href={`https://www.openstreetmap.org/?mlat=${place.location.lat}&mlon=${place.location.lng}#map=17/${place.location.lat}/${place.location.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md bg-primary/10 px-2 py-1 font-medium text-primary"
                >
                  OSM
                </a>
              </div>
            ))}
            {searchStatus && (
              <p className="border-t border-border/30 px-3 py-2 text-xs text-muted-foreground">
                {searchStatus}
              </p>
            )}
            {filteredIssues.length === 0 && searchPlaces.length === 0 && !searchStatus && (
              <p className="px-3 py-2 text-xs text-muted-foreground">Press Enter or tap 🔍 to search across India</p>
            )}
          </div>
        )}
      </div>

      {/* Map */}
      <div className="flex-1 min-h-0 relative">
        <LeafletMapView
          issues={filteredIssues}
          onSelectIssue={onSelectIssue}
          userLocation={userLocation}
          searchPlaces={searchPlaces}
          initialCenter={initialCenter}
          initialZoom={14}
          cameraTarget={cameraTarget}
          onCameraConsumed={consumeCamera}
          focusIssueId={focusIssueId}
          mapType={mapType}
          isFullscreen={isFullscreen}
        />
      </div>

      {/* Controls — safe area padding in fullscreen */}
      <div className={`absolute right-4 z-[500] flex flex-col gap-2 ${
        isFullscreen ? "bottom-[max(1rem,env(safe-area-inset-bottom))]" : "bottom-4"
      }`}>
        {!isFullscreen && (
          <button
            onClick={() => setIsFullscreen(true)}
            className="w-10 h-10 rounded-full glass-strong shadow-lg flex items-center justify-center"
            aria-label="Maximize map"
          >
            <Expand className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={locateUser}
          className="w-10 h-10 rounded-full glass-strong shadow-lg flex items-center justify-center"
          aria-label="Locate me"
        >
          <Navigation className="w-4 h-4" />
        </button>
        <button
          onClick={() =>
            setMapType((current) => (current === "roadmap" ? "satellite" : "roadmap"))
          }
          className="w-10 h-10 rounded-full glass-strong shadow-lg flex items-center justify-center"
          aria-label="Toggle map layer"
        >
          <Layers className="w-4 h-4" />
        </button>
      </div>

      {/* Legend */}
      <div className={`absolute left-4 z-[500] glass-strong rounded-xl px-3 py-2 shadow-lg ${
        isFullscreen ? "bottom-[max(1rem,env(safe-area-inset-bottom))]" : "bottom-4"
      }`}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px]">
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-nagrik-blue" />
            {userLocation ? `You${userAccuracy ? ` +/-${Math.round(userAccuracy)}m` : ""}` : "Location off"}
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            High
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-orange-500" />
            Medium
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            Low
          </span>
        </div>
        {!userLocation && (
          <p className="mt-1 max-w-44 text-[10px] text-muted-foreground">{locationMessage}</p>
        )}
      </div>
    </div>
  );
  return mapContent;
}
