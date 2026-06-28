"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Home, Loader2, MapPin, Navigation, Plus, User } from "lucide-react";
import HomePage from "@/components/pages/home-page";
import ReportPage from "@/components/pages/report-page";
import AssistantPage from "@/components/pages/assistant-page";
import ProfilePage from "@/components/pages/profile-page";
import IssueDetailSheet from "@/components/issue-detail-sheet";
import { NavBar } from "@/components/ui/tubelight-navbar";
import type { Issue, IssueStatus, TimelineEvent, CommunityPulse, FlashAlert, CityMood, PredictiveInsight } from "@/lib/types";
import { generateSeededIssues } from "@/lib/demo-seeder";
import { mockPulse, mockAlerts, mockCityMood, mockInsights } from "@/lib/mock-data";
import { useTranslation } from "@/components/language-provider";
import ChooseLanguageCard from "@/components/choose-language-card";

export type Tab = "home" | "report" | "profile";

const topTabs: { id: Tab; labelKey: string; icon: typeof Home }[] = [
  { id: "home", labelKey: "home", icon: Home },
  { id: "report", labelKey: "report", icon: Plus },
  { id: "profile", labelKey: "profile", icon: User },
];

// Default fallback location — Bengaluru
const DEFAULT_LOC = { lat: 12.9716, lng: 77.5946 };
const DEFAULT_CITY = "Bengaluru";
const LOCATION_DECISION_KEY = "nagrik_location_decision_v1";
const LOCATION_DATA_KEY = "nagrik_center_location";
const CITY_DATA_KEY = "nagrik_city_name";

type LocationDecision = "pending" | "ready";

