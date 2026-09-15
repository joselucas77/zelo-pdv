"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface BarcodeScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (barcode: string) => void;
}

export function BarcodeScanner({
  open,
  onOpenChange,
  onScan,
}: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState("");
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const startScan = async () => {
    setError("");

    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("reader");
      }

      await scannerRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
        },
        (decodedText) => {
          onScan(decodedText);
          stopScan();
          onOpenChange(false);
        },
        (errorMessage) => {
          // Ignore parsing errors as they fire constantly when no code is present
        },
      );
      setIsScanning(true);
    } catch (err) {
      setError(
        "Nenhuma câmera traseira encontrada ou sem permissão de acesso.",
      );
      setIsScanning(false);
    }
  };

  const stopScan = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        setIsScanning(false);
      } catch (err) {
        console.error("Failed to stop scanner", err);
      }
    }
  };

  useEffect(() => {
    if (open) {
      // Small timeout to ensure DOM is ready before injecting the video
      const timeout = setTimeout(() => startScan(), 100);
      return () => clearTimeout(timeout);
    } else {
      stopScan();
    }
  }, [open]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ler Código de Barras</DialogTitle>
          <DialogDescription>
            Aponte a câmera traseira para o código de barras.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 flex flex-col items-center">
          {error && (
            <p className="text-sm text-red-500 font-medium text-center">
              {error}
            </p>
          )}

          <div
            className={`w-full max-w-sm overflow-hidden rounded-lg bg-black ${
              isScanning ? "block" : "hidden"
            }`}
          >
            <div id="reader" className="w-full"></div>
          </div>

          {!isScanning && !error && (
            <p className="text-sm text-muted-foreground">Iniciando câmera...</p>
          )}
        </div>

        <div className="flex justify-end w-full mt-2">
          <Button
            variant="outline"
            onClick={() => {
              stopScan();
              onOpenChange(false);
            }}
          >
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
