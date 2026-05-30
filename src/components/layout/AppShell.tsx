"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useState } from "react";

const allNavigation = [
  { label: "Dashboard", href: "/", icon: "home" },
  { label: "Journal", href: "/journal", icon: "journal" },
  { label: "Ajouter", href: "/add", icon: "plus" },
  { label: "Aliments", href: "/foods", icon: "foods" },
  { label: "Importer", href: "/import", icon: "import" },
  { label: "Audit", href: "/audit-foods", icon: "audit" },
  { label: "Objectifs", href: "/goals", icon: "goal" },
  { label: "Repas types", href: "/recipes", icon: "meal" },
  { label: "Poids", href: "/weight", icon: "weight" },
  { label: "Analyse", href: "/analytics", icon: "chart" },
  { label: "Paramètres", href: "/settings", icon: "settings" },
];

const bottomNavigation = [
  { label: "Accueil", href: "/", icon: "home" },
  { label: "Journal", href: "/journal", icon: "journal" },
  { label: "Analyse", href: "/analytics", icon: "chart" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const isDashboard = pathname === "/";

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <div className="mt-app-bg">
      <div className="mt-phone-shell">
        {!isDashboard && (
          <header className="mt-topbar px-5">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-3">
                <div className="grid h-11 w-11 overflow-hidden rounded-[16px] bg-[var(--mt-rouge)] shadow-[var(--mt-shadow-red)]">
                  <img
                    src="/brand/macrotrack-logo.png"
                    alt=""
                    aria-hidden="true"
                    className="h-full w-full object-cover"
                  />
                </div>

                <div>
                  <p className="font-[var(--mt-display)] text-lg font-semibold leading-none tracking-[-0.02em] text-[var(--mt-ink)]">
                    MacroTrack
                  </p>
                  <p className="mt-1 text-[11px] font-bold text-[var(--mt-ink-2)]">
                    Nutrition douce
                  </p>
                </div>
              </Link>

              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                className="grid h-11 w-11 place-items-center rounded-[14px] bg-white text-[var(--mt-ink-2)] shadow-[var(--mt-shadow-sm)] ring-1 ring-[var(--mt-line)]"
                aria-label="Ouvrir le menu"
              >
                <Icon name="menu" />
              </button>
            </div>
          </header>
        )}

        <main className={isDashboard ? "mt-dashboard-main" : "mt-main"}>{children}</main>

        <nav className="mt-bottom-nav">
          <BottomNavItem
            item={bottomNavigation[0]}
            active={isActive(bottomNavigation[0].href)}
          />

          <BottomNavItem
            item={bottomNavigation[1]}
            active={isActive(bottomNavigation[1].href)}
          />

          <Link href="/add" className="mt-fab" aria-label="Ajouter un repas">
            <Icon name="plus" size="large" />
          </Link>

          <BottomNavItem
            item={bottomNavigation[2]}
            active={isActive(bottomNavigation[2].href)}
          />

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="mt-nav-item"
          >
            <Icon name="menu" />
            <span>Menu</span>
          </button>
        </nav>

        {menuOpen && (
          <div className="fixed inset-0 z-[80]">
            <button
              type="button"
              className="absolute inset-0 bg-black/25 backdrop-blur-sm"
              onClick={() => setMenuOpen(false)}
              aria-label="Fermer le menu"
            />

            <div className="mt-menu-sheet">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--mt-rouge)]">
                    Menu
                  </p>
                  <h2 className="mt-display mt-1 text-2xl font-semibold tracking-[-0.03em] text-[var(--mt-ink)]">
                    Toutes les pages
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="grid h-11 w-11 place-items-center rounded-[14px] bg-white text-[var(--mt-ink-2)] shadow-[var(--mt-shadow-sm)] ring-1 ring-[var(--mt-line)]"
                  aria-label="Fermer"
                >
                  <Icon name="x" />
                </button>
              </div>

              <div className="grid max-h-[70svh] gap-2 overflow-y-auto pb-3">
                {allNavigation.map((item) => {
                  const active = isActive(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-[20px] px-4 py-3 text-sm font-extrabold transition ${
                        active
                          ? "bg-[var(--mt-rouge)] text-white shadow-[var(--mt-shadow-red)]"
                          : "bg-white text-[var(--mt-ink)] shadow-[var(--mt-shadow-sm)] ring-1 ring-[var(--mt-line)]"
                      }`}
                    >
                      <span
                        className={`grid h-10 w-10 place-items-center rounded-[14px] ${
                          active
                            ? "bg-white/16"
                            : "bg-[var(--mt-rouge-wash)] text-[var(--mt-rouge)]"
                        }`}
                      >
                        <Icon name={item.icon} />
                      </span>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BottomNavItem({
  item,
  active,
}: {
  item: { label: string; href: string; icon: string };
  active: boolean;
}) {
  return (
    <Link
      href={item.href}
      className={`mt-nav-item ${active ? "mt-nav-item-active" : ""}`}
    >
      <Icon name={item.icon} />
      <span>{item.label}</span>
    </Link>
  );
}

function Icon({
  name,
  size = "normal",
}: {
  name: string;
  size?: "normal" | "large";
}) {
  const common = {
    className: size === "large" ? "h-7 w-7" : "h-5 w-5",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.2",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (name === "home") {
    return (
      <svg {...common}>
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5 10v10h14V10" />
        <path d="M9 20v-6h6v6" />
      </svg>
    );
  }

  if (name === "journal") {
    return (
      <svg {...common}>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M3 10h18" />
        <path d="M8 2v4" />
        <path d="M16 2v4" />
      </svg>
    );
  }

  if (name === "plus") {
    return (
      <svg {...common}>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </svg>
    );
  }

  if (name === "chart") {
    return (
      <svg {...common}>
        <path d="M3 12h4l3 8 4-16 3 8h4" />
      </svg>
    );
  }

  if (name === "meal") {
    return (
      <svg {...common}>
        <path d="M4 3v8" />
        <path d="M7 3v8" />
        <path d="M4 7h3" />
        <path d="M6 11v10" />
        <path d="M14 3v18" />
        <path d="M14 3c4 2 4 8 0 10" />
      </svg>
    );
  }

  if (name === "foods") {
    return (
      <svg {...common}>
        <path d="M12 3c2.5 2.2 4 4.8 4 7.5A4 4 0 0 1 12 14a4 4 0 0 1-4-3.5C8 7.8 9.5 5.2 12 3Z" />
        <path d="M6 21c1.2-3 3.2-5 6-5s4.8 2 6 5" />
      </svg>
    );
  }

  if (name === "import") {
    return (
      <svg {...common}>
        <path d="M12 3v12" />
        <path d="m7 10 5 5 5-5" />
        <path d="M5 21h14" />
      </svg>
    );
  }

  if (name === "audit") {
    return (
      <svg {...common}>
        <path d="M9 11 11 13 15 8" />
        <path d="M5 4h14v16H5z" />
      </svg>
    );
  }

  if (name === "goal") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }

  if (name === "weight") {
    return (
      <svg {...common}>
        <path d="M6 7h12l2 13H4L6 7Z" />
        <path d="M9 7a3 3 0 0 1 6 0" />
      </svg>
    );
  }

  if (name === "settings") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.8 1.8 0 0 0 .36 2l.04.04a2 2 0 1 1-2.83 2.83l-.04-.04a1.8 1.8 0 0 0-2-.36 1.8 1.8 0 0 0-1 1.63V21a2 2 0 1 1-4 0v-.06a1.8 1.8 0 0 0-1-1.63 1.8 1.8 0 0 0-2 .36l-.04.04a2 2 0 1 1-2.83-2.83l.04-.04a1.8 1.8 0 0 0 .36-2 1.8 1.8 0 0 0-1.63-1H3a2 2 0 1 1 0-4h.06a1.8 1.8 0 0 0 1.63-1 1.8 1.8 0 0 0-.36-2l-.04-.04a2 2 0 1 1 2.83-2.83l.04.04a1.8 1.8 0 0 0 2 .36 1.8 1.8 0 0 0 1-1.63V3a2 2 0 1 1 4 0v.06a1.8 1.8 0 0 0 1 1.63 1.8 1.8 0 0 0 2-.36l.04-.04a2 2 0 1 1 2.83 2.83l-.04.04a1.8 1.8 0 0 0-.36 2 1.8 1.8 0 0 0 1.63 1H21a2 2 0 1 1 0 4h-.06a1.8 1.8 0 0 0-1.54 1Z" />
      </svg>
    );
  }

  if (name === "menu") {
    return (
      <svg {...common}>
        <path d="M4 7h16" />
        <path d="M4 12h16" />
        <path d="M4 17h16" />
      </svg>
    );
  }

  if (name === "x") {
    return (
      <svg {...common}>
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </svg>
    );
  }

  return null;
}