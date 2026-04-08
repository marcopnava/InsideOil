"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="text-center max-w-md px-6">
        <h1 className="text-[48px] font-bold text-text leading-none mb-2">Error</h1>
        <p className="text-[15px] text-muted mb-2">Something went wrong.</p>
        <p className="text-[12px] text-muted/60 mb-6">{error.digest ?? error.message}</p>
        <button
          onClick={reset}
          className="inline-block px-5 py-2.5 bg-text text-bg text-[13px] font-semibold rounded-[var(--radius-xs)] hover:opacity-90 transition-opacity cursor-pointer border-none"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
