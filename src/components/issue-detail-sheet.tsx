"use client";

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
} from "lucide-react";
import type { Issue } from "@/lib/types";
import { CATEGORY_ICONS, CATEGORY_LABELS } from "@/lib/types";

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

export default function IssueDetailSheet({ issue, onClose, onVerifyIssue }: Props) {
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
            <div className="sticky top-0 bg-card/90 backdrop-blur-xl z-10 px-5 pt-3 pb-2 flex items-center justify-between border-b border-border/40">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/20 absolute top-2 left-1/2 -translate-x-1/2" />
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xl">{CATEGORY_ICONS[issue.category]}</span>
                <div>
                  <h2 className="text-base font-bold leading-tight">{issue.title}</h2>
                  <p className="text-xs text-muted-foreground">{issue.address}</p>
                </div>
              </div>
              <button
                id="close-issue-detail"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 mt-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-5">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-lg ${getSeverityBg(
                    issue.severity
                  )}`}
                >
                  {issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1)}
                </span>
                <span className="text-xs font-medium px-2 py-1 rounded-lg bg-primary/10 text-primary">
                  {CATEGORY_LABELS[issue.category]}
                </span>
                <span className="text-xs font-medium px-2 py-1 rounded-lg bg-muted text-muted-foreground">
                  {issue.status.replace("_", " ").charAt(0).toUpperCase() +
                    issue.status.replace("_", " ").slice(1)}
                </span>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">
                {issue.description}
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-muted/50 p-3 text-center">
                  <div className="text-2xl font-bold text-primary tabular-nums">
                    {issue.priority_score}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    Priority Score
                  </div>
                </div>
                <div className="rounded-xl bg-muted/50 p-3 text-center">
                  <div className="text-2xl font-bold text-foreground tabular-nums">
                    {issue.confidence}%
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    Confidence
                  </div>
                </div>
                <div className="rounded-xl bg-muted/50 p-3 text-center">
                  <div className="text-2xl font-bold text-foreground tabular-nums">
                    {issue.affected_citizens}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    Affected Citizens
                  </div>
                </div>
                <div className="rounded-xl bg-muted/50 p-3 text-center">
                  <div className="text-2xl font-bold text-foreground tabular-nums">
                    {issue.verification_count}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    Verified By
                  </div>
                </div>
              </div>

              {issue.root_cause && (
                <div className="rounded-xl border border-border/60 p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Brain className="w-3.5 h-3.5 text-nagrik-blue" />
                    <span className="text-xs font-semibold">Root Cause Analysis</span>
                  </div>
                  <p className="text-sm">{issue.root_cause}</p>
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                    <span>{issue.root_cause_confidence}% confidence</span>
                    <span>{issue.similar_cases} similar cases</span>
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-border/60 p-3">
                <div className="flex items-center gap-1.5 mb-3">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-semibold">Timeline</span>
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
                          <p className="text-xs font-medium">{event.description}</p>
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

              <div className="flex gap-2 pt-1 pb-4">
                <button
                  onClick={() => onVerifyIssue(issue, "still_exists")}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-orange-500/10 text-orange-400 text-sm font-semibold hover:bg-orange-500/20 transition-colors active:scale-[0.97]"
                >
                  <Eye className="w-4 h-4" />
                  Still Exists
                </button>
                <button
                  onClick={() => onVerifyIssue(issue, "resolved")}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-green-500/10 text-green-400 text-sm font-semibold hover:bg-green-500/20 transition-colors active:scale-[0.97]"
                >
                  <Check className="w-4 h-4" />
                  Resolved
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
