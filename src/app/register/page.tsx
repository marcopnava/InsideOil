"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

function RegisterForm() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [email, setEmail] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setError("Invalid registration link. Please use the link from your welcome email.");
      setValidating(false);
      return;
    }

    // Validate token
    fetch(`/api/auth/validate-token?token=${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setEmail(data.data.email);
        } else {
          setError(data.error || "Invalid or expired registration link.");
        }
        setValidating(false);
      })
      .catch(() => {
        setError("Something went wrong. Please try again.");
        setValidating(false);
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, token }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Registration failed");
      setLoading(false);
      return;
    }

    // Auto-login after registration
    const loginRes = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (loginRes?.error) {
      router.push("/login");
    } else {
      router.push("/dashboard?welcome=true");
    }
  };

  if (validating) {
    return (
      <div className="relative z-10 text-center">
        <p className="text-[14px] text-white/60">Validating your registration link...</p>
      </div>
    );
  }

  if (error && !email) {
    return (
      <div className="relative z-10 w-full max-w-[380px] text-center">
        <div className="flex items-center justify-center gap-2.5 mb-6">
          <svg viewBox="0 0 26 26" fill="none" className="w-[28px] h-[28px]">
            <rect width="26" height="26" rx="6.5" fill="#fff" />
            <circle cx="8" cy="13" r="2.2" fill="#111" />
            <circle cx="18" cy="13" r="2.2" fill="#111" />
            <line x1="10.2" y1="13" x2="15.8" y2="13" stroke="#111" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <span className="text-[22px] font-bold tracking-[-0.03em] text-white">InsideOil</span>
        </div>
        <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-[var(--radius)] p-7">
          <p className="text-[14px] text-white/70 mb-4">{error}</p>
          <p className="text-[12px] text-white/40">
            Need help? Contact <a href="mailto:info@insideoil.it" className="text-accent no-underline hover:underline">info@insideoil.it</a>
          </p>
        </div>
      </div>
    );
  }

  return (
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
        <p className="text-[13px] text-white/50">Complete your registration</p>
        <p className="text-[12px] text-white/30 mt-1">{email}</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-[var(--radius)] p-7">
        <div className="mb-4">
          <label className="text-[10px] font-semibold text-white/50 uppercase tracking-[0.07em] block mb-1.5">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full px-3.5 py-2.5 rounded-[var(--radius-xs)] border border-white/20 bg-white/10 text-[13px] text-white outline-none focus:border-white/40 transition-colors placeholder:text-white/30"
            required
          />
        </div>
        <div className="mb-2">
          <label className="text-[10px] font-semibold text-white/50 uppercase tracking-[0.07em] block mb-1.5">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 8 chars, 1 uppercase, 1 number"
            className="w-full px-3.5 py-2.5 rounded-[var(--radius-xs)] border border-white/20 bg-white/10 text-[13px] text-white outline-none focus:border-white/40 transition-colors placeholder:text-white/30"
            required
            minLength={8}
          />
        </div>
        <p className="text-[10px] text-white/30 mb-5">Min 8 characters, 1 uppercase letter, 1 number</p>

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
          {loading ? "Setting up your account..." : "Complete registration"}
        </button>
      </form>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <video autoPlay muted loop playsInline className="w-full h-full object-cover" style={{ filter: "brightness(0.2)" }}>
          <source src="/fog.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/30" />
      </div>
      <Suspense>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
