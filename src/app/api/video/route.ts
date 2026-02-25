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
      const VOLC_API_KEY = localKeys?.volcengine?.trim() || process.env.VOLC_API_KEY;
      const VOLC_MODEL_ID = localKeys?.volc_ep_video?.trim() || "doubao-seedance-1-5-pro-251215";
      
      if (!VOLC_API_KEY) throw new Error("Missing Volcengine API Key.");

      console.log(`🌋 [Volc Video] Target EP: ${VOLC_MODEL_ID}`);

      const arkUrl = "https://ark.cn-beijing.volces.com/api/v3/videos/generations";
      
      const payload = {
          model: VOLC_MODEL_ID,
          prompt: `Anime style, high quality. ${prompt}`,
          stream: false
      };

      const res = await fetch(arkUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${VOLC_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
          const errText = await res.text();
          console.error(`🔥 Volc Status: ${res.status}`);
          console.error(`🔥 Volc Response: ${errText}`);
          
          if (res.status === 404) {
              throw new Error("Volcengine Endpoint Not Found (404). 请检查：1. 接入点是否‘运行中’？ 2. 账号是否开通了 Seedance 权限？ 3. 地域是否正确 (默认北京)?");
          }
          throw new Error(`Volcengine Video Error (${res.status}): ${errText}`);
      }

      const data = await res.json();
      
      const taskId = data.id || data.data?.id;

      if (!taskId) {
          console.error("🔥 Volc Response Data:", data);
          throw new Error("Failed to retrieve Task ID from Volcengine.");
      }

      return NextResponse.json({
        success: true, 
        status: 'queued', 
        taskId: taskId,
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
    const provider = searchParams.get('provider'); 
    
    const statusUrl = searchParams.get('statusUrl');
    const responseUrl = searchParams.get('responseUrl');
    
    const userFalKey = req.headers.get("X-Fal-Key");
    const FINAL_FAL_KEY = userFalKey?.trim() || process.env.FAL_KEY;

    if (!statusUrl) return NextResponse.json({ error: "No Status URL provided" }, { status: 400 });
    if (!FINAL_FAL_KEY) return NextResponse.json({ error: "Missing Fal API Key for polling" }, { status: 401 });

    

    try {
        // ==========================
        // 🌋 火山引擎轮询逻辑
        // ==========================
        if (provider === 'volcengine') {
            const taskId = searchParams.get('taskId');
            const userVolcKey = req.headers.get("X-Volc-Key");
            const FINAL_VOLC_KEY = userVolcKey?.trim() || process.env.VOLC_API_KEY;

            if (!taskId || !FINAL_VOLC_KEY) return NextResponse.json({ error: "Missing TaskID or Key" }, { status: 400 });

            const checkUrl = `https://ark.cn-beijing.volces.com/api/v3/videos/generations/${taskId}`;

            const res = await fetch(checkUrl, {
                headers: { "Authorization": `Bearer ${FINAL_VOLC_KEY}` }
            });

            if (!res.ok) throw new Error(`Volc Check Error: ${await res.text()}`);
            
            const data = await res.json();
            
            const remoteStatus = data.status || data.data?.status;
            
            let status = 'processing';
            let videoUrl = null;

            if (remoteStatus === 'succeeded' || remoteStatus === 'SUCCEEDED') {
                status = 'succeeded';
                videoUrl = data.data?.video?.url || data.video?.url;
            } else if (remoteStatus === 'failed' || remoteStatus === 'FAILED') {
                status = 'failed';
            }

            return NextResponse.json({ status, output: { url: videoUrl } });
        }
      
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