function LocationGate({
  onAllow,
  onSkip,
  loading,
}: {
  onAllow: () => void;
  onSkip: () => void;
  loading: boolean;
}) {
  return (
    <div className="min-h-dvh w-full bg-[#0a0a0f] text-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-border/60 bg-card/85 p-6 text-center shadow-2xl">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-xl bg-primary/10 text-primary">
          <MapPin className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold">Use your location?</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Nagrik uses your location to show nearby civic reports first. If you skip, we will use sample city data.
        </p>
        <div className="mt-6 grid gap-3">
          <button
            onClick={onAllow}
            disabled={loading}
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground transition-opacity disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
            Allow location
          </button>
          <button
            onClick={onSkip}
            disabled={loading}
            className="h-12 rounded-xl border border-border bg-muted/40 px-4 text-sm font-bold text-muted-foreground hover:bg-muted/70"
          >
            Continue with sample data
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const { language, setLanguage, t, currentLanguageInfo } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [locationDecision, setLocationDecision] = useState<LocationDecision>("pending");
  const [locationLoading, setLocationLoading] = useState(false);
  const [centerLocation, setCenterLocation] = useState<{ lat: number; lng: number }>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("nagrik_center_location");
      if (saved) return JSON.parse(saved);
    }
    return DEFAULT_LOC;
  });

  const [issues, setIssues] = useState<Issue[]>([]);

  const [pulse, setPulse] = useState<CommunityPulse>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("nagrik_seeded_pulse");
      if (saved) return JSON.parse(saved);
    }
    return mockPulse;
  });

  const [alerts, setAlerts] = useState<FlashAlert[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("nagrik_seeded_alerts");
      if (saved) return JSON.parse(saved);
    }
    return mockAlerts;
  });

  const [mood, setMood] = useState<CityMood>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("nagrik_seeded_mood");
      if (saved) return JSON.parse(saved);
    }
    return mockCityMood;
  });

  const [insights, setInsights] = useState<PredictiveInsight[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("nagrik_seeded_insights");
      if (saved) return JSON.parse(saved);
    }
    return mockInsights;
  });

  const initializedLocation = useRef(false);
  const locationUpgraded = useRef(true);

  // Helper to fetch/analyze pulse data via Gemini
  const analyzeAndStorePulse = useCallback(async (issueList: Issue[], langName?: string) => {
    try {
      const targetLang = langName || currentLanguageInfo?.name || "English";
      const res = await fetch("/api/pulse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issues: issueList, lang: targetLang }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.pulse) {
          setPulse(data.pulse);
          localStorage.setItem("nagrik_seeded_pulse", JSON.stringify(data.pulse));
        }
        if (data.alerts) {
          setAlerts(data.alerts);
          localStorage.setItem("nagrik_seeded_alerts", JSON.stringify(data.alerts));
        }
        if (data.summary) {
          const newMood = { summary: data.summary, generated_at: new Date().toISOString() };
          setMood(newMood);
          localStorage.setItem("nagrik_seeded_mood", JSON.stringify(newMood));
        }
        if (data.insights) {
          setInsights(data.insights);
          localStorage.setItem("nagrik_seeded_insights", JSON.stringify(data.insights));
        }
      }
    } catch (err) {
      console.warn("Could not call pulse API, using static fallbacks:", err);
    }
  }, [currentLanguageInfo]);

  const loadAreaData = useCallback(async (center: { lat: number; lng: number }, city: string) => {
    const seededIssues = generateSeededIssues(center.lat, center.lng, city);
    let nextIssues = seededIssues;

    try {
      const res = await fetch(`/api/issues?limit=50&lat=${center.lat}&lng=${center.lng}`, { cache: "no-store" });
      if (res.ok) {
        const dbIssues: Issue[] = await res.json();
        
        // Filter out database issues that are far away (>50km / ~0.5 degrees distance)
        const nearbyDbIssues = dbIssues.filter(issue => {
          const dist = Math.abs(issue.latitude - center.lat) + Math.abs(issue.longitude - center.lng);
          return dist < 0.5;
        });

        const seen = new Set<string>();
        nextIssues = [...nearbyDbIssues, ...seededIssues].filter((issue) => {
          if (seen.has(issue.id)) return false;
          seen.add(issue.id);
          return true;
        });
      }
    } catch (err) {
      console.warn("Could not load database issues, using nearby sample data:", err);
    }

    // Sort all issues by distance to center coordinates
    const cosLat = Math.cos(center.lat * Math.PI / 180);
    nextIssues = nextIssues.sort((a, b) => {
      const dyA = a.latitude - center.lat;
      const dxA = (a.longitude - center.lng) * cosLat;
      const distA = dyA * dyA + dxA * dxA;

      const dyB = b.latitude - center.lat;
      const dxB = (b.longitude - center.lng) * cosLat;
      const distB = dyB * dyB + dxB * dxB;

      return distA - distB;
    });

    setIssues(nextIssues);
    setCenterLocation(center);
    localStorage.setItem("nagrik_seeded_issues", JSON.stringify(nextIssues));
    localStorage.setItem(LOCATION_DATA_KEY, JSON.stringify(center));
    localStorage.setItem(CITY_DATA_KEY, city);
    localStorage.setItem(LOCATION_DECISION_KEY, "ready");
    setLocationDecision("ready");
    void analyzeAndStorePulse(nextIssues);
  }, [analyzeAndStorePulse]);

  const useFallbackLocation = useCallback(() => {
    setLocationLoading(false);
    void loadAreaData(DEFAULT_LOC, DEFAULT_CITY);
  }, [loadAreaData]);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      useFallbackLocation();
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const center = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        let city = DEFAULT_CITY;
        try {
          const res = await fetch(`/api/places?q=${center.lat},${center.lng}&reverse=1`);
          if (res.ok) {
            const data = await res.json();
            if (data.results?.[0]) {
              city = data.results[0].name || data.results[0].address?.split(",")[0] || city;
            }
          }
        } catch {
          // Keep default city name while using detected coordinates.
        }

        await loadAreaData(center, city);
        setLocationLoading(false);
      },
      () => {
        useFallbackLocation();
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  }, [loadAreaData, useFallbackLocation]);

  useEffect(() => {
    if (typeof window === "undefined" || !language || initializedLocation.current) return;
    initializedLocation.current = true;

    if (localStorage.getItem(LOCATION_DECISION_KEY) !== "ready") return;

    const savedIssues = localStorage.getItem("nagrik_seeded_issues");
    if (savedIssues) {
      setIssues(JSON.parse(savedIssues));
      setLocationDecision("ready");
      return;
    }

    const savedLoc = localStorage.getItem(LOCATION_DATA_KEY);
    const savedCity = localStorage.getItem(CITY_DATA_KEY) || DEFAULT_CITY;
    if (savedLoc) {
      void loadAreaData(JSON.parse(savedLoc), savedCity);
    }
  }, [language, loadAreaData]);

  // On mount: save default issues if first time, then try upgrading to real location in background
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Cache version migration to clear any stale single-language API caches from prior versions
    const cacheVersion = localStorage.getItem("nagrik_cache_version_v2");
    if (!cacheVersion) {
      localStorage.removeItem("nagrik_seeded_pulse");
      localStorage.removeItem("nagrik_seeded_alerts");
      localStorage.removeItem("nagrik_seeded_mood");
      localStorage.removeItem("nagrik_seeded_insights");
      localStorage.setItem("nagrik_cache_version_v2", "true");
      setPulse(mockPulse);
      setAlerts(mockAlerts);
      setMood(mockCityMood);
      setInsights(mockInsights);
    }

    const hadSaved = localStorage.getItem("nagrik_seeded_issues");

    // If no saved data, persist the default seeded issues we already generated in useState
    if (!hadSaved) {
      localStorage.setItem("nagrik_seeded_issues", JSON.stringify(issues));
      localStorage.setItem("nagrik_center_location", JSON.stringify(DEFAULT_LOC));
      localStorage.setItem("nagrik_city_name", DEFAULT_CITY);
      // Kick off pulse analysis in the background
      void analyzeAndStorePulse(issues);
    }
  }, []);



  // Callback when user adds a report
  const handleAddIssue = useCallback((newIssue: Issue) => {
    setIssues((current) => {
      let next = [newIssue, ...current];
      // Sort all issues by distance to center coordinates
      const cosLat = Math.cos(centerLocation.lat * Math.PI / 180);
      next = next.sort((a, b) => {
        const dyA = a.latitude - centerLocation.lat;
        const dxA = (a.longitude - centerLocation.lng) * cosLat;
        const distA = dyA * dyA + dxA * dxA;

        const dyB = b.latitude - centerLocation.lat;
        const dxB = (b.longitude - centerLocation.lng) * cosLat;
        const distB = dyB * dyB + dxB * dxB;

        return distA - distB;
      });
      localStorage.setItem("nagrik_seeded_issues", JSON.stringify(next));
      void analyzeAndStorePulse(next);
      return next;
    });
  }, [analyzeAndStorePulse, centerLocation]);

  // Callback when user verifies an issue
  const verifySelectedIssue = async (
    issue: Issue,
    action: "still_exists" | "resolved"
  ) => {
    const nextStatus: IssueStatus = action === "resolved" ? "resolved" : "verified";
    const nextEventType: TimelineEvent["type"] =
      action === "resolved" ? "resolved" : "verified";
    const updatedIssue: Issue = {
      ...issue,
      status: nextStatus,
      verification_count: issue.verification_count + 1,
      confidence: Math.min(99, issue.confidence + 2),
      updated_at: new Date().toISOString(),
      timeline: [
        ...issue.timeline,
        {
          id: `${issue.id}-${action}-${Date.now()}`,
          type: nextEventType,
          description:
            action === "resolved"
              ? "Marked resolved by citizen"
              : "Verified as still existing by citizen",
          timestamp: new Date().toISOString(),
        },
      ],
    };

    if (selectedIssue && selectedIssue.id === issue.id) {
      setSelectedIssue(updatedIssue);
    }
    setIssues((current) => {
      const next = current.map((i) => (i.id === issue.id ? updatedIssue : i));
      localStorage.setItem("nagrik_seeded_issues", JSON.stringify(next));
      return next;
    });

    try {
      await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issue_id: issue.id, issue_title: issue.title, action }),
      });
    } catch (err) {
      console.warn("Verification saved locally only:", err);
    }
  };

  const handleMapLocationUpdate = useCallback(async (center: { lat: number; lng: number }) => {
    const dist = Math.abs(center.lat - centerLocation.lat) + Math.abs(center.lng - centerLocation.lng);
    if (dist < 0.0005) return;

    let city = DEFAULT_CITY;
    try {
      const res = await fetch(`/api/places?q=${center.lat},${center.lng}&reverse=1`);
      if (res.ok) {
        const data = await res.json();
        if (data.results?.[0]) {
          city = data.results[0].name || data.results[0].address?.split(",")[0] || city;
        }
      }
    } catch {
      // Keep default
    }

    void loadAreaData(center, city);
  }, [centerLocation, loadAreaData]);

  // Trigger pulse analysis ONLY when the issues list count changes
  useEffect(() => {
    if (language && issues.length > 0) {
      const lastIssuesCount = localStorage.getItem("nagrik_last_issues_count");
      const currentCount = String(issues.length);
      if (lastIssuesCount !== currentCount) {
        localStorage.setItem("nagrik_last_issues_count", currentCount);
        void analyzeAndStorePulse(issues, currentLanguageInfo?.name);
      }
    }
  }, [language, currentLanguageInfo, issues, analyzeAndStorePulse]);

  if (language === null) {
    return <ChooseLanguageCard onSelectLanguage={setLanguage} />;
  }

  if (locationDecision === "pending") {
    return (
      <LocationGate
        onAllow={requestLocation}
        onSkip={useFallbackLocation}
        loading={locationLoading}
      />
    );
  }

  return (
    <div className="flex flex-col h-dvh overflow-hidden bg-transparent">
      <header className="flex-shrink-0 z-40 glass-strong border-b border-border/50 px-3 py-2">
        <div className="mx-auto flex h-12 max-w-5xl items-center gap-2">
          <button
            onClick={() => setActiveTab("home")}
            className="flex min-w-0 items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-muted/60"
            aria-label="Go to home"
          >
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-nagrik-blue text-sm font-bold text-white">
              N
            </span>
            <span className="hidden text-base font-bold sm:inline">Nagrik</span>
          </button>

          <div className="ml-auto">
            <NavBar
              items={topTabs.map((tab) => ({
                id: tab.id,
                name: t(tab.labelKey),
                icon: tab.icon,
              }))}
              activeTab={activeTab}
              onTabChange={(id) => setActiveTab(id)}
              className="relative bottom-auto sm:top-auto left-auto -translate-x-0"
            />
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
        <AnimatePresence mode="wait">
          {activeTab === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="h-full"
            >
              <HomePage
                onNavigate={setActiveTab}
                selectedIssue={selectedIssue}
                onSelectIssue={setSelectedIssue}
                issues={issues}
                pulse={pulse}
                alerts={alerts}
                mood={mood}
                insights={insights}
                onUpdateIssues={setIssues}
                onVerifyIssue={verifySelectedIssue}
                userLocation={centerLocation}
                onLocationUpdate={handleMapLocationUpdate}
              />
            </motion.div>
          )}

          {activeTab === "report" && (
            <motion.div
              key="report"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="h-full"
            >
              <ReportPage onNavigate={setActiveTab} onAddIssue={handleAddIssue} />
            </motion.div>
          )}

          {activeTab === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="h-full"
            >
              <ProfilePage />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <button
        onClick={() => setChatOpen((open) => !open)}
        className="fixed bottom-6 right-6 z-[1010] flex items-center gap-2 px-5 py-3.5 rounded-full bg-gradient-to-r from-primary to-nagrik-blue text-white shadow-2xl shadow-primary/35 hover:shadow-primary/45 transition-all hover:scale-[1.04] active:scale-[0.97] cursor-pointer border border-primary/20"
        aria-label="Open AI chat"
      >
        <Bot className="h-5 w-5 animate-pulse text-white" />
        <span className="text-sm font-extrabold tracking-wide">
          {t("askAI") || "Ask AI 💬"}
        </span>
      </button>

      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.96 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fixed bottom-20 right-4 z-[1010] h-[min(640px,calc(100dvh-7rem))] w-[min(420px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border/70 bg-background shadow-2xl"
          >
            <AssistantPage
              onClose={() => setChatOpen(false)}
              issues={issues}
              pulse={pulse}
              cityMood={mood}
              insights={insights}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <IssueDetailSheet
        issue={selectedIssue}
        onClose={() => setSelectedIssue(null)}
        onVerifyIssue={verifySelectedIssue}
      />
    </div>
  );
}
