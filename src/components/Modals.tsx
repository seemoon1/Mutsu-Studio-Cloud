"use client";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, X, Edit2, Save, Key, Download, Lock } from "lucide-react";
import { useState, useEffect } from "react";

export const WorldInfoModal = ({ isOpen, onClose, title, content, setContent, onSave }: any) => (
    <AnimatePresence>
        {isOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-xl shadow-2xl w-[500px] border p-5 flex flex-col gap-4">
                    <div className="flex justify-between items-center"><div className="font-bold flex items-center gap-2 text-gray-700"><BookOpen size={16} />{title}</div><button onClick={onClose}><X /></button></div>
                    <textarea className="w-full h-48 border rounded-lg p-3 text-xs outline-none focus:ring-2 focus:ring-emerald-400" placeholder="在此输入设定..." value={content} onChange={e => setContent(e.target.value)}></textarea>
                    <div className="flex justify-end"><button onClick={onSave} className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-xs hover:bg-emerald-600 shadow-md flex items-center gap-2"><Save size={12} /> SAVE</button></div>
                </motion.div>
            </motion.div>
        )}
    </AnimatePresence>
);

export const EditModal = ({ isOpen, onClose, content, setContent, onConfirm }: any) => (
    <AnimatePresence>
        {isOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white rounded-2xl shadow-2xl w-[600px] max-w-full overflow-hidden flex flex-col max-h-[80vh]">
                    <div className="p-4 border-b flex justify-between items-center bg-gray-50"><div className="font-bold text-gray-700 flex items-center gap-2"><Edit2 size={16} /> 编辑消息</div><button onClick={onClose}><X size={20} /></button></div>
                    <div className="p-4 flex-1 overflow-auto"><textarea value={content} onChange={(e) => setContent(e.target.value)} className="w-full h-64 p-4 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none resize-none text-sm" /></div>
                    <div className="p-4 border-t bg-gray-50 flex justify-end gap-2"><button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg text-sm">取消</button><button onClick={onConfirm} className="px-6 py-2 bg-emerald-500 text-white rounded-lg text-sm hover:bg-emerald-600 shadow-md">确认重试</button></div>
                </motion.div>
            </motion.div>
        )}
    </AnimatePresence>
);

export const SuggestionModal = ({ isOpen, onClose, content, onConfirm }: any) => (
    <AnimatePresence>
        {isOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-xl shadow-2xl w-[500px] border overflow-hidden">
                    <div className="bg-emerald-50 p-4 border-b border-emerald-100 flex items-center gap-2">
                        <span className="text-xl">💡</span>
                        <span className="font-bold text-emerald-800 text-sm">采纳剧情建议 / Adopt Suggestion</span>
                    </div>

                    <div className="p-6">
                        <div className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Preview content:</div>
                        <div className="bg-gray-50 p-4 rounded-lg border text-sm text-gray-700 leading-relaxed font-medium">
                            {content}
                        </div>
                        <div className="mt-4 text-xs text-gray-400">
                            * 点击确认将直接以你的身份发送此内容。
                        </div>
                    </div>

                    <div className="p-4 bg-gray-50 border-t flex justify-end gap-2">
                        <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg text-xs font-bold">取消 / Cancel</button>
                        <button onClick={onConfirm} className="px-6 py-2 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 shadow-md flex items-center gap-2">
                            确认发送 / Send
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        )}
    </AnimatePresence>
);

