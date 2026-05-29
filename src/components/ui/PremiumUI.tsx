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
    <header className="mb-9 flex flex-col justify-between gap-6 md:flex-row md:items-start">
      <div>
        <p className="text-sm font-black text-[#E94B4B]">{eyebrow}</p>
        <h1 className="ui-page-title mt-3 max-w-4xl text-5xl font-black text-[#161412] md:text-7xl">
          {title}
        </h1>
        {description && (
          <p className="ui-page-text mt-5 max-w-2xl text-sm text-[#7A746E] md:text-base">
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
  if (tint === "red") {
    return <div className={`ui-red-card p-6 ${className}`}>{children}</div>;
  }

  if (tint === "cream") {
    return <div className={`ui-card-soft p-6 ${className}`}>{children}</div>;
  }

  if (tint === "dark") {
    return (
      <div className={`rounded-[42px] bg-[#171717] p-6 text-white shadow-[0_26px_70px_rgba(23,23,23,0.18)] ${className}`}>
        {children}
      </div>
    );
  }

  return <div className={`ui-card p-6 ${className}`}>{children}</div>;
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
    <div className="ui-card ui-float p-5">
      <p className="text-sm font-bold text-[#7A746E]">{label}</p>
      <p className="mt-2 text-3xl font-black tracking-[-0.055em] text-[#171717]">
        {value}
      </p>
      {detail && <p className="mt-2 text-sm leading-5 text-[#7A746E]">{detail}</p>}
    </div>
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
  const classes = `ui-button-primary inline-flex items-center justify-center px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-40 ${className}`;

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
  const classes = `ui-button-soft inline-flex items-center justify-center px-5 py-3 text-sm ${className}`;

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
  const classes = `ui-button-ghost inline-flex items-center justify-center px-5 py-3 text-sm ${className}`;

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
      className={`ui-button-danger inline-flex items-center justify-center px-5 py-3 text-sm ${className}`}
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

  return <span className={`ui-pill ${tones[tone]}`}>{children}</span>;
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
    <div className="rounded-[36px] border border-dashed border-black/10 bg-[#FFFAF5]/82 p-9 text-center">
      <p className="text-xl font-black tracking-[-0.035em] text-[#171717]">
        {title}
      </p>
      <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[#7A746E]">
        {text}
      </p>
      {action && <div className="mt-6 flex justify-center">{action}</div>}
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
      <h2 className="text-3xl font-black tracking-[-0.05em] text-[#171717]">
        {title}
      </h2>
      {text && <p className="mt-3 text-sm leading-7 text-[#7A746E]">{text}</p>}
    </div>
  );
}