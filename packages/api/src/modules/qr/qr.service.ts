import QRCode from "qrcode";
import prisma from "../../common/utils/prisma";
import { AppError } from "../../common/utils/app-error";

export class QrService {
  async generateForService(serviceId: string): Promise<string> {
    const record = await prisma.serviceRecord.findUnique({
      where: { id: serviceId },
      select: { trackingNumber: true },
    });

    if (!record) {
      throw AppError.notFound("Servis kaydi bulunamadi");
    }

    const trackingUrl = `${process.env.APP_URL || ""}/track/${record.trackingNumber}`;
    const qrDataUrl = await QRCode.toDataURL(trackingUrl, {
      width: 400,
      margin: 2,
      errorCorrectionLevel: "M",
    });

    return qrDataUrl;
  }

  async getQrForService(serviceId: string) {
    const record = await prisma.serviceRecord.findUnique({
      where: { id: serviceId },
      select: {
        id: true,
        trackingNumber: true,
        customer: { select: { fullName: true } },
        device: {
          select: {
            template: { select: { name: true } },
            dynamicFields: true,
          },
        },
      },
    });

    if (!record) {
      throw AppError.notFound("Servis kaydi bulunamadi");
    }

    const qrCode = await this.generateForService(serviceId);

    return {
      ...record,
      qrCode,
    };
  }

  async getAllPendingQrs(branchId?: string) {
    const where: any = {
      NOT: { status: "DELIVERED" },
    };

    if (branchId) {
      where.branchId = branchId;
    }

    const records = await prisma.serviceRecord.findMany({
      where,
      select: {
        id: true,
        trackingNumber: true,
        status: true,
        customer: { select: { fullName: true, phone: true } },
        device: {
          select: {
            template: { select: { name: true } },
            dynamicFields: true,
          },
        },
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return records;
  }

  async lookupByBarcode(barcode: string) {
    const record = await prisma.serviceRecord.findUnique({
      where: { trackingNumber: barcode },
      select: {
        id: true,
        trackingNumber: true,
        status: true,
        customer: { select: { fullName: true } },
        device: {
          select: {
            template: { select: { name: true } },
            dynamicFields: true,
          },
        },
      },
    });

    if (!record) {
      throw AppError.notFound("Barkod ile eslesen kayit bulunamadi");
    }

    return record;
  }
}

export const qrService = new QrService();
