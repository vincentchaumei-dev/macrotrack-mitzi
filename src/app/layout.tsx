import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/AppProviders";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "MacroTrack",
    template: "%s · MacroTrack",
  },
  description:
    "Une app personnelle de suivi nutritionnel simple, douce et mobile-first.",
  applicationName: "MacroTrack",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "MacroTrack",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      {
        url: "/brand/macrotrack-logo.png",
        type: "image/png",
      },
      {
        url: "/brand/macrotrack-logo.svg",
        type: "image/svg+xml",
      },
    ],
    apple: [
      {
        url: "/brand/macrotrack-logo.png",
        type: "image/png",
      },
    ],
  },
  openGraph: {
    title: "MacroTrack",
    description:
      "Une app personnelle de suivi nutritionnel simple, douce et mobile-first.",
    images: [
      {
        url: "/brand/macrotrack-logo.png",
        width: 1024,
        height: 1024,
        alt: "MacroTrack",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "MacroTrack",
    description:
      "Une app personnelle de suivi nutritionnel simple, douce et mobile-first.",
    images: ["/brand/macrotrack-logo.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#C01E3C",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* Script synchrone anti-flash : applique .dark avant que React hydrate */}
      <script
        dangerouslySetInnerHTML={{
          __html: `try{var t=localStorage.getItem('macrotrack-theme');if(t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}`,
        }}
      />
      <body className="min-h-full flex flex-col">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
