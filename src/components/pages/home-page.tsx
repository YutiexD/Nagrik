"use client";

import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, MapPinned } from "lucide-react";
import type { Tab } from "@/app/page";
import type {
  Issue,
  IssueStatus,
  FlashAlert,
  CommunityPulse,
  CityMood,
  PredictiveInsight,
  TimelineEvent,
} from "@/lib/types";
import {
  mockPulse,
  mockFeed,
  mockAlerts,
  mockIssues,
  mockCityMood,
  mockInsights,
} from "@/lib/mock-data";
import CommunityPulseCard from "@/components/community-pulse-card";
import LiveFeed from "@/components/live-feed";
import FlashAlerts from "@/components/flash-alerts";
import NearbyIssues from "@/components/nearby-issues";
import CityMoodCard from "@/components/city-mood-card";
import PredictiveInsightsCard from "@/components/predictive-insights-card";
import MapPage from "@/components/pages/map-page";

interface HomePageProps {
  onNavigate: (tab: Tab) => void;
  selectedIssue: Issue | null;
  onSelectIssue: (issue: Issue) => void;
}

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

export default function HomePage({ onNavigate, selectedIssue, onSelectIssue }: HomePageProps) {
  const [pulse, setPulse] = useState<CommunityPulse>(mockPulse);
  const [alerts, setAlerts] = useState<FlashAlert[]>(mockAlerts);
  const [issues, setIssues] = useState<Issue[]>(mockIssues);
  const [mood, setMood] = useState<CityMood>(mockCityMood);
  const [insights, setInsights] = useState<PredictiveInsight[]>(mockInsights);
  const [focusedIssueId, setFocusedIssueId] = useState<string | null>(null);
  const mapSectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const issuesRes = await fetch("/api/issues");
        if (!issuesRes.ok) throw new Error("Issues fetch failed");

        const realIssues: Issue[] = await issuesRes.json();
        if (realIssues && realIssues.length > 0) {
          setIssues(realIssues);

          const pulseRes = await fetch("/api/pulse", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ issues: realIssues }),
          });

          if (pulseRes.ok) {
            const data = await pulseRes.json();
            if (data.pulse) setPulse(data.pulse);
            if (data.alerts) setAlerts(data.alerts);
            if (data.summary) setMood({ summary: data.summary, generated_at: new Date().toISOString() });
            if (data.insights) setInsights(data.insights);
          }
        }
      } catch (err) {
        console.warn("Could not fetch real data, fallback to mock data:", err);
      }
    }

    loadData();
  }, []);

  const focusMapIssue = (issue: Issue) => {
    setFocusedIssueId(issue.id);
    onSelectIssue(issue);
    mapSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const verifyIssue = async (issue: Issue, action: "still_exists" | "resolved") => {
    const nextStatus: IssueStatus = action === "resolved" ? "resolved" : "verified";
    const nextEventType: TimelineEvent["type"] =
      action === "resolved" ? "resolved" : "verified";
    const nextIssues: Issue[] = issues.map((item) =>
      item.id === issue.id
        ? {
            ...item,
            status: nextStatus,
            verification_count: item.verification_count + 1,
            confidence: Math.min(99, item.confidence + 2),
            updated_at: new Date().toISOString(),
            timeline: [
              ...item.timeline,
              {
                id: `${item.id}-${action}-${Date.now()}`,
                type: nextEventType,
                description:
                  action === "resolved"
                    ? "Marked resolved from the map"
                    : "Verified as still existing from the map",
                timestamp: new Date().toISOString(),
              },
            ],
          }
        : item
    );

    setIssues(nextIssues);
    const updatedIssue = nextIssues.find((item) => item.id === issue.id);
    if (updatedIssue && selectedIssue?.id === issue.id) onSelectIssue(updatedIssue);

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

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="visible"
      className="safe-bottom"
    >
      <LiveFeed feed={mockFeed} />

      <div className="px-4 space-y-4 pt-3">
        <motion.div ref={mapSectionRef} variants={fadeUp} className="scroll-mt-20">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground/90 flex items-center gap-1.5">
              <MapPinned className="w-3.5 h-3.5 text-primary" />
              Civic Map
            </h2>
            <span className="text-[11px] text-muted-foreground">
              {issues.length} live pins
            </span>
          </div>
          <MapPage
            issues={issues}
            onSelectIssue={focusMapIssue}
            focusIssueId={focusedIssueId}
          />
        </motion.div>

        <motion.div variants={fadeUp}>
          <NearbyIssues
            issues={issues}
            onSelectIssue={focusMapIssue}
            onVerifyIssue={verifyIssue}
          />
        </motion.div>

        <motion.div variants={fadeUp}>
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <CommunityPulseCard pulse={pulse} />
            <FlashAlerts alerts={alerts} />
          </div>
        </motion.div>

        <motion.div variants={fadeUp}>
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <CityMoodCard mood={mood} />
            <PredictiveInsightsCard insights={insights} />
          </div>
        </motion.div>

        <motion.div variants={fadeUp}>
          <button
            id="report-cta-home"
            onClick={() => onNavigate("report")}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-nagrik-blue text-primary-foreground font-semibold text-base shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
          >
            <TrendingUp className="w-5 h-5" />
            Report an Issue
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
