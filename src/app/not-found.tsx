import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="text-center max-w-md px-6">
        <h1 className="text-[72px] font-bold text-text leading-none mb-2">404</h1>
        <p className="text-[15px] text-muted mb-6">The page you are looking for does not exist or has been moved.</p>
        <Link
          href="/dashboard"
          className="inline-block px-5 py-2.5 bg-text text-bg text-[13px] font-semibold rounded-[var(--radius-xs)] hover:opacity-90 transition-opacity no-underline"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
