const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;
console.log('API Key:', apiKey);

async function run() {
  try {
    const ai = new GoogleGenAI({ apiKey });
    console.log('Testing gemini-2.0-flash with new prompt...');
    const res = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: 'Giờ mở cửa của nhà hàng Dola là mấy giờ?',
    });
    console.log('SUCCESS Response:', res.text);
  } catch (err) {
    console.error('ERROR Details:', err?.message || err);
  }
}

run();
