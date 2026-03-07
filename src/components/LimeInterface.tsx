"use client";
import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft, Save, Menu, Send, Loader2, Brain } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export const LimeInterface = ({
    currentSession, 
    handleSend, 
    input, 
    setInput, 
    isLoading, 
    dbChars, 
    onExit, 
    updateSessionInfo
}: any) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [showMemory, setShowMemory] = useState(false);
    const [localStm, setLocalStm] = useState(currentSession?.stm || "");
    const[localLtm, setLocalLtm] = useState(currentSession?.ltm || "");

    useEffect(() => {
        setLocalStm(currentSession?.stm || "");
        setLocalLtm(currentSession?.ltm || "");
    }, [currentSession?.stm, currentSession?.ltm]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [currentSession?.messages]);

    const handleSaveMemory = () => {
        if (updateSessionInfo) {
            updateSessionInfo(currentSession.id, { stm: localStm, ltm: localLtm });
            setShowMemory(false); 
        } else {
            console.error("updateSessionInfo is missing!");
        }
    };

    const parseLimeChat = (content: string) => {
        const match = content.match(/<lime_chat>([\s\S]*?)<\/lime_chat>/);
        if (match) {
            try {
                return JSON.parse(match[1].trim());
            } catch (e) {
                console.error("LIME JSON Parse Error", e);
                return[];
            }
        }
        return [{ charId: "system", text: content.replace(/<[^>]+>/g, '').trim() }];
    };

    const LIME_BG = "#8FAADC";
    const LIME_BUBBLE_ME = "#85E249";

    const groupName = currentSession?.limeGroupId === 'mygo' ? "MyGO!!!!!" : "CRYCHIC";

    return (
        <div className="fixed inset-0 z-[500] flex flex-col font-sans sm:justify-center sm:items-center bg-gray-900">
            <div 
                className="w-full h-full sm:w-[400px] sm:h-[800px] sm:rounded-[40px] sm:border-[12px] sm:border-black overflow-hidden flex flex-col relative shadow-2xl"
                style={{ backgroundColor: LIME_BG }}
            >
                <div className="bg-[#2B2C2E] text-white px-4 py-3 pt-[calc(1rem+env(safe-area-inset-top))] flex items-center justify-between shrink-0 z-20 shadow-md relative">
                    <div className="flex items-center gap-3">
                        <button onClick={onExit} className="hover:bg-white/10 p-1 rounded-full transition-colors"><ChevronLeft size={24} /></button>
                        <span className="font-bold text-[15px]">{groupName}</span>
                    </div>
                    <div className="flex items-center gap-4 text-gray-300">
                        <button onClick={() => setShowMemory(!showMemory)} className={`transition-colors ${showMemory ? 'text-[#32CC70]' : 'hover:text-white'}`}>
                            <Brain size={20} />
                        </button>
                        <Menu size={24} className="hover:text-white cursor-pointer" />
                    </div>
                </div>

                <AnimatePresence>
                    {showMemory && (
                        <motion.div 
                            initial={{ y: "-100%", opacity: 0 }} 
                            animate={{ y: 0, opacity: 1 }} 
                            exit={{ y: "-100%", opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="absolute top-[calc(3.5rem+env(safe-area-inset-top))] left-0 right-0 bg-white z-10 shadow-xl border-b border-gray-200"
                        >
                            <div className="p-4 space-y-3">
                                <div>
                                    <label className="text-[10px] font-bold text-[#32CC70] uppercase tracking-widest mb-1 block">STM (Short Term Memory)</label>
                                    <textarea 
                                        value={localStm} onChange={e => setLocalStm(e.target.value)}
                                        className="w-full h-20 bg-gray-50 border border-gray-200 rounded-xl p-2 text-xs text-gray-700 outline-none focus:border-[#32CC70] focus:ring-1 focus:ring-[#32CC70] resize-none"
                                        placeholder="当前对话的短期记忆将自动生成在这里..."
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1 block">LTM (Long Term Memory)</label>
                                    <textarea 
                                        value={localLtm} onChange={e => setLocalLtm(e.target.value)}
                                        className="w-full h-20 bg-gray-50 border border-gray-200 rounded-xl p-2 text-xs text-gray-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 resize-none"
                                        placeholder="固化的长期记忆..."
                                    />
                                </div>
                                <button 
                                    onClick={handleSaveMemory}
                                    className="w-full py-2 bg-[#32CC70] hover:bg-[#28a75a] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-md"
                                >
                                    <Save size={14} /> 固化记忆
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div onClick={() => setShowMemory(false)} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide pb-20 relative z-0">
                    {currentSession?.messages.map((msg: any, i: number) => {
                        if (msg.role === 'user') {
                            const text = typeof msg.content === 'string' ? msg.content : msg.content[0]?.text || "";
                            if (!text) return null;
                            return (
                                <div key={i} className="flex gap-2 items-end justify-end animate-fade-in-up">
                                    <div className="flex flex-col gap-1 max-w-[75%] items-end">
                                        <span className="text-[10px] text-gray-600 mr-1 mb-1">已读</span>
                                        <div className="text-[#111111] px-3 py-2 text-[14px] leading-relaxed shadow-sm rounded-2xl rounded-tr-sm break-words" style={{ backgroundColor: LIME_BUBBLE_ME }}>
                                            {text}
                                        </div>
                                    </div>
                                </div>
                            );
                        }

                        if (msg.role === 'assistant') {
                            if (!msg.content) return null;
                            const chatArray = parseLimeChat(msg.content);
                            
                            return chatArray.map((chatObj: any, idx: number) => {
                                const charInfo = dbChars.find((c: any) => c.id === chatObj.charId) || { name: chatObj.charId || "System", avatar: "👤", hex: "#cccccc" };
                                
                                return (
                                    <div key={`${i}-${idx}`} className="flex gap-2 items-start animate-fade-in-up" style={{ animationDelay: `${idx * 0.1}s` }}>
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 shadow-sm border border-black/5" style={{ backgroundColor: charInfo.hex }}>
                                            {charInfo.avatar}
                                        </div>
                                        <div className="flex flex-col gap-1 max-w-[75%]">
                                            <span className="text-[11px] text-gray-700 ml-1 font-bold">{charInfo.name}</span>
                                            <div className="bg-white text-[#111111] px-3 py-2 text-[14px] leading-relaxed shadow-sm rounded-2xl rounded-tl-sm break-words">
                                                {chatObj.text}
                                            </div>
                                        </div>
                                    </div>
                                );
                            });
                        }
                        return null;
                    })}
                    
                    {isLoading && (
                        <div className="flex gap-2 items-start animate-fade-in-up">
                            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center shrink-0">
                                <Loader2 size={16} className="text-white animate-spin" />
                            </div>
                            <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></span>
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="bg-[#F5F5F5] px-3 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] flex items-end gap-2 shrink-0 border-t border-gray-200">
                    <button className="p-2 text-gray-500 hover:text-gray-700"><div className="w-6 h-6 border-2 border-current rounded-full flex items-center justify-center font-bold">+</div></button>
                    <textarea 
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                        placeholder="Aa"
                        className="flex-1 bg-white rounded-xl px-3 py-2 max-h-24 outline-none resize-none text-[14px] border border-gray-300"
                        rows={1}
                    />
                    <button 
                        disabled={isLoading || !input.trim()}
                        onClick={() => handleSend()}
                        className="p-2 text-[#32CC70] disabled:opacity-50 hover:brightness-110 shrink-0"
                    >
                        <Send size={24} />
                    </button>
                </div>
            </div>
        </div>
    );
}