"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, CameraDevice } from "html5-qrcode";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

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
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>("");
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState("");
  const scannerRef = useRef<Html5Qrcode | null>(null);

  // Initialize and get cameras when modal opens
  useEffect(() => {
    if (open) {
      Html5Qrcode.getCameras()
        .then((devices) => {
          if (devices && devices.length) {
            setCameras(devices);
            // Default to back camera if available, otherwise the first one
            const backCam = devices.find(
              (c) =>
                c.label.toLowerCase().includes("back") ||
                c.label.toLowerCase().includes("traseira") ||
                c.label.toLowerCase().includes("ambiente"),
            );
            setSelectedCamera(backCam ? backCam.id : devices[0].id);
          } else {
            setError("Nenhuma câmera encontrada no dispositivo.");
          }
        })
        .catch(() => {
          setError("Por favor, permita o acesso à câmera para continuar.");
        });
    } else {
      stopScan();
    }
  }, [open]);

  const startScan = async () => {
    if (!selectedCamera) return;
    setError("");

    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("reader");
      }

      await scannerRef.current.start(
        selectedCamera,
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
      setError("Falha ao iniciar a leitura da câmera.");
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
            Aponte a câmera para o código de barras (EAN-13, QR, etc).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {error && (
            <p className="text-sm text-red-500 font-medium text-center">
              {error}
            </p>
          )}

          {!isScanning && cameras.length > 0 && (
            <div className="space-y-2">
              <Label>Selecione a Câmera</Label>
              <Select
                value={selectedCamera}
                onValueChange={(val) => setSelectedCamera(val || "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {cameras.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.label || `Câmera ${c.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div
            className={`w-full max-w-sm mx-auto overflow-hidden rounded-lg bg-black ${
              isScanning ? "block" : "hidden"
            }`}
          >
            <div id="reader" className="w-full"></div>
          </div>
        </div>

        <div className="flex justify-between items-center w-full mt-2">
          <Button
            variant="outline"
            onClick={() => {
              stopScan();
              onOpenChange(false);
            }}
          >
            Cancelar
          </Button>

          {isScanning ? (
            <Button variant="destructive" onClick={stopScan}>
              Parar Câmera
            </Button>
          ) : (
            <Button onClick={startScan} disabled={!selectedCamera || !!error}>
              Iniciar Leitura
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
