import { getGeminiModel } from "@/lib/gemini";
import type { NextRequest } from "next/server";

type ReportPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, imageBase64, imageType, videoBase64, videoType, audioBase64, audioType } = body;

    const model = getGeminiModel();

    const systemPrompt = `You are Nagrik AI, an issue analysis engine for a civic platform.
Analyze the reported issue and respond ONLY with valid JSON (no markdown fences):
{
  "title": "short descriptive title",
  "category": "one of: road_damage, water, waste, lighting, drainage, noise, safety, other",
  "severity": "one of: low, medium, high, critical",
  "description": "2-3 sentence description of the issue and its impact",
  "priority_score": number between 1-100,
  "root_cause": "likely cause of this issue",
  "root_cause_confidence": number between 1-100
}`;

    const parts: ReportPart[] = [];

    parts.push({ text: systemPrompt });

    if (imageBase64 && imageType) {
      parts.push({
        inlineData: { mimeType: imageType, data: imageBase64 },
      });
      parts.push({ text: "Analyze this image of a civic issue." });
    }

    if (videoBase64 && videoType) {
      parts.push({
        inlineData: { mimeType: videoType, data: videoBase64 },
      });
      parts.push({ text: "Analyze this video of a civic issue." });
    }

    if (audioBase64 && audioType) {
      parts.push({
        inlineData: { mimeType: audioType, data: audioBase64 },
      });
      parts.push({ text: "Transcribe and analyze this voice report of a civic issue." });
    }

    if (text) {
      parts.push({ text: `User report: ${text}` });
    }

    if (!text && !imageBase64 && !videoBase64 && !audioBase64) {
      return Response.json({ error: "No input provided" }, { status: 400 });
    }

    const result = await model.generateContent(parts);
    const responseText = result.response.text();

    const cleaned = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const analysis = JSON.parse(cleaned);

    return Response.json(analysis);
  } catch (error) {
    console.error("Report analysis error:", error);
    return Response.json(
      { error: "Failed to analyze report" },
      { status: 500 }
    );
  }
}
