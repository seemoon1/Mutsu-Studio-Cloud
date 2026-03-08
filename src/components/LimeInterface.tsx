"use client";
import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft, Phone, Menu, Send, Loader2, Brain, Save, Plus, Users, Settings, Smartphone, Clock, Globe, Trash2, Edit2, Cpu, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { v4 as uuidv4 } from "uuid";
import { LimeChatGroup } from "../types";

const TIMELINE_OPTIONS = [
    { value: "0-1", label: "0-1. Early Years / 早年 (Childhood)" },
    { value: "1-2", label: "1-2. CRYCHIC Formed / CRYCHIC活跃期" },
    { value: "2-3", label: "2-3. CRYCHIC Disbanded / CRYCHIC解散期 (The Rain)" },
    { value: "3-4", label: "3-4. MyGO!!!!! Formed / MyGO结成期" },
    { value: "4-5", label: "4-5. MyGO!!!!! Broken / MyGO解散期(并非解散" },
    { value: "5-6", label: "5-6. MyGO!!!!! Reunited / MyGO重组后(诗超绊..." },
    { value: "6-7", label: "6-7. Ave Mujica Formed / Ave Mujica出道" },
    { value: "7-8", label: "7-8. Ave Mujica Disbanded / Ave Mujcia解散期 (Hypothetical)" },
    { value: "8-9", label: "8-9. Reconciliation / 大和解(Mujica重组) " },
    { value: "9-10", label: "9-10. Future / 未来 (After Story)" },
];

