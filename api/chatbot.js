import { GoogleGenerativeAI } from "@google/generative-ai";

// Ensure the API key is set in Vercel's environment variables.
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
    throw new Error("GEMINI_API_KEY is not set in environment variables.");
}

// Access your API key as an environment variable.
const genAI = new GoogleGenerativeAI(API_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { prompt } = req.body;
        
        // Define the model you want to use
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Generate content based on the user's prompt
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.status(200).json({ response: text });
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
