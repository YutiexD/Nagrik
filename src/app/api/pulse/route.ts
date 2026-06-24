import { getGeminiModel } from "@/lib/gemini";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { issues } = await request.json();

    if (!issues || !Array.isArray(issues)) {
      return Response.json({ error: "Issues array is required" }, { status: 400 });
    }

    const model = getGeminiModel();

    const prompt = `You are Nagrik AI. Analyze these civic issues and generate a concise City Mood summary.
Return ONLY valid JSON (no markdown fences):
{
  "summary": ["line 1", "line 2", "line 3", "line 4"],
  "alerts": [
    {
      "title": "alert title",
      "description": "what's happening",
      "severity": "critical or warning or info",
      "affected_population": estimated_number
    }
  ],
  "insights": [
    {
      "description": "predictive insight",
      "confidence": number 1-100,
      "category": "road_damage|water|waste|lighting|drainage|noise|safety|other"
    }
  ],
  "pulse": {
    "overall": number 1-100,
    "categories": [
      { "name": "Roads", "score": number, "icon": "🛣" },
      { "name": "Water", "score": number, "icon": "💧" },
      { "name": "Waste", "score": number, "icon": "🗑" },
      { "name": "Lighting", "score": number, "icon": "💡" },
      { "name": "Drainage", "score": number, "icon": "🌊" },
      { "name": "Safety", "score": number, "icon": "🛡" }
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
