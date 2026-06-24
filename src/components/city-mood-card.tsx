"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { CityMood } from "@/lib/types";

interface Props {
  mood: CityMood;
}

export default function CityMoodCard({ mood }: Props) {
  return (
    <div className="rounded-2xl bg-card border border-border/60 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">City Mood</span>
        <span className="text-[10px] text-muted-foreground ml-auto">
          AI-generated daily summary
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
            {line}
          </motion.p>
        ))}
      </div>
    </div>
  );
}
