"use client";

import { useEffect, useRef, useState } from "react";

type ScannerState = "loading" | "scanning" | "success" | "permission_denied" | "error";

export function BarcodeScanner({
  onScan,
  onClose,
}: {
  onScan: (barcode: string) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const [state, setState] = useState<ScannerState>("loading");
  const [manualCode, setManualCode] = useState("");

  useEffect(() => {
    if (!videoRef.current) return;
    let cancelled = false;

    async function startScanner() {
      try {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        if (cancelled) return;

        const reader = new BrowserMultiFormatReader();

        const controls = await reader.decodeFromVideoDevice(
          undefined,
          videoRef.current!,
          (result, error) => {
            if (cancelled) return;

            if (result) {
              setState("success");
              controls.stop();
              onScan(result.getText());
              return;
            }

            // "NotFoundException" = aucun code dans cette frame — c'est normal, on ignore
            if (error && (error as { name?: string }).name !== "NotFoundException") {
              console.warn("Scanner:", error);
            }
          }
        );

        if (!cancelled) {
          controlsRef.current = controls;
          setState("scanning");
        } else {
          controls.stop();
        }
      } catch (err: unknown) {
        if (cancelled) return;
        const { name } = err as { name?: string };
        setState(name === "NotAllowedError" ? "permission_denied" : "error");
      }
    }

    startScanner();

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
    };
  }, [onScan]);

  function handleClose() {
    controlsRef.current?.stop();
    onClose();
  }

  function handleManualSubmit() {
    const code = manualCode.trim();
    if (!code) return;
    controlsRef.current?.stop();
    onScan(code);
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black">
      {/* Flux vidéo */}
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        playsInline
        autoPlay
        muted
      />

      {/* Overlay sombre + contenu */}
      <div className="absolute inset-0 flex flex-col">

        {/* Barre du haut */}
        <div
          className="flex items-center justify-between px-5"
          style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 18px)", paddingBottom: 14 }}
        >
          <p className="text-[18px] font-black text-white">Scanner</p>
          <button
            type="button"
            onClick={handleClose}
            className="grid h-11 w-11 place-items-center rounded-full bg-white/20 text-white backdrop-blur"
            aria-label="Fermer"
          >
            <XIcon />
          </button>
        </div>

        {/* Zone centrale */}
        <div className="flex flex-1 flex-col items-center justify-center">

          {state === "loading" && (
            <div className="text-center text-white">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              <p className="text-[14px] font-semibold text-white/70">
                Initialisation de la caméra…
              </p>
            </div>
          )}

          {state === "scanning" && (
            <>
              {/* Viewfinder */}
              <div
                className="relative h-[160px] w-[280px] overflow-hidden rounded-[18px]"
                style={{
                  boxShadow: "0 0 0 2000px rgba(0, 0, 0, 0.65)",
                  border: "2px solid rgba(255, 255, 255, 0.75)",
                }}
              >
                {/* Ligne de scan animée */}
                <div
                  className="absolute left-3 right-3 h-[2px] rounded-full bg-[#e8455f]"
                  style={{
                    animation: "scanLine 1.6s ease-in-out infinite",
                    boxShadow: "0 0 8px 2px rgba(232, 69, 95, 0.6)",
                  }}
                />
                {/* Coins */}
                {[
                  "top-0 left-0 border-t-[3px] border-l-[3px] rounded-tl-[16px]",
                  "top-0 right-0 border-t-[3px] border-r-[3px] rounded-tr-[16px]",
                  "bottom-0 left-0 border-b-[3px] border-l-[3px] rounded-bl-[16px]",
                  "bottom-0 right-0 border-b-[3px] border-r-[3px] rounded-br-[16px]",
                ].map((cls, i) => (
                  <span
                    key={i}
                    className={`absolute h-6 w-6 border-white ${cls}`}
                  />
                ))}
              </div>

              <p className="mt-6 text-[13px] font-semibold text-white/70">
                Pointez vers le code-barres du produit
              </p>
            </>
          )}

          {state === "success" && (
            <div className="text-center text-white">
              <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-[#e8455f]">
                <CheckIcon />
              </div>
              <p className="text-[16px] font-black">Code détecté !</p>
              <p className="mt-1 text-[13px] text-white/60">Recherche du produit…</p>
            </div>
          )}

          {state === "permission_denied" && (
            <div className="mx-8 rounded-[24px] bg-white/10 p-6 text-center backdrop-blur">
              <p className="text-[16px] font-black text-white">Caméra inaccessible</p>
              <p className="mt-2 text-[13px] leading-6 text-white/70">
                Autorise l'accès à la caméra dans Réglages → Safari → Caméra.
              </p>
              <button
                type="button"
                onClick={handleClose}
                className="mt-5 rounded-full bg-white px-6 py-3 text-[13px] font-black text-black"
              >
                Fermer
              </button>
            </div>
          )}

          {state === "error" && (
            <div className="mx-8 rounded-[24px] bg-white/10 p-6 text-center backdrop-blur">
              <p className="text-[16px] font-black text-white">Erreur caméra</p>
              <p className="mt-2 text-[13px] leading-6 text-white/70">
                Impossible d'accéder à la caméra sur cet appareil.
              </p>
              <button
                type="button"
                onClick={handleClose}
                className="mt-5 rounded-full bg-white px-6 py-3 text-[13px] font-black text-black"
              >
                Fermer
              </button>
            </div>
          )}
        </div>

        {/* Saisie manuelle — fallback */}
        {(state === "scanning" || state === "loading") && (
          <div
            className="px-5"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 28px)" }}
          >
            <p className="mb-3 text-center text-[11px] font-bold uppercase tracking-[0.14em] text-white/40">
              ou saisir le code manuellement
            </p>
            <div className="flex gap-2">
              <input
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
                inputMode="numeric"
                placeholder="Ex : 3017620422003"
                className="min-h-[46px] flex-1 rounded-[14px] border border-white/20 bg-white/10 px-4 text-[14px] font-bold text-white placeholder-white/30 outline-none backdrop-blur"
              />
              <button
                type="button"
                onClick={handleManualSubmit}
                disabled={!manualCode.trim()}
                className="min-h-[46px] rounded-[14px] bg-[#e8455f] px-5 text-[13px] font-black text-white disabled:opacity-40"
              >
                OK
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Animation scan line */}
      <style>{`
        @keyframes scanLine {
          0%   { top: 16px; }
          50%  { top: calc(100% - 18px); }
          100% { top: 16px; }
        }
      `}</style>
    </div>
  );
}

function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18" /><path d="m6 6 12 12" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 12 5 5L19 7" />
    </svg>
  );
}
