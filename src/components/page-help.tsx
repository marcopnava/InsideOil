"use client";

import { useState, useEffect } from "react";

export interface HelpSection {
  title: string;
  body: string | string[];
}

interface PageHelpProps {
  title: string;
  intro?: string;
  sections: HelpSection[];
}

/**
 * Large floating "?" button bottom-right of a page. Click opens a slide-in
 * side panel that explains every section of the page in plain language.
 *
 * Use this on data-dense pages (e.g. /signals) instead of dotting many
 * <InfoTooltip /> all over the place. The two can also coexist.
 *
 * Usage:
 *   <PageHelp
 *     title="Institutional Signals — what am I looking at?"
 *     intro="..."
 *     sections={[{ title: "Contango Arbitrage", body: "..." }, ...]}
 *   />
 */
export function PageHelp({ title, intro, sections }: PageHelpProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Page explanation"
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-text text-white shadow-[var(--shadow)] flex items-center justify-center text-[24px] font-bold hover:scale-105 transition-transform cursor-pointer"
      >
        ?
      </button>

      {/* Backdrop + panel */}
      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            className="fixed inset-0 bg-black/40 z-50 animate-fade-in"
          />
          <aside
            className="fixed top-0 right-0 bottom-0 w-full sm:w-[440px] bg-bg3 border-l border-border z-50 overflow-y-auto shadow-2xl"
            style={{ animation: "slide-in 0.2s ease-out" }}
          >
            <div className="sticky top-0 bg-bg3 border-b border-border px-6 py-4 flex items-start justify-between gap-3">
              <h2 className="text-[16px] font-bold tracking-[-0.02em] text-text leading-tight">
                {title}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="w-8 h-8 rounded-full bg-black/6 text-text2 hover:bg-black/12 hover:text-text flex items-center justify-center text-[16px] cursor-pointer shrink-0"
              >
                ×
              </button>
            </div>

            <div className="px-6 py-5">
              {intro && (
                <p className="text-[12.5px] text-text2 leading-[1.6] mb-5">{intro}</p>
              )}

              <div className="flex flex-col gap-5">
                {sections.map((s, i) => (
                  <section key={i}>
                    <h3 className="text-[10px] font-bold text-text3 uppercase tracking-[0.07em] mb-2">
                      {s.title}
                    </h3>
                    {Array.isArray(s.body) ? (
                      <ul className="flex flex-col gap-1.5">
                        {s.body.map((line, j) => (
                          <li
                            key={j}
                            className="text-[12px] text-text leading-[1.55] pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-text3"
                          >
                            {line}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-[12px] text-text leading-[1.55]">{s.body}</p>
                    )}
                  </section>
                ))}
              </div>
            </div>
          </aside>

          <style jsx global>{`
            @keyframes slide-in {
              from { transform: translateX(100%); }
              to { transform: translateX(0); }
            }
          `}</style>
        </>
      )}
    </>
  );
}
