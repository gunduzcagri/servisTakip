import nodemailer from "nodemailer";
import prisma from "../../common/utils/prisma";

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
}

async function getSmtpConfig(): Promise<SmtpConfig | null> {
  const settings = await prisma.systemSetting.findMany({
    where: {
      key: { in: ["smtp_host", "smtp_port", "smtp_secure", "smtp_user", "smtp_pass", "smtp_from_name", "smtp_from_email"] },
    },
  });

  const map = Object.fromEntries(settings.map((s: { key: string; value: string }) => [s.key, s.value]));

  if (!map.smtp_host || !map.smtp_user || !map.smtp_pass) {
    return null;
  }

  return {
    host: map.smtp_host,
    port: parseInt(map.smtp_port || "587"),
    secure: map.smtp_secure === "true",
    user: map.smtp_user,
    pass: map.smtp_pass,
    fromName: map.smtp_from_name || "ServisNet",
    fromEmail: map.smtp_from_email || map.smtp_user,
  };
}

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    const config = await getSmtpConfig();
    if (!config) {
      console.log("SMTP yapilandirilmadi, e-posta gonderilemedi");
      return false;
    }

    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: { user: config.user, pass: config.pass },
    });

    await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to,
      subject,
      html,
    });

    console.log(`E-posta gonderildi: ${to} - ${subject}`);
    return true;
  } catch (err) {
    console.error("E-posta gonderim hatasi:", err);
    return false;
  }
}

export async function sendStatusEmail(
  to: string,
  trackingNumber: string,
  status: string,
  note?: string
) {
  const statusLabels: Record<string, string> = {
    RECEIVED: "Kabul Edildi",
    INSPECTING: "Inceleniyor",
    PRICE_OFFER: "Fiyat Teklifi",
    APPROVED: "Onaylandi",
    CANCELLED: "Iptal Edildi",
    PARTS_WAITING: "Parca Bekleniyor",
    REPAIRING: "Onarimda",
    QC: "Kalite Kontrol",
    READY: "Teslime Hazir",
    DELIVERED: "Teslim Edildi",
  };

  const label = statusLabels[status] || status;
  const trackingUrl = `${process.env.APP_URL || ""}/track/${trackingNumber}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1677ff;">ServisNet - Durum Guncellemesi</h2>
      <p>Takip No: <strong>${trackingNumber}</strong></p>
      <p>Cihazinizin durumu guncellendi:</p>
      <div style="background: #f0f5ff; border-left: 4px solid #1677ff; padding: 12px; margin: 16px 0;">
        <strong>${label}</strong>
        ${note ? `<br/>${note}` : ""}
      </div>
      ${trackingUrl ? `<p>Detayli takip icin: <a href="${trackingUrl}">${trackingUrl}</a></p>` : ""}
      <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;" />
      <p style="color: #999; font-size: 12px;">Bu e-posta ServisNet tarafindan otomatik olarak gonderilmistir.</p>
    </div>
  `;

  return sendEmail(to, `ServisNet - ${trackingNumber} | ${label}`, html);
}

export async function sendQuoteEmail(
  to: string,
  trackingNumber: string,
  estimatedCost: number,
  faultDescription?: string
) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1677ff;">ServisNet - Fiyat Teklifi</h2>
      <p>Takip No: <strong>${trackingNumber}</strong></p>
      ${faultDescription ? `<p>Ariza: ${faultDescription}</p>` : ""}
      <div style="background: #fff7e6; border: 2px solid #faad14; border-radius: 8px; padding: 20px; margin: 16px 0; text-align: center;">
        <p style="font-size: 14px; color: #666; margin: 0;">Tahmini Onarim Ucreti</p>
        <p style="font-size: 32px; font-weight: bold; color: #faad14; margin: 8px 0;">${estimatedCost} TL</p>
      </div>
      <p>Teklife onay vermek veya reddetmek icin lutfen servis noktamizla iletisime geciniz.</p>
      <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;" />
      <p style="color: #999; font-size: 12px;">Bu e-posta ServisNet tarafindan otomatik olarak gonderilmistir.</p>
    </div>
  `;

  return sendEmail(to, `ServisNet - ${trackingNumber} | Fiyat Teklifi`, html);
}

export async function sendCriticalStockAlert(
  to: string,
  partName: string,
  sku: string,
  currentStock: number,
  criticalThreshold: number,
  supplierName?: string
) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #ff4d4f;">ServisNet - Kritik Stok Uyarisı</h2>
      <div style="background: #fff1f0; border-left: 4px solid #ff4d4f; padding: 16px; margin: 16px 0;">
        <p style="margin: 0; font-size: 16px;"><strong>Parca:</strong> ${partName}</p>
        <p style="margin: 8px 0; font-size: 14px;"><strong>SKU:</strong> ${sku}</p>
        <p style="margin: 8px 0; font-size: 14px;"><strong>Mevcut Stok:</strong> <span style="color: #ff4d4f; font-weight: bold; font-size: 18px;">${currentStock}</span></p>
        <p style="margin: 8px 0; font-size: 14px;"><strong>Kritik Esik:</strong> ${criticalThreshold}</p>
        ${supplierName ? `<p style="margin: 8px 0; font-size: 14px;"><strong>Tedarikci:</strong> ${supplierName}</p>` : ""}
      </div>
      <p style="color: #ff4d4f; font-weight: 600;">Bu parca kritik stok seviyesinin altina dustu. Lutfen ivedilikle siparis veriniz.</p>
      <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;" />
      <p style="color: #999; font-size: 12px;">Bu e-posta ServisNet tarafindan otomatik olarak gonderilmistir.</p>
    </div>
  `;

  return sendEmail(to, `ServisNet - Kritik Stok: ${partName}`, html);
}
