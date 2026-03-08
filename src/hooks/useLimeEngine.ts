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

  const handleDeleteMessage = (groupIndex: number, msgIndex: number) => {
    if (!currentSession) return;
    const updatedGroups = [...currentSession.limeGroups];
    const targetGroup = updatedGroups[groupIndex];

    const newMsgs = targetGroup.messages.filter((_: any, i: number) => i !== msgIndex);
    updatedGroups[groupIndex] = { ...targetGroup, messages: newMsgs };

    setSessions((prev: any) =>
      prev.map((s: any) =>
        s.id === currentSession.id ? { ...s, limeGroups: updatedGroups } : s,
      ),
    );
  };

  const handleRegenerate = (groupIndex: number) => {
    if (!currentSession) return;
    const targetGroup = currentSession.limeGroups[groupIndex];
    const lastMsg = targetGroup.messages[targetGroup.messages.length - 1];

    if (lastMsg.role === "assistant") {
      handleDeleteMessage(groupIndex, targetGroup.messages.length - 1);
      if (showToast) showToast("🔄 已撤回，请重新发送指令。");
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

    const isDuo = activeGroup.type === "duo";
    const finalContent = isDuo ? `(Director's Instruction: ${txt})` : txt;

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
          limeReality: activeGroup.reality,
          limeAuContext: activeGroup.auContext,
          limeGroupMembers: activeGroup.members,

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
            const summaryLine = `•[LIME: ${activeGroup.name}]: ${microData.summary}\n`;

            setSessions((prev: any) =>
              prev.map((s: any) => {
                if (s.id === currentSession.id) {
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
                        localKeys: {
                          deepseek:
                            localStorage.getItem("mutsu_key_deepseek") || "",
                          openrouter:
                            localStorage.getItem("mutsu_key_openrouter") || "",
                          google:
                            localStorage.getItem("mutsu_key_google") || "",
                          volcengine:
                            localStorage.getItem("mutsu_key_volcengine") || "",
                          volc_ep_chat:
                            localStorage.getItem("mutsu_key_volc_ep_chat") ||
                            "",
                        },
                      }),
                    })
                      .then((r) => r.json())
                      .then((macroData) => {
                        if (macroData.summary) {
                          setSessions((inner: any) =>
                            inner.map((innerS: any) =>
                              innerS.id === currentSession.id
                                ? {
                                    ...innerS,
                                    ltm: macroData.summary,
                                    stm: "",
                                    turnCount: 0,
                                  }
                                : innerS,
                            ),
                          );
                          if (showToast) showToast("✨ 群聊记忆已固化");
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
        })
        .catch((e) => console.error("书记官总结失败:", e));
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
