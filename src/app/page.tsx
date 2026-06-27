"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Home, Plus, User } from "lucide-react";
import HomePage from "@/components/pages/home-page";
import ReportPage from "@/components/pages/report-page";
import AssistantPage from "@/components/pages/assistant-page";
import ProfilePage from "@/components/pages/profile-page";
import IssueDetailSheet from "@/components/issue-detail-sheet";
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

export default function App() {
  const { language, setLanguage, t, currentLanguageInfo } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  // Seed default issues immediately so the app is never empty
  const [issues, setIssues] = useState<Issue[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("nagrik_seeded_issues");
      if (saved) return JSON.parse(saved);
    }
    return generateSeededIssues(DEFAULT_LOC.lat, DEFAULT_LOC.lng, DEFAULT_CITY);
  });

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

  const locationUpgraded = useRef(false);

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

    // Now try to upgrade to user's real location in the background
    if (!locationUpgraded.current && navigator.geolocation) {
      locationUpgraded.current = true;

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          // Check if we already have data for this location (within ~500m)
          const savedLoc = localStorage.getItem("nagrik_center_location");
          if (savedLoc) {
            const prev = JSON.parse(savedLoc);
            const dist = Math.abs(prev.lat - lat) + Math.abs(prev.lng - lng);
            if (dist < 0.005) return; // Already seeded for this location
          }

          // Get city name via reverse geocoding
          let city = DEFAULT_CITY;
          try {
            const res = await fetch(`/api/places?q=${lat},${lng}&reverse=1`);
            if (res.ok) {
              const data = await res.json();
              if (data.results?.[0]) {
                city = data.results[0].name || data.results[0].address?.split(",")[0] || city;
              }
            }
          } catch { /* keep default */ }

          // Generate new location-specific issues and swap them in
          const newIssues = generateSeededIssues(lat, lng, city);
          setIssues(newIssues);
          localStorage.setItem("nagrik_seeded_issues", JSON.stringify(newIssues));
          localStorage.setItem("nagrik_center_location", JSON.stringify({ lat, lng }));
          localStorage.setItem("nagrik_city_name", city);

          // Re-analyze in background
          void analyzeAndStorePulse(newIssues);
        },
        () => {
          // Denied or failed — stay on default, no action needed
          console.info("Location denied, staying on default seed data.");
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



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
        body: JSON.stringify({ issue_id: issue.id, action }),
      });
    } catch (err) {
      console.warn("Verification saved locally only:", err);
    }
  };

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
                  <span className="hidden sm:inline">{t(tab.labelKey)}</span>
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
                pulse={pulse}
                alerts={alerts}
                mood={mood}
                insights={insights}
                onUpdateIssues={setIssues}
                onVerifyIssue={verifySelectedIssue}
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
