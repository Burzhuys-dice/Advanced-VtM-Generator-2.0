const { GoogleGenAI } = require("@google/genai"); 
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
console.log(process.env.GEMINI_API_KEY ? "key present" : "key missing");
