"use client";

import { motion } from "framer-motion";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";
import type { FlashAlert } from "@/lib/types";

interface Props {
  alerts: FlashAlert[];
}

const iconMap = {
  critical: AlertTriangle,
  warning: AlertCircle,
  info: Info,
};

const colorMap = {
  critical: "border-red-500/30 bg-red-500/5",
  warning: "border-orange-500/30 bg-orange-500/5",
  info: "border-blue-500/30 bg-blue-500/5",
};

const iconColorMap = {
  critical: "text-red-400",
  warning: "text-orange-400",
  info: "text-blue-400",
};

export default function FlashAlerts({ alerts }: Props) {
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-foreground/90 flex items-center gap-1.5">
        <AlertTriangle className="w-3.5 h-3.5 text-nagrik-red" />
        Flash Alerts
      </h2>
      {alerts.map((alert, i) => {
        const Icon = iconMap[alert.severity];
        return (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`rounded-xl border p-3 ${colorMap[alert.severity]}`}
          >
            <div className="flex gap-2.5">
              <div className="flex-shrink-0 mt-0.5">
                <Icon className={`w-4 h-4 ${iconColorMap[alert.severity]}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-tight">{alert.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{alert.description}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-[10px] text-muted-foreground">
                    ~{alert.affected_population} affected
                  </span>
                  <span className="text-[10px] text-muted-foreground">{alert.timestamp}</span>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
