"use client";

import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import type { CommunityPulse } from "@/lib/types";

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

export default function CommunityPulseCard({ pulse }: Props) {
  return (
    <div className="rounded-2xl bg-card border border-border/60 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Community Pulse</span>
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
              <span className="text-[11px] text-muted-foreground">{cat.icon} {cat.name}</span>
              <span className={`text-[11px] font-semibold tabular-nums ${getScoreColor(cat.score)}`}>
                {cat.score}
              </span>
            </div>
            <div className="h-1 rounded-full bg-muted overflow-hidden">
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
    </div>
  );
}
