"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Sparkles, Loader2, X } from "lucide-react";
import {
  mockPulse,
  mockIssues,
  mockCityMood,
  mockInsights,
} from "@/lib/mock-data";
import type { Issue, CommunityPulse, CityMood, PredictiveInsight } from "@/lib/types";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface AssistantPageProps {
  onClose?: () => void;
  issues?: Issue[];
  pulse?: CommunityPulse;
  cityMood?: CityMood;
  insights?: PredictiveInsight[];
}

const suggestions = [
  "Why are garbage issues increasing?",
  "Which area has most complaints?",
  "What is happening around me?",
  "What gets resolved fastest?",
];

export default function AssistantPage({
  onClose,
  issues,
  pulse,
  cityMood,
  insights,
}: AssistantPageProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messageCounterRef = useRef(0);

  const nextMessageId = () => {
    messageCounterRef.current += 1;
    return `message-${messageCounterRef.current}`;
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = {
      id: nextMessageId(),
      role: "user",
      content: text.trim(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: text.trim(),
          context: {
            pulse: pulse || mockPulse,
            issues: (issues || mockIssues).map((i) => ({
              title: i.title,
              category: i.category,
              severity: i.severity,
              status: i.status,
              affected_citizens: i.affected_citizens,
              confidence: i.confidence,
              address: i.address,
            })),
            cityMood: cityMood || mockCityMood,
            insights: insights || mockInsights,
          },
        }),
      });

      if (!res.ok) throw new Error("API error");

      const { answer } = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          id: nextMessageId(),
          role: "assistant",
          content: answer,
        },
      ]);
    } catch {
      const fallbacks: Record<string, string> = {
        "Why are garbage issues increasing?":
          "Garbage complaints have risen 25% this week, primarily in Sectors 3 and 7. The pattern correlates with the recent festival period — historically, waste generation spikes 2-3 days after major events.",
        "Which area has most complaints?":
          "Sector 5 currently leads with 34 active issues, primarily water-related. Sector 7 follows with 22 issues, mostly waste management.",
        "What is happening around me?":
          "Within 500m: 3 active issues. A pothole 120m away (92% confidence, 42 affected). A streetlight out 340m north. A blocked drain 480m east verified by 14 citizens.",
        "What gets resolved fastest?":
          "Streetlight issues resolve fastest at 2.3 days average. Road damage takes the longest at 8.7 days. Issues with 30+ affected citizens resolve 60% faster.",
      };

      const fallback =
        fallbacks[text.trim()] ||
        "Based on community data, the overall Community Pulse is 84. Roads are performing well at 91 but water infrastructure is at 68. I recommend monitoring water-related issues in your sector.";

      setMessages((prev) => [
        ...prev,
        {
          id: nextMessageId(),
          role: "assistant",
          content: fallback,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <header className="flex-shrink-0 glass-strong px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold">Ask Your Area</h1>
            <p className="text-[11px] text-muted-foreground">
              AI-powered community insights
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-full bg-muted hover:bg-muted/80"
              aria-label="Close AI chat"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center py-8"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-base font-bold mb-1">
              Ask anything about your area
            </h2>
            <p className="text-sm text-muted-foreground text-center mb-6 max-w-[280px]">
              Get AI-powered insights about issues, trends and patterns in your
              neighbourhood.
            </p>
            <div className="w-full space-y-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  className="w-full text-left px-4 py-3 rounded-xl bg-muted/50 hover:bg-muted text-sm transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-md"
                  : "bg-card border border-border/60 rounded-tl-md"
              }`}
            >
              {msg.content}
            </div>
          </motion.div>
        ))}

        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="px-4 py-3 rounded-2xl rounded-tl-md bg-card border border-border/60">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            </div>
          </motion.div>
        )}
      </div>

      <div className="flex-shrink-0 border-t border-border/50 p-3 glass-strong">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend(input)}
            placeholder="Ask about your area..."
            className="flex-1 px-4 py-3 rounded-xl bg-muted/50 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
          <button
            onClick={() => handleSend(input)}
            disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 active:scale-95 transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
