const env = require('../utils/config');
/** Gemini REST integration. Keep the API key server-side; never expose it to browser JS. */
async function askGemini(prompt, { system = 'You are Killora Bot AI, a helpful assistant for Discord communities. Be concise, safe, and do not claim to perform actions you cannot perform.' } = {}) {
  if (!env.GEMINI_API_KEY) throw new Error('Gemini is not configured. Add GEMINI_API_KEY to .env.');
  const model = env.GEMINI_MODEL || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`;
  const response = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ systemInstruction:{parts:[{text:system}]}, contents:[{role:'user',parts:[{text:String(prompt).slice(0,12000)}]}], generationConfig:{temperature:0.7,maxOutputTokens:900} }) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || `Gemini API returned HTTP ${response.status}`);
  return (data.candidates?.[0]?.content?.parts || []).map(p=>p.text||'').join('').trim() || 'I could not generate a response.';
}
module.exports = { askGemini };
