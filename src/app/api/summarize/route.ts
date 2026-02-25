// src/app/api/summarize/route.ts
import { OpenAI } from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const { text, previousLtm, mode, localKeys } = await req.json();
    
    if (!text) return new Response(JSON.stringify({ error: "No text provided" }), { status: 400 });

    const DS_KEY = localKeys?.deepseek?.trim();
    const OR_KEY = localKeys?.openrouter?.trim();
    const GOOGLE_KEY = localKeys?.google?.trim();
    const VOLC_KEY = localKeys?.volcengine?.trim();
    const VOLC_EP = localKeys?.volc_ep_chat?.trim();

    let summary = "";

    if (DS_KEY) {
        console.log("📜 Summarizer: Using DeepSeek Official");
        const client = new OpenAI({ apiKey: DS_KEY, baseURL: "https://api.deepseek.com" });
        const response = await client.chat.completions.create({
            model: "deepseek-chat",
            messages: buildPrompt(mode, text, previousLtm) as any, 
            temperature: 0.3, max_tokens: 500
        });
        summary = response.choices[0]?.message?.content || "";
    }
    
    else if (OR_KEY) {
        console.log("📜 Summarizer: Using OpenRouter");
        const client = new OpenAI({ 
            apiKey: OR_KEY, 
            baseURL: "https://openrouter.ai/api/v1",
            defaultHeaders: { "HTTP-Referer": "https://mutsu.cloud", "X-Title": "Mutsu Summarizer" }
        });
        const response = await client.chat.completions.create({
            model: "deepseek/deepseek-v3.2",
            messages: buildPrompt(mode, text, previousLtm) as any, 
            temperature: 0.3, max_tokens: 500
        });
        summary = response.choices[0]?.message?.content || "";
    }

    else if (GOOGLE_KEY) {
        console.log("📜 Summarizer: Using Google Gemini");
        const genAI = new GoogleGenerativeAI(GOOGLE_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); 
        
        const prompts = buildPrompt(mode, text, previousLtm);
        const fullText = `${prompts[0].content}\n\n${prompts[1].content}`;
        
        const result = await model.generateContent(fullText);
        summary = result.response.text();
    }

    else if (VOLC_KEY && VOLC_EP) {
        console.log("📜 Summarizer: Using Volcengine (Doubao)");
        const client = new OpenAI({ apiKey: VOLC_KEY, baseURL: "https://ark.cn-beijing.volces.com/api/v3" });
        const response = await client.chat.completions.create({
            model: VOLC_EP,
            messages: buildPrompt(mode, text, previousLtm) as any, 
            temperature: 0.3, max_tokens: 500
        });
        summary = response.choices[0]?.message?.content || "";
    }

    else {
        console.warn("📜 Summarizer: No keys found. Skipping summary.");
        return new Response(JSON.stringify({ summary: null, error: "No API Keys available for summary" }), { status: 200 });
    }

    return new Response(JSON.stringify({ summary }), { status: 200 });

  } catch (error: any) {
    console.error("Summarize Error:", error);
    return new Response(JSON.stringify({ error: error.message, summary: null }), { status: 200 });
  }
}

function buildPrompt(mode: string, text: string, previousLtm: string) {
    let system = "";
    let user = "";

    if (mode === 'novel_chapter') {
        system = `You are a 'Novel Plot Recorder'. Summarize the EVENTS of the chapter into 1-3 concise sentences. Focus on WHAT happened. Output language: Same as text (Chinese).`;
        user = `[Chapter Content]:\n${text}`;
    } else if (mode === 'micro') {
        system = `You are a 'Micro-Memory Encoder'. Compress the dialogue into a SINGLE, concise, 3rd-person sentence. Ignore pleasantries. Output language: Same as text (Chinese).`;
        user = `[Dialogue]:\n${text}`;
    } else { 
        system = `You are a 'Long-Term Memory Engine'. Merge "Recent Memory" into "Long-Term Memory". Keep it organized (bullet points). Output language: Chinese.`;
        user = `[Previous LTM]:\n${previousLtm || "None"}\n\n[Recent STM]:\n${text}\n\nGenerate updated LTM:`;
    }

    return [
        { role: "system", content: system },
        { role: "user", content: user }
    ];
}