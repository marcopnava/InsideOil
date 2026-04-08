"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#0a0a0a", color: "#e5e5e5" }}>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center", maxWidth: 400, padding: 24 }}>
            <h1 style={{ fontSize: 48, fontWeight: 700, margin: "0 0 8px" }}>Error</h1>
            <p style={{ fontSize: 15, opacity: 0.6, marginBottom: 8 }}>Something went wrong.</p>
            <p style={{ fontSize: 12, opacity: 0.4, marginBottom: 24 }}>{error.digest ?? error.message}</p>
            <button
              onClick={reset}
              style={{
                padding: "10px 20px", background: "#e5e5e5", color: "#0a0a0a",
                fontSize: 13, fontWeight: 600, borderRadius: 6, border: "none", cursor: "pointer",
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
