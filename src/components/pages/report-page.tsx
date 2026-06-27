"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Video,
  Mic,
  FileText,
  MapPin,
  Sparkles,
  Check,
  ArrowLeft,
  Loader2,
  X,
  Upload,
  Square,
} from "lucide-react";
import type { Tab } from "@/app/page";
import type { Issue } from "@/lib/types";
import { useTranslation } from "@/components/language-provider";

interface Props {
  onNavigate: (tab: Tab) => void;
  onAddIssue?: (issue: Issue) => void;
}

type InputMode = "image" | "video" | "record" | "audio_upload" | "text";
type Step = "input" | "processing" | "review";
type LocationMode = "gps" | "manual";

interface AnalysisResult {
  title: string;
  category: string;
  severity: string;
  description: string;
  priority_score: number;
  root_cause?: string;
  root_cause_confidence?: number;
}

const inputModes: { id: InputMode; icon: typeof Camera; label: string }[] = [
  { id: "image", icon: Camera, label: "Image" },
  { id: "video", icon: Video, label: "Video" },
  { id: "record", icon: Mic, label: "Record" },
  { id: "audio_upload", icon: Upload, label: "Audio" },
  { id: "text", icon: FileText, label: "Text" },
];

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formatLocationStatus(status: string, t: (key: string) => string, lang: string | null) {
  if (status === "Requesting location permission..." || status === "Requesting your location...") {
    return t("requestingLocation") || status;
  }
  if (status === "Detecting your location...") {
    return t("detectingLocation") || status;
  }
  if (status === "Location is not supported. Use manual location." || status === "Location is not supported in this browser.") {
    return t("locationNotSupported") || status;
  }
  if (status === "Could not detect GPS. Enter location manually." || status === "Could not get a fresh location fix.") {
    return t("locationFixFailed") || status;
  }
  if (status.startsWith("GPS detected within ")) {
    const accuracy = status.replace("GPS detected within ", "").replace("m", "");
    if (lang === "hi") {
      return `जीपीएस ने ${accuracy} मीटर के भीतर स्थान पाया`;
    }
    return status;
  }
  if (status.startsWith("GPS: ")) {
    const addr = status.replace("GPS: ", "");
    return `GPS: ${t(addr) || addr}`;
  }
  return t(status) || status;
}

