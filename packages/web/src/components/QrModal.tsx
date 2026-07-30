import { Modal, Button, Card, Space, App } from "antd";
import { QrcodeOutlined, PrinterOutlined } from "@ant-design/icons";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../api/client";

interface QrModalProps {
  serviceId: string;
  trackingNumber: string;
  customerName?: string;
}

export function QrModal({ serviceId, trackingNumber, customerName }: QrModalProps) {
  const [open, setOpen] = useState(false);
  const { message } = App.useApp();

  const { data, isLoading } = useQuery({
    queryKey: ["qr", serviceId],
    queryFn: () => api.get(`/qr/service/${serviceId}`).then((r: any) => r.data),
    enabled: open,
  });

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      message.error("Popup engellendi");
      return;
    }

    const qrData = data?.qrCode || "";
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>ServisNet - ${trackingNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
            h1 { color: #1677ff; margin-bottom: 10px; }
            .info { margin: 20px 0; color: #666; }
            .qr { margin: 20px auto; }
            .tracking { font-size: 24px; font-weight: bold; color: #333; margin-top: 20px; }
          </style>
        </head>
        <body>
          <h1>ServisNet</h1>
          <div class="info">
            <p>Musteri: ${customerName || "-"}</p>
            <p>Takip No: ${trackingNumber}</p>
          </div>
          <div class="qr">
            <img src="${qrData}" alt="QR Code" />
          </div>
          <div class="tracking">${trackingNumber}</div>
          <p style="color: #999; font-size: 12px; margin-top: 20px;">
            Takip icin QR kodu okutun
          </p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <>
      <Button icon={<QrcodeOutlined />} onClick={() => setOpen(true)}>
        QR Kod
      </Button>

      <Modal
        title={`QR Kod - ${trackingNumber}`}
        open={open}
        onCancel={() => setOpen(false)}
        footer={
          <Space>
            <Button onClick={() => setOpen(false)}>Kapat</Button>
            <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
              Yazdir
            </Button>
          </Space>
        }
      >
        {isLoading ? (
          <Card loading />
        ) : data?.qrCode ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ marginBottom: 16 }}>
              <strong>Musteri:</strong> {data.customer?.fullName || "-"}
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>Cihaz:</strong> {data.device?.template?.name || "-"}
            </div>
            <div
              style={{
                display: "inline-block",
                padding: 16,
                background: "#fff",
                borderRadius: 8,
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              <img src={data.qrCode} alt="QR Code" style={{ maxWidth: 300 }} />
            </div>
            <div style={{ marginTop: 16 }}>
              <strong style={{ fontSize: 18 }}>{trackingNumber}</strong>
            </div>
            <span style={{ display: "block", marginTop: 8, color: "#999", fontSize: 13 }}>
              Takip icin QR kodu okutun veya takip numarasini kullanin
            </span>
          </div>
        ) : (
          <span style={{ color: "#999" }}>QR kod olusturulamedi</span>
        )}
      </Modal>
    </>
  );
}
