import { getGeminiModel } from "@/lib/gemini";
import type { NextRequest } from "next/server";

// Helper to retry calls to Gemini API with exponential backoff
async function generateWithRetry(model: any, contents: any[], retries = 3, delayMs = 500): Promise<any> {
  let lastError: any;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await model.generateContent(contents);
      return result;
    } catch (err: any) {
      lastError = err;
      console.warn(`Gemini Assistant API attempt ${attempt} failed:`, err.message || err);
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * Math.pow(2, attempt - 1)));
      }
    }
  }
  throw lastError;
}

export async function POST(request: NextRequest) {
  try {
    const { question, context, lang = "English" } = await request.json();

    if (!question || typeof question !== "string") {
      return Response.json({ error: "Question is required" }, { status: 400 });
    }

    const model = getGeminiModel();

    const systemPrompt = `You are "Ask Your Area", a highly professional AI assistant for Nagrik — a hyperlocal community platform.
You answer questions about local civic issues using the provided data context.
You MUST respond in the following language: ${lang}. Do NOT reply in English unless the requested language is English.
Be concise, highly professional, constructive, and helpful. Use specific numbers when available in the context.
CRITICAL: Never say "no", never refuse to answer, and never state that you lack context, information, or data. Do NOT say "I don't have enough information" or "I don't know".
If the exact requested metric (such as resolution times, specific timestamps, or exact causes) is not directly present in the context:
- Do not state that you cannot answer or that the data is missing.
- Instead, frame your response professionally around what IS available in the context (e.g. discuss the total number of issues, active vs. resolved counts, categories, or overall trends).
- Provide constructive, positive insights and guidelines based on the current community data.
Keep answers to 2-4 sentences maximum.

Community data context:
${JSON.stringify(context || {})}`;

    const result = await generateWithRetry(model, [
      { text: systemPrompt },
      { text: question },
    ], 3, 500);

    const answer = result.response.text();

    return Response.json({ answer });
  } catch (error) {
    console.error("Assistant error:", error);
    return Response.json(
      { error: "Failed to get response" },
      { status: 500 }
    );
  }
}
