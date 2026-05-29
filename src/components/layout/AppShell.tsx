"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const desktopNavigation = [
  { label: "Dashboard", href: "/" },
  { label: "Journal", href: "/journal" },
  { label: "Ajouter un repas", href: "/add" },
  { label: "Aliments", href: "/foods" },
  { label: "Objectifs", href: "/goals" },
  { label: "Recettes", href: "/recipes" },
  { label: "Poids", href: "/weight" },
  { label: "Analyse", href: "/analytics" },
  { label: "Paramètres", href: "/settings" },
];

const mobileNavigation = [
  { label: "Accueil", href: "/" },
  { label: "Journal", href: "/journal" },
  { label: "Ajouter", href: "/add" },
  { label: "Aliments", href: "/foods" },
  { label: "Objectifs", href: "/goals" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <main className="min-h-screen bg-[#F7F4EF] text-[#10121A]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl">
        <aside className="hidden w-64 shrink-0 border-r border-black/5 bg-white/80 px-4 py-6 lg:block">
          <div className="mb-8 px-3">
            <p className="text-sm font-medium text-[#E85A0C]">MacroTrack</p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight">
              Nutrition app
            </h1>
          </div>

          <nav className="space-y-1">
            {desktopNavigation.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-2xl px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? "bg-[#10121A] text-white"
                      : "text-gray-600 hover:bg-black/5 hover:text-[#10121A]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex-1 px-5 pb-24 pt-6 lg:px-8 lg:pb-8">
            {children}
          </div>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white/95 px-2 py-2 backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
          {mobileNavigation.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-2xl px-2 py-3 text-center text-xs font-medium ${
                  isActive
                    ? "bg-[#10121A] text-white"
                    : "text-gray-500 hover:bg-black/5"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </main>
  );
}