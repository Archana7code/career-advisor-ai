import { GoogleGenerativeAI } from "@google/generative-ai";

// Ensure GEMINI_API_KEY is set in Vercel environment variables
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  throw new Error("GEMINI_API_KEY is not set in environment variables.");
}

const genAI = new GoogleGenerativeAI(API_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { skill } = req.body;
    if (!skill) {
      return res.status(400).json({ error: "Skill is required." });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const systemInstruction = {
      parts: [
        {
          text: `
          You are a world-class career and skill development expert. 
          Generate a JSON roadmap for learning a given skill. 
          The JSON must have:
          {
            "roadmapTitle": "string",
            "steps": ["string", "string", ...]
          }
          Do not include anything except valid JSON.
          `,
        },
      ],
    };

    const generationConfig = {
      responseMimeType: "application/json",
    };

    const userPrompt = `Generate a learning roadmap for the skill: ${skill}`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      systemInstruction,
      generationConfig,
    });

    // Safely grab the model's text output
    const responseText =
      result.response?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      console.error("API Response Missing Required Fields:", result);
      return res
        .status(500)
        .json({ error: "Invalid response from AI model." });
    }

    // Parse the JSON string inside .text
    let roadmapData;
    try {
      roadmapData = JSON.parse(responseText);
    } catch (err) {
      // fallback: try regex extraction if extra text slipped in
      const match = responseText.match(/{[\s\S]*}/);
      if (match) {
        roadmapData = JSON.parse(match[0]);
      } else {
        throw new Error("AI response did not contain valid JSON.");
      }
    }

    return res.status(200).json(roadmapData);
  } catch (error) {
    console.error("API Error:", error);
    return res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
}
