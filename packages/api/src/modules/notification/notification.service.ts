import prisma from "../../common/utils/prisma";
import { sendEmail, sendStatusEmail, sendQuoteEmail, sendCriticalStockAlert } from "./email.service";
import { smsService } from "./sms.service";

export class NotificationService {
  async sendServiceStatusUpdate(
    serviceRecordId: string,
    customerId: string,
    trackingNumber: string,
    status: string,
    note?: string
  ) {
    const customer = await prisma.user.findUnique({
      where: { id: customerId },
      select: { email: true, phone: true },
    });

    if (!customer) return;

    const promises: Promise<any>[] = [];

    // Email
    if (customer.email) {
      promises.push(sendStatusEmail(customer.email, trackingNumber, status, note));
    }

    // SMS
    if (customer.phone) {
      promises.push(
        smsService.sendSms({
          recipient: customer.phone,
          message: `ServisNet: ${trackingNumber} nolu servisiniz ${status} asamasinda. ${note || ""}`,
          referenceType: "SERVICE",
          referenceId: serviceRecordId,
        })
      );
    }

    await Promise.all(promises).catch(() => {});

    // Log notification
    await prisma.notification.create({
      data: {
        userId: customerId,
        serviceRecordId,
        channel: "EMAIL",
        trigger: status as any,
        content: `Durum guncellendi: ${status}`,
        status: "SENT",
      },
    });
  }

  async sendQuoteNotification(
    serviceRecordId: string,
    customerId: string,
    trackingNumber: string,
    estimatedCost: number,
    faultDescription?: string
  ) {
    const customer = await prisma.user.findUnique({
      where: { id: customerId },
      select: { email: true, phone: true },
    });

    if (!customer) return;

    const promises: Promise<any>[] = [];

    // Email
    if (customer.email) {
      promises.push(sendQuoteEmail(customer.email, trackingNumber, estimatedCost, faultDescription));
    }

    // SMS
    if (customer.phone) {
      promises.push(
        smsService.sendSms({
          recipient: customer.phone,
          message: `ServisNet: ${trackingNumber} icin fiyat teklifi: ${estimatedCost} TL. Lutfen onay veriniz.`,
          referenceType: "QUOTE",
          referenceId: serviceRecordId,
        })
      );
    }

    await Promise.all(promises).catch(() => {});
  }

  async sendCriticalStockNotification(
    partId: string,
    partName: string,
    sku: string,
    currentStock: number,
    threshold: number
  ) {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN", isActive: true },
      select: { email: true, phone: true },
    });

    const promises: Promise<any>[] = [];

    for (const admin of admins) {
      // Email
      if (admin.email) {
        promises.push(sendCriticalStockAlert(admin.email, partName, sku, currentStock, threshold));
      }

      // SMS
      if (admin.phone) {
        promises.push(
          smsService.sendSms({
            recipient: admin.phone,
            message: `KRITIK STOK: ${partName} (${sku}) - Mevcut: ${currentStock}`,
            referenceType: "STOCK_ALERT",
            referenceId: partId,
          })
        );
      }
    }

    await Promise.all(promises).catch(() => {});
  }
}

export const notificationService = new NotificationService();
