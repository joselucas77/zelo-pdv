"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export function PWAUpdater() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        toast.info("Atualização disponível", {
          description: "A aplicar a nova versão do sistema...",
          duration: 3000,
        });

        setTimeout(() => {
          window.location.reload();
        }, 1500);
      });
    }
  }, []);

  return null;
}
