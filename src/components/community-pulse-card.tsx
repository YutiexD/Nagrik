"use client";

import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import type { CommunityPulse } from "@/lib/types";
import { useTranslation } from "@/components/language-provider";
import { GradientCard } from "@/components/ui/gradient-card";

interface Props {
  pulse: CommunityPulse;
}

function getScoreColor(score: number) {
  if (score >= 85) return "text-green-400";
  if (score >= 70) return "text-yellow-400";
  if (score >= 50) return "text-orange-400";
  return "text-red-400";
}

function getBarColor(score: number) {
  if (score >= 85) return "bg-green-400";
  if (score >= 70) return "bg-yellow-400";
  if (score >= 50) return "bg-orange-400";
  return "bg-red-400";
}

function getCategoryKey(icon: string, name: string): string {
  if (icon === "🛣" || icon === "🕳") return "roads";
  if (icon === "💡" || icon === "⚡") return "lighting";
  if (icon === "💧") return "water";
  if (icon === "🗑") return "waste";
  if (icon === "🌊") return "drainage";
  if (icon === "🛡") return "safety";
  if (icon === "🔊") return "noise";
  
  const lower = name.toLowerCase();
  if (lower.includes("road") || lower.includes("सड़क")) return "roads";
  if (lower.includes("light") || lower.includes("बिजली")) return "lighting";
  if (lower.includes("water") || lower.includes("पानी")) return "water";
  if (lower.includes("waste") || lower.includes("garbage") || lower.includes("कचरा")) return "waste";
  if (lower.includes("drain") || lower.includes("निकासी")) return "drainage";
  if (lower.includes("safety") || lower.includes("सुरक्षा")) return "safety";
  if (lower.includes("noise") || lower.includes("शोर")) return "noise";
  return "other";
}

export default function CommunityPulseCard({ pulse }: Props) {
  const { t } = useTranslation();

  return (
    <GradientCard
      glowColorRight="rgba(52, 211, 153, 0.3)" // Emerald
      glowColorLeft="rgba(56, 189, 248, 0.3)"  // Sky Blue
      glowColorCenter="rgba(16, 185, 129, 0.2)" // Green
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">{t("communityPulse")}</span>
        </div>
        <div className="flex items-baseline gap-1">
          <motion.span
            key={pulse.overall}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`text-2xl font-bold tabular-nums ${getScoreColor(pulse.overall)}`}
          >
            {pulse.overall}
          </motion.span>
          <span className="text-xs text-muted-foreground">/100</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-x-4 gap-y-2.5">
        {pulse.categories.map((cat, i) => (
          <motion.div
            key={cat.name}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex flex-col gap-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">
                {cat.icon} {t(getCategoryKey(cat.icon, cat.name))}
              </span>
              <span className={`text-[11px] font-semibold tabular-nums ${getScoreColor(cat.score)}`}>
                {cat.score}
              </span>
            </div>
            <div className="h-1 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${cat.score}%` }}
                transition={{ duration: 0.6, delay: 0.2 + i * 0.05 }}
                className={`h-full rounded-full ${getBarColor(cat.score)}`}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </GradientCard>
  );
}
