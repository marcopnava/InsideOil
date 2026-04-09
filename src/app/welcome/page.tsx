import type { Metadata } from "next";

export const metadata: Metadata = { title: "Payment Confirmed" };

export default function WelcomePage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <video autoPlay muted loop playsInline className="w-full h-full object-cover" style={{ filter: "brightness(0.2)" }}>
          <source src="/fog.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/30" />
      </div>

      <div className="relative z-10 w-full max-w-[440px] text-center">
        <div className="flex items-center justify-center gap-2.5 mb-6">
          <svg viewBox="0 0 26 26" fill="none" className="w-[28px] h-[28px]">
            <rect width="26" height="26" rx="6.5" fill="#fff" />
            <circle cx="8" cy="13" r="2.2" fill="#111" />
            <circle cx="18" cy="13" r="2.2" fill="#111" />
            <line x1="10.2" y1="13" x2="15.8" y2="13" stroke="#111" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <span className="text-[22px] font-bold tracking-[-0.03em] text-white">InsideOil</span>
        </div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-[var(--radius)] p-8">
          <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-5">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="text-[24px] font-bold text-white mb-3">Payment confirmed</h1>
          <p className="text-[14px] text-white/60 leading-relaxed mb-2">
            Thank you for subscribing to InsideOil.
          </p>
          <p className="text-[14px] text-white/60 leading-relaxed mb-6">
            Check your email for a <strong className="text-white/90">welcome message</strong> with a link to complete your registration and access the platform.
          </p>
          <div className="bg-white/5 rounded-[var(--radius-xs)] p-4 text-[12px] text-white/40">
            Didn&apos;t receive the email? Check your spam folder or contact{" "}
            <a href="mailto:info@insideoil.it" className="text-accent no-underline hover:underline">info@insideoil.it</a>
          </div>
        </div>
      </div>
    </div>
  );
}
