// src/app/api/video/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, provider = "fal", localKeys } = body; 

    if (!prompt) throw new Error("Missing Prompt.");

    console.log(`🎥 [Video Engine]: ${provider} | Ready for Action`);

    const FAL_KEY = localKeys?.fal?.trim() || process.env.FAL_KEY;
    const VOLC_API_KEY = localKeys?.volcengine?.trim() || process.env.VOLC_API_KEY;

    // ==========================================
    // 🌊 方案 A：Fal.ai
    // ==========================================
    if (provider === "fal") {
      if (!FAL_KEY) throw new Error("Missing Fal.ai API Key. 请在金库中配置。");

      const res = await fetch(`https://queue.fal.run/fal-ai/minimax/hailuo-02/standard/text-to-video`, {
        method: "POST", 
        headers: { 
          "Authorization": `Key ${FAL_KEY}`, 
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({
          prompt: `Anime style, highly detailed, smooth motion. ${prompt}`,
          aspect_ratio: "16:9"
        })
      });

      if (!res.ok) throw new Error(`Fal.ai Error: ${await res.text()}`);
      const data = await res.json();

      return NextResponse.json({
        success: true, 
        status: 'queued', 
        taskId: data.request_id,
        statusUrl: data.status_url, 
        responseUrl: data.response_url, 
        provider: 'fal'
      });
    }

    // ==========================================
    // 🌋 方案 B：火山引擎 (Seedance 1.5 Pro)
    // ==========================================
    else if (provider === "volcengine") {
      if (!VOLC_API_KEY) throw new Error("Missing Volcengine API Key. 请在金库中配置。");
      
      const VOLC_MODEL_ID = localKeys?.volc_ep?.trim() || "doubao-seedance-1-5-pro-251215"; 

      const res = await fetch("https://ark.cn-beijing.volces.com/api/v3/videos/generations", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${VOLC_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: VOLC_MODEL_ID,
          prompt: `Anime style, smooth animation, high quality. ${prompt}`
        })
      });

      if (!res.ok) throw new Error(`Volcengine Video Error: ${await res.text()}`);
      const data = await res.json();

      return NextResponse.json({
        success: true, 
        status: 'queued', 
        taskId: data.data?.task_id || data.task_id, 
        provider: 'volcengine'
      });
    }

    throw new Error("Unknown Video Provider");

  } catch (error: any) {
    console.error("🔥 [Video Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const statusUrl = searchParams.get('statusUrl');
    const responseUrl = searchParams.get('responseUrl');
    
    const userFalKey = req.headers.get("X-Fal-Key");
    const FINAL_FAL_KEY = userFalKey?.trim() || process.env.FAL_KEY;

    if (!statusUrl) return NextResponse.json({ error: "No Status URL provided" }, { status: 400 });
    if (!FINAL_FAL_KEY) return NextResponse.json({ error: "Missing Fal API Key for polling" }, { status: 401 });

    try {
        const res = await fetch(statusUrl, {
            headers: { "Authorization": `Key ${FINAL_FAL_KEY}` }
        });
        
        if (!res.ok) throw new Error(`Status Fetch Error: ${await res.text()}`);

        const data = await res.json();
        let status = 'processing';
        let videoUrl = null;

        if (data.status === 'COMPLETED') {
            status = 'succeeded';
            if (responseUrl) {
                const resultRes = await fetch(responseUrl, {
                     headers: { "Authorization": `Key ${FINAL_FAL_KEY}` }
                });
                const resultData = await resultRes.json();
                videoUrl = resultData.video?.url || resultData.url; 
            }
        } else if (data.status === 'FAILED') {
            status = 'failed';
        }

        return NextResponse.json({ status, output: { url: videoUrl } });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}