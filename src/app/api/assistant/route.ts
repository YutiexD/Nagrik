import { getGeminiModel } from "@/lib/gemini";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { question, context } = await request.json();

    if (!question || typeof question !== "string") {
      return Response.json({ error: "Question is required" }, { status: 400 });
    }

    const model = getGeminiModel();

    const systemPrompt = `You are "Ask Your Area", an AI assistant for Nagrik — a hyperlocal community platform.
You answer questions about local civic issues using the provided data context.
Be concise, data-driven, and helpful. Use specific numbers when available.
Do NOT make up data. If you don't have enough context, say so.
Keep answers to 2-4 sentences maximum.

Community data context:
${JSON.stringify(context || {})}`;

    const result = await model.generateContent([
      { text: systemPrompt },
      { text: question },
    ]);

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
