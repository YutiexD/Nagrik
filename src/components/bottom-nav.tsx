"use client";

import { motion } from "framer-motion";
import {
  Home,
  Plus,
  User,
} from "lucide-react";
import type { Tab } from "@/app/page";

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const tabs: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "report", label: "Report", icon: Plus },
  { id: "profile", label: "Profile", icon: User },
];

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="flex-shrink-0 glass-strong nav-safe-bottom border-t border-border/50">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const isReport = tab.id === "report";

          return (
            <button
              key={tab.id}
              id={`nav-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center gap-0.5 w-16 h-full transition-all duration-200 ${
                isReport ? "" : ""
              }`}
            >
              {isReport ? (
                <div className="relative -mt-5">
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-nagrik-blue flex items-center justify-center shadow-lg shadow-primary/30"
                  >
                    <Plus className="w-6 h-6 text-primary-foreground" strokeWidth={2.5} />
                  </motion.div>
                </div>
              ) : (
                <>
                  <div className="relative">
                    {isActive && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-primary"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <tab.icon
                      className={`w-5 h-5 transition-colors duration-200 ${
                        isActive
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                      strokeWidth={isActive ? 2.2 : 1.8}
                    />
                  </div>
                  <span
                    className={`text-[10px] font-medium transition-colors duration-200 ${
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  >
                    {tab.label}
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
