import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

const apiKey = 'AIzaSyDmW2CAvBlKO80XPmLM8fzGMYSlSBHAf7E';

async function listModels() {
    try {
        console.log("Fetching models...");
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        if (data.models) {
            const modelNames = data.models.map(m => m.name).join('\n');
            fs.writeFileSync('models.txt', modelNames);
            console.log("Models saved to models.txt");
        } else {
            console.log("No models found:", JSON.stringify(data, null, 2));
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

listModels();
