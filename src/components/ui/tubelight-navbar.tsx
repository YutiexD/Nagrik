"use client"

import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  id: string
  name: string
  icon: LucideIcon
}

interface NavBarProps {
  items: NavItem[]
  activeTab?: string
  onTabChange?: (id: any) => void
  className?: string
}

export function NavBar({ items, activeTab, onTabChange, className }: NavBarProps) {
  const [internalActiveTab, setInternalActiveTab] = useState(items[0].id)
  const [isMobile, setIsMobile] = useState(false)

  const currentActive = activeTab !== undefined ? activeTab : internalActiveTab

  const handleTabClick = (itemId: string) => {
    if (onTabChange) {
      onTabChange(itemId)
    } else {
      setInternalActiveTab(itemId)
    }
  }

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Check if caller is overriding the default absolute/fixed positioning
  const hasPosition = className && (
    className.includes("relative") || 
    className.includes("static") || 
    className.includes("absolute")
  );

  return (
    <div
      className={cn(
        !hasPosition && "fixed bottom-6 sm:bottom-auto sm:top-4 left-1/2 -translate-x-1/2 z-[1000]",
        className,
      )}
    >
      <div className="flex items-center gap-1 bg-[#0d0d15]/85 border border-[#1f1f2e] backdrop-blur-xl py-1 px-1.5 rounded-full shadow-2xl shadow-cyan-950/20">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = currentActive === item.id

          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={cn(
                "relative cursor-pointer text-xs font-bold px-4 py-2 rounded-full transition-all duration-300 select-none",
                "text-muted-foreground hover:text-cyan-400",
                isActive && "text-cyan-400",
              )}
            >
              <span className="hidden sm:inline">{item.name}</span>
              <span className="sm:hidden">
                <Icon size={16} strokeWidth={2.5} />
              </span>
              {isActive && (
                <motion.div
                  layoutId="lamp"
                  className="absolute inset-0 w-full bg-cyan-500/10 rounded-full -z-10 border border-cyan-500/20"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                >
                  {/* Neon Tubelight glow effect (Teal/Cyan theme) */}
                  <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-cyan-400 rounded-t-full">
                    <div className="absolute w-12 h-6 bg-cyan-400/30 rounded-full blur-md -top-2 -left-2" />
                    <div className="absolute w-8 h-6 bg-cyan-400/20 rounded-full blur-md -top-1" />
                    <div className="absolute w-4 h-4 bg-cyan-400/20 rounded-full blur-sm top-0 left-2" />
                  </div>
                </motion.div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
