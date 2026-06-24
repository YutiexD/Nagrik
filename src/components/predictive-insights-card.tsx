"use client";

import { motion } from "framer-motion";
import { Brain, TrendingUp } from "lucide-react";
import type { PredictiveInsight } from "@/lib/types";
import { CATEGORY_ICONS } from "@/lib/types";

interface Props {
  insights: PredictiveInsight[];
}

export default function PredictiveInsightsCard({ insights }: Props) {
  return (
    <div className="rounded-2xl bg-card border border-border/60 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Brain className="w-4 h-4 text-nagrik-blue" />
        <span className="text-sm font-semibold">Predictive Insights</span>
      </div>
      <div className="space-y-2">
        {insights.map((insight, i) => (
          <motion.div
            key={insight.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="flex items-start gap-2.5 p-2.5 rounded-xl bg-muted/50"
          >
            <span className="text-base mt-0.5">{CATEGORY_ICONS[insight.category]}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] leading-snug">{insight.description}</p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3 text-primary" />
                <span className="text-[10px] text-muted-foreground">
                  {insight.confidence}% confidence
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
