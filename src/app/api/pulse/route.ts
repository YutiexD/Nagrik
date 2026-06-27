import { getGeminiModel } from "@/lib/gemini";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { issues, lang = "English" } = await request.json();

    if (!issues || !Array.isArray(issues)) {
      return Response.json({ error: "Issues array is required" }, { status: 400 });
    }

    const model = getGeminiModel();

    const prompt = `You are Nagrik AI. Analyze these civic issues and generate a concise City Mood summary.
You MUST write all textual content (specifically: the "summary" sentences, the alert "title" and "description", and the insight "description") in BOTH English and in the requested local language: ${lang}.
Specifically, each of these text fields must be returned as an object containing an "en" key (for English) and a "local" key (for ${lang}).
Return ONLY valid JSON (no markdown fences):
{
  "summary": [
    { "en": "English summary line 1", "local": "Local language summary line 1" }
  ],
  "alerts": [
    {
      "title": { "en": "English alert title", "local": "Local language alert title" },
      "description": { "en": "English alert description", "local": "Local language alert description" },
      "severity": "critical or warning or info",
      "affected_population": estimated_number
    }
  ],
  "insights": [
    {
      "description": { "en": "English insight description", "local": "Local language insight description" },
      "confidence": number 1-100,
      "category": "road_damage|water|waste|lighting|drainage|noise|safety|other"
    }
  ],
  "pulse": {
    "overall": number 1-100,
    "categories": [
      { "id": "roads", "name": "Roads", "score": number, "icon": "🛣" },
      { "id": "water", "name": "Water", "score": number, "icon": "💧" },
      { "id": "waste", "name": "Waste", "score": number, "icon": "🗑" },
      { "id": "lighting", "name": "Lighting", "score": number, "icon": "💡" },
      { "id": "drainage", "name": "Drainage", "score": number, "icon": "🌊" },
      { "id": "safety", "name": "Safety", "score": number, "icon": "🛡" }
    ]
  }
}

Issues data:
${JSON.stringify(issues.slice(0, 50))}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    const cleaned = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const analysis = JSON.parse(cleaned);

    return Response.json(analysis);
  } catch (error) {
    console.error("Pulse analysis error:", error);
    return Response.json(
      { error: "Failed to generate pulse" },
      { status: 500 }
    );
  }
}
