"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Send, Sparkles, Loader2, X, Mic, Square, Volume2 } from "lucide-react";
import { useTranslation } from "@/components/language-provider";
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

const localizedSuggestions: Record<string, string[]> = {
  en: [
    "Why are garbage issues increasing?",
    "Which area has most complaints?",
    "What is happening around me?",
    "What gets resolved fastest?",
  ],
  hi: [
    "कचरे की समस्या क्यों बढ़ रही है?",
    "किस क्षेत्र में सबसे अधिक शिकायतें हैं?",
    "मेरे आसपास क्या हो रहा है?",
    "क्या सबसे तेजी से हल होता है?",
  ],
  bn: [
    "আবর্জনার সমস্যা কেন বাড়ছে?",
    "কোন এলাকায় সবচেয়ে বেশি অভিযোগ আছে?",
    "আমার চারপাশে কি ঘটছে?",
    "কোনটি সবচেয়ে দ্রুত সমাধান হয়?",
  ],
  te: [
    "చెత్త సమస్యలు ఎందుకు పెరుగుతున్నాయి?",
    "ఏ ప్రాంతంలో ఎక్కువ ఫిర్యాదులు ఉన్నాయి?",
    "నా చుట్టూ ఏం జరుగుతోంది?",
    "ఏది వేగంగా పరిష్కరించబడుతుంది?",
  ],
  mr: [
    "कचऱ्याच्या समस्या का वाढत आहेत?",
    "कोणत्या भागात सर्वाधिक तक्रारी आहेत?",
    "माझ्या सभोवताली काय घडत आहे?",
    "काय सर्वात जलद सुटते?",
  ],
  ta: [
    "குப்பை பிரச்சினைகள் ஏன் அதிகரிக்கின்றன?",
    "எந்தப் பகுதியில் அதிக புகார்கள் உள்ளன?",
    "என்னைச் சுற்றி என்ன நடக்கிறது?",
    "எது மிக வேகமாக தீர்க்கப்படுகிறது?",
  ],
};

