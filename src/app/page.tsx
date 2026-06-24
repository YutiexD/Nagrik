"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Home, Plus, User } from "lucide-react";
import HomePage from "@/components/pages/home-page";
import ReportPage from "@/components/pages/report-page";
import AssistantPage from "@/components/pages/assistant-page";
import ProfilePage from "@/components/pages/profile-page";
import IssueDetailSheet from "@/components/issue-detail-sheet";
import type { Issue, IssueStatus, TimelineEvent } from "@/lib/types";

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

  const pages: Record<Tab, React.ReactNode> = {
    home: <HomePage onNavigate={setActiveTab} selectedIssue={selectedIssue} onSelectIssue={setSelectedIssue} />,
    report: <ReportPage onNavigate={setActiveTab} />,
    profile: <ProfilePage />,
  };

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
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="h-full"
          >
            {pages[activeTab]}
          </motion.div>
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
            <AssistantPage onClose={() => setChatOpen(false)} />
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
