// Quick Gemini API connectivity test
// Run with: node test-gemini.js

import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

console.log("GEMINI_API_KEY loaded:", process.env.GEMINI_API_KEY ? `${process.env.GEMINI_API_KEY.slice(0, 8)}...` : "MISSING");
console.log("GEMINI_MODEL:", process.env.GEMINI_MODEL);

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

try {
    const response = await genai.models.generateContent({
        model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
        contents: "Reply with exactly: OK",
        config: {
            systemInstruction: "You are a test assistant."
        }
    });

    console.log("✅ Gemini API working! Response:", response.text);
} catch (err) {
    console.error("❌ Gemini API error:");
    console.error("  Name:", err.name);
    console.error("  Message:", err.message);
    console.error("  Status:", err.status);
    console.error("  Response:", JSON.stringify(err.response?.data ?? err.response, null, 2));
    console.error("  Stack:", err.stack);
}
