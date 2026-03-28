import { GoogleGenerativeAI } from "@google/generative-ai";

let modelInstance = null;
const getModel = () => {
    if (!modelInstance) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("GEMINI_API_KEY is not defined in the environment.");

        const genAI = new GoogleGenerativeAI(apiKey);
        modelInstance = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: "You are a professional agricultural assistant. You only answer questions about farming, plants, pests, and gardening. If the user asks about anything else, politely decline and steer them back to agriculture.",
        });
    }
    return modelInstance;
};

// @desc    Ask a question to the AgriBot
// @route   POST /api/bot/ask-agribot
// @access  Private
export const askAgriBot = async (req, res) => {
    try {
        const { prompt, history } = req.body;

        if (!prompt) {
            return res.status(400).json({ message: 'Prompt is required' });
        }

        // Initialize chat session using the passed history array
        // It expects history elements structured like { role: "user" | "model", parts: [{ text: "..." }] }
        const chat = getModel().startChat({
            history: history || [],
        });

        const result = await chat.sendMessage(prompt);
        const responseText = result.response.text();

        res.json({ text: responseText });
    } catch (error) {
        console.error('Error in askAgriBot:', error);
        res.status(500).json({ message: 'AI processing failed, please try again.', details: error.message });
    }
};