export default function ReportPage({ onNavigate, onAddIssue }: Props) {
  const { t, currentLanguageInfo } = useTranslation();
  const [mode, setMode] = useState<InputMode>("image");
  const [step, setStep] = useState<Step>("input");
  const [textInput, setTextInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
    accuracy?: number;
  } | null>(null);
  const [locationMode, setLocationMode] = useState<LocationMode>("gps");
  const [manualAddress, setManualAddress] = useState("");
  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");
  const [locationStatus, setLocationStatus] = useState("Requesting location permission...");
  const fileRef = useRef<HTMLInputElement>(null);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4' });
      recordingChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordingChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(recordingChunksRef.current, { type: recorder.mimeType });
        const ext = recorder.mimeType.includes('webm') ? 'webm' : 'm4a';
        const file = new File([blob], `recording.${ext}`, { type: recorder.mimeType });
        setSelectedFile(file);
        setPreview(URL.createObjectURL(blob));
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
    } catch {
      setError("Microphone access denied. Please allow microphone permission.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const [addressSuggestions, setAddressSuggestions] = useState<
    { id: string; name: string; address: string; location: { lat: number; lng: number } }[]
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reverse geocode coords to a human-readable address
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      const res = await fetch(`/api/places?q=${encodeURIComponent(`${lat},${lng}`)}&reverse=1`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.results?.[0]?.address || null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationMode("manual");
      setLocationStatus("Location not supported. Enter manually.");
      return;
    }

    setLocationStatus("Detecting your location...");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          address: `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`,
        };
        setLocation(coords);
        setLocationStatus(`GPS detected within ${Math.round(pos.coords.accuracy)}m`);

        // Try to get a readable address
        const addr = await reverseGeocode(coords.lat, coords.lng);
        if (addr) {
          setLocation((prev) => prev ? { ...prev, address: addr } : prev);
          setLocationStatus(`GPS: ${addr}`);
        }
      },
      () => {
        setLocation(null);
        setLocationMode("manual");
        setLocationStatus("Could not detect GPS. Enter location manually.");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, [reverseGeocode]);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("Location is not supported. Use manual location.");
      setLocationMode("manual");
      return;
    }

    setLocationStatus("Detecting your location...");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          address: `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`,
        };
        setLocation(coords);
        setLocationStatus(`GPS detected within ${Math.round(pos.coords.accuracy)}m`);

        const addr = await reverseGeocode(coords.lat, coords.lng);
        if (addr) {
          setLocation((prev) => prev ? { ...prev, address: addr } : prev);
          setLocationStatus(`GPS: ${addr}`);
        }
      },
      () => {
        setLocation(null);
        setLocationMode("manual");
        setLocationStatus("Could not detect GPS. Enter location manually.");
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );
  };

  // Debounced address search for suggestions
  const searchAddress = useCallback((query: string) => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!query.trim() || query.trim().length < 3) {
      setAddressSuggestions([]);
      return;
    }
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/places?q=${encodeURIComponent(query)}`);
        if (!res.ok) return;
        const data = await res.json();
        setAddressSuggestions(data.results || []);
        setShowSuggestions(true);
      } catch { /* ignore */ }
    }, 400);
  }, []);

  const geocodeManualLocation = async () => {
    const trimmedAddress = manualAddress.trim();
    if (!trimmedAddress) {
      setError("Enter an address or landmark first.");
      return null;
    }

    try {
      const res = await fetch(`/api/places?q=${encodeURIComponent(trimmedAddress)}`);
      const data = await res.json();
      const result = data.results?.[0];

      if (!result) {
        setError("Could not find that address. Try a clearer landmark or add lat/lng.");
        return null;
      }

      const nextLocation = {
        lat: result.location.lat,
        lng: result.location.lng,
        address: result.address,
      };

      setLocation(nextLocation);
      setManualAddress(result.address);
      setManualLat(String(nextLocation.lat));
      setManualLng(String(nextLocation.lng));
      setLocationStatus("Manual address matched.");
      setError(null);
      setAddressSuggestions([]);
      setShowSuggestions(false);
      return nextLocation;
    } catch {
      setError("Search failed. Try adding lat/lng manually.");
      return null;
    }
  };

  const getReportLocation = async () => {
    if (locationMode === "gps" && location) return location;

    const parsedLat = Number(manualLat);
    const parsedLng = Number(manualLng);
    if (
      manualAddress.trim() &&
      Number.isFinite(parsedLat) &&
      Number.isFinite(parsedLng) &&
      Math.abs(parsedLat) <= 90 &&
      Math.abs(parsedLng) <= 180
    ) {
      return {
        lat: parsedLat,
        lng: parsedLng,
        address: manualAddress.trim(),
      };
    }

    if (manualAddress.trim()) return geocodeManualLocation();

    setError("Set a GPS or manual location before submitting.");
    return null;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreview(url);
  };

  const handleSubmit = async () => {
    setStep("processing");
    setError(null);

    try {
      const payload: Record<string, string> = {
        lang: currentLanguageInfo?.name || "English"
      };
      const location = await getReportLocation();
      if (location) {
        payload.lat = String(location.lat);
        payload.lng = String(location.lng);
        payload.address = location.address;
      }

      if (selectedFile) {
        const base64 = await fileToBase64(selectedFile);
        if (mode === "image") {
          payload.imageBase64 = base64;
          payload.imageType = selectedFile.type;
        } else if (mode === "video") {
          payload.videoBase64 = base64;
          payload.videoType = selectedFile.type;
        } else if (mode === "record" || mode === "audio_upload") {
          payload.audioBase64 = base64;
          payload.audioType = selectedFile.type;
        }
      }

      if (textInput) {
        payload.text = textInput;
      }

      if (!payload.text && !payload.imageBase64 && !payload.videoBase64 && !payload.audioBase64) {
        payload.text = "General civic issue to report";
      }

      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Analysis failed");
      }

      const result: AnalysisResult = await res.json();
      setAnalysis(result);
      setStep("review");
    } catch {
      setAnalysis({
        title: "Civic Issue Report",
        category: "other",
        severity: "medium",
        description: textInput || "Issue reported via Nagrik app.",
        priority_score: 50,
      });
      setStep("review");
    }
  };

  const handleFinalSubmit = async () => {
    if (!analysis) return;
    const reportLocation = await getReportLocation();
    if (!reportLocation) return;

    let newIssue: Issue | null = null;
    try {
      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...analysis,
          latitude: reportLocation.lat,
          longitude: reportLocation.lng,
          address: reportLocation.address,
        }),
      });
      if (res.ok) {
        newIssue = await res.json();
      }
    } catch (err) {
      console.warn("API submission failed, falling back to local creation:", err);
    }

    if (!newIssue) {
      newIssue = {
        id: "mock-" + Math.random().toString(36).slice(2, 11),
        title: analysis.title,
        description: analysis.description,
        category: (analysis.category || "other") as any,
        severity: (analysis.severity || "medium") as any,
        status: "reported",
        priority_score: analysis.priority_score || 50,
        confidence: 85,
        affected_citizens: 1,
        verification_count: 0,
        latitude: reportLocation.lat,
        longitude: reportLocation.lng,
        address: reportLocation.address,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        root_cause: analysis.root_cause || "Pending AI analysis",
        root_cause_confidence: analysis.root_cause_confidence || 70,
        timeline: [
          {
            id: `t-mock-${Date.now()}`,
            type: "reported",
            description: "Issue first reported by citizen",
            timestamp: new Date().toISOString(),
          },
        ],
      };
    }

    if (onAddIssue) {
      onAddIssue(newIssue);
    }

    setStep("input");
    setTextInput("");
    setSelectedFile(null);
    setPreview(null);
    setAnalysis(null);
    setManualAddress("");
    setManualLat("");
    setManualLng("");
    onNavigate("home");
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const severityColor: Record<string, string> = {
    low: "text-green-400",
    medium: "text-yellow-400",
    high: "text-orange-400",
    critical: "text-red-400",
  };

  return (
    <div className="h-full flex flex-col safe-bottom">
      <header className="sticky top-0 z-30 glass-strong px-5 py-4 flex items-center gap-3">
        <button
          onClick={() => onNavigate("home")}
          className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-extrabold tracking-tight">{t("reportAnIssue")}</h1>
      </header>

      <div className="flex-1 px-4 py-4">
        <AnimatePresence mode="wait">
          {step === "input" && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-5"
            >
              <div className="grid grid-cols-5 gap-2">
                {inputModes.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      if (isRecording) stopRecording();
                      setMode(m.id);
                      clearFile();
                    }}
                    className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all cursor-pointer border ${
                      mode === m.id
                        ? "bg-primary/20 text-primary border-primary/40 shadow-sm"
                        : "bg-muted hover:bg-muted/90 text-muted-foreground border-transparent"
                    }`}
                  >
                    <m.icon className="w-5 h-5" />
                    <span className="text-xs font-semibold">{t(m.id) || m.label}</span>
                  </button>
                ))}
              </div>

              <input
                ref={fileRef}
                type="file"
                className="hidden"
                accept={
                  mode === "image"
                    ? "image/*"
                    : mode === "video"
                    ? "video/*"
                    : mode === "audio_upload"
                    ? "audio/*"
                    : undefined
                }
                capture={mode === "image" ? "environment" : undefined}
                onChange={handleFileSelect}
              />

              {mode === "image" && !preview && (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full rounded-2xl border-2 border-dashed border-border bg-muted/30 p-8 flex flex-col items-center gap-3 cursor-pointer"
                >
                  <Camera className="w-10 h-10 text-muted-foreground/40" />
                  <p className="text-base text-muted-foreground font-semibold">
                    {t("tapToTakePhotoOrUpload")}
                  </p>
                </button>
              )}

              {mode === "video" && !preview && (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full rounded-2xl border-2 border-dashed border-border bg-muted/30 p-8 flex flex-col items-center gap-3 cursor-pointer"
                >
                  <Video className="w-10 h-10 text-muted-foreground/40" />
                  <p className="text-base text-muted-foreground font-semibold">
                    {t("recordOrUploadShortVideo")}
                  </p>
                </button>
              )}

              {mode === "record" && !preview && (
                <div className="w-full rounded-2xl border-2 border-dashed border-border bg-muted/30 p-8 flex flex-col items-center gap-4">
                  {isRecording ? (
                    <>
                      <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [1, 0.6, 1] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                        className="w-20 h-20 rounded-full bg-red-500/15 border-2 border-red-500/40 flex items-center justify-center"
                      >
                        <div className="w-4 h-4 rounded-sm bg-red-500 animate-pulse" />
                      </motion.div>
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-sm font-mono font-semibold text-red-400">
                          {Math.floor(recordingSeconds / 60).toString().padStart(2, '0')}:{(recordingSeconds % 60).toString().padStart(2, '0')}
                        </span>
                      </div>
                      {/* Waveform bars */}
                      <div className="flex items-end gap-0.5 h-8">
                        {Array.from({ length: 24 }).map((_, i) => (
                          <motion.div
                            key={i}
                            className="w-1 rounded-full bg-red-400/70"
                            animate={{ height: [4, 8 + Math.random() * 24, 4] }}
                            transition={{ duration: 0.4 + Math.random() * 0.4, repeat: Infinity, delay: i * 0.05 }}
                          />
                        ))}
                      </div>
                      <button
                        onClick={stopRecording}
                        className="mt-1 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500/10 text-red-400 font-semibold text-sm border border-red-500/20 cursor-pointer"
                      >
                        <Square className="w-4 h-4" />
                        {t("stopRecording")}
                      </button>
                    </>
                  ) : (
                    <button onClick={startRecording} className="flex flex-col items-center gap-3 cursor-pointer">
                      <motion.div
                        animate={{ scale: [1, 1.08, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center"
                      >
                        <Mic className="w-9 h-9 text-primary" />
                      </motion.div>
                      <p className="text-base text-muted-foreground font-semibold">{t("tapToStartRecording")}</p>
                    </button>
                  )}
                </div>
              )}

              {mode === "audio_upload" && !preview && (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full rounded-2xl border-2 border-dashed border-border bg-muted/30 p-8 flex flex-col items-center gap-3 cursor-pointer"
                >
                  <Upload className="w-10 h-10 text-muted-foreground/40" />
                  <p className="text-base text-muted-foreground font-semibold">
                    {t("uploadExistingAudioFile")}
                  </p>
                </button>
              )}

              {mode === "text" && (
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={t("describeIssue")}
                  className="w-full h-36 rounded-2xl bg-muted/30 border border-border p-4 text-base resize-none outline-none focus:ring-2 focus:ring-primary/30 transition-all placeholder:text-muted-foreground/60"
                />
              )}

              {preview && (
                <div className="relative rounded-2xl overflow-hidden border border-border">
                  {mode === "image" && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full h-48 object-cover"
                    />
                  )}
                  {mode === "video" && (
                    <video
                      src={preview}
                      controls
                      className="w-full h-48 object-cover"
                    />
                  )}
                  {(mode === "record" || mode === "audio_upload") && (
                    <div className="p-4">
                      <audio src={preview} controls className="w-full" />
                    </div>
                  )}
                  <button
                    onClick={clearFile}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              )}

              <div className="rounded-2xl border border-border/60 bg-card p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold">{t("reportLocation") || "Report location"}</p>
                    <p className="truncate text-xs text-muted-foreground mt-0.5">
                      {formatLocationStatus(locationStatus, t, currentLanguageInfo?.code || "en")}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      setLocationMode("gps");
                      detectLocation();
                    }}
                    className={`rounded-xl px-4 py-3 text-sm font-bold cursor-pointer transition-all border ${
                      locationMode === "gps"
                        ? "bg-primary/25 text-primary border-primary/45 shadow-sm"
                        : "bg-muted hover:bg-muted/90 text-muted-foreground border-transparent"
                    }`}
                  >
                    {t("useGPS")}
                  </button>
                  <button
                    onClick={() => setLocationMode("manual")}
                    className={`rounded-xl px-4 py-3 text-sm font-bold cursor-pointer transition-all border ${
                      locationMode === "manual"
                        ? "bg-primary/25 text-primary border-primary/45 shadow-sm"
                        : "bg-muted hover:bg-muted/90 text-muted-foreground border-transparent"
                    }`}
                  >
                    {t("manual")}
                  </button>
                </div>

                {locationMode === "gps" && (
                  <p className="rounded-xl bg-muted/50 px-4 py-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {location
                      ? `${location.address}${location.accuracy ? `, +/-${Math.round(location.accuracy)}m` : ""}`
                      : "Waiting for browser location permission..."}
                  </p>
                )}

                {locationMode === "manual" && (
                  <div className="space-y-3">
                    <div className="relative">
                      <input
                        type="text"
                        value={manualAddress}
                        onChange={(e) => {
                          setManualAddress(e.target.value);
                          searchAddress(e.target.value);
                        }}
                        onFocus={() => addressSuggestions.length > 0 && setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        placeholder="Search address, landmark, or city..."
                        className="w-full rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm sm:text-base outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all placeholder:text-muted-foreground/60"
                      />
                      {showSuggestions && addressSuggestions.length > 0 && (
                        <div className="absolute left-0 right-0 top-full z-30 mt-1.5 max-h-48 overflow-y-auto rounded-xl border border-border bg-card shadow-lg">
                          {addressSuggestions.map((s) => (
                            <button
                              key={s.id}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setManualAddress(s.address);
                                setManualLat(String(s.location.lat));
                                setManualLng(String(s.location.lng));
                                setLocation({ lat: s.location.lat, lng: s.location.lng, address: s.address });
                                setLocationStatus(`Manual: ${s.name}`);
                                setShowSuggestions(false);
                                setAddressSuggestions([]);
                                setError(null);
                              }}
                              className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm hover:bg-primary/10 transition-colors cursor-pointer"
                            >
                              <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                              <span className="min-w-0 flex-1 truncate">{s.address}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="number"
                        value={manualLat}
                        onChange={(e) => setManualLat(e.target.value)}
                        placeholder="Latitude"
                        className="min-w-0 rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm sm:text-base outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all placeholder:text-muted-foreground/60"
                      />
                      <input
                        type="number"
                        value={manualLng}
                        onChange={(e) => setManualLng(e.target.value)}
                        placeholder="Longitude"
                        className="min-w-0 rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm sm:text-base outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all placeholder:text-muted-foreground/60"
                      />
                    </div>
                    <button
                      onClick={() => void geocodeManualLocation()}
                      className="w-full rounded-xl bg-primary/20 hover:bg-primary/30 px-4 py-3 text-xs sm:text-sm font-bold text-primary transition-all cursor-pointer border border-primary/20"
                    >
                      {t("findCoords")}
                    </button>
                  </div>
                )}
              </div>

              {error && (
                <p className="text-sm text-red-400 text-center font-medium">{error}</p>
              )}

              <button
                onClick={handleSubmit}
                disabled={mode === "text" && !textInput.trim() && !selectedFile}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-nagrik-blue text-primary-foreground font-bold text-base shadow-lg shadow-primary/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-40 cursor-pointer hover:brightness-110"
              >
                <Sparkles className="w-5 h-5" />
                {t("analyzeAI")}
              </button>
            </motion.div>
          )}

          {step === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center py-20"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "linear" as const,
                }}
                className="mb-4"
              >
                <Loader2 className="w-10 h-10 text-primary" />
              </motion.div>
              <h2 className="text-lg font-bold mb-1">{t("analyzingAI")}</h2>
              <p className="text-sm text-muted-foreground text-center">
                {t("understandingReport")}
              </p>
            </motion.div>
          )}

          {step === "review" && analysis && (
            <motion.div
              key="review"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-5"
            >
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="text-base font-bold">
                  AI Analysis Complete
                </span>
              </div>

              <div className="rounded-2xl bg-card border border-border/60 p-5 space-y-4 shadow-sm">
                <div>
                  <span className="text-xs font-bold text-muted-foreground">
                    Title
                  </span>
                  <p className="text-base font-bold mt-1 text-foreground/95">
                    {analysis.title}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-bold text-muted-foreground">
                    Category
                  </span>
                  <p className="text-base font-bold mt-1 text-primary">
                    {analysis.category.replace("_", " ")}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-bold text-muted-foreground">
                    Severity
                  </span>
                  <p
                    className={`text-base font-bold mt-1 capitalize ${
                      severityColor[analysis.severity] || "text-foreground"
                    }`}
                  >
                    {analysis.severity}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-bold text-muted-foreground">
                    Description
                  </span>
                  <p className="text-sm sm:text-base text-muted-foreground mt-1 leading-relaxed">
                    {analysis.description}
                  </p>
                </div>
                {analysis.root_cause && (
                  <div>
                    <span className="text-xs font-bold text-muted-foreground">
                      Likely Cause
                    </span>
                    <p className="text-sm sm:text-base mt-1 text-foreground/90 font-medium">
                      {analysis.root_cause}
                      {analysis.root_cause_confidence && (
                        <span className="text-muted-foreground font-normal">
                          {" "}
                          ({analysis.root_cause_confidence}% confidence)
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted/50 border border-border/30">
                <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
                <p className="text-sm font-semibold text-muted-foreground min-w-0 flex-1 truncate">
                  {locationMode === "manual"
                    ? manualAddress || location?.address || "Manual location pending"
                    : location?.address || "GPS location pending"}
                </p>
              </div>

              <button
                onClick={handleFinalSubmit}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-nagrik-blue text-primary-foreground font-bold text-base shadow-lg shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer hover:brightness-110 active:scale-[0.98] transition-all"
              >
                <Check className="w-5 h-5" />
                {t("submitReport")}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
