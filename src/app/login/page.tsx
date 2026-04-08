"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      {/* Video background */}
      <div className="absolute inset-0 z-0">
        <video autoPlay muted loop playsInline className="w-full h-full object-cover" style={{ filter: "brightness(0.2)" }}>
          <source src="/fog.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/30" />
      </div>

      <div className="relative z-10 w-full max-w-[380px]">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2.5 mb-4">
            <svg viewBox="0 0 26 26" fill="none" className="w-[28px] h-[28px]">
              <rect width="26" height="26" rx="6.5" fill="#fff" />
              <circle cx="8" cy="13" r="2.2" fill="#111" />
              <circle cx="18" cy="13" r="2.2" fill="#111" />
              <line x1="10.2" y1="13" x2="15.8" y2="13" stroke="#111" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <span className="text-[22px] font-bold tracking-[-0.03em] text-white">InsideOil</span>
          </div>
          <p className="text-[13px] text-white/50">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-[var(--radius)] p-7">
          <div className="mb-4">
            <label className="text-[10px] font-semibold text-white/50 uppercase tracking-[0.07em] block mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-3.5 py-2.5 rounded-[var(--radius-xs)] border border-white/20 bg-white/10 text-[13px] text-white outline-none focus:border-white/40 transition-colors placeholder:text-white/30"
              required
            />
          </div>
          <div className="mb-5">
            <label className="text-[10px] font-semibold text-white/50 uppercase tracking-[0.07em] block mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-3.5 py-2.5 rounded-[var(--radius-xs)] border border-white/20 bg-white/10 text-[13px] text-white outline-none focus:border-white/40 transition-colors placeholder:text-white/30"
              required
            />
          </div>

          {error && (
            <div className="mb-4 p-2.5 rounded-[var(--radius-xs)] bg-accent-soft border border-accent text-[12px] text-accent font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-[var(--radius-xs)] bg-white text-text text-[13px] font-semibold cursor-pointer border-none hover:bg-white/90 transition-colors disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-center text-[11px] text-white/40 mt-5">
          Don&apos;t have an account?{" "}
          <a href="/register" className="text-accent font-semibold no-underline hover:underline">Create one</a>
        </p>
      </div>
    </div>
  );
}