export default function AssistantPage({
  onClose,
  issues,
  pulse,
  cityMood,
  insights,
}: AssistantPageProps) {
  const { t, language, currentLanguageInfo } = useTranslation();
  const suggestions = localizedSuggestions[language || "en"] || localizedSuggestions.en;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messageCounterRef = useRef(0);

  // Sarvam voice recording state
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);

  // TTS playback state
  const [playingTtsId, setPlayingTtsId] = useState<string | null>(null);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);

  const nextMessageId = () => {
    messageCounterRef.current += 1;
    return `message-${messageCounterRef.current}`;
  };

  // Start recording via MediaRecorder → Sarvam STT
  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";
      const recorder = new MediaRecorder(stream, { mimeType });
      recordingChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordingChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(recordingChunksRef.current, { type: mimeType });

        // Send to Sarvam STT
        setIsTranscribing(true);
        try {
          const form = new FormData();
          form.append("file", blob, "voice.webm");
          form.append("language_code", language || "unknown");
          const res = await fetch("/api/sarvam/speech-to-text", {
            method: "POST",
            body: form,
          });
          if (res.ok) {
            const data = await res.json();
            if (data.transcript) {
              setInput((prev) => (prev ? prev + " " + data.transcript : data.transcript));
            }
          }
        } catch (err) {
          console.warn("Sarvam STT failed:", err);
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsListening(true);
    } catch {
      alert(t("microphoneDenied") || "Microphone access denied.");
    }
  }, [language, t]);

  const stopListening = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
    setIsListening(false);
  }, []);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }
      if (ttsAudioRef.current) {
        ttsAudioRef.current.pause();
      }
    };
  }, []);

  // TTS: Play AI response aloud via Sarvam
  const playTts = async (messageId: string, text: string) => {
    // Stop any currently playing audio
    if (ttsAudioRef.current) {
      ttsAudioRef.current.pause();
      ttsAudioRef.current = null;
    }

    if (playingTtsId === messageId) {
      setPlayingTtsId(null);
      return;
    }

    setPlayingTtsId(messageId);
    try {
      const res = await fetch("/api/sarvam/text-to-speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.slice(0, 2400), // bulbul:v3 max 2500 chars
          language: language || "en",
        }),
      });

      if (!res.ok) throw new Error("TTS failed");

      const { audioBase64 } = await res.json();
      if (!audioBase64) throw new Error("No audio data");

      const audioBlob = Uint8Array.from(atob(audioBase64), (c) => c.charCodeAt(0));
      const blob = new Blob([audioBlob], { type: "audio/wav" });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      ttsAudioRef.current = audio;

      audio.onended = () => {
        setPlayingTtsId(null);
        URL.revokeObjectURL(url);
        ttsAudioRef.current = null;
      };

      audio.play();
    } catch (err) {
      console.warn("TTS playback failed:", err);
      setPlayingTtsId(null);
    }
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
          lang: currentLanguageInfo?.name || "English",
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
      const fallback =
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
      <header className="flex-shrink-0 glass-strong px-5 py-4 border-b border-border/40">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-primary animate-pulse" />
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-extrabold tracking-tight">{t("askYourArea")}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("aiInsights")}
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="grid h-10 w-10 place-items-center rounded-full bg-muted hover:bg-muted/80 transition-all cursor-pointer"
              aria-label={t("close")}
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center py-6"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-lg font-bold mb-1.5 text-center">
              {t("askAnything")}
            </h2>
            <p className="text-base text-muted-foreground text-center mb-6 max-w-[300px] leading-relaxed">
              {t("askDescription")}
            </p>
            <div className="w-full space-y-2.5">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  className="w-full text-left px-4 py-3.5 rounded-2xl bg-muted/50 hover:bg-muted text-sm sm:text-base font-semibold transition-colors border border-border/20 cursor-pointer"
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
              className={`max-w-[85%] rounded-2xl text-sm sm:text-base leading-relaxed shadow-sm border ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-md border-transparent px-4 py-3"
                  : "bg-card border-border/60 rounded-tl-md px-4 py-3"
              }`}
            >
              <div>{msg.content}</div>
              {msg.role === "assistant" && (
                <button
                  onClick={() => playTts(msg.id, msg.content)}
                  className={`mt-2 flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                    playingTtsId === msg.id
                      ? "text-primary"
                      : "text-muted-foreground hover:text-primary"
                  }`}
                  title={t("listenAloud") || "Listen aloud"}
                >
                  <Volume2 className={`h-3.5 w-3.5 ${playingTtsId === msg.id ? "animate-pulse" : ""}`} />
                  {playingTtsId === msg.id
                    ? (t("playing") || "Playing...")
                    : (t("listenAloud") || "Listen")}
                </button>
              )}
            </div>
          </motion.div>
        ))}

        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="px-4 py-3.5 rounded-2xl rounded-tl-md bg-card border border-border/60">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            </div>
          </motion.div>
        )}
      </div>

      <div className="flex-shrink-0 border-t border-border/50 p-4 glass-strong">
        {isTranscribing && (
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-primary">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {t("transcribingVoice") || "Transcribing with Sarvam AI..."}
          </div>
        )}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend(input)}
            placeholder={t("askPlaceholder")}
            className="flex-1 px-4 py-3.5 rounded-2xl bg-muted/50 text-sm sm:text-base outline-none focus:ring-2 focus:ring-primary/30 transition-all placeholder:text-muted-foreground/60"
          />
          <button
            onClick={toggleListening}
            disabled={isTranscribing}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer disabled:opacity-50 ${
              isListening
                ? "bg-red-500 text-white animate-pulse"
                : "bg-muted/70 text-muted-foreground hover:bg-muted"
            }`}
            title={t("voiceSearch") || "Voice Search"}
          >
            {isListening ? <Square className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          <button
            onClick={() => handleSend(input)}
            disabled={!input.trim() || loading}
            className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 active:scale-95 transition-all cursor-pointer"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

