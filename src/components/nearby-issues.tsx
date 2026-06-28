"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, Users, Shield, Check, Eye, CheckCircle } from "lucide-react";
import type { Issue } from "@/lib/types";
import { CATEGORY_ICONS } from "@/lib/types";
import { useTranslation } from "@/components/language-provider";
import { GradientCard } from "@/components/ui/gradient-card";

interface Props {
  issues: Issue[];
  onSelectIssue: (issue: Issue) => void;
  onFocusMap: (issue: Issue) => void;
  onVerifyIssue: (issue: Issue, action: "still_exists" | "resolved") => void;
  userLocation?: { lat: number; lng: number };
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

const severityGlows = {
  critical: {
    right: "rgba(239, 68, 68, 0.25)",   // Red
    left: "rgba(244, 63, 94, 0.25)",    // Rose
    center: "rgba(185, 28, 28, 0.15)",  // Deep Red
  },
  high: {
    right: "rgba(249, 115, 22, 0.25)",  // Orange
    left: "rgba(245, 158, 11, 0.25)",   // Amber
    center: "rgba(194, 65, 12, 0.15)",  // Deep Orange
  },
  medium: {
    right: "rgba(234, 179, 8, 0.2)",    // Yellow
    left: "rgba(202, 138, 4, 0.15)",    // Gold
    center: "rgba(250, 204, 21, 0.1)",  // Soft Yellow
  },
  low: {
    right: "rgba(16, 185, 129, 0.2)",   // Emerald
    left: "rgba(52, 211, 153, 0.15)",   // Green
    center: "rgba(5, 150, 105, 0.1)",   // Deep Green
  },
};

function getDistanceText(issue: Issue, userLoc?: { lat: number; lng: number }) {
  if (!userLoc) {
    let hash = 0;
    for (let i = 0; i < issue.id.length; i++) {
      hash = issue.id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return `${Math.abs(hash % 450 + 50)}m`;
  }

  const lat1 = userLoc.lat;
  const lon1 = userLoc.lng;
  const lat2 = issue.latitude;
  const lon2 = issue.longitude;

  const R = 6371000; // radius of Earth in meters
  const x = (lon2 - lon1) * Math.PI / 180 * Math.cos((lat1 + lat2) * Math.PI / 360);
  const y = (lat2 - lat1) * Math.PI / 180;
  const d = Math.sqrt(x * x + y * y) * R;

  if (d < 1000) {
    return `${Math.round(d)}m`;
  }
  return `${(d / 1000).toFixed(1)}km`;
}

/** Read the set of issue IDs the user has already voted on */
function getVerifiedIssues(): Record<string, "still_exists" | "resolved"> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem("nagrik_verified_issues");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** Persist a new vote */
function saveVerification(issueId: string, action: "still_exists" | "resolved") {
  const current = getVerifiedIssues();
  current[issueId] = action;
  localStorage.setItem("nagrik_verified_issues", JSON.stringify(current));
}

const localizedResponses: Record<string, string> = {
  en: "Response recorded! Thank you. 👍",
  hi: "प्रतिक्रिया दर्ज की गई! धन्यवाद। 👍",
  bn: "প্রতিক্রিয়া রেকর্ড করা হয়েছে! ধন্যবাদ। 👍",
  te: "ప్రతిస్పందన రికార్డ్ చేయబడింది! ధన్యవాదాలు. 👍",
  mr: "प्रतिसाद नोंदवला गेला! धन्यवाद। 👍",
  ta: "பதில் பதிவு செய்யப்பட்டது! நன்றி. 👍",
  ur: "جواب درج کر لیا گیا! شکریہ۔ 👍",
  gu: "પ્રતિભાવ નોંધવામાં આવ્યો છે! આભાર. 👍",
  kn: "ಪ್ರತಿಕ್ರಿಯೆ ದಾಖಲಿಸಲಾಗಿದೆ! ಧನ್ಯವಾದಗಳು. 👍",
  ml: "പ്രതികരണം രേഖപ്പെടുത്തി! നന്ദി. 👍",
  pa: "ਪ੍ਰਤੀਕਰਮ ਦਰਜ ਕੀਤਾ ਗਿਆ! ਧੰਨਵਾਦ। 👍",
};

export default function NearbyIssues({ issues, onSelectIssue, onFocusMap, onVerifyIssue, userLocation }: Props) {
  const { t, language } = useTranslation();
  const [verifiedMap, setVerifiedMap] = useState<Record<string, "still_exists" | "resolved">>({});
  const [tempNotedMap, setTempNotedMap] = useState<Record<string, boolean>>({});

  // Load verification state on mount
  useEffect(() => {
    setVerifiedMap(getVerifiedIssues());
  }, []);

  const handleVerify = (issue: Issue, action: "still_exists" | "resolved") => {
    if (verifiedMap[issue.id]) return; // Already voted
    saveVerification(issue.id, action);
    setVerifiedMap((prev) => ({ ...prev, [issue.id]: action }));
    onVerifyIssue(issue, action);

    // Show temporary feedback note for 3.5 seconds
    setTempNotedMap((prev) => ({ ...prev, [issue.id]: true }));
    setTimeout(() => {
      setTempNotedMap((prev) => ({ ...prev, [issue.id]: false }));
    }, 3500);
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between px-0.5">
        <h2 className="text-sm font-semibold text-foreground/90">{t("nearbyIssues")}</h2>
        <span className="text-[11px] text-muted-foreground">{t("tapOpen")}</span>
      </div>
      <div className="grid gap-3">
        {issues.slice(0, 4).map((issue, i) => {
          const voted = verifiedMap[issue.id];
          const severity = (issue.severity || "low").toLowerCase() as keyof typeof severityGlows;
          const glows = severityGlows[severity] || severityGlows.low;

          return (
            <motion.div
              key={issue.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <GradientCard
                glowColorRight={glows.right}
                glowColorLeft={glows.left}
                glowColorCenter={glows.center}
                className="p-1"
              >
                {tempNotedMap[issue.id] ? (
                  <div className="flex flex-col items-center justify-center py-6 px-4 text-center min-h-[110px] w-full">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex flex-col items-center gap-2"
                    >
                      <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                        <CheckCircle className="w-5 h-5 animate-pulse" />
                      </div>
                      <p className="text-sm sm:text-base font-bold text-emerald-300 tracking-wide">
                        {localizedResponses[language || "en"] || localizedResponses.en}
                      </p>
                    </motion.div>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-xl flex-shrink-0 border border-white/5">
                      {CATEGORY_ICONS[issue.category]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3
                          className="text-base font-bold leading-tight cursor-pointer hover:text-primary transition-colors truncate"
                          onClick={() => onSelectIssue(issue)}
                        >
                          {t(issue.title) || issue.title}
                        </h3>
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-md border flex-shrink-0 capitalize ${getSeverityColor(
                            issue.severity
                          )}`}
                        >
                          {t(issue.severity) || issue.severity}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-2 text-xs sm:text-sm text-muted-foreground font-medium">
                        <span>📍 {getDistanceText(issue, userLocation)} {t("away") || "away"}</span>
                        <span>•</span>
                        <span>👥 {issue.affected_citizens} {t("peopleAffected")}</span>
                      </div>

                      <div className="flex items-center gap-2 mt-3.5">
                        {voted ? (
                          <div
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold opacity-80 border ${
                              voted === "still_exists"
                                ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                                : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                            }`}
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            {voted === "still_exists" ? t("stillExists") : t("resolved")}
                            <span className="text-[10px] opacity-75">✓</span>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => handleVerify(issue, "still_exists")}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs sm:text-sm font-bold transition-all active:scale-[0.97] cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              {t("stillExists")}
                            </button>
                            <button
                              onClick={() => handleVerify(issue, "resolved")}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold transition-all active:scale-[0.97] cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              {t("resolved")}
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => onFocusMap(issue)}
                          className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs sm:text-sm font-bold hover:brightness-110 transition-all active:scale-[0.97] cursor-pointer"
                        >
                          {t("open")}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </GradientCard>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
