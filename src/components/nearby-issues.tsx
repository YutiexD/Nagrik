"use client";

import { motion } from "framer-motion";
import { MapPin, Users, Shield, Check, Eye } from "lucide-react";
import type { Issue } from "@/lib/types";
import { CATEGORY_ICONS } from "@/lib/types";

interface Props {
  issues: Issue[];
  onSelectIssue: (issue: Issue) => void;
  onVerifyIssue: (issue: Issue, action: "still_exists" | "resolved") => void;
}

function getSeverityColor(severity: string) {
  switch (severity) {
    case "critical":
      return "bg-red-500/10 text-red-400 border-red-500/20";
    case "high":
      return "bg-orange-500/10 text-orange-400 border-orange-500/20";
    case "medium":
      return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    default:
      return "bg-green-500/10 text-green-400 border-green-500/20";
  }
}

function getDistance(issueId: string) {
  let hash = 0;
  for (let i = 0; i < issueId.length; i++) {
    hash = issueId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash % 450 + 50);
}

export default function NearbyIssues({ issues, onSelectIssue, onVerifyIssue }: Props) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground/90">Nearby Issues</h2>
        <span className="text-[11px] text-muted-foreground">Tap Open to focus map</span>
      </div>
      {issues.slice(0, 4).map((issue, i) => (
        <motion.div
          key={issue.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
          className="rounded-2xl bg-card border border-border/60 p-3.5 shadow-sm"
        >
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-lg flex-shrink-0">
              {CATEGORY_ICONS[issue.category]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3
                  className="text-sm font-semibold leading-tight cursor-pointer hover:text-primary transition-colors truncate"
                  onClick={() => onSelectIssue(issue)}
                >
                  {issue.title}
                </h3>
                <span
                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md border flex-shrink-0 ${getSeverityColor(
                    issue.severity
                  )}`}
                >
                  {issue.severity}
                </span>
              </div>

              <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-0.5">
                  <MapPin className="w-3 h-3" />
                  {getDistance(issue.id)}m
                </span>
                <span className="flex items-center gap-0.5">
                  <Users className="w-3 h-3" />
                  {issue.affected_citizens}
                </span>
                <span className="flex items-center gap-0.5">
                  <Shield className="w-3 h-3" />
                  {issue.confidence}%
                </span>
              </div>

              <div className="flex items-center gap-2 mt-2.5">
                <button
                  onClick={() => onVerifyIssue(issue, "still_exists")}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-orange-500/10 text-orange-400 text-xs font-medium hover:bg-orange-500/20 transition-colors active:scale-[0.97]"
                >
                  <Eye className="w-3 h-3" />
                  Still Exists
                </button>
                <button
                  onClick={() => onVerifyIssue(issue, "resolved")}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-green-500/10 text-green-400 text-xs font-medium hover:bg-green-500/20 transition-colors active:scale-[0.97]"
                >
                  <Check className="w-3 h-3" />
                  Resolved
                </button>
                <button
                  onClick={() => onSelectIssue(issue)}
                  className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors active:scale-[0.97]"
                >
                  Open
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
