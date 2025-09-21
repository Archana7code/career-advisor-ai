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
    const { resume } = req.body;
    if (!resume) {
      return res.status(400).json({ error: "Resume text is required." });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const systemInstruction = {
      parts: [
        {
          text: `
          You are a professional career counselor and resume expert.
          Analyze the given resume and respond ONLY in valid JSON (no markdown, no text).
          JSON structure must be:
          {
            "summary": "string",
            "strengths": ["string", ...],
            "weaknesses": ["string", ...],
            "tips": ["string", ...]
          }
        `,
        },
      ],
    };

    const generationConfig = {
      responseMimeType: "application/json",
    };

    const userPrompt = `Analyze the following resume:\n\n${resume}`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      systemInstruction,
      generationConfig,
    });

    // Try to extract the structured JSON response
    let responseText = "";
    if (
      result.response &&
      result.response.candidates?.[0]?.content?.parts?.[0]?.text
    ) {
      responseText = result.response.candidates[0].content.parts[0].text;
    } else {
      console.error("API Response Missing Required Fields:", result);
      return res
        .status(500)
        .json({ error: "Invalid response structure from AI model." });
    }

    let analysisData;
    try {
      analysisData = JSON.parse(responseText);
    } catch (err) {
      // fallback: extract JSON object from text
      const match = responseText.match(/{[\s\S]*}/);
      if (match) {
        analysisData = JSON.parse(match[0]);
      } else {
        throw new Error("AI response did not contain valid JSON.");
      }
    }

    return res.status(200).json(analysisData);
  } catch (error) {
    console.error("API Error:", error);
    return res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
}