export const LimeInterface = ({
    currentSession, handleSend, input, setInput, isLoading, dbChars, onExit, updateSessionInfo
}: any) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const [showMemory, setShowMemory] = useState(false);
    const [showMemberManage, setShowMemberManage] = useState(false);
    const [showModelMenu, setShowModelMenu] = useState(false);

    const [isRenaming, setIsRenaming] = useState(false);
    const [renameText, setRenameText] = useState("");

    const [newGroupName, setNewGroupName] = useState("");
    const [newGroupPov, setNewGroupPov] = useState<'outsider' | 'insider'>('outsider');
    const [newGroupTimeline, setNewGroupTimeline] = useState("5-6");
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

    const [localStm, setLocalStm] = useState(currentSession?.stm || "");
    const [localLtm, setLocalLtm] = useState(currentSession?.ltm || "");

    const limeGroups: LimeChatGroup[] = currentSession?.limeGroups || [];
    const activeGroup = limeGroups.find(g => g.id === activeGroupId);

    const [newGroupReality, setNewGroupReality] = useState<'canon' | 'au'>('canon');
    const [newGroupAuContext, setNewGroupAuContext] = useState("");

    useEffect(() => {
        setLocalStm(currentSession?.stm || "");
        setLocalLtm(currentSession?.ltm || "");
    }, [currentSession?.stm, currentSession?.ltm]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [currentSession?.messages, activeGroupId]);

    const toggleMember = (id: string) => {
        setSelectedMembers(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
    };

    const handleCreateGroup = () => {
        if (!newGroupName) return;
        const newGroup: LimeChatGroup = {
            id: uuidv4(), name: newGroupName, type: selectedMembers.length > 1 ? 'group' : 'duo',
            pov: newGroupPov, reality: 'canon', timeline: newGroupTimeline, members: selectedMembers,
            messages: [], createdAt: Date.now(), updatedAt: Date.now(),
        };
        updateSessionInfo(currentSession.id, { limeGroups: [newGroup, ...limeGroups] });
        setIsCreating(false); setNewGroupName(""); setSelectedMembers([]); setActiveGroupId(newGroup.id);
    };

    const handleDeleteGroup = (id: string, e: any) => {
        e.stopPropagation();
        if (!confirm("确定要解散这个频段吗？数据将无法恢复！")) return;
        updateSessionInfo(currentSession.id, { limeGroups: limeGroups.filter(g => g.id !== id) });
    };

    const handleRenameGroup = () => {
        if (!renameText.trim() || !activeGroupId) return setIsRenaming(false);
        const updated = limeGroups.map(g => g.id === activeGroupId ? { ...g, name: renameText } : g);
        updateSessionInfo(currentSession.id, { limeGroups: updated });
        setIsRenaming(false);
    };

    const handleUpdateMembers = (newMembers: string[]) => {
        if (!activeGroupId) return;
        const updated = limeGroups.map(g => g.id === activeGroupId ? { ...g, members: newMembers } : g);
        updateSessionInfo(currentSession.id, { limeGroups: updated });
    };

    const handleSaveMemory = () => {
        if (updateSessionInfo) updateSessionInfo(currentSession.id, { stm: localStm, ltm: localLtm });
        setShowMemory(false);
    };

    const parseLimeChat = (content: string) => {
        const match = content.match(/<lime_chat>([\s\S]*?)<\/lime_chat>/);
        if (match) { try { return JSON.parse(match[1].trim()); } catch (e) { return []; } }
        return [{ charId: "system", text: content.replace(/<[^>]+>/g, '').trim() }];
    };

    const LIME_BG = "#8FAADC";
    const LIME_BUBBLE_ME = "#85E249";

    if (!activeGroupId) {
        return (
            <div className="fixed inset-0 z-[500] bg-[#f0f2f5] flex items-center justify-center p-4 md:p-8 font-sans">
                <div className="w-full max-w-6xl h-full bg-white rounded-3xl shadow-2xl overflow-hidden flex border border-gray-200">
                    <div className="w-1/3 bg-gray-50 border-r border-gray-200 flex flex-col">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-white">
                            <div className="flex items-center gap-2 text-emerald-600 font-black text-xl"><Smartphone size={24} /> LIME HUB</div>
                            <button onClick={onExit} className="p-2 text-gray-400 hover:text-red-500"><ChevronLeft size={20} /></button>
                        </div>
                        <div className="p-4"><button onClick={() => setIsCreating(true)} className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm"><Plus size={18} /> New Group</button></div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {limeGroups.map(g => (
                                <div key={g.id} onClick={() => { setActiveGroupId(g.id); setIsCreating(false); updateSessionInfo(currentSession.id, { limeGroupId: g.id }); }} className="relative p-4 bg-white border border-gray-100 rounded-2xl hover:shadow-md cursor-pointer transition-all hover:border-emerald-200 group">
                                    <div className="font-bold text-gray-800 flex items-center gap-2 pr-8"><Users size={16} className="text-emerald-500" /> <span className="truncate">{g.name}</span></div>
                                    <div className="text-[10px] text-gray-400 mt-2 flex gap-2"><span className="bg-gray-100 px-2 py-0.5 rounded border border-gray-200">{g.pov.toUpperCase()}</span></div>

                                    <button onClick={(e) => handleDeleteGroup(g.id, e)} className="absolute right-4 top-4 text-red-400 opacity-0 group-hover:opacity-100 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-all"><Trash2 size={16} /></button>
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
                                            {newGroupReality === 'canon' ? (
                                                <select value={newGroupTimeline} onChange={(e: any) => setNewGroupTimeline(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-emerald-500 font-mono text-xs">
                                                    {TIMELINE_OPTIONS.map(opt => (
                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <textarea
                                                    value={newGroupAuContext}
                                                    onChange={e => setNewGroupAuContext(e.target.value)}
                                                    placeholder="输入架空设定，例如：CRYCHIC 从未解散..."
                                                    className="w-full bg-orange-50 border border-orange-200 rounded-xl p-2 text-xs outline-none"
                                                />
                                            )}
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

    let displayTitle = activeGroup?.name || "Group";

    if (activeGroup && activeGroup.type === 'duo' && activeGroup.members?.length === 2) {
        const otherCharId = activeGroup.members.find((m: string) => m !== activeGroup.defaultPovChar);
        const otherChar = dbChars.find((c: any) => c.id === otherCharId);
        displayTitle = otherChar ? otherChar.name : "Unknown";
    }

    return (
        <div className="fixed inset-0 z-[500] flex flex-col font-sans sm:justify-center sm:items-center bg-gray-900/90 backdrop-blur-sm" onClick={() => { setShowMemory(false); setShowMemberManage(false); setShowModelMenu(false); }}>
            <div className="w-full h-full sm:w-[420px] sm:h-[850px] sm:rounded-[50px] sm:border-[14px] sm:border-black overflow-hidden flex flex-col relative shadow-[0_0_50px_rgba(0,0,0,0.5)]" style={{ backgroundColor: LIME_BG }} onClick={e => e.stopPropagation()}>

                <div className="bg-[#2B2C2E] text-white px-4 py-3 pt-[calc(1rem+env(safe-area-inset-top))] flex items-center justify-between shrink-0 z-20 shadow-md relative">
                    <div className="flex items-center gap-3 min-w-0">
                        <button onClick={() => setActiveGroupId(null)} className="hover:bg-white/10 p-1 rounded-full transition-colors shrink-0"><ChevronLeft size={24} /></button>

                        <div className="flex flex-col min-w-0 flex-1">
                            {isRenaming ? (
                                <input
                                    autoFocus value={renameText} onChange={e => setRenameText(e.target.value)}
                                    onBlur={handleRenameGroup} onKeyDown={e => e.key === 'Enter' && handleRenameGroup()}
                                    className="bg-[#1A1A1A] text-white text-[15px] font-bold px-2 py-0.5 rounded outline-none border border-emerald-500 w-[140px]"
                                />
                            ) : (
                                <div
                                    className={`flex items-center gap-1 ${activeGroup?.type === 'group' ? 'group cursor-pointer' : ''}`}
                                    onClick={() => {
                                        if (activeGroup?.type === 'group') {
                                            setIsRenaming(true);
                                            setRenameText(activeGroup?.name || "");
                                        }
                                    }}
                                >
                                    <span className="font-bold text-[15px] truncate max-w-[130px]">{displayTitle}</span>
                                    {activeGroup?.type === 'group' && <Edit2 size={12} className="opacity-0 group-hover:opacity-100 text-gray-400" />}
                                </div>
                            )}
                            <span className="text-[10px] text-white/50 truncate">{activeGroup?.members.length} members • T-{activeGroup?.timeline}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 text-gray-300 shrink-0">
                        <button onClick={() => { setShowMemory(!showMemory); setShowMemberManage(false); setShowModelMenu(false); }} className={`transition-colors ${showMemory ? 'text-[#32CC70]' : 'hover:text-white'}`}><Brain size={20} /></button>
                        <button onClick={() => { setShowMemberManage(!showMemberManage); setShowMemory(false); setShowModelMenu(false); }} className={`transition-colors ${showMemberManage ? 'text-[#32CC70]' : 'hover:text-white'}`}><Users size={20} /></button>
                        <button onClick={() => { setShowModelMenu(!showModelMenu); setShowMemory(false); setShowMemberManage(false); }} className={`transition-colors ${showModelMenu ? 'text-[#32CC70]' : 'hover:text-white'}`}><Menu size={24} /></button>
                    </div>
                </div>

                <AnimatePresence>
                    {showModelMenu && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-[calc(3.5rem+env(safe-area-inset-top))] right-4 bg-[#2B2C2E] border border-gray-700 rounded-xl shadow-xl z-50 w-48 p-2">
                            <div className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-700 mb-1 flex items-center gap-2"><Cpu size={12} /> System Config</div>
                            <div className="px-3 py-2 text-xs text-emerald-400 hover:bg-white/10 rounded-lg cursor-pointer transition-colors">Model settings apply globally.</div>
                            <div className="px-3 py-2 text-[10px] text-gray-500">To change API models, please use the Main Sidebar.</div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {showMemberManage && (
                        <motion.div initial={{ y: "-100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "-100%", opacity: 0 }} className="absolute top-[calc(3.5rem+env(safe-area-inset-top))] left-0 right-0 bg-white z-40 shadow-xl border-b border-gray-200 max-h-[50%] overflow-y-auto">
                            <div className="p-4 bg-gray-50 flex justify-between items-center sticky top-0 z-10 border-b">
                                <span className="font-bold text-gray-700 text-xs uppercase tracking-widest">Manage Group Members</span>
                                <button onClick={() => setShowMemberManage(false)}><X size={18} className="text-gray-400 hover:text-red-500" /></button>
                            </div>
                            {activeGroup?.type === 'group' ? (
                                <div className="p-4 grid grid-cols-4 gap-3">
                                    {dbChars.map((c: any) => {
                                        const isIn = activeGroup?.members.includes(c.id);
                                        return (
                                            <button key={c.id} onClick={() => handleUpdateMembers(isIn ? (activeGroup?.members.filter(m => m !== c.id) || []) : [...(activeGroup?.members || []), c.id])} className={`flex flex-col items-center p-2 rounded-xl border transition-all ${isIn ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-200' : 'bg-white border-gray-100 opacity-50 grayscale'}`}>
                                                <div className="text-2xl mb-1">{c.avatar}</div>
                                                <span className="text-[9px] font-bold text-gray-600 truncate w-full text-center">{c.name}</span>
                                            </button>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="p-6 flex flex-col items-center justify-center gap-4">
                                    <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Current POV / 当前持机人</div>

                                    <div className="w-16 h-16 rounded-full border-4 border-[#32CC70] flex items-center justify-center text-3xl shadow-lg"
                                        style={{ backgroundColor: dbChars.find((c: any) => c.id === activeGroup?.defaultPovChar)?.hex }}>
                                        {dbChars.find((c: any) => c.id === activeGroup?.defaultPovChar)?.avatar}
                                    </div>
                                    <span className="font-bold text-gray-800">
                                        {dbChars.find((c: any) => c.id === activeGroup?.defaultPovChar)?.name}的手机
                                    </span>

                                    <button
                                        onClick={() => {
                                            if (!activeGroup) return;

                                            const otherChar = activeGroup.members.find((m: string) => m !== activeGroup.defaultPovChar);

                                            const updated = limeGroups.map(g => g.id === activeGroupId ? { ...g, defaultPovChar: otherChar } : g);
                                            updateSessionInfo(currentSession.id, { limeGroups: updated });
                                        }}
                                        className="mt-4 px-6 py-2 bg-gray-900 text-white rounded-full text-xs font-bold hover:bg-gray-800 transition-all shadow-md"
                                    >
                                        🔄 切换视角 (Switch Phone)
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {showMemory && (
                        <motion.div initial={{ y: "-100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "-100%", opacity: 0 }} className="absolute top-[calc(3.5rem+env(safe-area-inset-top))] left-0 right-0 bg-white z-30 shadow-xl border-b border-gray-200">
                            <div className="p-4 space-y-3">
                                <div><label className="text-[10px] font-bold text-[#32CC70] uppercase mb-1 block">STM</label><textarea value={localStm} onChange={e => setLocalStm(e.target.value)} className="w-full h-20 bg-gray-50 border border-gray-200 rounded-xl p-2 text-xs text-gray-700 outline-none focus:border-[#32CC70]" /></div>
                                <div><label className="text-[10px] font-bold text-blue-500 uppercase mb-1 block">LTM</label><textarea value={localLtm} onChange={e => setLocalLtm(e.target.value)} className="w-full h-20 bg-gray-50 border border-gray-200 rounded-xl p-2 text-xs text-gray-700 outline-none focus:border-blue-400" /></div>
                                <button onClick={handleSaveMemory} className="w-full py-2 bg-[#32CC70] hover:bg-[#28a75a] text-white text-xs font-bold rounded-xl flex justify-center gap-2"><Save size={14} /> Update</button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div onClick={() => { setShowMemory(false); setShowMemberManage(false); setShowModelMenu(false); }} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide pb-20 relative z-0">
                    {currentSession?.messages.map((msg: any, i: number) => {
                        if (msg.role === 'user') {
                            const text = typeof msg.content === 'string' ? msg.content : msg.content[0]?.text || "";
                            if (!text) return null;
                            return (
                                <div key={i} className="flex gap-2 items-end justify-end animate-fade-in-up">
                                    <div className="flex flex-col gap-1 max-w-[75%] items-end">
                                        <div className="text-gray-900 px-3 py-2 text-[14px] font-medium leading-relaxed shadow-sm rounded-2xl rounded-tr-sm break-words" style={{ backgroundColor: LIME_BUBBLE_ME }}>{text}</div>
                                    </div>
                                </div>
                            );
                        }
                        if (msg.role === 'assistant' && msg.content) {
                            const chatArray = parseLimeChat(msg.content);
                            return chatArray.map((chatObj: any, idx: number) => {
                                const charInfo = dbChars.find((c: any) => c.id === chatObj.charId) || { name: chatObj.charId || "System", avatar: "👤", hex: "#cccccc" };
                                return (
                                    <div key={`${i}-${idx}`} className="flex gap-2 items-start animate-fade-in-up" style={{ animationDelay: `${idx * 0.1}s` }}>
                                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg shrink-0 shadow-sm border border-black/5" style={{ backgroundColor: charInfo.hex }}>{charInfo.avatar}</div>
                                        <div className="flex flex-col gap-1 max-w-[75%]">
                                            <span className="text-[10px] text-gray-700 ml-1 font-bold">{charInfo.name}</span>
                                            <div className="bg-white text-gray-900 font-medium px-3 py-2 text-[14px] leading-relaxed shadow-sm rounded-2xl rounded-tl-sm break-words border border-black/5">{chatObj.text}</div>
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
                            <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1"><span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span><span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></span><span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></span></div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="bg-[#F2F3F5] px-3 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] flex items-end gap-2 shrink-0 border-t border-gray-200/80">
                    <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors"><Plus size={24} /></button>
                    <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} placeholder="Message..." className="flex-1 bg-white rounded-2xl px-4 py-2.5 max-h-24 outline-none resize-none text-[15px] text-gray-900 font-medium border border-gray-200 focus:border-emerald-400 transition-colors" rows={1} />
                    <button disabled={isLoading || !input.trim()} onClick={() => handleSend()} className="p-2 text-[#32CC70] disabled:opacity-50 hover:brightness-110 shrink-0 hover:scale-110 transition-all"><Send size={24} /></button>
                </div>
            </div>
        </div>
    );
}