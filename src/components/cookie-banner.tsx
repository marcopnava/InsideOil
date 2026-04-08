"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) setVisible(true);
  }, []);

  function accept() {
    localStorage.setItem("cookie-consent", "accepted");
    setVisible(false);
  }

  function decline() {
    localStorage.setItem("cookie-consent", "declined");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 bg-white/95 backdrop-blur-xl border-t border-border">
      <div className="max-w-[960px] mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <p className="text-[12px] text-text2 flex-1">
          We use essential cookies for authentication and optional analytics cookies to improve the platform.
          Read our{" "}
          <Link href="/privacy" className="text-accent no-underline hover:underline font-medium">
            Privacy Policy
          </Link>
          .
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={decline}
            className="px-4 py-2 text-[11px] font-semibold text-text3 bg-transparent border border-border rounded-[var(--radius-xs)] cursor-pointer hover:bg-black/4 transition-colors"
          >
            Decline
          </button>
          <button
            onClick={accept}
            className="px-4 py-2 text-[11px] font-semibold text-white bg-text rounded-[var(--radius-xs)] cursor-pointer hover:opacity-90 transition-opacity border-none"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