export const ApiKeysModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
    const [keys, setKeys] = useState({ deepseek: "", openrouter: "", google: "", tavily: "", volcengine: "", volc_ep_image: "", volc_ep_video: "", volc_ep_chat: "", fal: "", accessCode: "" });

    useEffect(() => {
        if (isOpen) {
            setKeys({
                deepseek: localStorage.getItem("mutsu_key_deepseek") || "",
                openrouter: localStorage.getItem("mutsu_key_openrouter") || "",
                google: localStorage.getItem("mutsu_key_google") || "",
                tavily: localStorage.getItem("mutsu_key_tavily") || "",
                volcengine: localStorage.getItem("mutsu_key_volcengine") || "",
                volc_ep_image: localStorage.getItem("mutsu_key_volc_ep_image") || "",
                volc_ep_video: localStorage.getItem("mutsu_key_volc_ep_video") || "",
                volc_ep_chat: localStorage.getItem("mutsu_key_volc_ep_chat") || "",
                fal: localStorage.getItem("mutsu_key_fal") || "",
                accessCode: localStorage.getItem("mutsu_access_code") || ""
            });
        }
    }, [isOpen]);

    const handleSave = () => {
        localStorage.setItem("mutsu_key_deepseek", keys.deepseek);
        localStorage.setItem("mutsu_key_openrouter", keys.openrouter);
        localStorage.setItem("mutsu_key_google", keys.google);
        localStorage.setItem("mutsu_key_tavily", keys.tavily);
        localStorage.setItem("mutsu_key_volcengine", keys.volcengine);
        localStorage.setItem("mutsu_key_volc_ep_image", keys.volc_ep_image);
        localStorage.setItem("mutsu_key_volc_ep_video", keys.volc_ep_video);
        localStorage.setItem("mutsu_key_volc_ep_chat", keys.volc_ep_chat);
        localStorage.setItem("mutsu_key_fal", keys.fal);
        localStorage.setItem("mutsu_access_code", keys.accessCode);
        alert("🔑 密钥已加密保存在您的浏览器本地！");
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            >
                <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-[#1e1e1e] border border-gray-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden font-mono text-gray-300 flex flex-col max-h-[80vh]">
                    <div className="px-4 py-3 border-b border-gray-700 bg-[#252526] flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-500">
                            <Key size={14} /> LOCAL KEY VAULT
                        </div>
                        <button onClick={onClose} className="text-gray-500 hover:text-red-400"><X size={16} /></button>
                    </div>

                    <div className="p-5 space-y-4 text-xs overflow-y-auto scrollbar-thin">
                        <p className="text-gray-500 mb-4 leading-relaxed">
                            ⚠️ 您的密钥仅保存在本地浏览器中，绝不上传第三方服务器。
                        </p>

                        <div>
                            <label className="block text-emerald-400 font-bold mb-1">DeepSeek Key (聊天核心)</label>
                            <input type="password" value={keys.deepseek} onChange={e => setKeys({ ...keys, deepseek: e.target.value })} className="w-full bg-[#111] border border-gray-600 rounded p-2 outline-none focus:border-emerald-500" placeholder="sk-..." />
                        </div>
                        <div>
                            <label className="block text-indigo-400 font-bold mb-1">OpenRouter Key (备用/大香蕉)</label>
                            <input type="password" value={keys.openrouter} onChange={e => setKeys({ ...keys, openrouter: e.target.value })} className="w-full bg-[#111] border border-gray-600 rounded p-2 outline-none focus:border-indigo-500" placeholder="sk-or-v1-..." />
                        </div>
                        <div>
                            <label className="block text-blue-400 font-bold mb-1">Google Gemini Key</label>
                            <input type="password" value={keys.google} onChange={e => setKeys({ ...keys, google: e.target.value })} className="w-full bg-[#111] border border-gray-600 rounded p-2 outline-none focus:border-blue-500" placeholder="AIza..." />
                        </div>
                        <div className="pt-2 border-t border-gray-700 mt-2">
                            <label className="block text-orange-400 font-bold mb-1">Volcengine Key (火山引擎 API Key)</label>
                            <input type="password" value={keys.volcengine} onChange={e => setKeys({ ...keys, volcengine: e.target.value })} className="w-full bg-[#111] border border-gray-600 rounded p-2 outline-none focus:border-orange-500" placeholder="填写火山引擎 API Key" />
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                            <div>
                                <label className="block text-purple-300 text-[9px] font-bold mb-1">EP: Image (画图)</label>
                                <input type="text" value={keys.volc_ep_image} onChange={e => setKeys({ ...keys, volc_ep_image: e.target.value })} className="w-full bg-[#111] border border-gray-600 rounded p-1.5 outline-none focus:border-purple-400 text-[10px]" placeholder="ep-xxx" />
                            </div>
                            <div>
                                <label className="block text-indigo-300 text-[9px] font-bold mb-1">EP: Video (视频)</label>
                                <input type="text" value={keys.volc_ep_video} onChange={e => setKeys({ ...keys, volc_ep_video: e.target.value })} className="w-full bg-[#111] border border-gray-600 rounded p-1.5 outline-none focus:border-indigo-400 text-[10px]" placeholder="ep-xxx" />
                            </div>
                            <div>
                                <label className="block text-blue-300 text-[9px] font-bold mb-1">EP: Chat (聊天)</label>
                                <input type="text" value={keys.volc_ep_chat} onChange={e => setKeys({ ...keys, volc_ep_chat: e.target.value })} className="w-full bg-[#111] border border-gray-600 rounded p-1.5 outline-none focus:border-blue-400 text-[10px]" placeholder="ep-xxx" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-pink-400 font-bold mb-1">Fal.ai Key (海螺视频备用)</label>
                            <input type="password" value={keys.fal} onChange={e => setKeys({ ...keys, fal: e.target.value })} className="w-full bg-[#111] border border-gray-600 rounded p-2 outline-none focus:border-pink-500" placeholder="key:secret" />
                        </div>
                        <div>
                            <label className="block text-yellow-400 font-bold mb-1">Tavily Search Key (联网必备)</label>
                            <input type="password" value={keys.tavily} onChange={e => setKeys({ ...keys, tavily: e.target.value })} className="w-full bg-[#111] border border-gray-600 rounded p-2 outline-none focus:border-yellow-500" placeholder="tvly-..." />
                        </div>
                        <div className="pt-2 border-t border-gray-700 mt-2">
                            <label className="block text-red-400 font-bold mb-1 flex items-center gap-1">
                                <Lock size={12} /> Site Access Code (若站长设置了密码)
                            </label>
                            <input
                                type="password"
                                value={keys.accessCode}
                                onChange={e => setKeys({ ...keys, accessCode: e.target.value })}
                                className="w-full bg-[#111] border border-red-900/30 rounded p-2 outline-none focus:border-red-500 text-red-100"
                                placeholder="输入站点访问密码..."
                            />
                        </div>
                    </div>



                    <div className="p-4 bg-[#252526] border-t border-gray-700 flex justify-end gap-2 shrink-0">
                        <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white text-xs">取消</button>
                        <button onClick={handleSave} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold flex items-center gap-2 shadow-lg">
                            <Save size={14} /> 固化至本地
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export const ImageViewerModal = ({ url, onClose }: { url: string | null, onClose: () => void }) => {
    if (!url) return null;

    const handleDownload = async () => {
        try {
            const res = await fetch(url);
            const blob = await res.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = `mutsu_visual_${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(blobUrl);
        } catch (e) {
            window.open(url, '_blank');
        }
    };

    return (
        <div
            className="fixed inset-0 z-[99999] bg-black/90 flex items-center justify-center p-4 backdrop-blur-md transition-opacity"
            onClick={onClose}
        >
            <img
                src={url}
                className="max-w-full max-h-full object-contain shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-sm"
                onClick={e => e.stopPropagation()}
                alt="Fullscreen Preview"
            />

            <button
                onClick={e => { e.stopPropagation(); handleDownload(); }}
                className="absolute bottom-8 right-8 bg-white/10 hover:bg-emerald-500 text-white rounded-full p-4 transition-all shadow-xl backdrop-blur-sm group"
                title="Download Image"
            >
                <Download size={24} className="group-hover:scale-110 transition-transform" />
            </button>

            <button
                onClick={onClose}
                className="absolute top-8 right-8 bg-white/10 hover:bg-red-500 text-white rounded-full p-3 transition-all shadow-xl backdrop-blur-sm"
                title="Close"
            >
                <X size={24} />
            </button>
        </div>
    )
}