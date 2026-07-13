import { speechToText, toSarvamLangCode } from "@/lib/sarvam";
import type { NextRequest } from "next/server";

/**
 * POST /api/sarvam/speech-to-text
 *
 * Accepts multipart/form-data with:
 *   - file: audio blob
 *   - language_code: optional app-level code (hi, bn, ta…)
 *
 * Returns { transcript, language_code }
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as Blob | null;
    const langCode = (formData.get("language_code") as string) || "unknown";

    if (!file) {
      return Response.json({ error: "No audio file provided" }, { status: 400 });
    }

    const sarvamLang = langCode === "unknown" ? "unknown" : toSarvamLangCode(langCode);
    const result = await speechToText(file, sarvamLang);

    return Response.json(result);
  } catch (error) {
    console.error("Sarvam STT proxy error:", error);
    return Response.json(
      { error: "Speech-to-text failed" },
      { status: 500 }
    );
  }
}
