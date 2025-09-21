import { GoogleGenerativeAI } from "@google/generative-ai";

// Ensure GEMINI_API_KEY is set in Vercel environment variables.
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    throw new Error("GEMINI_API_KEY is not set in environment variables.");
}

const genAI = new GoogleGenerativeAI(API_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { userProfile } = req.body;
        
        if (!userProfile) {
            return res.status(400).json({ error: 'userProfile is required' });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const promptText = `Generate a single, concise daily challenge for a job seeker. The challenge should be actionable and simple to complete in one day, and it should be relevant to the following user profile: "${userProfile}". Your response should only be the challenge text itself, nothing else.`;

        const result = await model.generateContent(promptText);
        const challenge = result.response.text();
        
        res.status(200).json({ challenge });

    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}