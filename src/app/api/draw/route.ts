// src/app/api/draw/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, charId, provider = "volcengine", localKeys } = body; 

    if (!prompt) throw new Error("Missing Prompt.");

    console.log(`🎨 [Draw Engine]: ${provider} | Target: ${charId}`);

    if (provider === "volcengine") {
      const VOLC_API_KEY = localKeys?.volcengine?.trim() || process.env.VOLC_API_KEY;
      const VOLC_ENDPOINT_ID = localKeys?.volc_ep_image?.trim() || process.env.VOLC_IMAGE_EP;
      
      if (!VOLC_API_KEY) throw new Error("Missing Volcengine API Key");
      if (!VOLC_ENDPOINT_ID) throw new Error("Missing Volcengine Endpoint ID (ep-xxx). 请在金库中配置接入点 ID。");

      const res = await fetch("https://ark.cn-beijing.volces.com/api/v3/images/generations", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${VOLC_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: VOLC_ENDPOINT_ID,
          prompt: `Anime style, masterpiece, best quality. ${prompt}`,
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(`Volcengine Error: ${JSON.stringify(data)}`);
      
      const imageUrl = data.data?.[0]?.url || `data:image/jpeg;base64,${data.data?.[0]?.b64_json}`;

      return NextResponse.json({
        success: true,
        image: imageUrl,
        meta: { charId, model: "Volcengine" }
      });
    }

    else {
      const OPENROUTER_API_KEY = localKeys?.openrouter?.trim() || process.env.OPENROUTER_API_KEY;
      if (!OPENROUTER_API_KEY) throw new Error("Missing OPENROUTER_API_KEY");

      console.log(`🍌 [Banana Relay] Attempting Gemini 3 Pro (Artistic Base)...`);

      const REAL_BANANA_ID = "google/gemini-3-pro-image-preview";

      const naturalPrompt = `
[Task]: Generate a HIGH QUALITY anime illustration base composition.
[Action/Pose]: ${prompt}
[Style]: BanG Dream! official anime screencap, masterpiece, studio quality lighting.
[Strict Rule]: OUTPUT IMAGE ONLY. NO TEXT.
`.trim();

      const messageContent = [{ type: "text", text: naturalPrompt }];

      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
              "HTTP-Referer": "https://mutsu.cloud",
              "X-Title": "Mutsu Studio",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: REAL_BANANA_ID,
              messages: [{ role: "user", content: messageContent }],
            }),
      });

      const rawText = await res.text();

      if (!res.ok) throw new Error(`OpenRouter Error: ${rawText.slice(0, 200)}`);

      let extractedUrlOrBase64 = null;
      const b64Match = rawText.match(/data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)/);
      const mdMatch = rawText.match(/\!\[.*?\]\((.*?)\)/);
      const urlMatch = rawText.match(/https?:\/\/[^\s"'\)]+/);

      if (b64Match) extractedUrlOrBase64 = b64Match[0];
      else if (mdMatch) extractedUrlOrBase64 = mdMatch[1];
      else if (urlMatch && !urlMatch[0].includes("openrouter.ai/api")) extractedUrlOrBase64 = urlMatch[0];

      if (!extractedUrlOrBase64) {
          throw new Error(`Gemini refused to draw or output format is unknown. Response: ${rawText.slice(0, 100)}...`);
      }

      console.log(`🍌 Banana Step Complete. Extracted URL/Base64.`);

      return NextResponse.json({
        success: true,
        image: extractedUrlOrBase64,
        meta: { charId, model: "Banana/OpenRouter" }
      });
    }

  } catch (error: any) {
    console.error("🔥 [Draw Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}