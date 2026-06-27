"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { CityMood } from "@/lib/types";
import { useTranslation } from "@/components/language-provider";
import { getLocalizedText } from "@/lib/translations";
import { GradientCard } from "@/components/ui/gradient-card";

interface Props {
  mood: CityMood;
}

export default function CityMoodCard({ mood }: Props) {
  const { t, language } = useTranslation();

  return (
    <GradientCard
      glowColorRight="rgba(168, 85, 247, 0.3)" // Purple
      glowColorLeft="rgba(99, 102, 241, 0.3)"  // Indigo
      glowColorCenter="rgba(139, 92, 246, 0.2)" // Violet
    >
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">{t("cityMood")}</span>
        <span className="text-[10px] text-muted-foreground ml-auto">
          {t("aiGeneratedDailySummary")}
        </span>
      </div>
      <div className="space-y-1.5">
        {mood.summary.map((line, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="text-[13px] text-muted-foreground leading-relaxed flex items-start gap-2"
          >
            <span className="w-1 h-1 rounded-full bg-primary mt-1.5 flex-shrink-0" />
            {getLocalizedText(line, language, t)}
          </motion.p>
        ))}
      </div>
    </GradientCard>
  );
}
