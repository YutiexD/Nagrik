"use client";

import { motion } from "framer-motion";
import { Brain, TrendingUp } from "lucide-react";
import type { PredictiveInsight } from "@/lib/types";
import { CATEGORY_ICONS } from "@/lib/types";
import { useTranslation } from "@/components/language-provider";
import { getLocalizedText } from "@/lib/translations";
import { GradientCard } from "@/components/ui/gradient-card";

interface Props {
  insights: PredictiveInsight[];
}

export default function PredictiveInsightsCard({ insights }: Props) {
  const { t, language } = useTranslation();

  return (
    <GradientCard
      glowColorRight="rgba(6, 182, 212, 0.3)" // Cyan
      glowColorLeft="rgba(59, 130, 246, 0.3)"  // Blue
      glowColorCenter="rgba(14, 165, 233, 0.2)" // Sky Blue
    >
      <div className="flex items-center gap-2 mb-3">
        <Brain className="w-4 h-4 text-nagrik-blue" />
        <span className="text-sm font-semibold">{t("predictiveInsights")}</span>
      </div>
      <div className="space-y-2">
        {insights.map((insight, i) => (
          <motion.div
            key={insight.id || `insight-${i}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/5 border border-white/5"
          >
            <span className="text-base mt-0.5">{CATEGORY_ICONS[insight.category]}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] leading-snug">
                {getLocalizedText(insight.description, language, t)}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3 text-primary" />
                <span className="text-[10px] text-muted-foreground">
                  {insight.confidence}% {t("confidence")}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </GradientCard>
  );
}
