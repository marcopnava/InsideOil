"use client";

interface KPICardProps {
  label: string;
  value: string | number;
  sub?: string;
  trend?: "up" | "down";
}

export function KPICard({ label, value, sub, trend }: KPICardProps) {
  return (
    <div className="bg-bg3 border border-border rounded-[var(--radius)] p-[22px_24px] transition-all hover:shadow-[var(--shadow2)] hover:-translate-y-px">
      <div className="text-[11px] font-semibold text-text3 uppercase tracking-[0.07em] mb-3">
        {label}
      </div>
      <div className="text-[34px] font-bold tracking-[-0.035em] leading-none text-text">
        {value}
      </div>
      {sub && (
        <div className="text-[11px] font-medium mt-2 text-text3">
          <span className={trend === "up" ? "text-accent" : "text-text2"}>
            {sub}
          </span>
        </div>
      )}
    </div>
  );
}
