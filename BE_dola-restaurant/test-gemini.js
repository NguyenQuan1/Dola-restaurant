import { GoogleGenAI } from './node_modules/@google/genai/dist/index.js';
import * as dotenv from 'dotenv';

dotenv.config({ path: './.env' });

const apiKey = process.env.GEMINI_API_KEY;
console.log('API Key from .env:', apiKey ? apiKey.substring(0, 15) + '...' : 'NONE');

async function test() {
  try {
    const ai = new GoogleGenAI({ apiKey });
    console.log('Testing gemini-2.0-flash...');
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: 'Xin chào, bạn tên là gì?',
    });
    console.log('Gemini Response SUCCESS:');
    console.log(response.text);
  } catch (err) {
    console.error('Gemini Error:', err);
  }
}

test();
