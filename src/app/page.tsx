"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Home, Plus, User, Loader2 } from "lucide-react";
import HomePage from "@/components/pages/home-page";
import ReportPage from "@/components/pages/report-page";
import AssistantPage from "@/components/pages/assistant-page";
import ProfilePage from "@/components/pages/profile-page";
import IssueDetailSheet from "@/components/issue-detail-sheet";
import type { Issue, IssueStatus, TimelineEvent, CommunityPulse, FlashAlert, CityMood, PredictiveInsight } from "@/lib/types";
import { generateSeededIssues } from "@/lib/demo-seeder";
import { mockPulse, mockAlerts, mockCityMood, mockInsights } from "@/lib/mock-data";

export type Tab = "home" | "report" | "profile";

const topTabs: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "report", label: "Report", icon: Plus },
  { id: "profile", label: "Profile", icon: User },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  // Central Seeding & Consistency States
  const [issues, setIssues] = useState<Issue[]>([]);
  const [pulse, setPulse] = useState<CommunityPulse | null>(null);
  const [alerts, setAlerts] = useState<FlashAlert[]>([]);
  const [mood, setMood] = useState<CityMood | null>(null);
  const [insights, setInsights] = useState<PredictiveInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [cityName, setCityName] = useState("Your Location");

  // Helper to fetch/analyze pulse data via Gemini using issues context
  const analyzeAndStorePulse = useCallback(async (issueList: Issue[]) => {
    try {
      const res = await fetch("/api/pulse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issues: issueList }),
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
      } else {
        throw new Error("Pulse status not OK");
      }
    } catch (err) {
      console.warn("Could not call pulse API, using static fallbacks:", err);
      setPulse(mockPulse);
      setAlerts(mockAlerts);
      setMood(mockCityMood);
      setInsights(mockInsights);
    }
  }, []);

  // Geolocation and seeding on mount
  useEffect(() => {
    async function initSeeding() {
      if (typeof window === "undefined") return;

      const savedIssues = localStorage.getItem("nagrik_seeded_issues");
      const savedPulse = localStorage.getItem("nagrik_seeded_pulse");
      const savedAlerts = localStorage.getItem("nagrik_seeded_alerts");
      const savedMood = localStorage.getItem("nagrik_seeded_mood");
      const savedInsights = localStorage.getItem("nagrik_seeded_insights");
      const savedLoc = localStorage.getItem("nagrik_center_location");
      const savedCity = localStorage.getItem("nagrik_city_name");

      if (savedIssues) {
        setIssues(JSON.parse(savedIssues));
        if (savedPulse) setPulse(JSON.parse(savedPulse));
        if (savedAlerts) setAlerts(JSON.parse(savedAlerts));
        if (savedMood) setMood(JSON.parse(savedMood));
        if (savedInsights) setInsights(JSON.parse(savedInsights));
        if (savedLoc) setUserLocation(JSON.parse(savedLoc));
        if (savedCity) setCityName(savedCity);
        setIsLoading(false);
      } else {
        // Prompt for geolocation
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const lat = position.coords.latitude;
              const lng = position.coords.longitude;
              const loc = { lat, lng };
              setUserLocation(loc);
              localStorage.setItem("nagrik_center_location", JSON.stringify(loc));

              let city = "Bengaluru";
              try {
                const res = await fetch(`/api/places?q=${lat},${lng}&reverse=1`);
                if (res.ok) {
                  const data = await res.json();
                  if (data.results && data.results.length > 0) {
                    city = data.results[0].name || data.results[0].address.split(",")[0] || "Your Location";
                  }
                }
              } catch (err) {
                console.warn("Reverse geocode failed:", err);
              }
              setCityName(city);
              localStorage.setItem("nagrik_city_name", city);

              const seeded = generateSeededIssues(lat, lng, city);
              setIssues(seeded);
              localStorage.setItem("nagrik_seeded_issues", JSON.stringify(seeded));

              await analyzeAndStorePulse(seeded);
              setIsLoading(false);
            },
            async (error) => {
              console.warn("Geolocation denied/failed, falling back to Bangalore:", error);
              const defaultLoc = { lat: 12.9716, lng: 77.5946 };
              setUserLocation(defaultLoc);
              localStorage.setItem("nagrik_center_location", JSON.stringify(defaultLoc));
              setCityName("Bengaluru");
              localStorage.setItem("nagrik_city_name", "Bengaluru");

              const seeded = generateSeededIssues(defaultLoc.lat, defaultLoc.lng, "Bengaluru");
              setIssues(seeded);
              localStorage.setItem("nagrik_seeded_issues", JSON.stringify(seeded));

              await analyzeAndStorePulse(seeded);
              setIsLoading(false);
            },
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
          );
        } else {
          // No geolocation, fallback
          const defaultLoc = { lat: 12.9716, lng: 77.5946 };
          setUserLocation(defaultLoc);
          setCityName("Bengaluru");

          const seeded = generateSeededIssues(defaultLoc.lat, defaultLoc.lng, "Bengaluru");
          setIssues(seeded);
          localStorage.setItem("nagrik_seeded_issues", JSON.stringify(seeded));
          await analyzeAndStorePulse(seeded);
          setIsLoading(false);
        }
      }
    }

    void initSeeding();
  }, [analyzeAndStorePulse]);

  // Callback when user adds a report
  const handleAddIssue = useCallback((newIssue: Issue) => {
    setIssues((current) => {
      const next = [newIssue, ...current];
      localStorage.setItem("nagrik_seeded_issues", JSON.stringify(next));
      void analyzeAndStorePulse(next);
      return next;
    });
  }, [analyzeAndStorePulse]);

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

    setSelectedIssue(updatedIssue);
    setIssues((current) => {
      const next = current.map((i) => (i.id === issue.id ? updatedIssue : i));
      localStorage.setItem("nagrik_seeded_issues", JSON.stringify(next));
      return next;
    });

    try {
      await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issue_id: issue.id, action }),
      });
    } catch (err) {
      console.warn("Verification saved locally only:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-dvh w-screen flex-col items-center justify-center bg-background p-6">
        <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-nagrik-blue/10 border border-primary/20 shadow-2xl">
          <span className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-br from-primary to-nagrik-blue">
            N
          </span>
          <Loader2 className="absolute -inset-1 animate-spin text-primary opacity-45" style={{ animationDuration: "3s" }} />
        </div>
        <h1 className="text-xl font-bold mb-2">Setting up Nagrik</h1>
        <p className="text-sm text-muted-foreground text-center max-w-sm leading-relaxed">
          Requesting location to seed your hyperlocal community dashboard and AI insights...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-dvh overflow-hidden bg-background">
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

          <div className="ml-auto flex items-center gap-1">
            {topTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition-colors sm:px-3 ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
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
                pulse={pulse || mockPulse}
                alerts={alerts}
                mood={mood || mockCityMood}
                insights={insights}
                onUpdateIssues={setIssues}
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
        className="fixed bottom-4 right-4 z-[70] grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30 transition-transform active:scale-95"
        aria-label="Open AI chat"
      >
        <Bot className="h-5 w-5" />
      </button>

      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.96 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fixed bottom-20 right-4 z-[70] h-[min(640px,calc(100dvh-7rem))] w-[min(420px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border/70 bg-background shadow-2xl"
          >
            <AssistantPage
              onClose={() => setChatOpen(false)}
              issues={issues}
              pulse={pulse || mockPulse}
              cityMood={mood || mockCityMood}
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
