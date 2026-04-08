interface CardProps {
  title: string;
  badge?: { text: string; variant?: "accent" | "dark" };
  children: React.ReactNode;
  className?: string;
}

export function Card({ title, badge, children, className = "" }: CardProps) {
  return (
    <div
      className={`bg-bg3 border border-border rounded-[var(--radius)] p-6 transition-shadow hover:shadow-[var(--shadow)] ${className}`}
    >
      <div className="text-[13px] font-semibold mb-[18px] flex items-center justify-between text-text">
        {title}
        {badge && (
          <span
            className={`text-[10px] px-[9px] py-[3px] rounded-[20px] font-semibold ${
              badge.variant === "dark"
                ? "bg-black/6 text-text2"
                : "bg-accent-soft text-accent"
            }`}
          >
            {badge.text}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
