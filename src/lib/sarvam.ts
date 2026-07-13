/**
 * Sarvam AI — Server-side utility for Indian language speech & translation.
 *
 * Sarvam handles:
 *   • Speech-to-Text  (saaras:v3)
 *   • Text-to-Speech  (bulbul:v3)
 *   • Translation      (mayura:v1)
 *
 * Google Gemini remains the sole reasoning / analysis engine.
 */

const SARVAM_BASE = "https://api.sarvam.ai";

function getSarvamKey(): string {
  const key = process.env.SARVAM_API_KEY;
  if (!key) {
    throw new Error(
      "SARVAM_API_KEY is not set. Add it to .env.local (server-side only)."
    );
  }
  return key;
}

/**
 * Language code mapping for Sarvam's BCP-47 format.
 * Our app uses short codes (hi, bn, ta…) while Sarvam uses hi-IN, bn-IN etc.
 */
export const SARVAM_LANG_CODES: Record<string, string> = {
  hi: "hi-IN",
  bn: "bn-IN",
  te: "te-IN",
  mr: "mr-IN",
  ta: "ta-IN",
  gu: "gu-IN",
  kn: "kn-IN",
  ml: "ml-IN",
  pa: "pa-IN",
  or: "od-IN",
  ur: "ur-IN",
  as: "as-IN",
  ne: "ne-IN",
  kok: "kok-IN",
  ks: "ks-IN",
  sd: "sd-IN",
  sa: "sa-IN",
  sat: "sat-IN",
  mni: "mni-IN",
  brx: "brx-IN",
  mai: "mai-IN",
  doi: "doi-IN",
  en: "en-IN",
};

export function toSarvamLangCode(appCode: string): string {
  return SARVAM_LANG_CODES[appCode] || "unknown";
}

/* ------------------------------------------------------------------ */
/*  Speech-to-Text                                                     */
/* ------------------------------------------------------------------ */

export interface SttResult {
  transcript: string;
  language_code: string;
}

/**
 * Transcribe audio via Sarvam saaras:v3.
 * Accepts a File/Blob, returns the transcript in the original language.
 */
export async function speechToText(
  audioBlob: Blob,
  languageCode = "unknown"
): Promise<SttResult> {
  const formData = new FormData();
  formData.append("file", audioBlob, "audio.wav");
  formData.append("model", "saaras:v3");
  formData.append("language_code", languageCode);

  const res = await fetch(`${SARVAM_BASE}/speech-to-text`, {
    method: "POST",
    headers: {
      "api-subscription-key": getSarvamKey(),
    },
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Sarvam STT failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return {
    transcript: data.transcript,
    language_code: data.language_code || languageCode,
  };
}

/* ------------------------------------------------------------------ */
/*  Translation                                                        */
/* ------------------------------------------------------------------ */

export interface TranslateResult {
  translated_text: string;
}

/**
 * Translate text between Indian languages using Sarvam mayura:v1.
 */
export async function translateText(
  input: string,
  sourceLang: string,
  targetLang: string
): Promise<TranslateResult> {
  const res = await fetch(`${SARVAM_BASE}/translate`, {
    method: "POST",
    headers: {
      "api-subscription-key": getSarvamKey(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input,
      source_language_code: toSarvamLangCode(sourceLang),
      target_language_code: toSarvamLangCode(targetLang),
      model: "mayura:v1",
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Sarvam Translate failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return { translated_text: data.translated_text };
}

/* ------------------------------------------------------------------ */
/*  Text-to-Speech                                                     */
/* ------------------------------------------------------------------ */

export interface TtsResult {
  /** Base64-encoded WAV audio */
  audioBase64: string;
}

/**
 * Convert text to speech using Sarvam bulbul:v3.
 * Returns base64-encoded audio.
 */
export async function textToSpeech(
  text: string,
  targetLangCode: string,
  speaker = "shubh"
): Promise<TtsResult> {
  const res = await fetch(`${SARVAM_BASE}/text-to-speech`, {
    method: "POST",
    headers: {
      "api-subscription-key": getSarvamKey(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      target_language_code: toSarvamLangCode(targetLangCode),
      speaker,
      model: "bulbul:v3",
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Sarvam TTS failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return { audioBase64: data.audios?.[0] || "" };
}
