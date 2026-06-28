import { getGeminiModel } from "@/lib/gemini";
import type { NextRequest } from "next/server";

// Helper to retry calls to Gemini API with exponential backoff
async function generateWithRetry(model: any, prompt: string, retries = 3, delayMs = 500): Promise<any> {
  let lastError: any;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      return result;
    } catch (err: any) {
      lastError = err;
      console.warn(`Gemini API attempt ${attempt} failed:`, err.message || err);
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * Math.pow(2, attempt - 1)));
      }
    }
  }
  throw lastError;
}

// Fallback function to generate dynamic pulse analysis when Gemini is unavailable
function generateLocalFallback(issues: any[], lang: string) {
  const categoryMap: Record<string, { count: number; resolvedCount: number }> = {
    roads: { count: 0, resolvedCount: 0 },
    water: { count: 0, resolvedCount: 0 },
    waste: { count: 0, resolvedCount: 0 },
    lighting: { count: 0, resolvedCount: 0 },
    drainage: { count: 0, resolvedCount: 0 },
    safety: { count: 0, resolvedCount: 0 },
  };

  issues.forEach((issue) => {
    let cat = issue.category;
    if (cat === "road_damage") cat = "roads";
    if (categoryMap[cat]) {
      categoryMap[cat].count++;
      if (issue.status === "resolved") {
        categoryMap[cat].resolvedCount++;
      }
    }
  });

  const categories = [
    { id: "roads", name: "Roads", icon: "🛣", defaultScore: 85 },
    { id: "water", name: "Water", icon: "💧", defaultScore: 72 },
    { id: "waste", name: "Waste", icon: "🗑", defaultScore: 78 },
    { id: "lighting", name: "Lighting", icon: "💡", defaultScore: 80 },
    { id: "drainage", name: "Drainage", icon: "🌊", defaultScore: 75 },
    { id: "safety", name: "Safety", icon: "🛡", defaultScore: 88 },
  ].map((cat) => {
    const stats = categoryMap[cat.id];
    let score = cat.defaultScore;
    if (stats && stats.count > 0) {
      const penalty = Math.min(40, stats.count * 8 - stats.resolvedCount * 12);
      score = Math.max(10, Math.min(100, cat.defaultScore - penalty));
    }
    return { id: cat.id, name: cat.name, score, icon: cat.icon };
  });

  const overall = Math.round(categories.reduce((acc, c) => acc + c.score, 0) / categories.length);

  const activeIssues = issues.filter(i => i.status !== "resolved");
  const criticalIssues = activeIssues.filter(i => i.severity === "critical" || i.severity === "high");

  const alerts: any[] = [];
  if (criticalIssues.length > 0) {
    criticalIssues.slice(0, 2).forEach((issue) => {
      const issueCat = issue.category === "road_damage" ? "roads" : issue.category;
      alerts.push({
        title: {
          en: `Critical ${issueCat || "Civic"} Alert: ${issue.title}`,
          local: `गंभीर ${issueCat || "नागरिक"} चेतावनी: ${issue.title}`
        },
        description: {
          en: `High priority issue reported at ${issue.address || "nearby area"} affecting around ${issue.affected_citizens || 10} citizens.`,
          local: `${issue.address || "आसपास के क्षेत्र"} में उच्च प्राथमिकता वाली समस्या दर्ज की गई है जिससे लगभग ${issue.affected_citizens || 10} नागरिक प्रभावित हैं।`
        },
        severity: "critical",
        affected_population: issue.affected_citizens || 25
      });
    });
  } else {
    alerts.push({
      title: {
        en: "Active Community Vigilance",
        local: "सक्रिय सामुदायिक सतर्कता"
      },
      description: {
        en: "Regular civic monitoring is active. No major new critical incidents reported in the last 24 hours.",
        local: "नियमित नागरिक निगरानी सक्रिय है। पिछले 24 घंटों में कोई बड़ी नई गंभीर घटना सामने नहीं आई है।"
      },
      severity: "info",
      affected_population: 0
    });
  }

  const insights = [
    {
      description: {
        en: `Road and transport safety currently has the highest stability rating at ${categories.find(c => c.id === 'roads')?.score || 85}%.`,
        local: `सड़क और परिवहन सुरक्षा वर्तमान में ${categories.find(c => c.id === 'roads')?.score || 85}% पर उच्चतम स्थिरता रेटिंग रखती है।`
      },
      confidence: 90,
      category: "road_damage"
    },
    {
      description: {
        en: "Waste management reports are showing a steady clearance pattern across the sectors.",
        local: "कचरा प्रबंधन रिपोर्टों में सभी क्षेत्रों में लगातार सफाई का पैटर्न दिख रहा है।"
      },
      confidence: 85,
      category: "waste"
    }
  ];

  const summary = [
    {
      en: `Overall community pulse index stands at ${overall}%.`,
      local: `कुल सामुदायिक पल्स सूचकांक ${overall}% पर है।`
    },
    {
      en: `Active tracking of ${activeIssues.length} civic reports is currently in progress.`,
      local: `वर्तमान में ${activeIssues.length} नागरिक रिपोर्टों की सक्रिय ट्रैकिंग चल रही है।`
    }
  ];

  return {
    summary,
    alerts,
    insights,
    pulse: {
      overall,
      categories
    }
  };
}

export async function POST(request: NextRequest) {
  try {
    const { issues, lang = "English" } = await request.json();

    if (!issues || !Array.isArray(issues)) {
      return Response.json({ error: "Issues array is required" }, { status: 400 });
    }

    try {
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

      const result = await generateWithRetry(model, prompt, 3, 500);
      const responseText = result.response.text();

      const cleaned = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const analysis = JSON.parse(cleaned);

      return Response.json(analysis);
    } catch (apiError) {
      console.warn("Gemini API failed or timed out. Falling back to dynamic local pulse analysis:", apiError);
      const fallbackAnalysis = generateLocalFallback(issues, lang);
      return Response.json(fallbackAnalysis);
    }
  } catch (error) {
    console.error("Pulse API handler error:", error);
    return Response.json(
      { error: "Failed to generate pulse" },
      { status: 500 }
    );
  }
}
