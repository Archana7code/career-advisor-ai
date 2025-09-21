import { GoogleGenerativeAI } from "@google/generative-ai"; 

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
        // We now deconstruct 'action' from the request body
        const { jobRole, history, action } = req.body; 

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); 
        const chat = model.startChat({ history }); 

        let promptText; 
        let finalResponse = {}; // Use a generic object to hold the response

        // Use a switch statement or if/else if to handle different actions
        if (action === 'start') { 
            promptText = `Start a mock interview for a ${jobRole} role. Your first message should be a friendly greeting and the first interview question. Do not provide feedback on answers unless requested by the user. Keep your questions professional and realistic.`; 
            const result = await chat.sendMessage(promptText); 
            const responseText = result.response.text(); 
            finalResponse = { message: responseText }; 

        } else if (action === 'continue') { 
            promptText = `You are a professional interviewer for a ${jobRole} role. The user has just responded. Your turn. Ask the next question, or provide concise feedback if the user's last message explicitly asks for it. Your response should only contain your part of the conversation.`; 
            const result = await chat.sendMessage(promptText); 
            const responseText = result.response.text(); 
            finalResponse = { message: responseText }; 

        } else if (action === 'end') { 
            // New logic to handle the 'end' action
            const feedbackPrompt = `Based on the entire interview history, provide a structured feedback report for a ${jobRole} candidate. Respond with a JSON object containing the following keys:
            - "score": A score from 1-10 on their performance.
            - "strengths": A summary of their strengths as a single string.
            - "improvements": A summary of their areas for improvement as a single string.
            - "overall": An overall summary of their performance as a single string.
            
            Do not include any text outside of the JSON object.`;

            const result = await chat.sendMessage(feedbackPrompt);
            const responseText = result.response.text();

            // Attempt to parse the JSON from the AI's response
            try {
                // We use a regex to find the JSON object within the text, in case the AI adds extra words.
                const jsonMatch = responseText.match(/{[\s\S]*}/);
                if (jsonMatch && jsonMatch[0]) {
                    finalResponse = JSON.parse(jsonMatch[0]);
                } else {
                    console.error('Failed to parse JSON response for feedback:', responseText);
                    return res.status(500).json({ error: 'Failed to generate a valid feedback report.' });
                }
            } catch (jsonError) {
                console.error('JSON parsing error:', jsonError);
                return res.status(500).json({ error: 'Failed to parse feedback from AI.' });
            }
        }

        res.status(200).json(finalResponse);

    } catch (error) { 
        console.error('API Error:', error); 
        res.status(500).json({ error: 'Internal Server Error', details: error.message }); 
    } 
}