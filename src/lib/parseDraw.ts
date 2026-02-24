
export type DrawCommand = {
    trigger: boolean;
    type?: 'image' | 'video'; 
    description: string;
    negativePrompt: string;
    charId?: string; 
    outfitId?: string; 
    videoModel?: string;
    parameters?: any;
};

export const cleanDrawTag = (content: string) => {
    return content
        .replace(/<draw>[\s\S]*?<\/draw>/g, "")
        .replace(/<draw_log>[\s\S]*?<\/draw_log>/g, "")
        .replace(/<video>[\s\S]*?<\/video>/g, "")     
        .replace(/<video_log>[\s\S]*?<\/video_log>/g, "") 
        .trim();
};

export const parseMediaTag = (content: string): DrawCommand | null => {
    const videoMatch = content.match(/<video>([\s\S]*?)<\/video>/);
    if (videoMatch) return parseInnerJson(videoMatch[1], 'video');

    const drawMatch = content.match(/<draw>([\s\S]*?)<\/draw>/);
    if (drawMatch) return parseInnerJson(drawMatch[1], 'image');

    return null;
};

const parseInnerJson = (rawContent: string, type: 'image' | 'video'): DrawCommand | null => {
    try {
        const jsonString = rawContent.replace(/```json/g, "").replace(/```/g, "").trim();
        const data = JSON.parse(jsonString);

        const desc = data.description || data.prompt || "";
        let rawCharId = data.charId || data.character || data.id;
        if (Array.isArray(rawCharId)) rawCharId = rawCharId[0];
        
        return {
            trigger: true,
            type: type, 
            description: desc,
            charId: rawCharId,
            outfitId: data.outfitId || "casual",
            videoModel: data.model, 
            parameters: data.parameters || {}, 
            negativePrompt: data.negativePrompt || data.neg || ""
        };
    } catch (e) {
        return { 
            trigger: true, 
            type: type, 
            description: rawContent, 
            parameters: {},
            negativePrompt: "",
            outfitId: "casual"
        };
    }
}

export const parseDrawTag = parseMediaTag;