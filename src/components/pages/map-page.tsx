"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Expand, Layers, Locate, MapPin, Minimize2, Search, X } from "lucide-react";
import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps";
import type { MapCameraChangedEvent } from "@vis.gl/react-google-maps";
import type { Issue } from "@/lib/types";
import { CATEGORY_ICONS } from "@/lib/types";

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

const defaultCenter = { lat: 28.6139, lng: 77.209 };

interface SearchPlace {
  id: string;
  name: string;
  address: string;
  location: { lat: number; lng: number };
}

interface MapViewProps {
  issues: Issue[];
  onSelectIssue: (issue: Issue) => void;
  userLocation: { lat: number; lng: number } | null;
  searchPlaces: SearchPlace[];
  center: { lat: number; lng: number };
  zoom: number;
  onCameraChanged: (event: MapCameraChangedEvent) => void;
  focusIssueId?: string | null;
  mapType: "roadmap" | "satellite";
}

function FallbackMap({ issues, onSelectIssue, userLocation, focusIssueId, searchPlaces }: MapViewProps) {
  const positions = [
    { top: "25%", left: "35%" },
    { top: "35%", left: "65%" },
    { top: "55%", left: "25%" },
    { top: "45%", left: "55%" },
    { top: "65%", left: "70%" },
    { top: "70%", left: "40%" },
  ];

  return (
    <div className="min-h-72 flex-1 relative bg-muted/20">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 30% 40%, oklch(0.65 0.2 160 / 8%) 0%, transparent 50%),radial-gradient(circle at 70% 60%, oklch(0.6 0.15 250 / 6%) 0%, transparent 50%),radial-gradient(circle at 50% 50%, oklch(0.3 0.01 240 / 30%) 0%, transparent 80%)",
        }}
      />
      <svg className="absolute inset-0 w-full h-full opacity-[0.06]">
        <defs>
          <pattern
            id="grid"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {userLocation && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <motion.div
            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 w-7 h-7 -m-3.5 rounded-full bg-nagrik-blue/30"
          />
          <div className="w-4 h-4 rounded-full bg-nagrik-blue border-2 border-white shadow-lg relative z-10" />
        </div>
      )}

      {issues.map((issue: Issue, i: number) => {
        const pos = positions[i % positions.length];
        return (
          <motion.button
            key={issue.id}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 + i * 0.08 }}
            style={{ top: pos.top, left: pos.left }}
            className="absolute -translate-x-1/2 -translate-y-1/2 group"
            onClick={() => onSelectIssue(issue)}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-background group-hover:scale-110 transition-transform ${
                focusIssueId === issue.id ? "ring-4 ring-primary/35 scale-110" : ""
              }`}
              style={{ backgroundColor: getSeverityColor(issue.severity) }}
            >
              <span className="text-xs">{CATEGORY_ICONS[issue.category]}</span>
            </div>
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 rounded-lg bg-card border border-border/60 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              <p className="text-[10px] font-medium">{issue.title}</p>
            </div>
          </motion.button>
        );
      })}
      {searchPlaces.map((place, i) => {
        const pos = positions[(i + 2) % positions.length];

        return (
          <motion.div
            key={place.id}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            style={{ top: pos.top, left: pos.left }}
            className="absolute -translate-x-1/2 -translate-y-1/2"
          >
            <div className="grid h-9 w-9 place-items-center rounded-full border-2 border-white bg-nagrik-blue text-white shadow-lg">
              <MapPin className="h-4 w-4" />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function GoogleMapView({
  issues,
  onSelectIssue,
  userLocation,
  searchPlaces,
  center,
  zoom,
  onCameraChanged,
  focusIssueId,
  mapType,
}: MapViewProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <FallbackMap
        issues={issues}
        onSelectIssue={onSelectIssue}
        userLocation={userLocation}
        searchPlaces={searchPlaces}
        center={center}
        zoom={zoom}
        onCameraChanged={onCameraChanged}
        focusIssueId={focusIssueId}
        mapType={mapType}
      />
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        center={center}
        zoom={zoom}
        onCameraChanged={onCameraChanged}
        mapId="nagrik-map"
        gestureHandling="greedy"
        disableDefaultUI
        className="min-h-72 flex-1"
        colorScheme="DARK"
        mapTypeId={mapType}
      >
        {userLocation && (
          <AdvancedMarker position={userLocation} zIndex={20}>
            <div className="relative grid h-8 w-8 place-items-center">
              <span className="absolute h-8 w-8 rounded-full bg-nagrik-blue/25 animate-ping" />
              <span className="relative h-4 w-4 rounded-full bg-nagrik-blue border-2 border-white shadow-lg" />
            </div>
          </AdvancedMarker>
        )}
        {searchPlaces.map((place) => (
          <AdvancedMarker key={place.id} position={place.location} zIndex={15}>
            <div className="group relative grid h-9 w-9 cursor-pointer place-items-center rounded-full border-2 border-white bg-nagrik-blue text-white shadow-lg">
              <MapPin className="h-4 w-4" />
              <div className="pointer-events-none absolute top-full left-1/2 mt-1 w-max max-w-48 -translate-x-1/2 rounded-lg border border-border/60 bg-card px-2 py-1 text-[10px] text-card-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                {place.name}
              </div>
            </div>
          </AdvancedMarker>
        ))}
        {issues.map((issue: Issue) => (
          <AdvancedMarker
            key={issue.id}
            position={{ lat: issue.latitude, lng: issue.longitude }}
            onClick={() => onSelectIssue(issue)}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-white/80 cursor-pointer hover:scale-110 transition-transform ${
                focusIssueId === issue.id ? "ring-4 ring-primary/40 scale-110" : ""
              }`}
              style={{ backgroundColor: getSeverityColor(issue.severity) }}
            >
              <span className="text-xs">{CATEGORY_ICONS[issue.category]}</span>
            </div>
          </AdvancedMarker>
        ))}
      </Map>
    </APIProvider>
  );
}

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
  const [center, setCenter] = useState(() =>
    issues[0] ? { lat: issues[0].latitude, lng: issues[0].longitude } : defaultCenter
  );
  const [zoom, setZoom] = useState(14);
  const [mapType, setMapType] = useState<"roadmap" | "satellite">("roadmap");
  const [dismissedFocusId, setDismissedFocusId] = useState<string | null>(null);
  const [searchPlaces, setSearchPlaces] = useState<SearchPlace[]>([]);
  const [searchStatus, setSearchStatus] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const centeredOnFirstLocationRef = useRef(false);

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
        setCenter(next);
        setZoom(15);
        setDismissedFocusId(focusIssueId ?? null);
      },
      (error) => {
        setLocationMessage(
          error.code === error.PERMISSION_DENIED
            ? "Allow location permission to show your position."
            : "Could not get a fresh location fix."
        );
        setDismissedFocusId(focusIssueId ?? null);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      return;
    }

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
          setCenter(next);
          setZoom(15);
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

  const focusedIssue =
    focusIssueId && dismissedFocusId !== focusIssueId
      ? issues.find((item) => item.id === focusIssueId)
      : null;
  const renderedCenter = focusedIssue
    ? { lat: focusedIssue.latitude, lng: focusedIssue.longitude }
    : center;
  const renderedZoom = focusedIssue ? 16 : zoom;
  const handleCameraChanged = (event: MapCameraChangedEvent) => {
    setCenter(event.detail.center);
    setZoom(event.detail.zoom);
    if (focusIssueId) setDismissedFocusId(focusIssueId);
  };

  const searchGooglePlaces = async () => {
    const query = searchQuery.trim();
    if (!query) return;

    const matchedIssues = filteredIssues;
    if (typeof google === "undefined" || !google.maps?.Geocoder) {
      if (matchedIssues[0]) {
        setCenter({ lat: matchedIssues[0].latitude, lng: matchedIssues[0].longitude });
        setZoom(16);
        onSelectIssue(matchedIssues[0]);
      }
      setSearchStatus("Google Maps search is available after the map API loads.");
      return;
    }

    setSearchStatus("Searching Google Maps...");
    const geocoder = new google.maps.Geocoder();

    try {
      const response = await geocoder.geocode({
        address: query,
        componentRestrictions: { country: "IN" },
        region: "in",
      });
      const places = response.results.slice(0, 6).map((result, index) => ({
        id: result.place_id || `${query}-${index}`,
        name:
          result.address_components[0]?.long_name ||
          result.formatted_address.split(",")[0] ||
          query,
        address: result.formatted_address,
        location: result.geometry.location.toJSON(),
      }));

      setSearchPlaces(places);
      if (places[0]) {
        setCenter(places[0].location);
        setZoom(14);
        setSearchStatus(`${places.length} Google Maps result${places.length === 1 ? "" : "s"} found`);
      } else {
        setSearchStatus("No Google Maps locations found.");
      }
    } catch {
      setSearchStatus("Google Maps search failed. Try a more specific name.");
    }
  };

  const openFirstSearchResult = () => {
    void searchGooglePlaces();
  };

  return (
    <div
      className={`relative overflow-hidden border border-border/60 bg-card shadow-sm flex flex-col ${
        isFullscreen
          ? "fixed inset-0 z-[80] h-dvh rounded-none"
          : `h-[380px] rounded-2xl ${className}`
      }`}
    >
      <div className="absolute top-0 left-0 right-0 z-20 p-4">
        <div
          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl glass-strong shadow-lg transition-all ${
            searchFocused ? "ring-2 ring-primary/30" : ""
          }`}
        >
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search places..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") openFirstSearchResult();
            }}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")}>
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
        {searchQuery && (
          <div className="mt-2 max-h-48 overflow-y-auto rounded-xl glass-strong shadow-lg">
            {filteredIssues.slice(0, 3).map((issue) => (
              <button
                key={issue.id}
                onClick={() => {
                  setCenter({ lat: issue.latitude, lng: issue.longitude });
                  setZoom(16);
                  setDismissedFocusId(null);
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
                    setCenter(place.location);
                    setZoom(15);
                  }}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left hover:text-primary"
                >
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-nagrik-blue" />
                  <span className="min-w-0 flex-1 truncate">{place.address}</span>
                </button>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.address)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md bg-primary/10 px-2 py-1 font-medium text-primary"
                >
                  Maps
                </a>
              </div>
            ))}
            {searchStatus && (
              <p className="border-t border-border/30 px-3 py-2 text-xs text-muted-foreground">
                {searchStatus}
              </p>
            )}
            {filteredIssues.length === 0 && searchPlaces.length === 0 && !searchStatus && (
              <p className="px-3 py-2 text-xs text-muted-foreground">Press search for Google Maps results</p>
            )}
          </div>
        )}
      </div>

      <GoogleMapView
        issues={filteredIssues}
        onSelectIssue={onSelectIssue}
        userLocation={userLocation}
        searchPlaces={searchPlaces}
        center={renderedCenter}
        zoom={renderedZoom}
        onCameraChanged={handleCameraChanged}
        focusIssueId={focusIssueId}
        mapType={mapType}
      />

      <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-2">
        <button
          onClick={() => setIsFullscreen((value) => !value)}
          className="w-10 h-10 rounded-full glass-strong shadow-lg flex items-center justify-center"
          aria-label={isFullscreen ? "Exit full screen map" : "Maximize map"}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Expand className="w-4 h-4" />}
        </button>
        <button
          onClick={locateUser}
          className="w-10 h-10 rounded-full glass-strong shadow-lg flex items-center justify-center"
          aria-label="Locate me"
        >
          <Locate className="w-4 h-4" />
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

      <div className="absolute bottom-4 left-4 z-20 glass-strong rounded-xl px-3 py-2 shadow-lg">
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
}
