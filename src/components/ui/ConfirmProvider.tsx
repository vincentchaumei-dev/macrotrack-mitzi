"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";

type ConfirmTone = "default" | "danger";

type ConfirmOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
};

type ConfirmContextValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<ConfirmOptions | null>(null);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    setRequest(options);

    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  function close(value: boolean) {
    resolverRef.current?.(value);
    resolverRef.current = null;
    setRequest(null);
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      {request && (
        <div className="fixed inset-0 z-[120] grid place-items-end bg-black/28 px-4 pb-[calc(18px+env(safe-area-inset-bottom))] backdrop-blur-sm sm:place-items-center sm:pb-0">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-[390px] rounded-[30px] bg-white p-5 shadow-[0_28px_80px_rgba(23,19,24,0.24)] ring-1 ring-[var(--mt-line)]"
          >
            <div
              className={`grid h-12 w-12 place-items-center rounded-[18px] ${
                request.tone === "danger"
                  ? "bg-[var(--mt-rouge-wash)] text-[var(--mt-rouge-deep)]"
                  : "bg-[var(--mt-card-soft)] text-[var(--mt-ink)]"
              }`}
            >
              <span className="text-xl font-black">!</span>
            </div>

            <h2 className="mt-4 text-[24px] font-black leading-tight tracking-[-0.045em] text-[var(--mt-ink)]">
              {request.title}
            </h2>

            <p className="mt-3 text-[13px] font-semibold leading-6 text-[var(--mt-ink-2)]">
              {request.message}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => close(false)}
                className="rounded-[18px] bg-[var(--mt-card-soft)] px-4 py-4 text-[13px] font-black text-[var(--mt-ink)] ring-1 ring-[var(--mt-line)]"
              >
                {request.cancelLabel ?? "Annuler"}
              </button>

              <button
                type="button"
                onClick={() => close(true)}
                className={`rounded-[18px] px-4 py-4 text-[13px] font-black text-white ${
                  request.tone === "danger"
                    ? "bg-[var(--mt-rouge-deep)]"
                    : "bg-[var(--mt-rouge)]"
                } shadow-[var(--mt-shadow-red)]`}
              >
                {request.confirmLabel ?? "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);

  if (!context) {
    throw new Error("useConfirm must be used inside ConfirmProvider");
  }

  return context.confirm;
}