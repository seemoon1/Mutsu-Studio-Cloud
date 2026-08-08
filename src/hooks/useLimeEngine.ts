import { useState, useRef } from "react";

export const useLimeEngine = ({
  currentSession,
  setSessions,
  apiProvider,
  showToast,
  selectedModel,
  localKeys,
}: any) => {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
      if (showToast) showToast("⏹️ 生成已中断");
    }
  };

  const handleDeleteMessage = (groupId: string, msgIndex: number) => {
    if (!confirm("⚠️ 确定要永久删除这条记录吗？（不可恢复）")) return;

    if (!currentSession) return;
    const updatedGroups = [...currentSession.limeGroups];
    const gIndex = updatedGroups.findIndex((g) => g.id === groupId);
    if (gIndex === -1) return;

    const targetGroup = updatedGroups[gIndex];
    const newMsgs = targetGroup.messages.filter(
      (_: any, i: number) => i !== msgIndex,
    );
    updatedGroups[gIndex] = { ...targetGroup, messages: newMsgs };

    setSessions((prev: any) =>
      prev.map((s: any) =>
        s.id === currentSession.id ? { ...s, limeGroups: updatedGroups } : s,
      ),
    );
  };

  const handleRegenerate = (groupId: string) => {
    if (!confirm("🔄 确定要撤回 AI 的最后一次回复并重新生成吗？")) return;

    if (!currentSession) return;
    const updatedGroups = [...currentSession.limeGroups];
    const gIndex = updatedGroups.findIndex((g: any) => g.id === groupId);
    if (gIndex === -1) return;

    const targetGroup = updatedGroups[gIndex];
    const lastMsg = targetGroup.messages[targetGroup.messages.length - 1];

    if (lastMsg && lastMsg.role === "assistant") {
      const newMsgs = targetGroup.messages.slice(0, -1);
      updatedGroups[gIndex] = { ...targetGroup, messages: newMsgs };

      setSessions((prev: any) =>
        prev.map((s: any) =>
          s.id === currentSession.id ? { ...s, limeGroups: updatedGroups } : s,
        ),
      );
      if (showToast) showToast("🔄 已撤回，请修改大纲后重新发送。");
    }
  };

  const handleSendLime = async (overrideInput?: string) => {
    if (isLoading || !currentSession || currentSession.memoryMode !== "lime")
      return;

    const activeGroupId = currentSession.limeGroupId;
    if (!activeGroupId) return;

    const activeGroupIndex = currentSession.limeGroups?.findIndex(
      (g: any) => g.id === activeGroupId,
    );
    if (activeGroupIndex === -1) return;

    const activeGroup = currentSession.limeGroups[activeGroupIndex];
    const txt = overrideInput !== undefined ? overrideInput : input.trim();
    if (!txt) return;

    setInput("");
    setIsLoading(true);

    const isDirectorMode = activeGroup.pov === "outsider";
    const finalContent = isDirectorMode ? `(Director's Instruction: ${txt})` : txt;

    const userMsg = {
      role: "user",
      content: finalContent,
      timestamp: Date.now(),
    };

    const updatedGroups = [...currentSession.limeGroups];
    updatedGroups[activeGroupIndex] = {
      ...activeGroup,
      messages: [...activeGroup.messages, userMsg],
    };

    setSessions((prev: any) =>
      prev.map((s: any) =>
        s.id === currentSession.id ? { ...s, limeGroups: updatedGroups } : s,
      ),
    );

    const history = activeGroup.messages.concat(userMsg).map((m: any) => ({
      role: m.role,
      content:
        typeof m.content === "string" ? m.content : JSON.stringify(m.content),
    }));

    abortControllerRef.current = new AbortController();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history,
          model: selectedModel || "google/gemini-3-flash-preview",
          memoryMode: "lime",

          limeGroupId: activeGroupId,
          limeGroupName: activeGroup.name,
          limeTimeline: activeGroup.timeline,
          limeGroupType: activeGroup.type,
          limePovChar: activeGroup.defaultPovChar,
          limePov: activeGroup.pov,
          limeReality: activeGroup.reality,
          limeAuContext: activeGroup.auContext,
          limeGroupMembers: activeGroup.members,
          limePlayerName: activeGroup.playerName || "用户",

          provider: apiProvider,
          localKeys: {
            deepseek: localStorage.getItem("mutsu_key_deepseek") || "",
            openrouter: localStorage.getItem("mutsu_key_openrouter") || "",
            google: localStorage.getItem("mutsu_key_google") || "",
            volcengine: localStorage.getItem("mutsu_key_volcengine") || "",
            volc_ep_chat: localStorage.getItem("mutsu_key_volc_ep_chat") || "",
          },
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) throw new Error("Network Error");
      if (!res.body) throw new Error("No Body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;

        setSessions((prev: any) =>
          prev.map((s: any) => {
            if (s.id !== currentSession.id) return s;

            const liveGroups = [...s.limeGroups];
            const targetGroup = liveGroups[activeGroupIndex];

            const lastMsg =
              targetGroup.messages[targetGroup.messages.length - 1];

            let newMessages;
            if (lastMsg && lastMsg.role === "assistant") {
              newMessages = targetGroup.messages
                .slice(0, -1)
                .concat({ ...lastMsg, content: fullText });
            } else {
              newMessages = [
                ...targetGroup.messages,
                { role: "assistant", content: fullText, timestamp: Date.now() },
              ];
            }

            liveGroups[activeGroupIndex] = {
              ...targetGroup,
              messages: newMessages,
            };
            return { ...s, limeGroups: liveGroups };
          }),
        );
      }

      const textToSummarize = `User: ${txt}\nLIME Group (${activeGroup.name}): ${fullText}\n`;

      fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textToSummarize,
          mode: "micro",
          localKeys: {
            deepseek: localStorage.getItem("mutsu_key_deepseek") || "",
            openrouter: localStorage.getItem("mutsu_key_openrouter") || "",
            google: localStorage.getItem("mutsu_key_google") || "",
            volcengine: localStorage.getItem("mutsu_key_volcengine") || "",
            volc_ep_chat: localStorage.getItem("mutsu_key_volc_ep_chat") || "",
          },
        }),
      })
        .then((res) => res.json())
        .then((microData) => {
          if (microData.summary) {
            const summaryLine = `•[${activeGroup.name}]: ${microData.summary}\n`;

            setSessions((prev: any) =>
              prev.map((s: any) => {
                if (s.id !== currentSession.id) return s;

                const updatedGroups = [...s.limeGroups];
                const gIndex = updatedGroups.findIndex(
                  (g) => g.id === activeGroupId,
                );
                if (gIndex === -1) return s;

                const tGroup = updatedGroups[gIndex];
                const newStm = (tGroup.stm || "") + summaryLine;
                const newCount = (tGroup.turnCount || 0) + 1;

                if (newCount >= 7) {
                  fetch("/api/summarize", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      text: newStm,
                      previousLtm: tGroup.ltm,
                      mode: "macro",
                      localKeys: {
                        deepseek:
                          localStorage.getItem("mutsu_key_deepseek") || "",
                        openrouter:
                          localStorage.getItem("mutsu_key_openrouter") || "",
                        google: localStorage.getItem("mutsu_key_google") || "",
                        volcengine:
                          localStorage.getItem("mutsu_key_volcengine") || "",
                        volc_ep_chat:
                          localStorage.getItem("mutsu_key_volc_ep_chat") || "",
                      },
                    }),
                  })
                    .then((r) => r.json())
                    .then((macroData) => {
                      if (macroData.summary) {
                        setSessions((inner: any) =>
                          inner.map((innerS: any) => {
                            if (innerS.id !== currentSession.id) return innerS;
                            const macroGroups = [...innerS.limeGroups];
                            const mIndex = macroGroups.findIndex(
                              (mg) => mg.id === activeGroupId,
                            );
                            if (mIndex !== -1) {
                              macroGroups[mIndex] = {
                                ...macroGroups[mIndex],
                                ltm: macroData.summary,
                                stm: "",
                                turnCount: 0,
                              };
                            }
                            return { ...innerS, limeGroups: macroGroups };
                          }),
                        );
                      }
                    });
                  updatedGroups[gIndex] = {
                    ...tGroup,
                    stm: newStm,
                    turnCount: 0,
                  };
                } else {
                  updatedGroups[gIndex] = {
                    ...tGroup,
                    stm: newStm,
                    turnCount: newCount,
                  };
                }
                return { ...s, limeGroups: updatedGroups };
              }),
            );
          }
        });
    } catch (e: any) {
      console.error(e);
      if (showToast) showToast("❌ 通信中断");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    input,
    setInput,
    isLoading,
    handleSend: handleSendLime,
    stopGeneration,
    handleDeleteMessage,
    handleRegenerate,
  };
};
