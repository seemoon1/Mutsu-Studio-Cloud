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
    const VOLC_API_KEY =
      localKeys?.volcengine?.trim() || process.env.VOLC_API_KEY;

    // ==========================================
    // 🌊 方案 A：Fal.ai
    // ==========================================
    if (provider === "fal") {
      if (!FAL_KEY) throw new Error("Missing Fal.ai API Key. 请在金库中配置。");

      const res = await fetch(
        `https://queue.fal.run/fal-ai/minimax/hailuo-02/standard/text-to-video`,
        {
          method: "POST",
          headers: {
            Authorization: `Key ${FAL_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: `Anime style, highly detailed, smooth motion. ${prompt}`,
            aspect_ratio: "16:9",
          }),
        },
      );

      if (!res.ok) throw new Error(`Fal.ai Error: ${await res.text()}`);
      const data = await res.json();

      return NextResponse.json({
        success: true,
        status: "queued",
        taskId: data.request_id,
        statusUrl: data.status_url,
        responseUrl: data.response_url,
        provider: "fal",
      });
    }

    // ==========================================
    // 🌋 方案 B：火山引擎 (Seedance 1.5 Pro)
    // ==========================================
    else if (provider === "volcengine") {
      if (!VOLC_API_KEY) throw new Error("Missing Volcengine API Key.");

      const VOLC_MODEL_ID = localKeys?.volc_ep_video?.trim();
      if (!VOLC_MODEL_ID)
        throw new Error("Missing Volcengine Video Endpoint ID (ep-xxx).");

      console.log(`🌋 [Volc Video] Creating Task on EP: ${VOLC_MODEL_ID}`);

      const arkUrl =
        "https://ark.cn-beijing.volces.com/api/v3/content_generation/tasks";

      const res = await fetch(arkUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${VOLC_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: VOLC_MODEL_ID,
          content: [
            { type: "text", text: `Anime style, high fidelity, 8k. ${prompt}` },
          ],
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error(`🔥 Volc Create Error: ${errText}`);
        throw new Error(`Volcengine Error (${res.status}): ${errText}`);
      }

      const data = await res.json();
      const taskId = data.id;

      if (!taskId) throw new Error("Failed to get Task ID from Volcengine.");

      return NextResponse.json({
        success: true,
        status: "queued",
        taskId: taskId,
        provider: "volcengine",
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
  const provider = searchParams.get("provider");

  try {
    if (provider === "volcengine") {
      const taskId = searchParams.get("taskId");
      const userVolcKey = req.headers.get("X-Volc-Key");
      const FINAL_VOLC_KEY = userVolcKey?.trim() || process.env.VOLC_API_KEY;

      if (!taskId || !FINAL_VOLC_KEY)
        return NextResponse.json(
          { error: "Missing TaskID or Key" },
          { status: 400 },
        );

      const checkUrl = `https://ark.cn-beijing.volces.com/api/v3/content_generation/tasks/${taskId}`;

      const res = await fetch(checkUrl, {
        headers: { Authorization: `Bearer ${FINAL_VOLC_KEY}` },
      });

      if (!res.ok) throw new Error(`Volc Check Error: ${await res.text()}`);

      const data = await res.json();
      const remoteStatus = data.status; // 'succeeded', 'running', 'failed'

      let status = "processing";
      let videoUrl = null;

      if (remoteStatus === "succeeded") {
        status = "succeeded";
        const videoContent = data.content?.find(
          (c: any) => c.type === "video_url",
        );
        videoUrl = videoContent?.video_url;
      } else if (remoteStatus === "failed") {
        status = "failed";
      }

      return NextResponse.json({ status, output: { url: videoUrl } });
    }

    const statusUrl = searchParams.get("statusUrl");
    const responseUrl = searchParams.get("responseUrl");

    const userFalKey = req.headers.get("X-Fal-Key");
    const FINAL_FAL_KEY = userFalKey?.trim() || process.env.FAL_KEY;

    if (!statusUrl)
      return NextResponse.json(
        { error: "No Status URL provided" },
        { status: 400 },
      );
    if (!FINAL_FAL_KEY)
      return NextResponse.json(
        { error: "Missing Fal API Key for polling" },
        { status: 401 },
      );

    const res = await fetch(statusUrl, {
      headers: { Authorization: `Key ${FINAL_FAL_KEY}` },
    });

    if (!res.ok) throw new Error(`Status Fetch Error: ${await res.text()}`);

    const data = await res.json();
    let status = "processing";
    let videoUrl = null;

    if (data.status === "COMPLETED") {
      status = "succeeded";
      if (responseUrl) {
        const resultRes = await fetch(responseUrl, {
          headers: { Authorization: `Key ${FINAL_FAL_KEY}` },
        });
        const resultData = await resultRes.json();
        videoUrl = resultData.video?.url || resultData.url;
      }
    } else if (data.status === "FAILED") {
      status = "failed";
    }

    return NextResponse.json({ status, output: { url: videoUrl } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
