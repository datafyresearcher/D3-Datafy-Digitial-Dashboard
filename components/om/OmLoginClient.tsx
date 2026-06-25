"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, Mail, ArrowRight, Sun, Loader2, ShieldCheck } from "lucide-react";
import { OM_DEMO_CREDENTIALS, omLogin } from "@/lib/auth";

const ROLE_TONE: Record<string, string> = {
  "Super Admin": "text-rose-300",
  "Field Engineer": "text-amber-300",
  "Client Admin": "text-emerald-300",
  "Client Viewer": "text-sky-300",
};

export default function OmLoginClient() {
  const router = useRouter();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const user = await omLogin(loginId, password);
    setLoading(false);
    if (!user) {
      setError("Invalid credentials. Try a demo account below.");
      return;
    }
    router.push("/portal");
  };

  const fill = (id: string, pwd: string) => {
    setLoginId(id);
    setPassword(pwd);
    setError("");
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center px-4 py-16 bg-ink-900 text-white overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-20" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-brand-500/15 blur-[160px]" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative w-full max-w-md"
      >
        <Link href="/" className="flex flex-col items-center mb-8">
          <div className="grid place-items-center w-14 h-14 rounded-2xl bg-brand-500/15 border border-brand-500/30 text-brand-400 mb-3">
            <Sun className="w-7 h-7" />
          </div>
          <span className="font-display font-bold text-2xl">Solar O&amp;M Portal</span>
          <span className="text-xs tracking-[0.25em] uppercase text-brand-400 font-bold mt-1">
            Datafy Associate
          </span>
        </Link>

        <div className="rounded-3xl bg-white/5 border border-white/10 p-8 backdrop-blur-xl">
          <h1 className="font-display font-bold text-2xl mb-1">Sign in</h1>
          <p className="text-white/60 text-sm mb-6">
            Operations &amp; maintenance workspace for solar assets.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/60 mb-2">
                Login ID
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/40" />
                <input
                  type="email"
                  required
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/60 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/40" />
                <input
                  type={showPwd ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-11 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80"
                >
                  {showPwd ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-lg py-2"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full group inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-500 transition-all shadow-lg shadow-brand-600/30 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Signing in…
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 rounded-2xl bg-brand-500/5 border border-brand-500/20 p-4">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-brand-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-400">
                Demo accounts (3 roles)
              </span>
            </div>
            <div className="space-y-1.5">
              {OM_DEMO_CREDENTIALS.map((c) => (
                <button
                  key={c.loginId}
                  onClick={() => fill(c.loginId, c.password)}
                  className="w-full flex items-center justify-between gap-2 text-left text-xs px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <span className="font-mono text-white/70">{c.loginId}</span>
                  <span className={`font-semibold ${ROLE_TONE[c.role]}`}>{c.role}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-white/40 text-xs mt-6">
          <Link href="/" className="hover:text-brand-400">← Back to website</Link>
        </p>
      </motion.div>
    </main>
  );
}
