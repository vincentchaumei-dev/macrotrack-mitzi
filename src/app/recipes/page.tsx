import { AppShell } from "@/components/layout/AppShell";

export default function RecipesPage() {
  return (
    <AppShell>
      <p className="text-sm font-medium text-[#E85A0C]">À venir</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">Recettes</h1>
      <p className="mt-2 text-gray-500">
        Les recettes réutilisables seront ajoutées après le MVP de tracking.
      </p>
    </AppShell>
  );
}