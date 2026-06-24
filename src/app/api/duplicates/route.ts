import { getGeminiModel } from "@/lib/gemini";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { newReport, existingIssues } = await request.json();

    if (!newReport) {
      return Response.json({ error: "newReport is required" }, { status: 400 });
    }

    const model = getGeminiModel();

    const prompt = `You are Nagrik AI duplicate detection system.
Compare this new report against existing issues and determine if it's a duplicate.
Return ONLY valid JSON (no markdown fences):
{
  "is_duplicate": boolean,
  "matched_issue_id": "id or null",
  "confidence": number 1-100,
  "merged_title": "improved merged title if duplicate, or null",
  "reasoning": "brief explanation"
}

New report:
${JSON.stringify(newReport)}

Existing issues:
${JSON.stringify((existingIssues || []).slice(0, 30))}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    const cleaned = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const analysis = JSON.parse(cleaned);

    return Response.json(analysis);
  } catch (error) {
    console.error("Duplicate detection error:", error);
    return Response.json(
      { error: "Failed to check duplicates" },
      { status: 500 }
    );
  }
}
