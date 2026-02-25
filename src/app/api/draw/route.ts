import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, charId, provider = "volcengine", localKeys } = body; 

    const VOLC_API_KEY = localKeys?.volcengine || process.env.VOLC_API_KEY; 
    const OPENROUTER_API_KEY = localKeys?.openrouter || process.env.OPENROUTER_API_KEY;

    if (!prompt) throw new Error("Missing Prompt.");

    console.log(`🎨 [Draw Engine]: ${provider} | Target: ${charId}`);

    if (provider === "volcengine") {
      if (!VOLC_API_KEY) throw new Error("Missing VOLC_API_KEY");

      const VOLC_ENDPOINT_ID = process.env.VOLC_IMAGE_EP || "ep-xxxxxx"; 

      const res = await fetch("https://ark.cn-beijing.volces.com/api/v3/images/generations", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${VOLC_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: VOLC_ENDPOINT_ID,
          prompt: `Anime style, masterpiece, best quality. ${prompt}`,
          size: "1024x1024"
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(`Volcengine Error: ${JSON.stringify(data)}`);

      return NextResponse.json({
        success: true,
        image: data.data[0].url,
        meta: { charId, model: "doubao-seedream-5-0-260128" }
      });
    }

    else {
      if (!OPENROUTER_API_KEY) throw new Error("Missing OPENROUTER_API_KEY");

      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "google/gemini-3-pro-image-preview",
          messages: [{
            role: "user",
            content: `Generate an anime style image: masterpiece, best quality. ${prompt}`
          }]
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(`OpenRouter Error: ${JSON.stringify(data)}`);

      const rawText = data.choices[0].message.content;
      const urlMatch = rawText.match(/\!\[.*?\]\((.*?)\)/) || rawText.match(/https?:\/\/[^\s"'\)]+/);
      
      if (!urlMatch) throw new Error("Failed to extract image URL from response.");

      return NextResponse.json({
        success: true,
        image: urlMatch[1] || urlMatch[0],
        meta: { charId, model: "OpenRouter Gen" }
      });
    }

  } catch (error: any) {
    console.error("🔥 [Draw Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}