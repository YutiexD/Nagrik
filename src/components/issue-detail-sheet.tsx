"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Users,
  Shield,
  Clock,
  Check,
  Eye,
  Brain,
  TrendingUp,
  CheckCircle,
} from "lucide-react";
import type { Issue } from "@/lib/types";
import { CATEGORY_ICONS, CATEGORY_LABELS } from "@/lib/types";
import { useTranslation } from "@/components/language-provider";

function getVerifiedIssues(): Record<string, "still_exists" | "resolved"> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem("nagrik_verified_issues");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveVerification(issueId: string, action: "still_exists" | "resolved") {
  const current = getVerifiedIssues();
  current[issueId] = action;
  localStorage.setItem("nagrik_verified_issues", JSON.stringify(current));
}

interface Props {
  issue: Issue | null;
  onClose: () => void;
  onVerifyIssue: (issue: Issue, action: "still_exists" | "resolved") => void;
}

function getSeverityBg(severity: string) {
  switch (severity) {
    case "critical":
      return "bg-red-500/10 text-red-400";
    case "high":
      return "bg-orange-500/10 text-orange-400";
    case "medium":
      return "bg-yellow-500/10 text-yellow-400";
    default:
      return "bg-green-500/10 text-green-400";
  }
}

const timelineIcons = {
  reported: Clock,
  citizens_increased: Users,
  priority_increased: TrendingUp,
  verified: Shield,
  resolved: Check,
};

function formatTimelineDescription(desc: string, t: (key: string) => string, lang: string | null) {
  if (desc.startsWith("Affected citizen count grew to ")) {
    const num = desc.replace("Affected citizen count grew to ", "");
    if (lang === "hi") {
      return `प्रभावित नागरिकों की संख्या बढ़कर हुई: ${num}`;
    }
    return `Affected citizen count grew to ${num}`;
  }
  if (desc.startsWith("Community verified by ") && desc.endsWith(" citizens")) {
    const num = desc.replace("Community verified by ", "").replace(" citizens", "");
    if (lang === "hi") {
      return `${num} नागरिकों द्वारा सत्यापित`;
    }
    return `Community verified by ${num} citizens`;
  }
  return t(desc) || desc;
}

export default function IssueDetailSheet({ issue, onClose, onVerifyIssue }: Props) {
  const { t, language } = useTranslation();
  const [verifiedMap, setVerifiedMap] = useState<Record<string, "still_exists" | "resolved">>({});

  useEffect(() => {
    setVerifiedMap(getVerifiedIssues());
  }, [issue]);

  const handleVerify = (iss: Issue, action: "still_exists" | "resolved") => {
    if (verifiedMap[iss.id]) return;
    saveVerification(iss.id, action);
    setVerifiedMap((prev) => ({ ...prev, [iss.id]: action }));
    onVerifyIssue(iss, action);
  };

  return (
    <AnimatePresence>
      {issue && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] rounded-t-3xl bg-card border-t border-border/60 shadow-2xl overflow-y-auto"
          >
            <div className="sticky top-0 bg-card/90 backdrop-blur-xl z-10 px-5 pt-4 pb-3 flex items-center justify-between border-b border-border/40">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/20 absolute top-2 left-1/2 -translate-x-1/2" />
              <div className="flex items-center gap-3 mt-2">
                <span className="text-2xl">{CATEGORY_ICONS[issue.category]}</span>
                <div>
                  <h2 className="text-lg font-bold leading-tight">{t(issue.title) || issue.title}</h2>
                  <p className="text-sm text-muted-foreground">{t(issue.address) || issue.address}</p>
                </div>
              </div>
              <button
                id="close-issue-detail"
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 mt-2 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-5">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-lg ${getSeverityBg(
                    issue.severity
                  )}`}
                >
                  {t(issue.severity) || issue.severity}
                </span>
                <span className="text-xs font-medium px-2 py-1 rounded-lg bg-primary/10 text-primary">
                  {t(issue.category) || CATEGORY_LABELS[issue.category]}
                </span>
                <span className="text-xs font-medium px-2 py-1 rounded-lg bg-muted text-muted-foreground">
                  {t(issue.status) || issue.status.replace("_", " ")}
                </span>
              </div>

              <p className="text-base text-muted-foreground leading-relaxed">
                {t(issue.description) || issue.description}
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-muted/50 p-3 text-center">
                  <div className="text-2xl font-bold text-primary tabular-nums">
                    {issue.priority_score}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {t("priorityScore")}
                  </div>
                </div>
                <div className="rounded-xl bg-muted/50 p-3 text-center">
                  <div className="text-2xl font-bold text-foreground tabular-nums">
                    {issue.confidence}%
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {t("confidence")}
                  </div>
                </div>
                <div className="rounded-xl bg-muted/50 p-3 text-center">
                  <div className="text-2xl font-bold text-foreground tabular-nums">
                    {issue.affected_citizens}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {t("affectedCitizens")}
                  </div>
                </div>
                <div className="rounded-xl bg-muted/50 p-3 text-center">
                  <div className="text-2xl font-bold text-foreground tabular-nums">
                    {issue.verification_count}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {t("verifiedBy")}
                  </div>
                </div>
              </div>

              {issue.root_cause && (
                <div className="rounded-xl border border-border/60 p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Brain className="w-4 h-4 text-nagrik-blue" />
                    <span className="text-sm font-semibold">{t("rootCauseAnalysis")}</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{t(issue.root_cause) || issue.root_cause}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span>{issue.root_cause_confidence}% {t("confidence")}</span>
                    <span>{issue.similar_cases} {t("similarCases")}</span>
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-border/60 p-3">
                <div className="flex items-center gap-1.5 mb-3">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-semibold">{t("timeline")}</span>
                </div>
                <div className="space-y-0">
                  {issue.timeline.map((event, i) => {
                    const Icon = timelineIcons[event.type];
                    return (
                      <div key={event.id} className="flex gap-3 relative">
                        {i < issue.timeline.length - 1 && (
                          <div className="absolute left-[9px] top-6 bottom-0 w-px bg-border" />
                        )}
                        <div className="w-[18px] h-[18px] rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5 z-10">
                          <Icon className="w-2.5 h-2.5 text-muted-foreground" />
                        </div>
                        <div className="pb-3 flex-1 min-w-0">
                          <p className="text-xs font-medium">{formatTimelineDescription(event.description, t, language)}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {new Date(event.timestamp).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-2 pb-6">
                {verifiedMap[issue.id] ? (
                  <div
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold opacity-80 border ${
                      verifiedMap[issue.id] === "still_exists"
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                        : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    {verifiedMap[issue.id] === "still_exists" ? t("stillExists") : t("resolved")}
                    <span className="text-[10px] opacity-75">✓</span>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => handleVerify(issue, "still_exists")}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold transition-all active:scale-[0.97] cursor-pointer shadow-lg shadow-amber-600/10"
                    >
                      <Eye className="w-4 h-4" />
                      {t("stillExists")}
                    </button>
                    <button
                      onClick={() => handleVerify(issue, "resolved")}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-all active:scale-[0.97] cursor-pointer shadow-lg shadow-emerald-600/10"
                    >
                      <Check className="w-4 h-4" />
                      {t("resolved")}
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
