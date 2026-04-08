"use client";

interface DetailPanelProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function DetailPanel({ open, onClose, children }: DetailPanelProps) {
  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/10 z-[1500]" onClick={onClose} />
      )}
      <div
        className={`fixed right-0 top-[var(--nav-h)] bottom-0 w-[420px] max-w-[90vw] bg-white border-l border-border z-[2000] transition-transform duration-300 ease-out overflow-y-auto ${
          open ? "translate-x-0 shadow-[-8px_0_32px_rgba(0,0,0,.06)]" : "translate-x-full"
        }`}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full border border-border2 bg-bg flex items-center justify-center text-text3 hover:bg-border transition-colors cursor-pointer text-sm"
        >
          x
        </button>
        <div className="p-7">{children}</div>
      </div>
    </>
  );
}

interface DetailRowProps {
  label: string;
  value: string | number | null | undefined;
  mono?: boolean;
  accent?: boolean;
}

export function DetailRow({ label, value, mono, accent }: DetailRowProps) {
  return (
    <div className="flex justify-between py-2 border-b border-border last:border-b-0">
      <span className="text-[11.5px] text-text3">{label}</span>
      <span
        className={`text-[11.5px] font-semibold ${accent ? "text-accent" : "text-text"}`}
        style={mono ? { fontFamily: "var(--font-jetbrains)" } : undefined}
      >
        {value ?? "N/A"}
      </span>
    </div>
  );
}
