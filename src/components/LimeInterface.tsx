"use client";
import React, { useEffect, useRef, useState } from "react";
import {
    ChevronLeft, Phone, Menu, Send, Loader2,
    Brain, Save, Plus, Users, Settings, Smartphone,
    Clock, Globe, Trash2, Edit2, Cpu, X, RefreshCcw,
    Square,
} from "lucide-react";
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
    currentSession, handleSend, input, setInput, isLoading, dbChars, onExit, updateSessionInfo,
    apiProvider, setApiProvider, selectedModel, setSelectedModel, MODEL_DATA,
    stopGeneration,
    handleDeleteMessage,
    handleRegenerate
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

    const [editingAuId, setEditingAuId] = useState<string | null>(null);
    const [tempAuContext, setTempAuContext] = useState("");

    useEffect(() => {
        setLocalStm(activeGroup?.stm || "");
        setLocalLtm(activeGroup?.ltm || "");
    }, [activeGroup?.stm, activeGroup?.ltm, activeGroupId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [currentSession?.messages, activeGroupId]);

    const toggleMember = (id: string) => {
        setSelectedMembers(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
    };

    const handleCreateGroup = () => {
        if (!newGroupName) return;
        if (selectedMembers.length < 2) {
            alert("At least 2 members are required! (2 for Duo, 3+ for Group)");
            return;
        }

        const isDuo = selectedMembers.length === 2;
        const type = isDuo ? 'duo' : 'group';
        const defaultPov = isDuo ? selectedMembers[0] : undefined;
        const finalPov = newGroupPov;

        let finalGroupName = newGroupName.trim();

        let auLabelStr = "";

        if (newGroupReality === 'canon') {
            const isDuplicate = limeGroups.some(g => g.reality === 'canon' && g.name === finalGroupName && g.timeline === newGroupTimeline && g.pov === finalPov);
            if (isDuplicate) {
                alert(`⚠️ 在时间线 T-${newGroupTimeline} 下，已存在名为 "${finalGroupName}" 的[${finalPov}] 模式群聊！`);
                return;
            }
        } else {
            const auGroups = limeGroups.filter(g => g.reality === 'au' && g.name === finalGroupName);
            const auCount = auGroups.length;
            let suffix = "1st";
            if (auCount === 1) suffix = "2nd";
            else if (auCount === 2) suffix = "3rd";
            else if (auCount >= 3) suffix = `${auCount + 1}th`;
            auLabelStr = `AU_${suffix}`;
        }

        const newGroup: LimeChatGroup = {
            id: uuidv4(),
            name: finalGroupName,
            type: type,
            pov: finalPov,
            reality: newGroupReality,
            auLabel: auLabelStr,
            auContext: newGroupAuContext,
            timeline: newGroupTimeline,
            members: selectedMembers,
            defaultPovChar: defaultPov,
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        updateSessionInfo(currentSession.id, {
            limeGroups: [newGroup, ...limeGroups],
            limeGroupId: newGroup.id
        });
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
        if (!confirm("⚠️ 确定要变更群成员吗？")) return;
        const updated = limeGroups.map(g => g.id === activeGroupId ? { ...g, members: newMembers } : g);
        updateSessionInfo(currentSession.id, { limeGroups: updated });
    };

    const handleSaveMemory = () => {
        if (!confirm("💾 确定要覆盖当前的记忆面板吗？")) return;
        if (updateSessionInfo && activeGroupId) {
            const updated = limeGroups.map(g => g.id === activeGroupId ? { ...g, stm: localStm, ltm: localLtm } : g);
            updateSessionInfo(currentSession.id, { limeGroups: updated });
            setShowMemory(false);
        }
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
                <div className="w-full max-w-6xl h-full bg-white md:rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-gray-200">

                    <div className="w-full md:w-1/3 h-[40%] md:h-full bg-gray-50 border-b md:border-b-0 md:border-r border-gray-200 flex flex-col">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-white">
                            <div className="flex items-center gap-2 text-emerald-600 font-black text-xl"><Smartphone size={24} /> LIME HUB</div>
                            <button onClick={onExit} className="p-2 text-gray-400 hover:text-red-500"><ChevronLeft size={20} /></button>
                        </div>
                        <div className="p-4"><button onClick={() => setIsCreating(true)} className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm"><Plus size={18} /> New Group</button></div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-2">Active Chats</div>
                            {limeGroups.map(g => (
                                <div key={g.id} className="relative p-4 bg-white border border-gray-100 rounded-2xl hover:shadow-md transition-all hover:border-emerald-200 group">

                                    {editingAuId === g.id ? (
                                        <div className="flex flex-col gap-2">
                                            <span className="text-[10px] font-bold text-purple-600">Edit AU Context</span>
                                            <textarea value={tempAuContext} onChange={e => setTempAuContext(e.target.value)} className="w-full bg-purple-50 border border-purple-300 rounded p-2 text-xs outline-none resize-none text-purple-900 font-medium" rows={3} />
                                            <div className="flex gap-2 justify-end">
                                                <button onClick={() => setEditingAuId(null)} className="px-3 py-1 text-xs text-gray-500 bg-gray-100 rounded font-bold">Cancel</button>
                                                <button onClick={() => {
                                                    if (!confirm("⚙️ 确定要修改当前频段的架空世界观吗？")) return;
                                                    const updated = limeGroups.map(lg => lg.id === g.id ? { ...lg, auContext: tempAuContext } : lg);
                                                    updateSessionInfo(currentSession.id, { limeGroups: updated });
                                                    setEditingAuId(null);
                                                }} className="px-3 py-1 text-xs text-white bg-purple-500 hover:bg-purple-600 rounded font-bold shadow-sm">Save</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div onClick={() => { setActiveGroupId(g.id); setIsCreating(false); updateSessionInfo(currentSession.id, { limeGroupId: g.id }); }} className="cursor-pointer">
                                            <div className="font-bold text-gray-800 flex items-center gap-2 pr-16"><Users size={16} className="text-emerald-500" /> <span className="truncate">{g.name}</span></div>
                                            <div className="text-[10px] text-gray-400 mt-2 flex gap-2">
                                                <span className="bg-gray-100 px-2 py-0.5 rounded border border-gray-200">{g.pov.toUpperCase()}</span>
                                                <span className="bg-purple-50 px-2 py-0.5 rounded border border-purple-100 text-purple-600 font-bold">
                                                    {g.reality === 'au' ? (g.auLabel || 'AU') : `T-${g.timeline}`}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {g.reality === 'au' && editingAuId !== g.id && (
                                        <button onClick={(e) => { e.stopPropagation(); setEditingAuId(g.id); setTempAuContext(g.auContext || ""); }} className="absolute right-12 top-4 text-purple-400 opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:text-purple-600 hover:bg-purple-50 p-1.5 rounded-lg transition-all z-10">
                                            <Edit2 size={16} />
                                        </button>
                                    )}

                                    <button onClick={(e) => handleDeleteGroup(g.id, e)} className="absolute right-4 top-4 text-red-400 opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-all z-10">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="w-full md:w-2/3 h-[60%] md:h-full bg-white p-4 md:p-8 flex flex-col overflow-y-auto">
                        {isCreating ? (
                            <div className="max-w-xl mx-auto w-full animate-fade-in-up space-y-6">
                                <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
                                    <Settings className="text-emerald-600" /> Configure New Link
                                </h2>

                                <div>
                                    <label className="text-xs font-bold text-gray-900 uppercase tracking-wider block mb-2">Group Name / 名称</label>
                                    <input
                                        value={newGroupName}
                                        onChange={e => setNewGroupName(e.target.value)}
                                        className="w-full bg-white border-2 border-gray-300 rounded-xl p-3 text-gray-900 font-bold outline-none focus:border-emerald-500 focus:bg-emerald-50/30 transition-all placeholder-gray-400"
                                        placeholder="e.g. MyGO Emergency Meeting"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-900 uppercase tracking-wider block mb-2">
                                        Members / 成员 ({selectedMembers.length})
                                    </label>
                                    <div className="grid grid-cols-4 gap-3">
                                        {dbChars.map((c: any) => {
                                            const isSelected = selectedMembers.includes(c.id);
                                            const isUser = c.id === 'user';
                                            const isDisabled = isUser && newGroupPov === 'outsider';

                                            return (
                                                <button
                                                    key={c.id}
                                                    onClick={() => !isDisabled && toggleMember(c.id)}
                                                    disabled={isDisabled}
                                                    className={`p-2 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${isDisabled ? 'bg-gray-200 border-gray-300 opacity-30 cursor-not-allowed grayscale' :
                                                        isSelected ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm' :
                                                            'bg-gray-50 border-gray-200 text-gray-500 hover:border-emerald-300 hover:bg-white'
                                                        }`}
                                                >
                                                    <span className="text-2xl drop-shadow-sm">{c.avatar}</span>
                                                    <span className="text-[11px] font-bold truncate w-full text-center">{c.name}</span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                                    <div>
                                        <label className="text-xs font-bold text-gray-900 uppercase tracking-wider block mb-2 flex items-center gap-2">
                                            <Globe size={14} /> Mode / 观测模式
                                        </label>
                                        <select
                                            value={newGroupPov}
                                            onChange={(e: any) => {
                                                const mode = e.target.value;
                                                setNewGroupPov(mode);
                                                if (mode === 'outsider') {
                                                    setSelectedMembers(prev => prev.filter(m => m !== 'user'));
                                                }
                                            }}
                                            className="w-full bg-white border-2 border-gray-300 rounded-xl p-3 text-sm font-bold text-gray-900 outline-none focus:border-emerald-500"
                                        >
                                            <option value="outsider">Outsider (Director / 导演模式)</option>
                                            <option value="insider">Insider (Actor / 演员模式)</option>
                                        </select>
                                    </div>


                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                                <Clock size={14} /> Timeline / 世界线
                                            </label>
                                            <div className="flex bg-gray-200 p-0.5 rounded-lg">
                                                <button onClick={() => setNewGroupReality('canon')} className={`px-2 py-0.5 text-[10px] font-bold rounded ${newGroupReality === 'canon' ? 'bg-white text-gray-900 shadow' : 'text-gray-500'}`}>Canon</button>
                                                <button onClick={() => setNewGroupReality('au')} className={`px-2 py-0.5 text-[10px] font-bold rounded ${newGroupReality === 'au' ? 'bg-purple-500 text-white shadow' : 'text-gray-500'}`}>AU</button>
                                            </div>
                                        </div>

                                        {newGroupReality === 'canon' ? (
                                            <select value={newGroupTimeline} onChange={(e: any) => setNewGroupTimeline(e.target.value)} className="w-full bg-white border-2 border-gray-300 rounded-xl p-3 text-sm font-bold text-gray-900 outline-none focus:border-emerald-500">
                                                {TIMELINE_OPTIONS.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                                            </select>
                                        ) : (
                                            <textarea
                                                value={newGroupAuContext}
                                                onChange={e => setNewGroupAuContext(e.target.value)}
                                                className="w-full bg-purple-50 border-2 border-purple-200 rounded-xl p-3 text-sm font-bold text-purple-900 outline-none focus:border-purple-500 resize-none h-24"
                                                placeholder="在此输入架空世界设定 (例如：丰川祥子从未离开 CRYCHIC...)"
                                            />
                                        )}
                                    </div>
                                </div>

                                <button onClick={handleCreateGroup} className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-xl font-black text-lg shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2 transform active:scale-95">
                                    <Send size={20} /> Establish Connection
                                </button>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-300 select-none">
                                <Smartphone size={80} className="opacity-20 mb-6" />
                                <p className="font-black tracking-[0.2em] uppercase text-sm text-gray-400">Select or Create a Frequency</p>
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
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        <button onClick={() => setActiveGroupId(null)} className="hover:bg-white/10 p-2 -ml-2 rounded-full transition-colors shrink-0 z-50 cursor-pointer pointer-events-auto">
                            <ChevronLeft size={28} />
                        </button>

                        <div className="flex flex-col min-w-0 flex-1">
                            {isRenaming ? (
                                <input autoFocus value={renameText} onChange={e => setRenameText(e.target.value)} onBlur={handleRenameGroup} onKeyDown={e => e.key === 'Enter' && handleRenameGroup()} className="bg-[#1A1A1A] text-white text-[15px] font-bold px-2 py-0.5 rounded outline-none border border-emerald-500 w-[140px]" />
                            ) : (
                                <div className={`flex items-center gap-1 ${activeGroup?.type === 'group' ? 'group cursor-pointer' : ''}`} onClick={() => { if (activeGroup?.type === 'group') { setIsRenaming(true); setRenameText(activeGroup?.name || ""); } }}>
                                    <span className="font-bold text-[15px] truncate max-w-[130px]">{displayTitle}</span>
                                    {activeGroup?.type === 'group' && <Edit2 size={12} className="opacity-0 group-hover:opacity-100 text-gray-400" />}
                                </div>
                            )}
                            <span className="text-[10px] text-white/50 truncate flex items-center gap-1">
                                {activeGroup?.type === 'duo' ? (
                                    <><span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>POV: {dbChars.find((c: any) => c.id === activeGroup.defaultPovChar)?.name}</>
                                ) : (
                                    <>{activeGroup?.members.length} members • {activeGroup?.reality === 'au' ? 'AU World' : `T-${activeGroup?.timeline}`}</>
                                )}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-6 text-gray-300 shrink-0 ml-4">
                        <button onClick={() => { setShowMemory(!showMemory); setShowMemberManage(false); setShowModelMenu(false); }} className={`transition-colors ${showMemory ? 'text-[#32CC70]' : 'hover:text-white'}`}><Brain size={22} /></button>

                        <button onClick={() => { setShowMemberManage(!showMemberManage); setShowMemory(false); setShowModelMenu(false); }} className={`transition-colors ${showMemberManage ? 'text-[#32CC70]' : 'hover:text-white'}`}>
                            {activeGroup?.type === 'group' ? <Users size={22} /> : <RefreshCcw size={22} />}
                        </button>

                        <button onClick={() => { setShowModelMenu(!showModelMenu); setShowMemory(false); setShowMemberManage(false); }} className={`transition-colors ${showModelMenu ? 'text-[#32CC70]' : 'hover:text-white'}`}><Menu size={24} /></button>
                    </div>
                </div>

                <AnimatePresence>
                    {showModelMenu && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-[calc(3.5rem+env(safe-area-inset-top))] right-4 bg-[#2B2C2E] border border-gray-700 rounded-xl shadow-xl z-50 w-64 p-3">
                            <div className="px-1 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-700 mb-3 flex items-center gap-2">
                                <Cpu size={12} /> API & Model Config
                            </div>

                            <div className="flex bg-black/40 p-1 rounded-lg mb-3">
                                <button onClick={() => setApiProvider('deepseek')} className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${apiProvider === 'deepseek' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}>Domestic</button>
                                <button onClick={() => setApiProvider('openrouter')} className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${apiProvider === 'openrouter' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}>Router</button>
                                <button onClick={() => setApiProvider('siliconflow')} className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${apiProvider === 'siliconflow' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}>Silicon</button>
                                <button onClick={() => setApiProvider('google')} className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${apiProvider === 'google' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}>Google</button>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] text-gray-400 font-bold">Select Model</label>
                                <select
                                    value={selectedModel}
                                    onChange={(e) => setSelectedModel(e.target.value)}
                                    className="w-full bg-[#1A1A1A] border border-gray-600 text-white text-xs rounded-lg px-2 py-2 outline-none focus:border-emerald-500"
                                >
                                    {MODEL_DATA?.filter((g: any) => {
                                        const gn = g.groupName.toLowerCase();
                                        if (apiProvider === 'deepseek') return gn.includes("domestic");
                                        if (apiProvider === 'google') return gn.includes("gemini (google)");
                                        if (apiProvider === 'siliconflow') return gn.includes("siliconflow");
                                        if (apiProvider === 'openrouter') return gn.includes("openrouter");
                                        return true;
                                    }).flatMap((g: any) => g.models).map((m: any) => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </select>
                            </div>
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
                    {activeGroup?.messages?.map((msg: any, i: number) => {

                        if (msg.role === 'user') {
                            const text = typeof msg.content === 'string' ? msg.content : msg.content[0]?.text || "";
                            if (!text) return null;

                            if (activeGroup.type === 'duo') {
                                const cleanText = text.replace("(Director's Instruction: ", "").replace(")", "");
                                return (
                                    <div key={i} className="group/msg flex justify-center animate-fade-in-up w-full my-2 relative">
                                        <div className="absolute left-4 opacity-100 md:opacity-0 md:group-hover/msg:opacity-100 transition-opacity">
                                            <button onClick={() => handleDeleteMessage(activeGroupId, i)} className="p-1 text-gray-400 hover:text-red-500 bg-white/80 rounded-full shadow-sm border border-gray-100"><Trash2 size={12} /></button>
                                        </div>
                                        <div className="bg-black/10 px-4 py-1.5 rounded-full text-[10px] text-gray-500 font-bold flex items-center gap-1 shadow-inner">
                                            🎬 导演指令: {cleanText}
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div key={i} className="group/msg flex gap-2 items-end justify-end animate-fade-in-up w-full relative">
                                    <div className="absolute right-[80%] opacity-100 md:opacity-0 md:group-hover/msg:opacity-100 transition-opacity mr-2">
                                        <button onClick={() => handleDeleteMessage(activeGroupId, i)} className="p-1.5 text-gray-400 hover:text-red-500 bg-gray-100/80 rounded-full shadow-sm"><Trash2 size={12} /></button>
                                    </div>
                                    <div className="flex flex-col gap-1 max-w-[75%] items-end">
                                        <div className="text-gray-900 px-3 py-2 text-[14px] font-medium leading-relaxed shadow-sm rounded-2xl rounded-tr-sm break-words" style={{ backgroundColor: LIME_BUBBLE_ME }}>
                                            {text}
                                        </div>
                                        <span className="text-[9px] text-gray-400 mr-1">Read</span>
                                    </div>
                                </div>
                            );
                        }

                        if (msg.role === 'assistant' && msg.content) {
                            const chatArray = parseLimeChat(msg.content);

                            return (
                                <div key={i} className="group/msg flex flex-col gap-2 w-full relative">

                                    <div className="absolute top-1/2 -translate-y-1/2 right-0 md:-right-10 opacity-100 md:opacity-0 md:group-hover/msg:opacity-100 flex flex-col gap-1 transition-opacity z-10">
                                        {i === activeGroup.messages.length - 1 && (
                                            <button onClick={() => handleRegenerate(activeGroupId)} className="p-1.5 text-gray-400 hover:text-blue-500 bg-white/90 rounded-full shadow-sm border border-gray-100"><RefreshCcw size={12} /></button>
                                        )}
                                        <button onClick={() => handleDeleteMessage(activeGroupId, i)} className="p-1.5 text-gray-400 hover:text-red-500 bg-white/90 rounded-full shadow-sm border border-gray-100"><Trash2 size={12} /></button>
                                    </div>

                                    {chatArray.map((chatObj: any, idx: number) => {
                                        if (chatObj.charId === 'system') {
                                            return <div key={idx} className="text-center text-[10px] text-gray-400 font-bold my-2 bg-black/5 w-fit mx-auto px-3 py-1 rounded-full">{chatObj.text}</div>;
                                        }

                                        const isPovOwner = chatObj.charId === activeGroup.defaultPovChar;
                                        const charInfo = dbChars.find((c: any) => c.id === chatObj.charId) || { name: chatObj.charId || "User", avatar: "👤", hex: "#cccccc" };

                                        if (isPovOwner) {
                                            return (
                                                <div key={`${i}-${idx}`} className="flex gap-2 items-end justify-end animate-fade-in-up w-full mt-1">
                                                    <div className="flex flex-col gap-1 max-w-[75%] items-end">
                                                        <div className="text-gray-900 px-3 py-2 text-[14px] font-medium leading-relaxed shadow-sm rounded-2xl rounded-tr-sm break-words" style={{ backgroundColor: LIME_BUBBLE_ME }}>
                                                            {chatObj.text}
                                                        </div>
                                                        <span className="text-[9px] text-gray-400 mr-1">Read</span>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        else {
                                            return (
                                                <div key={`${i}-${idx}`} className="flex gap-2 items-start animate-fade-in-up mt-1 relative pr-8 md:pr-0">
                                                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg shrink-0 shadow-sm border border-black/5" style={{ backgroundColor: charInfo.hex }}>{charInfo.avatar}</div>
                                                    <div className="flex flex-col gap-1 max-w-[75%]">
                                                        {activeGroup.type === 'group' && <span className="text-[10px] text-gray-600 ml-1 font-bold">{charInfo.name}</span>}
                                                        <div className="bg-white text-gray-900 font-medium px-3 py-2 text-[14px] leading-relaxed shadow-sm rounded-2xl rounded-tl-sm break-words border border-black/5">
                                                            {chatObj.text}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }
                                    })}
                                </div>
                            );
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
                    <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                        <Plus size={24} />
                    </button>

                    <textarea
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        placeholder="Message..."
                        className="flex-1 bg-white rounded-2xl px-4 py-2.5 max-h-24 outline-none resize-none text-[15px] text-gray-900 font-medium border border-gray-200 focus:border-emerald-400 transition-colors"
                        rows={1}
                    />

                    {isLoading ? (
                        <button
                            onClick={stopGeneration}
                            className="p-2 text-red-500 hover:text-red-600 shrink-0 hover:scale-110 transition-all animate-pulse"
                            title="Stop Generating"
                        >
                            <Square fill="currentColor" size={24} />
                        </button>
                    ) : (
                        <button
                            disabled={!input.trim()}
                            onClick={() => handleSend()}
                            className="p-2 text-[#32CC70] disabled:opacity-50 hover:brightness-110 shrink-0 hover:scale-110 transition-all"
                            title="Send"
                        >
                            <Send size={24} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}