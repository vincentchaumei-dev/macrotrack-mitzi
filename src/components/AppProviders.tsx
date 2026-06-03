"use client";

import { ReactNode } from "react";
import { ConfirmProvider } from "@/components/ui/ConfirmProvider";
import { ThemeProvider } from "@/components/ui/ThemeProvider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ConfirmProvider>{children}</ConfirmProvider>
    </ThemeProvider>
  );
}