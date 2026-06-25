import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/places?q=<search query>[&reverse=1]
 *
 * Server-side Places search proxy using OpenStreetMap Nominatim.
 * Supports forward geocoding (address/landmark search) and reverse
 * geocoding (lat,lng → address). No API key required.
 *
 * Nominatim usage policy: max 1 req/sec, custom User-Agent required.
 * https://operations.osmfoundation.org/policies/nominatim/
 */

interface PlaceResult {
  id: string;
  name: string;
  address: string;
  location: { lat: number; lng: number };
}

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";
const USER_AGENT = "Nagrik/1.0 (civic-platform)";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q")?.trim();
  const isReverse = req.nextUrl.searchParams.get("reverse") === "1";

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  try {
    // ─── Reverse geocoding ───
    if (isReverse) {
      const results = await reverseGeocode(query);
      return NextResponse.json({ results });
    }

    // ─── Forward: Nominatim search ───
    const results = await forwardSearch(query);
    return NextResponse.json({ results });
  } catch (error) {
    console.error("Places search error:", error);
    return NextResponse.json(
      { error: "Search failed", results: [] },
      { status: 500 }
    );
  }
}

/**
 * Reverse geocode — converts "lat,lng" to a readable address.
 */
async function reverseGeocode(latlng: string): Promise<PlaceResult[]> {
  try {
    // Clean the input — handle various formats like "28.6139,77.209" or "{28.6139,77.209}"
    const cleaned = latlng.replace(/[{}]/g, "").trim();
    const parts = cleaned.split(",").map((s) => s.trim());
    const lat = parseFloat(parts[0]);
    const lon = parseFloat(parts[1]);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return [];
    }

    const url = new URL(`${NOMINATIM_BASE}/reverse`);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lon));
    url.searchParams.set("zoom", "18");
    url.searchParams.set("addressdetails", "1");

    const res = await fetch(url.toString(), {
      headers: { "User-Agent": USER_AGENT },
    });

    if (!res.ok) return [];
    const data = await res.json();

    if (!data || data.error) return [];

    return [
      {
        id: String(data.place_id || "reverse-0"),
        name: data.name || data.display_name?.split(",")[0] || "",
        address: data.display_name || "",
        location: { lat: parseFloat(data.lat), lng: parseFloat(data.lon) },
      },
    ];
  } catch {
    return [];
  }
}

/**
 * Forward search — finds locations by query string.
 * Biased toward India using countrycodes and viewbox parameters.
 */
async function forwardSearch(query: string): Promise<PlaceResult[]> {
  try {
    // Primary search: restricted to India
    const url = new URL(`${NOMINATIM_BASE}/search`);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("q", query);
    url.searchParams.set("countrycodes", "in");
    url.searchParams.set("limit", "8");
    url.searchParams.set("addressdetails", "1");
    // Viewbox covering India for result biasing
    url.searchParams.set("viewbox", "68.0,6.5,97.4,37.1");
    url.searchParams.set("bounded", "0");

    const res = await fetch(url.toString(), {
      headers: { "User-Agent": USER_AGENT },
    });

    if (!res.ok) return [];
    const data = await res.json();

    interface NominatimResult {
      place_id: number;
      display_name: string;
      name?: string;
      lat: string;
      lon: string;
      type?: string;
      address?: {
        road?: string;
        suburb?: string;
        city?: string;
        state?: string;
        village?: string;
        town?: string;
      };
    }

    let results: PlaceResult[] = (data || []).map((r: NominatimResult) => ({
      id: String(r.place_id),
      name:
        r.name ||
        r.address?.road ||
        r.address?.suburb ||
        r.display_name.split(",")[0] ||
        query,
      address: r.display_name,
      location: {
        lat: parseFloat(r.lat),
        lng: parseFloat(r.lon),
      },
    }));

    // If no results with country restriction, try appending ", India"
    if (results.length === 0) {
      const broadUrl = new URL(`${NOMINATIM_BASE}/search`);
      broadUrl.searchParams.set("format", "jsonv2");
      broadUrl.searchParams.set("q", `${query}, India`);
      broadUrl.searchParams.set("limit", "6");
      broadUrl.searchParams.set("addressdetails", "1");

      const broadRes = await fetch(broadUrl.toString(), {
        headers: { "User-Agent": USER_AGENT },
      });

      if (broadRes.ok) {
        const broadData = await broadRes.json();
        results = (broadData || []).map((r: NominatimResult) => ({
          id: String(r.place_id),
          name:
            r.name ||
            r.address?.road ||
            r.display_name.split(",")[0] ||
            query,
          address: r.display_name,
          location: {
            lat: parseFloat(r.lat),
            lng: parseFloat(r.lon),
          },
        }));
      }
    }

    return results;
  } catch {
    return [];
  }
}
