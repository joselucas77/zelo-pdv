"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export function PWAUpdater() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // Registrar o Service Worker de forma segura
      navigator.serviceWorker.register("/sw.js").then(
        function (registration) {
          console.log("Service Worker registration successful with scope: ", registration.scope);
        },
        function (err) {
          console.log("Service Worker registration failed: ", err);
        }
      );

      // Ouvir atualizações
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
