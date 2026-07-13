import { translateText } from "@/lib/sarvam";
import type { NextRequest } from "next/server";

/**
 * POST /api/sarvam/translate
 *
 * Accepts JSON:
 *   - input: text to translate
 *   - source_language: app code (hi, en, bn…)
 *   - target_language: app code (hi, en, bn…)
 *
 * Returns { translated_text }
 */
export async function POST(request: NextRequest) {
  try {
    const { input, source_language, target_language } = await request.json();

    if (!input || !source_language || !target_language) {
      return Response.json(
        { error: "input, source_language, and target_language are required" },
        { status: 400 }
      );
    }

    const result = await translateText(input, source_language, target_language);
    return Response.json(result);
  } catch (error) {
    console.error("Sarvam Translate proxy error:", error);
    return Response.json(
      { error: "Translation failed" },
      { status: 500 }
    );
  }
}
