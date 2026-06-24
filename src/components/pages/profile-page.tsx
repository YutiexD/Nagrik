"use client";

import { motion } from "framer-motion";
import { User, FileText, Shield, Users, Award, TrendingUp, Clock } from "lucide-react";
import { mockProfile } from "@/lib/mock-data";

const statItems = [
  { icon: TrendingUp, label: "Impact Score", value: mockProfile.impact_score, color: "text-primary" },
  { icon: FileText, label: "Reports Created", value: mockProfile.reports_created, color: "text-nagrik-blue" },
  { icon: Shield, label: "Issues Verified", value: mockProfile.issues_verified, color: "text-nagrik-orange" },
  { icon: Users, label: "People Helped", value: mockProfile.people_helped.toLocaleString(), color: "text-green-400" },
];

const actionIcons: Record<string, string> = {
  verified: "🛡",
  reported: "📝",
  "marked resolved": "✅",
};

export default function ProfilePage() {
  return (
    <div className="safe-bottom">
      <header className="sticky top-0 z-30 glass-strong px-5 py-4">
        <h1 className="text-lg font-bold">Profile</h1>
      </header>

      <div className="px-4 py-4 space-y-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-card border border-border/60 p-5 flex flex-col items-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-nagrik-blue flex items-center justify-center mb-3">
            <User className="w-8 h-8 text-primary-foreground" />
          </div>
          <h2 className="text-lg font-bold">{mockProfile.name}</h2>
          <div className="flex items-center gap-1.5 mt-1">
            <Award className="w-3.5 h-3.5 text-primary" />
            <span className="text-sm text-primary font-medium">{mockProfile.title}</span>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 gap-3">
          {statItems.map((item, i) => (
            <motion.div key={item.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="rounded-2xl bg-card border border-border/60 p-4 shadow-sm">
              <item.icon className={`w-5 h-5 ${item.color} mb-2`} />
              <div className="text-2xl font-bold tabular-nums">{item.value}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{item.label}</div>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-2xl bg-card border border-border/60 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Recent Activity</span>
          </div>
          <div className="space-y-2.5">
            {mockProfile.recent_activity.map((act) => (
              <div key={act.id} className="flex items-start gap-2.5">
                <span className="text-sm mt-0.5">{actionIcons[act.action] || "📌"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px]">
                    <span className="capitalize font-medium">{act.action}</span>{" "}
                    <span className="text-muted-foreground">{act.issue_title}</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground">{act.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
