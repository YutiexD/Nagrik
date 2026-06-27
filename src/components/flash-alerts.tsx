"use client";

import { motion } from "framer-motion";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";
import type { FlashAlert } from "@/lib/types";
import { useTranslation } from "@/components/language-provider";
import { getLocalizedText } from "@/lib/translations";
import { GradientCard } from "@/components/ui/gradient-card";

interface Props {
  alerts: FlashAlert[];
}

const iconMap = {
  critical: AlertTriangle,
  warning: AlertCircle,
  info: Info,
};

const iconColorMap = {
  critical: "text-red-400",
  warning: "text-orange-400",
  info: "text-blue-400",
};

const glowConfig = {
  critical: {
    right: "rgba(244, 63, 94, 0.3)", // Rose
    left: "rgba(225, 29, 72, 0.2)",  // Deep Red
    center: "rgba(239, 68, 68, 0.2)", // Red
  },
  warning: {
    right: "rgba(245, 158, 11, 0.3)", // Amber
    left: "rgba(217, 119, 6, 0.2)",  // Orange
    center: "rgba(249, 115, 22, 0.2)", // Orange
  },
  info: {
    right: "rgba(59, 130, 246, 0.3)", // Blue
    left: "rgba(37, 99, 235, 0.2)",  // Royal Blue
    center: "rgba(14, 165, 233, 0.2)", // Sky Blue
  },
};

export default function FlashAlerts({ alerts }: Props) {
  const { t, language } = useTranslation();

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-foreground/90 flex items-center gap-1.5 px-0.5">
        <AlertTriangle className="w-3.5 h-3.5 text-nagrik-red animate-pulse" />
        {t("flashAlerts")}
      </h2>
      <div className="grid gap-2">
        {alerts.map((alert, i) => {
          const severityKey = (alert.severity || "warning").toLowerCase() as keyof typeof iconMap;
          const Icon = iconMap[severityKey] || AlertTriangle;
          const iconColor = iconColorMap[severityKey] || iconColorMap.warning;
          const glows = glowConfig[severityKey] || glowConfig.warning;

          return (
            <motion.div
              key={alert.id || `alert-${i}`}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <GradientCard
                glowColorRight={glows.right}
                glowColorLeft={glows.left}
                glowColorCenter={glows.center}
                className="p-1" // minimal padding for layout consistency
              >
                <div className="flex gap-2.5">
                  <div className="flex-shrink-0 mt-0.5">
                    <Icon className={`w-4 h-4 ${iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-tight">
                      {getLocalizedText(alert.title, language, t)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {getLocalizedText(alert.description, language, t)}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[10px] text-muted-foreground">
                        ~{alert.affected_population} {t("affected")}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {t(alert.timestamp) || alert.timestamp}
                      </span>
                    </div>
                  </div>
                </div>
              </GradientCard>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
