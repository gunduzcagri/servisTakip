import { useState, useRef, useEffect } from "react";
import { Modal, Button, App } from "antd";
import { BarcodeOutlined } from "@ant-design/icons";
import { Html5QrcodeScanner } from "html5-qrcode";
import api from "../api/client";

interface BarcodeScannerProps {
  onScan: (result: any) => void;
  trigger?: "button" | "auto";
}

export function BarcodeScanner({ onScan, trigger = "button" }: BarcodeScannerProps) {
  const [open, setOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const { message } = App.useApp();

  const startScan = () => {
    setOpen(true);
    setScanning(true);
  };

  const stopScan = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(() => {});
      scannerRef.current = null;
    }
    setScanning(false);
    setOpen(false);
  };

  const onScanSuccess = async (decodedText: string) => {
    if (!decodedText) return;

    try {
      stopScan();
      const { data } = await api.post("/qr/scan", { barcode: decodedText });
      onScan(data);
    } catch (err: any) {
      message.error(err?.response?.data?.error?.message || "Barkod okunamadi");
      stopScan();
    }
  };

  const onScanError = (errorMessage: string) => {
    console.log("Scan error:", errorMessage);
  };

  useEffect(() => {
    if (open && scanning && !scannerRef.current) {
      scannerRef.current = new Html5QrcodeScanner(
        "scanner-container",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        false
      );

      scannerRef.current.render(onScanSuccess, onScanError);
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [open, scanning]);

  if (trigger === "auto") {
    return (
      <Button icon={<BarcodeOutlined />} onClick={startScan}>
        Barkod Oku
      </Button>
    );
  }

  return (
    <>
      <Button type="primary" icon={<BarcodeOutlined />} onClick={startScan}>
        Barkod Oku
      </Button>

      <Modal
        title="Barkod / QR Kod Oku"
        open={open}
        onCancel={stopScan}
        footer={
          <Button onClick={stopScan}>Kamera Kapat</Button>
        }
        width={400}
      >
        <div style={{ textAlign: "center" }}>
          <div id="scanner-container" style={{ marginBottom: 16 }} />
          <p style={{ color: "#999", fontSize: 13 }}>
            Kamera iznini verin ve barkodu/QR kodu kare icine tutun
          </p>
        </div>
      </Modal>
    </>
  );
}
