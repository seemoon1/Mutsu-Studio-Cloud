"use client";
import React, { useEffect, useRef, useState } from "react";
import {
    ChevronLeft, Phone, Menu, Send, Loader2,
    Brain, Save, Plus, Users, Settings,
    Smartphone, Clock, Globe, X
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { v4 as uuidv4 } from "uuid";
import { LimeChatGroup } from "../types";

const TIMELINE_OPTIONS = [
    { value: 0, label: "0. Early Years / 早年 (Childhood)" },
    { value: 1, label: "1. CRYCHIC Formed / CRYCHIC结成" },
    { value: 2, label: "2. CRYCHIC Disbanded / CRYCHIC解散 (The Rain)" },
    { value: 3, label: "3. MyGO!!!!! Formed / MyGO结成" },
    { value: 4, label: "4. MyGO!!!!! Broken / MyGO解散(并非解散" },
    { value: 5, label: "5. MyGO!!!!! Reunited / MyGO重组(诗超绊..." },
    { value: 6, label: "6. Ave Mujica Formed / Ave Mujica出道" },
    { value: 7, label: "7. Ave Mujica Disbanded / Ave Mujcia解散 (Hypothetical)" },
    { value: 8, label: "8. Reconciliation / 大和解(Mujica重组) " },
    { value: 9, label: "9. Future / 未来 (After Story)" },
];

export const LimeInterface = ({
    currentSession, handleSend, input, setInput, isLoading, dbChars, onExit, updateSessionInfo
}: any) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [showMemberManage, setShowMemberManage] = useState(false);

    const handleUpdateMembers = (newMembers: string[]) => {
        if (!activeGroupId) return;
        const updatedGroups = limeGroups.map(g =>
            g.id === activeGroupId ? { ...g, members: newMembers } : g
        );
        updateSessionInfo(currentSession.id, { limeGroups: updatedGroups });
    };

    const [newGroupName, setNewGroupName] = useState("");
    const [newGroupPov, setNewGroupPov] = useState<'outsider' | 'insider'>('outsider');
    const [newGroupTimeline, setNewGroupTimeline] = useState(6);
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

    const [showMemory, setShowMemory] = useState(false);
    const [localStm, setLocalStm] = useState(currentSession?.stm || "");
    const [localLtm, setLocalLtm] = useState(currentSession?.ltm || "");

    const limeGroups: LimeChatGroup[] = currentSession?.limeGroups || [];

    const activeGroup = limeGroups.find(g => g.id === activeGroupId);


    useEffect(() => {
        setLocalStm(currentSession?.stm || "");
        setLocalLtm(currentSession?.ltm || "");
    }, [currentSession?.stm, currentSession?.ltm]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [currentSession?.messages, activeGroupId]);

    const handleCreateGroup = () => {
        if (!newGroupName || selectedMembers.length === 0) {
            alert("Please enter a name and select at least one member.\n请填写名称并选择成员。");
            return;
        }
        const newGroup: LimeChatGroup = {
            id: uuidv4(),
            name: newGroupName,
            type: selectedMembers.length > 1 ? 'group' : 'duo',
            pov: newGroupPov,
            reality: 'canon',
            timeline: newGroupTimeline,
            members: selectedMembers,
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        const updatedGroups = [newGroup, ...limeGroups];
        updateSessionInfo(currentSession.id, { limeGroups: updatedGroups });

        setIsCreating(false);
        setNewGroupName("");
        setSelectedMembers([]);
        setActiveGroupId(newGroup.id);
    };

    const handleSaveMemory = () => {
        if (updateSessionInfo) {
            updateSessionInfo(currentSession.id, { stm: localStm, ltm: localLtm });
            setShowMemory(false);
        }
    };

    const parseLimeChat = (content: string) => {
        const match = content.match(/<lime_chat>([\s\S]*?)<\/lime_chat>/);
        if (match) {
            try { return JSON.parse(match[1].trim()); }
            catch (e) { return []; }
        }
        return [{ charId: "system", text: content.replace(/<[^>]+>/g, '').trim() }];
    };

    const toggleMember = (id: string) => {
        setSelectedMembers(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
    };

    const LIME_BG = "#8FAADC";
    const LIME_BUBBLE_ME = "#85E249";

    if (!activeGroupId) {
        return (
            <div className="fixed inset-0 z-[500] bg-[#f0f2f5] flex items-center justify-center p-4 md:p-8 font-sans text-gray-800">
                <div className="w-full max-w-6xl h-full bg-white rounded-3xl shadow-2xl overflow-hidden flex border border-gray-200">

                    <div className="w-1/3 bg-gray-50 border-r border-gray-200 flex flex-col">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-white">
                            <div className="flex items-center gap-2 text-emerald-600 font-black text-xl tracking-wider">
                                <Smartphone size={24} /> LIME HUB
                            </div>
                            <button onClick={onExit} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><ChevronLeft size={20} /></button>
                        </div>

                        <div className="p-4">
                            <button onClick={() => setIsCreating(true)} className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-all">
                                <Plus size={18} /> New Group / 新建
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-2">Active Chats</div>
                            {limeGroups.map(g => (
                                <div key={g.id} onClick={() => { setActiveGroupId(g.id); setIsCreating(false); }} className="p-4 bg-white border border-gray-100 rounded-2xl hover:shadow-md cursor-pointer transition-all hover:border-emerald-200 group">
                                    <div className="font-bold text-gray-800 flex items-center gap-2">
                                        <Users size={16} className="text-emerald-500" /> {g.name}
                                    </div>
                                    <div className="text-[10px] text-gray-400 mt-2 flex gap-2">
                                        <span className="bg-gray-100 px-2 py-0.5 rounded border border-gray-200">{g.pov.toUpperCase()}</span>
                                        <span className="bg-gray-100 px-2 py-0.5 rounded border border-gray-200">T-{g.timeline}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="w-2/3 bg-white p-8 flex flex-col overflow-y-auto">
                        {isCreating ? (
                            <div className="max-w-xl mx-auto w-full animate-fade-in-up">
                                <h2 className="text-2xl font-black text-gray-800 mb-6 flex items-center gap-2"><Settings className="text-emerald-500" /> Configure New Link</h2>
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Group Name / 名称</label>
                                        <input value={newGroupName} onChange={e => setNewGroupName(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-emerald-500 transition-colors" placeholder="e.g. MyGO Emergency Meeting" />
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Members / 成员</label>
                                        <div className="grid grid-cols-4 gap-3">
                                            {dbChars.map((c: any) => (
                                                <button key={c.id} onClick={() => toggleMember(c.id)} className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${selectedMembers.includes(c.id) ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-1 ring-emerald-200' : 'bg-white border-gray-200 grayscale opacity-60 hover:grayscale-0 hover:opacity-100'}`}>
                                                    <span className="text-2xl">{c.avatar}</span>
                                                    <span className="text-[10px] font-bold truncate w-full text-center">{c.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2"><Globe size={12} className="inline mr-1" />Mode / 模式</label>
                                            <select value={newGroupPov} onChange={(e: any) => setNewGroupPov(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-emerald-500">
                                                <option value="outsider">Outsider (Director Mode / 导演)</option>
                                                <option value="insider">Insider (Roleplay Mode / 参演)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2"><Clock size={12} className="inline mr-1" />Timeline / 时间点</label>
                                            <select value={newGroupTimeline} onChange={(e: any) => setNewGroupTimeline(Number(e.target.value))} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-emerald-500 font-mono text-xs">
                                                {TIMELINE_OPTIONS.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <button onClick={handleCreateGroup} className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all shadow-lg mt-4 flex items-center justify-center gap-2">
                                        <Send size={18} /> Establish Connection
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-300 select-none">
                                <div className="w-32 h-32 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                                    <Smartphone size={64} className="opacity-20" />
                                </div>
                                <p className="font-bold tracking-widest uppercase text-sm">Select a group to start chatting</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[500] flex flex-col font-sans sm:justify-center sm:items-center bg-gray-900/90 backdrop-blur-sm">
            <div className="w-full h-full sm:w-[420px] sm:h-[850px] sm:rounded-[50px] sm:border-[14px] sm:border-black overflow-hidden flex flex-col relative shadow-[0_0_50px_rgba(0,0,0,0.5)]" style={{ backgroundColor: LIME_BG }}>

                <div className="bg-[#2B2C2E] text-white px-4 py-3 pt-[calc(1rem+env(safe-area-inset-top))] flex items-center justify-between shrink-0 z-20 shadow-md relative">
                    <div className="flex items-center gap-3 min-w-0" onClick={() => setShowMemberManage(true)}>
                        <button onClick={() => setActiveGroupId(null)} className="hover:bg-white/10 p-1 rounded-full transition-colors shrink-0"><ChevronLeft size={24} /></button>
                        <div className="flex flex-col min-w-0">
                            <span className="font-bold text-[15px] truncate">{activeGroup?.name || "Group"}</span>
                            <span className="text-[10px] text-white/50 truncate">
                                {activeGroup?.members.length} members • T-{activeGroup?.timeline}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 text-gray-300 shrink-0">
                        <button onClick={() => setShowMemory(!showMemory)} className={`transition-colors ${showMemory ? 'text-[#32CC70]' : 'hover:text-white'}`}>
                            <Brain size={20} />
                        </button>
                        <Menu size={24} className="hover:text-white cursor-pointer" />
                    </div>
                </div>

                <AnimatePresence>
                    {showMemberManage && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                            className="absolute inset-4 z-50 bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                        >
                            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                                <span className="font-bold text-gray-700">Manage Members</span>
                                <button onClick={() => setShowMemberManage(false)}><X size={20} className="text-gray-400" /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-3 gap-3 content-start">
                                {dbChars.map((c: any) => {
                                    const isIn = activeGroup?.members.includes(c.id);
                                    return (
                                        <button
                                            key={c.id}
                                            onClick={() => {
                                                const current = activeGroup?.members || [];
                                                const next = isIn ? current.filter(m => m !== c.id) : [...current, c.id];
                                                handleUpdateMembers(next);
                                            }}
                                            className={`flex flex-col items-center p-2 rounded-xl border transition-all ${isIn ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-200' : 'bg-white border-gray-100 opacity-50 grayscale'}`}
                                        >
                                            <div className="text-2xl mb-1">{c.avatar}</div>
                                            <span className="text-[10px] font-bold text-gray-600 truncate w-full text-center">{c.name}</span>
                                            <span className="text-[9px] mt-1 font-mono text-gray-400">{isIn ? "KICK" : "ADD"}</span>
                                        </button>
                                    )
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {showMemory && (
                        <motion.div initial={{ y: "-100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "-100%", opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="absolute top-[calc(3.5rem+env(safe-area-inset-top))] left-0 right-0 bg-white z-10 shadow-xl border-b border-gray-200">
                            <div className="p-4 space-y-3">
                                <div>
                                    <label className="text-[10px] font-bold text-[#32CC70] uppercase tracking-widest mb-1 block">STM</label>
                                    <textarea value={localStm} onChange={e => setLocalStm(e.target.value)} className="w-full h-20 bg-gray-50 border border-gray-200 rounded-xl p-2 text-xs text-gray-700 outline-none focus:border-[#32CC70] focus:ring-1 focus:ring-[#32CC70] resize-none" placeholder="Short term context..." />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1 block">LTM</label>
                                    <textarea value={localLtm} onChange={e => setLocalLtm(e.target.value)} className="w-full h-20 bg-gray-50 border border-gray-200 rounded-xl p-2 text-xs text-gray-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 resize-none" placeholder="Long term facts..." />
                                </div>
                                <button onClick={handleSaveMemory} className="w-full py-2 bg-[#32CC70] hover:bg-[#28a75a] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-md"><Save size={14} /> Update Memory</button>
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
                                        <div className="text-[#111111] px-3 py-2 text-[14px] leading-relaxed shadow-sm rounded-2xl rounded-tr-sm break-words" style={{ backgroundColor: LIME_BUBBLE_ME }}>
                                            {text}
                                        </div>
                                        <span className="text-[9px] text-gray-500 mr-1">Read</span>
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
                                    <div key={`${i}-${idx}`} className="flex gap-2 items-start animate-fade-in-up">
                                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg shrink-0 shadow-sm border border-black/5" style={{ backgroundColor: charInfo.hex }}>{charInfo.avatar}</div>
                                        <div className="flex flex-col gap-1 max-w-[75%]">
                                            <span className="text-[10px] text-gray-600 ml-1 font-bold">{charInfo.name}</span>
                                            <div className="bg-white text-[#111111] px-3 py-2 text-[14px] leading-relaxed shadow-sm rounded-2xl rounded-tl-sm break-words border border-black/5">
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
                            <div className="w-9 h-9 rounded-full bg-gray-300 flex items-center justify-center shrink-0"><Loader2 size={14} className="text-white animate-spin" /></div>
                            <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1"><span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span><span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></span><span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></span></div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="bg-[#F2F3F5] px-3 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] flex items-end gap-2 shrink-0 border-t border-gray-200/80">
                    <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors"><Plus size={24} /></button>
                    <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} placeholder="Message..." className="flex-1 bg-white rounded-2xl px-4 py-2.5 max-h-24 outline-none resize-none text-[15px] text-gray-900 border border-gray-200 focus:border-emerald-400 transition-colors" rows={1} />
                    <button disabled={isLoading || !input.trim()} onClick={() => handleSend()} className="p-2 text-[#32CC70] disabled:opacity-50 hover:brightness-110 shrink-0 hover:scale-110 transition-all"><Send size={24} /></button>
                </div>
            </div>
        </div>
    );
}