"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Award,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  MapPin,
  Shield,
  TrendingUp,
  Upload,
  User,
  Users,
} from "lucide-react";
import { mockProfile } from "@/lib/mock-data";
import { useTranslation } from "@/components/language-provider";
import type { UserProfile } from "@/lib/types";

interface UploadedIssue {
  id: string;
  title: string;
  category: string;
  severity: string;
  status: string;
  address: string;
  created_at: string;
}

const actionKeys: Record<string, string> = {
  verified: "verified",
  reported: "reported",
  "marked resolved": "markedResolved",
};

const actionIcons = {
  verified: Shield,
  reported: FileText,
  "marked resolved": CheckCircle2,
};

function formatActivityTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const diffMs = Date.now() - date.getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function ProfilePage() {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<UserProfile>(mockProfile);
  const [uploadedIssues, setUploadedIssues] = useState<UploadedIssue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      setLoading(true);
      try {
        const res = await fetch("/api/profile", { cache: "no-store" });
        if (!res.ok) throw new Error("Profile request failed");
        const data = await res.json();
        if (mounted) {
          setProfile(data.profile || mockProfile);
          setUploadedIssues(data.uploaded_issues || []);
        }
      } catch (error) {
        console.warn("Could not load profile activity:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  const statItems = useMemo(
    () => [
      { key: "impactScore", icon: TrendingUp, value: profile.impact_score, color: "text-primary" },
      { key: "reportsCreated", icon: FileText, value: profile.reports_created, color: "text-nagrik-blue" },
      { key: "issuesVerified", icon: Shield, value: profile.issues_verified, color: "text-nagrik-orange" },
      { key: "peopleHelped", icon: Users, value: profile.people_helped.toLocaleString(), color: "text-green-400" },
    ],
    [profile]
  );

  return (
    <div className="safe-bottom">
      <header className="sticky top-0 z-30 glass-strong px-5 py-4">
        <h1 className="text-lg font-bold">{t("profile")}</h1>
      </header>

      <div className="px-4 py-4 space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-card border border-border/60 p-5 flex flex-col items-center shadow-sm"
        >
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-nagrik-blue flex items-center justify-center mb-3">
            <User className="w-8 h-8 text-primary-foreground" />
          </div>
          <h2 className="text-lg font-bold">{profile.name}</h2>
          <div className="flex items-center gap-1.5 mt-1">
            <Award className="w-3.5 h-3.5 text-primary" />
            <span className="text-sm text-primary font-medium">{t(profile.title) || profile.title}</span>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 gap-3">
          {statItems.map((item, i) => (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="rounded-2xl bg-card border border-border/60 p-4 shadow-sm"
            >
              <item.icon className={`w-5 h-5 ${item.color} mb-2`} />
              <div className="text-2xl font-bold tabular-nums">{item.value}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{t(item.key)}</div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl bg-card border border-border/60 p-4 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold">{t("recentActivity")}</span>
            {loading && <Loader2 className="ml-auto h-3.5 w-3.5 animate-spin text-muted-foreground" />}
          </div>
          {profile.recent_activity.length > 0 ? (
            <div className="space-y-2.5">
              {profile.recent_activity.map((act) => {
                const Icon = actionIcons[act.action as keyof typeof actionIcons] || FileText;
                return (
                  <div key={act.id} className="flex items-start gap-2.5">
                    <span className="mt-0.5 grid h-6 w-6 place-items-center rounded-lg bg-muted text-primary">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px]">
                        <span className="capitalize font-medium">{t(actionKeys[act.action] || act.action)}</span>{" "}
                        <span className="text-muted-foreground">{t(act.issue_title) || act.issue_title}</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground">{formatActivityTime(act.timestamp)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="rounded-xl bg-muted/40 px-3 py-3 text-sm text-muted-foreground">
              Your reports and verification marks will appear here.
            </p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.36 }}
          className="rounded-2xl bg-card border border-border/60 p-4 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-3">
            <Upload className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold">My Uploads</span>
          </div>
          {uploadedIssues.length > 0 ? (
            <div className="space-y-2.5">
              {uploadedIssues.map((issue) => (
                <div key={issue.id} className="rounded-xl border border-border/50 bg-muted/30 px-3 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{issue.title}</p>
                      <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{issue.address || "Location saved"}</span>
                      </div>
                    </div>
                    <span className="rounded-md bg-primary/10 px-2 py-1 text-[10px] font-bold capitalize text-primary">
                      {issue.status.replace("_", " ")}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span className="capitalize">{issue.category.replace("_", " ")}</span>
                    <span>-</span>
                    <span className="capitalize">{issue.severity}</span>
                    <span>-</span>
                    <span>{formatActivityTime(issue.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-xl bg-muted/40 px-3 py-3 text-sm text-muted-foreground">
              Submitted reports will be saved here after upload.
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
