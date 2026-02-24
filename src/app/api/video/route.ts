import { NextResponse } from "next/server";

export const runtime = "edge"; 

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, provider = "fal", localKeys } = body; 
    
    const FAL_KEY = localKeys?.fal || process.env.FAL_KEY;
    const VOLC_API_KEY = localKeys?.volcengine || process.env.VOLC_API_KEY;

    if (!prompt) throw new Error("Missing Prompt.");

    console.log(`🎥 [Video Engine]: ${provider}`);

    if (provider === "fal") {
      if (!FAL_KEY) throw new Error("Missing FAL_KEY");

      const res = await fetch(`https://queue.fal.run/fal-ai/minimax/video`, {
        method: "POST", 
        headers: { 
          "Authorization": `Key ${FAL_KEY}`, 
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({
          prompt: `Anime style, highly detailed. ${prompt}`,
          aspect_ratio: "16:9"
        })
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      return NextResponse.json({
        success: true, status: 'queued', taskId: data.request_id,
        statusUrl: data.status_url, responseUrl: data.response_url, provider: 'fal'
      });
    }

    else if (provider === "volcengine") {
      if (!VOLC_API_KEY) throw new Error("Missing VOLC_API_KEY");
      
      const VOLC_VIDEO_EP = process.env.VOLC_VIDEO_EP || "ep-xxxxxx"; 

      const res = await fetch("https://ark.cn-beijing.volces.com/api/v3/videos/generations", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${VOLC_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: VOLC_VIDEO_EP,
          prompt: `Anime style. ${prompt}`
        })
      });

      if (!res.ok) throw new Error(`Volcengine Video Error: ${await res.text()}`);
      const data = await res.json();

      return NextResponse.json({
        success: true, status: 'queued', 
        taskId: data.data.task_id, 
        provider: 'volcengine'
      });
    }

    throw new Error("Unknown Video Provider");

  } catch (error: any) {
    console.error("🔥 [Video Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}