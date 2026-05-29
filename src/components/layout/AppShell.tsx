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

const primaryNavigation = [
  { label: "Accueil", href: "/", icon: "home" },
  { label: "Journal", href: "/journal", icon: "journal" },
  { label: "Ajouter", href: "/add", icon: "plus", isMain: true },
  { label: "Aliments", href: "/foods", icon: "foods" },
  { label: "Repas", href: "/recipes", icon: "meal" },
];

const bottomNavigation = [
  { label: "Accueil", href: "/", icon: "home" },
  { label: "Journal", href: "/journal", icon: "journal" },
  { label: "Repas", href: "/recipes", icon: "meal" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <div className="app-premium-bg min-h-screen text-[#171717]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1500px]">
        <aside className="sticky top-0 hidden h-screen w-[116px] shrink-0 p-4 lg:block">
          <div className="flex h-full flex-col items-center rounded-[38px] bg-white/82 px-3 py-4 shadow-[0_24px_70px_rgba(28,21,18,0.08)] ring-1 ring-black/5 backdrop-blur-xl">
            <Link href="/" className="flex flex-col items-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-[26px] bg-[#E94B4B] text-lg font-black text-white shadow-[0_16px_30px_rgba(233,75,75,0.25)]">
                M
              </div>
              <p className="mt-3 text-xs font-black tracking-tight">
                MacroTrack
              </p>
              <p className="text-[10px] font-medium text-[#7A746E]">
                Nutrition douce
              </p>
            </Link>

            <nav className="mt-8 flex w-full flex-1 flex-col items-center gap-3">
              {primaryNavigation.map((item) => {
                const active = isActive(item.href);

                if (item.isMain) {
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="my-1 flex h-16 w-16 items-center justify-center rounded-full bg-[#E94B4B] text-white shadow-[0_18px_34px_rgba(233,75,75,0.34)] transition hover:bg-[#B92D35]"
                      aria-label={item.label}
                    >
                      <Icon name={item.icon} />
                    </Link>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex w-full flex-col items-center gap-1 rounded-[24px] px-2 py-3 text-[11px] font-bold transition ${
                      active
                        ? "bg-[#FFE1DD] text-[#E94B4B]"
                        : "text-[#7A746E] hover:bg-[#FFF2EE] hover:text-[#171717]"
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
                        active
                          ? "bg-white shadow-sm"
                          : "bg-transparent group-hover:bg-white"
                      }`}
                    >
                      <Icon name={item.icon} />
                    </span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <button
              onClick={() => setMenuOpen(true)}
              className="mt-4 flex w-full flex-col items-center gap-1 rounded-[24px] px-2 py-3 text-[11px] font-bold text-[#7A746E] transition hover:bg-[#FFF2EE] hover:text-[#171717]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full group-hover:bg-white">
                <Icon name="menu" />
              </span>
              <span>Menu</span>
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col text-[#171717]">
          <header className="sticky top-0 z-30 border-b border-black/5 bg-[#FBF7F1]/86 px-4 py-3 backdrop-blur-xl lg:hidden">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-[22px] bg-[#E94B4B] text-sm font-black text-white shadow-[0_14px_28px_rgba(233,75,75,0.25)]">
                  M
                </div>

                <div>
                  <p className="font-black tracking-tight">MacroTrack</p>
                  <p className="text-xs font-medium text-[#7A746E]">
                    Nutrition douce
                  </p>
                </div>
              </Link>

              <button
                onClick={() => setMenuOpen(true)}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-black/5"
                aria-label="Ouvrir le menu"
              >
                <Icon name="menu" />
              </button>
            </div>
          </header>

          <main className="safe-bottom w-full px-4 py-5 sm:px-6 lg:px-10 lg:py-8">
            {children}
          </main>
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-black/5 bg-white/88 px-3 pb-[calc(0.7rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-18px_40px_rgba(28,21,18,0.08)] backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 items-end gap-1">
          <BottomNavItem
            item={bottomNavigation[0]}
            active={isActive(bottomNavigation[0].href)}
          />

          <BottomNavItem
            item={bottomNavigation[1]}
            active={isActive(bottomNavigation[1].href)}
          />

          <Link
            href="/add"
            className="mx-auto flex h-16 w-16 -translate-y-5 items-center justify-center rounded-full bg-[#E94B4B] text-white shadow-[0_18px_32px_rgba(233,75,75,0.34)] ring-8 ring-white"
            aria-label="Ajouter un repas"
          >
            <Icon name="plus" />
          </Link>

          <BottomNavItem
            item={bottomNavigation[2]}
            active={isActive(bottomNavigation[2].href)}
          />

          <button
            onClick={() => setMenuOpen(true)}
            className="flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-xs font-bold text-[#7A746E]"
          >
            <Icon name="menu" />
            <span>Menu</span>
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="fixed inset-0 z-50">
          <button
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
            aria-label="Fermer le menu"
          />

          <div className="absolute bottom-0 left-0 right-0 rounded-t-[38px] bg-[#FBF7F1] p-4 shadow-[0_-24px_60px_rgba(0,0,0,0.18)] lg:bottom-auto lg:left-auto lg:right-6 lg:top-6 lg:h-[calc(100vh-3rem)] lg:w-[390px] lg:rounded-[38px] lg:shadow-[0_30px_90px_rgba(28,21,18,0.22)]">
            <div className="mx-auto flex h-full max-w-md flex-col">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-[#E94B4B]">Menu</p>
                  <h2 className="text-2xl font-black tracking-tight">
                    Toutes les pages
                  </h2>
                </div>

                <button
                  onClick={() => setMenuOpen(false)}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-black/5"
                  aria-label="Fermer"
                >
                  <Icon name="x" />
                </button>
              </div>

              <div className="grid gap-2 overflow-y-auto pb-[env(safe-area-inset-bottom)]">
                {allNavigation.map((item) => {
                  const active = isActive(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-[24px] px-4 py-3 text-sm font-bold transition ${
                        active
                          ? "bg-[#E94B4B] text-white shadow-[0_16px_30px_rgba(233,75,75,0.22)]"
                          : "bg-white text-[#171717] ring-1 ring-black/5 hover:bg-[#FFF2EE]"
                      }`}
                    >
                      <span
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${
                          active ? "bg-white/16" : "bg-[#FFFAF5]"
                        }`}
                      >
                        <Icon name={item.icon} />
                      </span>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>

              <div className="mt-auto hidden rounded-[28px] bg-white p-4 ring-1 ring-black/5 lg:block">
                <p className="text-sm font-black">Focus doux</p>
                <p className="mt-2 text-xs leading-5 text-[#7A746E]">
                  On suit la tendance, pas la perfection d’une journée isolée.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
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
      className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-xs font-bold ${
        active ? "text-[#E94B4B]" : "text-[#7A746E]"
      }`}
    >
      <Icon name={item.icon} />
      <span>{item.label}</span>
    </Link>
  );
}

function Icon({ name }: { name: string }) {
  const common = {
    className: "h-5 w-5",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
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
        <path d="M7 4h10a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
        <path d="M9 8h6" />
        <path d="M9 12h6" />
        <path d="M9 16h4" />
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
        <path d="M12 2v3" />
        <path d="M22 12h-3" />
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

  if (name === "chart") {
    return (
      <svg {...common}>
        <path d="M4 19V5" />
        <path d="M4 19h16" />
        <path d="M8 15l3-4 3 2 5-7" />
      </svg>
    );
  }

  if (name === "settings") {
    return (
      <svg {...common}>
        <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
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