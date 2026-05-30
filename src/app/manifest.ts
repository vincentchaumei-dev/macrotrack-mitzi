import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MacroTrack",
    short_name: "MacroTrack",
    description:
      "Une app personnelle de suivi nutritionnel simple, douce et mobile-first.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FEFAF4",
    theme_color: "#C01E3C",
    categories: ["health", "fitness", "lifestyle"],
    icons: [
      {
        src: "/brand/macrotrack-logo.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/brand/macrotrack-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/macrotrack-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/macrotrack-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
