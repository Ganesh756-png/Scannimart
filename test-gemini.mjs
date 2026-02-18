import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = 'AIzaSyDmW2CAvBlKO80XPmLM8fzGMYSlSBHAf7E'; // Hardcoded for test, from .env.local

async function testGemini() {
    try {
        console.log("Initializing Gemini...");
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        console.log("Sending prompt...");
        const result = await model.generateContent("Hello, are you working?");
        const response = await result.response;
        const text = response.text();
        console.log("Response:", text);
    } catch (error) {
        console.error("Error:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    }
}

testGemini();
