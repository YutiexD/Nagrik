"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Globe, ChevronRight, Check } from "lucide-react";
import { SUPPORTED_LANGUAGES, Language } from "@/lib/translations";

interface ChooseLanguageCardProps {
  onSelectLanguage: (code: string) => void;
}

const regions = ["All", "Central", "North", "South", "East", "West", "Northeast"];

const regionColors: Record<string, string> = {
  Central: "from-amber-500/10 to-orange-500/10 border-orange-500/20 text-orange-400",
  North: "from-sky-500/10 to-blue-500/10 border-blue-500/20 text-sky-400",
  South: "from-emerald-500/10 to-teal-500/10 border-emerald-500/20 text-emerald-400",
  East: "from-purple-500/10 to-indigo-500/10 border-indigo-500/20 text-indigo-400",
  West: "from-rose-500/10 to-pink-500/10 border-rose-500/20 text-rose-400",
  Northeast: "from-lime-500/10 to-green-500/10 border-green-500/20 text-lime-400",
  Other: "from-gray-500/10 to-slate-500/10 border-slate-500/20 text-slate-400",
};

export default function ChooseLanguageCard({ onSelectLanguage }: ChooseLanguageCardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("All");
  const [selectedLangCode, setSelectedLangCode] = useState<string | null>(null);

  const filteredLanguages = useMemo(() => {
    return SUPPORTED_LANGUAGES.filter((lang) => {
      const matchesSearch =
        lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lang.states.some((state) => state.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesRegion = selectedRegion === "All" || lang.region === selectedRegion;

      return matchesSearch && matchesRegion;
    });
  }, [searchQuery, selectedRegion]);

  const handleSelect = (code: string) => {
    setSelectedLangCode(code);
    // Subtle delay to let the selection animation play
    setTimeout(() => {
      onSelectLanguage(code);
    }, 300);
  };

  return (
    <div className="min-h-dvh w-full bg-[#0a0a0f] text-foreground flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-nagrik-blue/10 blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-card/60 backdrop-blur-xl border border-border/60 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="text-center mb-6 flex-shrink-0">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 100 }}
            className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-nagrik-blue text-white font-black text-xl mb-4 shadow-lg shadow-primary/20"
          >
            N
          </motion.div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent">
            Nagrik • नागरिक • নাগরিক
          </h1>
          <p className="text-base text-muted-foreground mt-2 max-w-md mx-auto font-semibold">
            Select your preferred language to continue
            <span className="block text-[11px] opacity-75 mt-1 font-mono">
              आगे बढ़ने के लिए अपनी पसंदीदा भाषा चुनें • এগিয়ে যাওয়ার জন্য ভাষা নির্বাচন করুন
            </span>
          </p>
        </div>

        {/* Filters and Search */}
        <div className="space-y-4 mb-6 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search language or state (e.g. Hindi, Karnataka, West Bengal)..."
              className="w-full bg-muted/40 border border-border/50 rounded-2xl pl-12 pr-4 py-3.5 text-sm sm:text-base placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
            />
          </div>

          {/* Region Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none mask-image-horizontal">
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
                {region === "All" ? "All Regions" : region}
              </button>
            ))}
          </div>
        </div>

        {/* Languages Grid */}
        <div className="flex-1 overflow-y-auto pr-1 -mr-2 space-y-4 scrollbar-thin">
          {filteredLanguages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Globe className="w-8 h-8 mx-auto mb-2 stroke-[1.5] opacity-50" />
              <p className="text-sm">No languages match your search.</p>
            </div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              <AnimatePresence mode="popLayout">
                {filteredLanguages.map((lang) => {
                  const isSelected = selectedLangCode === lang.code;
                  const colorClass = regionColors[lang.region] || regionColors.Other;

                  return (
                    <motion.button
                      layout
                      key={lang.code}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleSelect(lang.code)}
                      className={`relative overflow-hidden text-left p-4 rounded-2xl border transition-all ${
                        isSelected
                          ? "bg-primary/10 border-primary shadow-lg shadow-primary/5 ring-1 ring-primary"
                          : "bg-muted/20 hover:bg-muted/40 border-border/40 hover:border-border/80"
                      }`}
                    >
                      {/* Decorative Region Stripe */}
                      <div className={`absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b ${colorClass.split(" ")[0]} ${colorClass.split(" ")[1]}`} />

                      <div className="pl-2 flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline gap-2">
                            <span className="text-lg font-bold tracking-tight">
                              {lang.nativeName}
                            </span>
                            <span className="text-xs text-muted-foreground truncate">
                              ({lang.name})
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1 truncate">
                            {lang.states.join(", ")}
                          </p>
                        </div>

                        <div className="flex-shrink-0">
                          {isSelected ? (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            </motion.div>
                          ) : (
                            <ChevronRight className="w-4 h-4 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
                          )}
                        </div>
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
