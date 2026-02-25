import { useState, useRef } from "react";
import { calculateNewStats } from "../lib/emotionalEngine";
import { parseMediaTag } from "../lib/parseDraw";

export const useChatEngine = ({
  currentSession,
  currentSessionId,
  setSessions,
  activeCharacterId,
  voiceVariant,
  globalWorldInfo,
  config,
  setTrackId,
  showToast,
  setIsGlobalGenerating,
  manualOutfitId,
  apiProvider,
  drawEngine,
}: any) => {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{
    url: string;
    type: "image" | "video" | "text";
    name: string;
  } | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
    }
  };

  const handleSend = async (
    overrideInput?: string,
    overrideMessages?: any[],
    configOverride?: {
      useJailbreak?: boolean;
      useErotic?: boolean;
      useMusicControl?: boolean;
      useImageGen?: boolean;
      imageModel?: string;
      useVideoGen?: boolean;
      videoModel?: string;
      novelConfig?: any;
      modelOverride?: string;
    },
  ) => {
    if (isLoading || !currentSession) return;

    const isRegen = overrideMessages !== undefined;
    const txt = overrideInput !== undefined ? overrideInput : input.trim();
    if (!isRegen && !txt && !selectedFile) return;

    if (!isRegen) {
      setInput("");
      setSelectedFile(null);
    }
    setIsLoading(true);

    let msgs = overrideMessages
      ? [...overrideMessages]
      : [...currentSession.messages];
    const modelToUse =
      configOverride?.modelOverride ||
      config.selectedModel ||
      "google/gemini-3-flash-preview";

    if (!isRegen) {
      let content: any = txt;
      if (selectedFile) {
        if (selectedFile.type === "text")
          content =
            (txt ? txt + "\n\n" : "") +
            `[Attached File: ${selectedFile.name}]\n${selectedFile.url}`;
        else
          content = [
            { type: "text", text: txt || "File" },
            { type: "image_url", image_url: { url: selectedFile.url } },
          ];
      }
      msgs.push({ role: "user", content, characterId: activeCharacterId });
    }

    setSessions((prev: any) =>
      prev.map((s: any) =>
        s.id === currentSessionId
          ? {
              ...s,
              messages: [
                ...msgs,
                {
                  role: "assistant",
                  content: "",
                  modelName: modelToUse,
                  characterId: activeCharacterId,
                },
              ],
              updatedAt: Date.now(),
              voiceVariant,
            }
          : s,
      ),
    );

    abortControllerRef.current = new AbortController();

    let payloadMessages = msgs;
    const MAX_CONTEXT_MSG = 20;
    if (msgs.length > MAX_CONTEXT_MSG) {
      payloadMessages = [msgs[0], ...msgs.slice(-MAX_CONTEXT_MSG)];
    }

    const localKeys = {
      deepseek: localStorage.getItem("mutsu_key_deepseek") || "",
      openrouter: localStorage.getItem("mutsu_key_openrouter") || "",
      google: localStorage.getItem("mutsu_key_google") || "",
      tavily: localStorage.getItem("mutsu_key_tavily") || "",
      volcengine: localStorage.getItem("mutsu_key_volcengine") || "",
      volc_ep: localStorage.getItem("mutsu_key_volc_ep") || "",
      fal: localStorage.getItem("mutsu_key_fal") || "",
      accessCode: localStorage.getItem("mutsu_access_code") || "",
    };

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: payloadMessages.map((m: any) => ({
            role: m.role,
            content: m.content,
            characterId: m.characterId,
          })),
          model: modelToUse,
          characterId: activeCharacterId,
          variant: voiceVariant,
          globalWorldInfo,
          localWorldInfo: currentSession.localWorldInfo,
          memoryMode: currentSession.memoryMode || "sliding",
          stm: currentSession.stm,
          ltm: currentSession.ltm,
          timeline: currentSession.timeline,
          novelConfig: configOverride?.novelConfig,
          useWebSearch: config.webSearch,
          useJailbreak: configOverride?.useJailbreak ?? config.jailbreak,
          useErotic: configOverride?.useErotic ?? config.erotic,
          useMusicControl:
            configOverride?.useMusicControl ?? config.musicControl,
          useImageGen: config.imageGen,
          drawEngine: drawEngine,
          useVideoGen: configOverride?.useVideoGen ?? config.videoGen,
          videoModel:
            configOverride?.videoModel || config.videoModel || "hailuo",
          charStatus: currentSession.charStatus,
          codeRepository: currentSession.codeRepository,
          provider: apiProvider,
          localKeys: localKeys,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) throw new Error((await res.json()).error);
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;

        setSessions((prev: any) =>
          prev.map((s: any) =>
            s.id === currentSessionId
              ? {
                  ...s,
                  messages: [
                    ...msgs,
                    {
                      role: "assistant",
                      content: fullText,
                      modelName: modelToUse,
                      characterId: activeCharacterId,
                    },
                  ],
                }
              : s,
          ),
        );
      }

      if (abortControllerRef.current?.signal.aborted) {
        setIsLoading(false);
        return;
      }

      let currentText = fullText;
      let capturedState: any = null;
      let newFiles: Record<string, any> = {};

      const audioRegex = /<audio>(.*?)<\/audio>/;
      const audioMatch = currentText.match(audioRegex);
      if (audioMatch) {
        try {
          const audioData = JSON.parse(audioMatch[1]);
          if (audioData.trackId && setTrackId) setTrackId(audioData.trackId);
          currentText = currentText.replace(audioRegex, "");
        } catch (e) {
          console.error("Audio Parse Error", e);
        }
      }

      const gameRegex = /<game_state>([\s\S]*?)<\/game_state>/;
      const gameMatch = currentText.match(gameRegex);
      if (gameMatch) {
        try {
          capturedState = JSON.parse(gameMatch[1]);
          currentText = currentText.replace(gameRegex, "").trim();

          if (capturedState.character) {
            const currentStatsRaw = Array.isArray(currentSession.charStatus)
              ? currentSession.charStatus[0]
              : currentSession.charStatus;
            const currentStats = {
              affection: currentStatsRaw?.affection || 0,
              monopoly: currentStatsRaw?.monopoly || 0,
              yandere: currentStatsRaw?.yandere || 0,
              lust: currentStatsRaw?.lust || 0,
              ...currentStatsRaw,
            };
            const aiSuggestedRaw = Array.isArray(capturedState.character)
              ? capturedState.character[0]
              : capturedState.character;
            const finalStats = calculateNewStats(currentStats, aiSuggestedRaw);
            capturedState.character = [{ ...aiSuggestedRaw, ...finalStats }];
          }

          if (
            capturedState.music?.trigger &&
            capturedState.music?.trackId &&
            setTrackId
          ) {
            setTimeout(() => setTrackId(capturedState.music.trackId), 500);
          }
        } catch (e) {
          console.error("Game State Error", e);
        }
      }

      const titleRegex = /<title>(.*?)<\/title>/;
      const titleMatch = currentText.match(titleRegex);
      let newTitle = undefined;
      if (
        titleMatch &&
        (currentSession.title === "新篇章" ||
          currentSession.title === "New Dream")
      ) {
        newTitle = titleMatch[1];
        currentText = currentText.replace(titleRegex, "").trim();
      }

      const fileRegex = /<file name="(.*?)">([\s\S]*?)<\/file>/g;
      currentText = currentText
        .replace(fileRegex, (match, fileName, fileContent) => {
          const ext = fileName.split(".").pop()?.toLowerCase() || "";
          if (["txt", "md", "markdown", "log"].includes(ext)) {
            return `\n**[Document: ${fileName}]**\n\`\`\`${ext}\n${fileContent}\n\`\`\`\n`;
          }
          newFiles[fileName] = {
            name: fileName,
            language: ext || "text",
            content: fileContent.trim(),
          };
          return "";
        })
        .trim();

      setSessions((prev: any) =>
        prev.map((s: any) => {
          if (s.id === currentSessionId) {
            return {
              ...s,
              ...(newTitle ? { title: newTitle } : {}),
              messages: [
                ...msgs,
                {
                  role: "assistant",
                  content: currentText,
                  modelName: modelToUse,
                  characterId: activeCharacterId,
                },
              ],
              codeRepository: { ...(s.codeRepository || {}), ...newFiles },
              ...(capturedState
                ? {
                    protagonist: capturedState.protagonist,
                    charStatus: capturedState.character,
                    plotSuggestions: capturedState.suggestions,
                    lastDanmaku: capturedState.danmaku,
                    timeline: capturedState.timeline,
                    currentBackground:
                      capturedState.environment?.bgId || s.currentBackground,
                    live2dCharId: capturedState.live2d?.charId || null,
                    currentEmotion: capturedState.live2d?.motion || "idle",
                    currentOutfitId:
                      capturedState.imageGen?.outfitId || s.currentOutfitId,
                  }
                : {}),
            };
          }
          return s;
        }),
      );

      /* 
            let mediaCmd = parseMediaTag(currentText);
            
            if (!mediaCmd && capturedState?.imageGen?.trigger && config.imageGen) {
                 mediaCmd = {
                     trigger: true,
                     type: 'image',
                     description: (capturedState.imageGen.emotion || "") + ", " + (capturedState.imageGen.description || ""),
                     negativePrompt: capturedState.imageGen.negativePrompt,
                     charId: capturedState.imageGen.charId || activeCharacterId,
                     outfitId: capturedState.imageGen.outfitId || manualOutfitId || "casual",
                     parameters: capturedState.imageGen.parameters
                 };
            }

            if (mediaCmd && mediaCmd.trigger) {
                const targetFingerprint = mediaCmd.type === 'video' 
                    ? currentText.match(/<video>([\s\S]*?)<\/video>/)?.[0] 
                    : currentText.match(/<draw>([\s\S]*?)<\/draw>/)?.[0];

                (async () => {
                    setIsGlobalGenerating(true);
                    try {
                        if (mediaCmd.type === 'video' && config.videoGen) {
                            const currentVideoModel = mediaCmd.videoModel || config.videoModel || 'hailuo';
                            showToast(`🎬 Action! Engine: ${currentVideoModel}`);

                            const vidRes = await fetch("/api/video", {
                                method: "POST", headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    prompt: mediaCmd.description,
                                    provider: currentVideoModel === 'doubao' ? 'volcengine' : 'fal',
                                    localKeys
                                })
                            });
                            const vidData = await vidRes.json();
                            if (!vidRes.ok) throw new Error(vidData.error || "Video Request Failed");

                            let videoUrl = null;
                            if (vidData.status === 'succeeded' && vidData.output?.url) {
                                videoUrl = vidData.output.url;
                            } else if (vidData.statusUrl) {
                                showToast("⏳ Rendering Cinematic (Wait ~2m)...");
                                for (let i = 0; i < 60; i++) {
                                    await new Promise(r => setTimeout(r, 3000));
                                    const check = await fetch(`/api/video?statusUrl=${encodeURIComponent(vidData.statusUrl)}&responseUrl=${encodeURIComponent(vidData.responseUrl || '')}`);
                                    const checkData = await check.json();
                                    if (checkData.status === 'succeeded') { videoUrl = checkData.output?.url; break; }
                                    if (checkData.status === 'failed') throw new Error("Render Failed on Server");
                                }
                            }

                            if (videoUrl) {
                                setSessions((prev: any) => prev.map((s: any) => {
                                    if (s.id !== currentSessionId) return s;
                                    const newMessages = s.messages.map((m: any) => {
                                        if (typeof m.content === 'string') {
                                            if (targetFingerprint && m.content.includes(targetFingerprint)) {
                                                const logTag = targetFingerprint.replace('<video>', '<video_log>').replace('</video>', '</video_log>');
                                                return { ...m, content: m.content.replace(targetFingerprint, `${logTag}\n\n![Video](${videoUrl})\n`) };
                                            } else if (m === s.messages[s.messages.length - 1]) {
                                                return { ...m, content: m.content + `\n\n![Video](${videoUrl})\n` };
                                            }
                                        }
                                        return m;
                                    });
                                    return { ...s, messages: newMessages };
                                }));
                                showToast("🎞️ Scene Complete.");
                            } else {
                                throw new Error("Video Generation Timeout.");
                            }
                        }
                        else if (mediaCmd.type === 'image' && config.imageGen) {
                            showToast(`🎨 Painting... (${drawEngine})`);
                            
                            const drawRes = await fetch("/api/draw", {
                                method: "POST", headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    prompt: mediaCmd.description,
                                    charId: mediaCmd.charId || activeCharacterId,
                                    provider: drawEngine,
                                    localKeys
                                })
                            });

                            const drawData = await drawRes.json();
                            if (!drawRes.ok) throw new Error(drawData.error || "Draw Request Failed");

                            if (drawData.success && drawData.image) {
                                const imageUrl = drawData.image; 
                                setSessions((prev: any) => prev.map((s: any) => {
                                    if (s.id !== currentSessionId) return s;
                                    const newMessages = s.messages.map((m: any) => {
                                        if (typeof m.content === 'string') {
                                            if (targetFingerprint && m.content.includes(targetFingerprint)) {
                                                const logTag = targetFingerprint.replace('<draw>', '<draw_log>').replace('</draw>', '</draw_log>');
                                                return { ...m, content: m.content.replace(targetFingerprint, `${logTag}\n\n![Generated](${imageUrl})\n`) };
                                            } else if (m === s.messages[s.messages.length - 1]) {
                                                return { ...m, content: m.content + `\n\n![Generated](${imageUrl})\n` };
                                            }
                                        }
                                        return m;
                                    });
                                    return { ...s, messages: newMessages };
                                }));
                                showToast("✨ Image Ready.");
                            }
                        }       
                    } catch (e: any) {
                        console.error("Media Gen Error:", e);
                        showToast(`❌ Error: ${e.message}`);
                    } finally {
                        setIsGlobalGenerating(false);
                    }
                })();
            }
            */

      if (
        currentSession.memoryMode === "sliding" ||
        currentSession.memoryMode === "novel"
      ) {
        const textToSummarize =
          currentSession.memoryMode === "novel"
            ? currentText
            : `User: ${txt}\nAI: ${currentText}\n`;
        const summarizeMode =
          currentSession.memoryMode === "novel" ? "novel_chapter" : "micro";

        fetch("/api/summarize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: textToSummarize, mode: summarizeMode }),
        })
          .then((res) => res.json())
          .then((microData) => {
            if (microData.summary) {
              const prefix =
                currentSession.memoryMode === "novel" ? `[Chapter]: ` : `• `;
              const summaryLine = `${prefix}${microData.summary}\n`;

              setSessions((prev: any) =>
                prev.map((s: any) => {
                  if (s.id === currentSessionId) {
                    const newStm = (s.stm || "") + summaryLine;
                    const newCount = (s.turnCount || 0) + 1;

                    if (newCount >= 7) {
                      fetch("/api/summarize", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          text: newStm,
                          previousLtm: s.ltm,
                          mode: "macro",
                        }),
                      })
                        .then((r) => r.json())
                        .then((macroData) => {
                          if (macroData.summary) {
                            setSessions((inner: any) =>
                              inner.map((innerS: any) =>
                                innerS.id === currentSessionId
                                  ? {
                                      ...innerS,
                                      ltm: macroData.summary,
                                      stm: "",
                                      turnCount: 0,
                                    }
                                  : innerS,
                              ),
                            );
                            showToast("✨ Memory Consolidated");
                          }
                        });
                      return {
                        ...s,
                        stm: newStm,
                        stmBackup: s.stm,
                        turnCount: 0,
                      };
                    }
                    return {
                      ...s,
                      stm: newStm,
                      stmBackup: s.stm,
                      turnCount: newCount,
                    };
                  }
                  return s;
                }),
              );
            }
          });
      }
    } catch (e: any) {
      if (e.name !== "AbortError") showToast(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = (idx: number) => {
    if (!currentSession) return;
    if (idx === currentSession.messages.length - 1) {
      setSessions((prev: any) =>
        prev.map((s: any) =>
          s.id === currentSessionId && s.stmBackup !== undefined
            ? { ...s, stm: s.stmBackup }
            : s,
        ),
      );
      showToast("⏳ Timeline Reverted");
    }
    handleSend(undefined, currentSession.messages.slice(0, idx));
  };

  const handleDeleteMessage = (idx: number, role: string) => {
    if (!currentSession) return;
    if (!confirm("⚠️ Delete this message?")) return;
    let newMsgs = [...currentSession.messages];
    if (role === "assistant") newMsgs.splice(idx, 1);
    else if (role === "user")
      newMsgs.splice(idx, idx === newMsgs.length - 2 ? 2 : 1);
    setSessions((prev: any) =>
      prev.map((s: any) =>
        s.id === currentSessionId ? { ...s, messages: newMsgs } : s,
      ),
    );
  };

  const handleRepoUpdate = (newRepo: any) => {
    setSessions((prev: any) =>
      prev.map((s: any) =>
        s.id === currentSessionId ? { ...s, codeRepository: newRepo } : s,
      ),
    );
  };

  const handleVisualCommand = async (cmdOrPrompt: any) => {
    let cmd = cmdOrPrompt;

    if (typeof cmdOrPrompt === "string") {
      cmd = parseMediaTag(cmdOrPrompt) || {
        description: cmdOrPrompt,
        type: "image",
        trigger: true,
      };
    }
    if (!cmd || !cmd.trigger) return;

    let targetFingerprint = "";
    const lastMsg = currentSession?.messages
      .filter((m: any) => m.role === "assistant")
      .pop();
    if (lastMsg) {
      const match = lastMsg.content.match(/<(video|draw)>([\s\S]*?)<\/\1>/);
      if (match) targetFingerprint = match[0];
    }

    const localKeys = {
      volcengine: localStorage.getItem("mutsu_key_volcengine") || "",
      volc_ep: localStorage.getItem("mutsu_key_volc_ep") || "", 
      fal: localStorage.getItem("mutsu_key_fal") || "",
      openrouter: localStorage.getItem("mutsu_key_openrouter") || "",
    };

    setIsGlobalGenerating(true);

    try {
      if (cmd.type === "video" && config.videoGen) {
        const currentVideoModel =
          cmd.videoModel || config.videoModel || "hailuo";
        showToast(`🎬 Action! Engine: ${currentVideoModel}`);

        const vidRes = await fetch("/api/video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: cmd.description,
            provider: currentVideoModel === "doubao" ? "volcengine" : "fal",
            localKeys,
          }),
        });

        const vidData = await vidRes.json();
        if (!vidRes.ok)
          throw new Error(vidData.error || "Video Request Failed");

        let videoUrl = null;
        if (vidData.status === "succeeded" && vidData.output?.url) {
          videoUrl = vidData.output.url;
        } else if (vidData.statusUrl) {
          showToast("⏳ Rendering Cinematic (Wait ~2m)...");
          for (let i = 0; i < 60; i++) {
            await new Promise((r) => setTimeout(r, 3000));
            const check = await fetch(
              `/api/video?statusUrl=${encodeURIComponent(vidData.statusUrl)}&responseUrl=${encodeURIComponent(vidData.responseUrl || "")}`,
            );
            const checkData = await check.json();
            if (checkData.status === "succeeded") {
              videoUrl = checkData.output?.url;
              break;
            }
            if (checkData.status === "failed")
              throw new Error("Render Failed on Server");
          }
        }

        if (videoUrl) {
          setSessions((prev: any) =>
            prev.map((s: any) => {
              if (s.id !== currentSessionId) return s;
              const newMessages = s.messages.map((m: any) => {
                if (typeof m.content === "string") {
                  if (
                    targetFingerprint &&
                    m.content.includes(targetFingerprint)
                  ) {
                    const logTag = targetFingerprint
                      .replace("<video>", "<video_log>")
                      .replace("</video>", "</video_log>");
                    const showcase = `\n\n> **[ 🎥 Cinematic Sequence ]**\n<video controls playsinline loop src="${videoUrl}" class="w-full rounded-2xl shadow-lg border border-white/20 my-4" />\n\n`;
                    return {
                      ...m,
                      content: m.content.replace(
                        targetFingerprint,
                        logTag + showcase,
                      ),
                    };
                  } else if (m === s.messages[s.messages.length - 1]) {
                    return {
                      ...m,
                      content: m.content + `\n\n![Video](${videoUrl})\n`,
                    };
                  }
                }
                return m;
              });
              return { ...s, messages: newMessages };
            }),
          );
          showToast("🎞️ Scene Complete.");
        } else {
          throw new Error("Video Timeout.");
        }
      } else if (cmd.type === "image" && config.imageGen) {
        showToast(`🎨 Painting... (${drawEngine})`);

        const drawRes = await fetch("/api/draw", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: cmd.description,
            charId: cmd.charId || activeCharacterId,
            provider: drawEngine,
            localKeys,
          }),
        });

        if (drawRes.status === 504) {
          throw new Error(
            "⏳ Timeout! Cloud engine is busy. Please try again.",
          );
        }

        const drawData = await drawRes.json();
        if (!drawRes.ok)
          throw new Error(drawData.error || "Draw Request Failed");

        if (drawData.success && drawData.image) {
          const imageUrl = drawData.image;
          setSessions((prev: any) =>
            prev.map((s: any) => {
              if (s.id !== currentSessionId) return s;
              const newMessages = s.messages.map((m: any) => {
                if (typeof m.content === "string") {
                  if (
                    targetFingerprint &&
                    m.content.includes(targetFingerprint)
                  ) {
                    const logTag = targetFingerprint
                      .replace("<draw>", "<draw_log>")
                      .replace("</draw>", "</draw_log>");
                    return {
                      ...m,
                      content: m.content.replace(
                        targetFingerprint,
                        `${logTag}\n\n![Generated](${imageUrl})\n`,
                      ),
                    };
                  } else if (m === s.messages[s.messages.length - 1]) {
                    return {
                      ...m,
                      content: m.content + `\n\n![Generated](${imageUrl})\n`,
                    };
                  }
                }
                return m;
              });
              return { ...s, messages: newMessages };
            }),
          );
          showToast("✨ Image Ready.");
        }
      }
    } catch (e: any) {
      console.error("Media Gen Error:", e);
      showToast(`❌ Error: ${e.message}`);
    } finally {
      setIsGlobalGenerating(false);
    }
  };

  return {
    input,
    setInput,
    isLoading,
    selectedFile,
    setSelectedFile,
    handleSend,
    stopGeneration,
    handleRegenerate,
    handleDeleteMessage,
    handleRepoUpdate,
    handleVisualCommand,
  };
};
