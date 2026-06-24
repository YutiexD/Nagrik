import { GoogleGenerativeAI } from "@google/generative-ai";

function getGemini() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to .env.local (server-side only)."
    );
  }
  return new GoogleGenerativeAI(key);
}

export function getGeminiModel(model = "gemini-2.5-flash") {
  return getGemini().getGenerativeModel({ model });
}
