"use client";

import { useRef, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, MapPinned } from "lucide-react";
import type { Tab } from "@/app/page";
import type {
  Issue,
  FlashAlert,
  CommunityPulse,
  CityMood,
  PredictiveInsight,
} from "@/lib/types";
import { generateFeedFromIssues } from "@/lib/demo-seeder";
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
  issues: Issue[];
  pulse: CommunityPulse;
  alerts: FlashAlert[];
  mood: CityMood;
  insights: PredictiveInsight[];
  onUpdateIssues?: React.Dispatch<React.SetStateAction<Issue[]>>;
  onVerifyIssue?: (issue: Issue, action: "still_exists" | "resolved") => void;
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

export default function HomePage({
  onNavigate,
  selectedIssue,
  onSelectIssue,
  issues,
  pulse,
  alerts,
  mood,
  insights,
  onVerifyIssue,
}: HomePageProps) {
  const [focusedIssueId, setFocusedIssueId] = useState<string | null>(null);
  const mapSectionRef = useRef<HTMLDivElement | null>(null);

  // Generate live feed dynamically from seeded issues list to maintain absolute consistency
  const feed = useMemo(() => generateFeedFromIssues(issues), [issues]);

  const focusMapIssue = (issue: Issue) => {
    setFocusedIssueId(issue.id);
    onSelectIssue(issue);
    mapSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleVerify = async (issue: Issue, action: "still_exists" | "resolved") => {
    if (onVerifyIssue) {
      onVerifyIssue(issue, action);
    }
  };

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="visible"
      className="safe-bottom"
    >
      <LiveFeed feed={feed} />

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
            onVerifyIssue={handleVerify}
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
