"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronRight, Globe, Search } from "lucide-react";
import { SUPPORTED_LANGUAGES } from "@/lib/translations";

interface ChooseLanguageCardProps {
  onSelectLanguage: (code: string) => void;
}

const regions = ["All", "Central", "North", "South", "East", "West", "Northeast", "Other"];

const regionColors: Record<string, string> = {
  Central: "border-orange-500/25 text-orange-300",
  North: "border-sky-500/25 text-sky-300",
  South: "border-emerald-500/25 text-emerald-300",
  East: "border-indigo-500/25 text-indigo-300",
  West: "border-rose-500/25 text-rose-300",
  Northeast: "border-lime-500/25 text-lime-300",
  Other: "border-slate-500/25 text-slate-300",
};

export default function ChooseLanguageCard({ onSelectLanguage }: ChooseLanguageCardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("All");
  const [selectedLangCode, setSelectedLangCode] = useState<string | null>(null);

  const filteredLanguages = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return SUPPORTED_LANGUAGES.filter((lang) => {
      const matchesSearch =
        !query ||
        lang.name.toLowerCase().includes(query) ||
        lang.nativeName.toLowerCase().includes(query) ||
        lang.states.some((state) => state.toLowerCase().includes(query));

      const matchesRegion = selectedRegion === "All" || lang.region === selectedRegion;

      return matchesSearch && matchesRegion;
    });
  }, [searchQuery, selectedRegion]);

  const handleSelect = (code: string) => {
    setSelectedLangCode(code);
    window.setTimeout(() => onSelectLanguage(code), 220);
  };

  return (
    <div className="min-h-dvh w-full bg-[#0a0a0f] text-foreground flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-card/80 backdrop-blur-xl border border-border/60 rounded-2xl p-5 sm:p-7 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
      >
        <div className="text-center mb-5 flex-shrink-0">
          <span className="inline-block text-4xl font-black tracking-tight text-white bg-gradient-to-r from-primary via-cyan-400 to-nagrik-blue bg-clip-text text-transparent animate-gradient mb-4">
            Nagrik
          </span>
          <h1 className="text-2xl font-bold tracking-tight">Choose Language</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            Select one language before opening Nagrik. The app will continue in that language.
          </p>
          <p className="mt-2 text-[11px] font-semibold text-primary">
            22 scheduled Indian languages + English
          </p>
        </div>

        <div className="space-y-4 mb-5 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search language or state..."
              className="w-full bg-muted/40 border border-border/50 rounded-xl pl-12 pr-4 py-3.5 text-sm sm:text-base placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {regions.map((region) => (
              <button
                key={region}
                onClick={() => setSelectedRegion(region)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedRegion === region
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/15"
                    : "bg-muted/40 hover:bg-muted/70 text-muted-foreground hover:text-foreground"
                }`}
              >
                {region === "All" ? "All India" : region}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 -mr-2 space-y-4 scrollbar-thin">
          {filteredLanguages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Globe className="w-8 h-8 mx-auto mb-2 stroke-[1.5] opacity-50" />
              <p className="text-sm">No languages match your search.</p>
            </div>
          ) : (
            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <AnimatePresence mode="popLayout">
                {filteredLanguages.map((lang) => {
                  const isSelected = selectedLangCode === lang.code;
                  const colorClass = regionColors[lang.region] || regionColors.Other;

                  return (
                    <motion.button
                      layout
                      key={lang.code}
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleSelect(lang.code)}
                      className={`relative text-left p-4 rounded-xl border transition-all ${
                        isSelected
                          ? "bg-primary/10 border-primary shadow-lg shadow-primary/5 ring-1 ring-primary"
                          : `bg-muted/20 hover:bg-muted/40 hover:border-border/80 ${colorClass}`
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline gap-2">
                            <span className="text-lg font-bold tracking-tight">{lang.nativeName}</span>
                            <span className="text-xs text-muted-foreground truncate">({lang.name})</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1 truncate">
                            {lang.states.join(", ")}
                          </p>
                        </div>

                        {isSelected ? (
                          <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          </span>
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground/60 flex-shrink-0" />
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
