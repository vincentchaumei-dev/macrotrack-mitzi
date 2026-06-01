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
        <p className="text-sm font-black text-[var(--mt-rouge)]">{eyebrow}</p>

        <h1 className="ui-page-title mt-3 max-w-4xl font-black text-[var(--mt-ink)]">
          {title}
        </h1>

        {description && (
          <p className="ui-page-text mt-5 max-w-2xl text-sm text-[var(--mt-ink-2)] md:text-base">
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
  if (tint === "dark") {
    return (
      <div
        className={`rounded-[42px] bg-[var(--mt-ink)] p-6 text-white shadow-[0_26px_70px_rgba(23,19,24,0.18)] ${className}`}
      >
        {children}
      </div>
    );
  }

  return <div className={`ui-card p-5 sm:p-6 ${className}`}>{children}</div>;
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
      <p className="text-sm font-bold text-[var(--mt-ink-2)]">{label}</p>
      <p className="mt-2 text-3xl font-black tracking-[-0.055em] text-[var(--mt-ink)]">
        {value}
      </p>
      {detail && (
        <p className="mt-2 text-sm leading-5 text-[var(--mt-ink-2)]">
          {detail}
        </p>
      )}
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
    cream: "bg-white text-[var(--mt-ink-2)] ring-1 ring-[var(--mt-line)]",
    red: "bg-[var(--mt-rouge-wash)] text-[var(--mt-rouge-deep)]",
    dark: "bg-[var(--mt-ink)] text-white",
    green: "bg-[var(--mt-success-soft)] text-[var(--mt-success)]",
    blue: "bg-[var(--mt-rouge-wash)] text-[var(--mt-rouge-deep)]",
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
      <span className="mb-2 block text-sm font-black text-[var(--mt-ink)]">
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
    <div className="rounded-[36px] border border-dashed border-[var(--mt-line-2)] bg-[var(--mt-card-soft)]/80 p-9 text-center">
      <p className="text-xl font-black tracking-[-0.035em] text-[var(--mt-ink)]">
        {title}
      </p>
      <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[var(--mt-ink-2)]">
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
      <h2 className="ui-section-title font-black text-[var(--mt-ink)]">
        {title}
      </h2>
      {text && (
        <p className="mt-3 text-sm leading-7 text-[var(--mt-ink-2)]">
          {text}
        </p>
      )}
    </div>
  );
}