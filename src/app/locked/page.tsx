"use client";

import { FormEvent, useState } from "react";

export default function LockedPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!password || submitting) return;

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        setError(response.status === 401 ? "密码错误。" : "暂时无法验证密码。");
        return;
      }

      window.location.replace("/");
    } catch {
      setError("网络错误，请稍后重试。");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#08090b] text-zinc-100 flex items-center justify-center p-6">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute left-1/2 top-[-20rem] h-[42rem] w-[42rem] -translate-x-1/2 rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="absolute bottom-[-18rem] right-[-12rem] h-[36rem] w-[36rem] rounded-full bg-emerald-500/5 blur-[110px]" />
      </div>

      <section className="relative w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950/75 p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-8">
          <div className="mb-3 text-[10px] font-mono uppercase tracking-[0.35em] text-zinc-500">
            Mutsu Studio // Archive Mode
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            项目暂时封存
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Mutsu Studio Cloud 当前已暂停公开访问。
            <br />
            如需进入，请输入访问密码。
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="site-password"
              className="mb-2 block text-xs font-medium text-zinc-400"
            >
              Access Password
            </label>
            <input
              id="site-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              autoFocus
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-400/10"
              placeholder="请输入密码"
            />
          </div>

          {error && (
            <p className="text-xs text-rose-400" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!password || submitting}
            className="w-full rounded-xl bg-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? "验证中..." : "解锁 / Unlock"}
          </button>
        </form>

        <div className="mt-8 border-t border-white/5 pt-5 text-center font-mono text-[10px] tracking-[0.18em] text-zinc-600">
          WE&apos;LL MEET AGAIN IN ANOTHER WORLDLINE.
        </div>
      </section>
    </main>
  );
}
