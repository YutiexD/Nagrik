import { textToSpeech } from "@/lib/sarvam";
import type { NextRequest } from "next/server";

/**
 * POST /api/sarvam/text-to-speech
 *
 * Accepts JSON:
 *   - text: the text to speak
 *   - language: app code (hi, bn, ta…)
 *   - speaker: optional voice name (defaults to "shubh")
 *
 * Returns { audioBase64 }
 */
export async function POST(request: NextRequest) {
  try {
    const { text, language, speaker } = await request.json();

    if (!text || !language) {
      return Response.json(
        { error: "text and language are required" },
        { status: 400 }
      );
    }

    const result = await textToSpeech(text, language, speaker || "shubh");
    return Response.json(result);
  } catch (error) {
    console.error("Sarvam TTS proxy error:", error);
    return Response.json(
      { error: "Text-to-speech failed" },
      { status: 500 }
    );
  }
}
