"use client";

import Link from "next/link";
import { formatMacro } from "@/lib/nutrition";

type BadgeTone = "red" | "dark" | "cream" | "green" | "blue";
type ActionTone = "primary" | "soft" | "ghost" | "danger";

type PremiumMealCardBadge = {
  label: string;
  tone?: BadgeTone;
};

type PremiumMealCardAction = {
  label: string;
  tone?: ActionTone;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
};

type PremiumMealCardItem = {
  id: string;
  name: string;
  quantityG: number;
  calories?: number | null;
  proteinG?: number | null;
};

type PremiumMealCardTotals = {
  calories?: number | null;
  proteinG?: number | null;
  carbsG?: number | null;
  fatG?: number | null;
};

function safeMacro(value: number | null | undefined) {
  return value ?? null;
}

export function PremiumMealCard({
  variant = "standard",
  accentIndex = 0,
  eyebrow,
  title,
  description,
  badges = [],
  totals,
  items,
  actions = [],
  maxItems = 4,
  className = "",
}: {
  variant?: "standard" | "featured";
  accentIndex?: number;
  eyebrow?: string;
  title: string;
  description?: string;
  badges?: PremiumMealCardBadge[];
  totals: PremiumMealCardTotals;
  items: PremiumMealCardItem[];
  actions?: PremiumMealCardAction[];
  maxItems?: number;
  className?: string;
}) {
  const isFeatured = variant === "featured";

  const gradients = [
    "from-[#E94B4B] via-[#E94B4B] to-[#B92D35]",
    "from-[#171717] via-[#2D2825] to-[#4A3632]",
    "from-[#F6C766] via-[#E94B4B] to-[#B92D35]",
  ];

  const visibleItems = items.slice(0, maxItems);
  const hiddenItemsCount = Math.max(0, items.length - maxItems);

  if (isFeatured) {
    return (
      <article
        className={`ui-float relative overflow-hidden rounded-[44px] bg-gradient-to-br ${
          gradients[accentIndex % gradients.length]
        } p-6 text-white shadow-[0_30px_80px_rgba(28,21,18,0.18)] ${className}`}
      >
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/14" />
        <div className="absolute -bottom-20 left-8 h-52 w-52 rounded-full bg-white/10" />

        <div className="relative">
          <div className="flex flex-wrap gap-2">
            {badges.slice(0, 3).map((badge) => (
              <span
                key={badge.label}
                className="rounded-full bg-white/16 px-3 py-1 text-xs font-black text-white backdrop-blur"
              >
                {badge.label}
              </span>
            ))}
          </div>

          {eyebrow && (
            <p className="mt-5 text-xs font-black uppercase tracking-wide text-white/62">
              {eyebrow}
            </p>
          )}

          <h3 className="mt-2 text-3xl font-black tracking-[-0.055em]">
            {title}
          </h3>

          {description && (
            <p className="mt-3 text-sm leading-7 text-white/78">
              {description}
            </p>
          )}

          <div className="mt-6 grid grid-cols-3 gap-2">
            <FeaturedMini
              label="Kcal"
              value={formatMacro(safeMacro(totals.calories), "")}
            />
            <FeaturedMini
              label="Prot."
              value={formatMacro(safeMacro(totals.proteinG), "g")}
            />
            <FeaturedMini label="Aliments" value={`${items.length}`} />
          </div>

          {visibleItems.length > 0 && (
            <div className="mt-5 space-y-2">
              {visibleItems.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="rounded-[22px] bg-white/14 px-4 py-3 text-sm backdrop-blur"
                >
                  <div className="flex justify-between gap-3">
                    <span className="font-black">{item.name}</span>
                    <span className="text-white/72">{item.quantityG} g</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {actions.length > 0 && (
            <div className="mt-6 grid gap-2">
              {actions.map((action) => (
                <MealAction key={action.label} action={action} featured />
              ))}
            </div>
          )}
        </div>
      </article>
    );
  }

  return (
    <article className={`ui-card-soft ui-float overflow-hidden p-5 ${className}`}>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {badges.map((badge) => (
              <MealBadge key={badge.label} badge={badge} />
            ))}
          </div>

          {eyebrow && (
            <p className="mt-4 text-xs font-black uppercase tracking-wide text-[#E94B4B]">
              {eyebrow}
            </p>
          )}

          <h3 className="mt-1 text-2xl font-black tracking-[-0.055em] text-[#171717]">
            {title}
          </h3>

          {description && (
            <p className="mt-3 text-sm leading-7 text-[#7A746E]">
              {description}
            </p>
          )}
        </div>

        <div className="shrink-0 rounded-full bg-[#FFE1DD] px-4 py-2 text-sm font-black text-[#B92D35]">
          {formatMacro(safeMacro(totals.calories), " kcal")}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <MiniStat
          label="Prot."
          value={formatMacro(safeMacro(totals.proteinG), " g")}
        />
        <MiniStat
          label="Gluc."
          value={formatMacro(safeMacro(totals.carbsG), " g")}
        />
        <MiniStat
          label="Lip."
          value={formatMacro(safeMacro(totals.fatG), " g")}
        />
      </div>

      {visibleItems.length > 0 && (
        <div className="mt-5 space-y-2">
          {visibleItems.map((item) => (
            <div
              key={item.id}
              className="flex flex-col justify-between gap-1 rounded-[24px] bg-white px-4 py-3 text-sm ring-1 ring-black/[0.055] md:flex-row"
            >
              <span className="font-black text-[#171717]">
                {item.name} · {item.quantityG} g
              </span>
              <span className="text-[#7A746E]">
                {item.calories ?? "—"} kcal · {item.proteinG ?? "—"} P
              </span>
            </div>
          ))}

          {hiddenItemsCount > 0 && (
            <div className="rounded-[24px] bg-white/70 px-4 py-3 text-sm font-black text-[#7A746E] ring-1 ring-black/[0.055]">
              +{hiddenItemsCount} autre(s) aliment(s)
            </div>
          )}
        </div>
      )}

      {actions.length > 0 && (
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {actions.map((action) => (
            <MealAction key={action.label} action={action} />
          ))}
        </div>
      )}
    </article>
  );
}

function MealBadge({ badge }: { badge: PremiumMealCardBadge }) {
  const tone = badge.tone ?? "cream";

  const styles = {
    red: "bg-[#FFE1DD] text-[#B92D35]",
    dark: "bg-[#171717] text-white",
    cream: "bg-white text-[#7A746E] ring-1 ring-black/[0.06]",
    green: "bg-green-100 text-green-800",
    blue: "bg-sky-100 text-sky-800",
  };

  return <span className={`ui-pill ${styles[tone]}`}>{badge.label}</span>;
}

function MealAction({
  action,
  featured = false,
}: {
  action: PremiumMealCardAction;
  featured?: boolean;
}) {
  const tone = action.tone ?? "primary";

  const standardStyles = {
    primary: "ui-button-primary text-white",
    soft: "ui-button-soft",
    ghost: "ui-button-ghost",
    danger: "ui-button-danger",
  };

  const featuredStyles = {
    primary:
      "rounded-full bg-white px-5 py-3 text-sm font-black text-[#171717] shadow-[0_18px_34px_rgba(0,0,0,0.12)] transition hover:-translate-y-0.5 hover:bg-[#FFF2EE]",
    soft:
      "rounded-full bg-white/16 px-5 py-3 text-sm font-black text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/22",
    ghost:
      "rounded-full bg-white/16 px-5 py-3 text-sm font-black text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/22",
    danger:
      "rounded-full bg-white/16 px-5 py-3 text-sm font-black text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/22",
  };

  const classes = featured
    ? `${featuredStyles[tone]} w-full`
    : `${standardStyles[tone]} w-full px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-40`;

  if (action.href) {
    return (
      <Link href={action.href} className={classes}>
        {action.label}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={action.onClick}
      disabled={action.disabled}
      className={classes}
    >
      {action.label}
    </button>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] bg-white p-4 ring-1 ring-black/[0.055]">
      <p className="text-xs font-bold text-[#7A746E]">{label}</p>
      <p className="mt-1 font-black text-[#171717]">{value}</p>
    </div>
  );
}

function FeaturedMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] bg-white/14 p-3 backdrop-blur">
      <p className="text-[11px] font-bold text-white/68">{label}</p>
      <p className="mt-1 text-lg font-black text-white">{value}</p>
    </div>
  );
}