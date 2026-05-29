import Link from "next/link";
import { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-start">
      <div>
        <p className="text-sm font-black text-[#E94B4B]">{eyebrow}</p>
        <h1 className="mt-2 max-w-3xl text-4xl font-black tracking-[-0.045em] text-[#161412] md:text-6xl">
          {title}
        </h1>
        {description && (
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#7A746E] md:text-base">
            {description}
          </p>
        )}
      </div>

      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}

export function PremiumCard({
  children,
  className = "",
  tint = "white",
}: {
  children: ReactNode;
  className?: string;
  tint?: "white" | "cream" | "red" | "dark";
}) {
  const styles = {
    white:
      "bg-white text-[#171717] shadow-[0_26px_70px_rgba(28,21,18,0.08)] ring-1 ring-black/[0.055]",
    cream:
      "bg-[#FFFAF5] text-[#171717] shadow-[0_18px_46px_rgba(28,21,18,0.06)] ring-1 ring-black/[0.055]",
    red:
      "bg-gradient-to-br from-[#E94B4B] to-[#B92D35] text-white shadow-[0_28px_70px_rgba(233,75,75,0.28)]",
    dark:
      "bg-[#171717] text-white shadow-[0_24px_60px_rgba(23,23,23,0.18)]",
  };

  return (
    <div className={`rounded-[42px] p-6 ${styles[tint]} ${className}`}>
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <PremiumCard className="p-5" tint="white">
      <p className="text-sm font-bold text-[#7A746E]">{label}</p>
      <p className="mt-2 text-3xl font-black tracking-[-0.04em] text-[#171717]">
        {value}
      </p>
      {detail && <p className="mt-2 text-sm leading-5 text-[#7A746E]">{detail}</p>}
    </PremiumCard>
  );
}

export function PrimaryButton({
  children,
  onClick,
  href,
  disabled,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  className?: string;
}) {
  const classes = `inline-flex items-center justify-center rounded-full bg-[#E94B4B] px-5 py-3 text-sm font-black text-white shadow-[0_18px_34px_rgba(233,75,75,0.26)] transition hover:-translate-y-0.5 hover:bg-[#B92D35] hover:shadow-[0_22px_42px_rgba(233,75,75,0.32)] disabled:cursor-not-allowed disabled:opacity-40 ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={classes}>
      {children}
    </button>
  );
}

export function SoftButton({
  children,
  onClick,
  href,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  className?: string;
}) {
  const classes = `inline-flex items-center justify-center rounded-full bg-[#FFF2EE] px-5 py-3 text-sm font-black text-[#B92D35] ring-1 ring-[#F6C9C3] transition hover:-translate-y-0.5 hover:bg-[#FFE1DD] ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={classes}>
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  onClick,
  href,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  className?: string;
}) {
  const classes = `inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-black text-[#171717] shadow-sm ring-1 ring-black/[0.06] transition hover:-translate-y-0.5 hover:bg-[#FFF2EE] ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={classes}>
      {children}
    </button>
  );
}

export function DangerButton({
  children,
  onClick,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-black text-[#B92D35] ring-1 ring-red-100 transition hover:-translate-y-0.5 hover:bg-[#FFE1DD] ${className}`}
    >
      {children}
    </button>
  );
}

export function Pill({
  children,
  tone = "cream",
}: {
  children: ReactNode;
  tone?: "cream" | "red" | "dark" | "green" | "blue";
}) {
  const tones = {
    cream: "bg-white text-[#7A746E] ring-1 ring-black/[0.06]",
    red: "bg-[#FFE1DD] text-[#B92D35]",
    dark: "bg-[#171717] text-white",
    green: "bg-green-100 text-green-800",
    blue: "bg-sky-100 text-sky-800",
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-black ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-[#171717]">
        {label}
      </span>
      {children}
    </label>
  );
}

export function EmptyState({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-[34px] border border-dashed border-black/10 bg-[#FFFAF5] p-8 text-center">
      <p className="text-lg font-black text-[#171717]">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#7A746E]">
        {text}
      </p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function SectionTitle({
  title,
  text,
}: {
  title: string;
  text?: string;
}) {
  return (
    <div>
      <h2 className="text-2xl font-black tracking-[-0.035em] text-[#171717]">
        {title}
      </h2>
      {text && <p className="mt-2 text-sm leading-6 text-[#7A746E]">{text}</p>}
    </div>
  );
}