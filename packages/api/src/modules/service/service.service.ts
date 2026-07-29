import prisma from "../../common/utils/prisma";
import { AppError } from "../../common/utils/app-error";
import {
  CreateServiceInput,
  UpdateStatusInput,
  AddActionInput,
  AddPartInput,
  QuoteInput,
} from "./service.dto";
import { isValidTransition, generateTrackingNumber } from "./state-machine";
import { sendStatusEmail, sendQuoteEmail } from "../notification/email.service";

export class ServiceService {
  async list(params: {
    page?: number;
    limit?: number;
    status?: string;
    technicianId?: string;
    customerId?: string;
    role: string;
    userId: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const where: any = {};

    if (params.role === "TECHNICIAN") {
      where.technicianId = params.userId;
    } else if (params.role === "CUSTOMER") {
      where.customerId = params.userId;
    }

    if (params.status) where.status = params.status;
    if (params.technicianId && params.role === "ADMIN") {
      where.technicianId = params.technicianId;
    }

    const [records, total] = await Promise.all([
      prisma.serviceRecord.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          customer: { select: { id: true, fullName: true, phone: true } },
          technician: { select: { id: true, fullName: true } },
          device: {
            select: {
              id: true,
              template: { select: { id: true, name: true } },
              dynamicFields: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.serviceRecord.count({ where }),
    ]);

    return { records, total, page, limit };
  }

  async getById(id: string) {
    const record = await prisma.serviceRecord.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, fullName: true, phone: true, email: true } },
        technician: { select: { id: true, fullName: true } },
        device: {
          include: { template: { select: { id: true, name: true } } },
        },
        branch: { select: { id: true, name: true } },
        statusLogs: {
          include: { changedByUser: { select: { id: true, fullName: true } } },
          orderBy: { createdAt: "asc" },
        },
        actions: { orderBy: { createdAt: "desc" } },
        photos: { orderBy: { createdAt: "desc" } },
        serviceParts: {
          include: { part: { select: { id: true, name: true, sku: true } } },
        },
        ratings: true,
      },
    });

    if (!record) throw AppError.notFound("Servis kaydi bulunamadi");
    return record;
  }

  async getByTrackingNumber(trackingNumber: string) {
    const record = await prisma.serviceRecord.findUnique({
      where: { trackingNumber },
      select: {
        trackingNumber: true,
        status: true,
        estimatedDelivery: true,
        faultDescription: true,
        estimatedCost: true,
        customerApproved: true,
        statusLogs: {
          select: { status: true, note: true, createdAt: true },
          orderBy: { createdAt: "asc" },
        },
        createdAt: true,
      },
    });

    if (!record) throw AppError.notFound("Takip numarasi bulunamadi");
    return record;
  }

  async create(input: CreateServiceInput, userId: string) {
    const lastRecord = await prisma.serviceRecord.findFirst({
      orderBy: { createdAt: "desc" },
      select: { trackingNumber: true },
    });

    let lastNumber = 0;
    if (lastRecord) {
      const match = lastRecord.trackingNumber.match(/SRV-(\d+)/);
      if (match) lastNumber = parseInt(match[1], 10);
    }

    const trackingNumber = generateTrackingNumber(lastNumber);

    const record = await prisma.serviceRecord.create({
      data: {
        trackingNumber,
        customerId: input.customerId,
        deviceId: input.deviceId,
        technicianId: input.technicianId,
        branchId: input.branchId,
        faultDescription: input.faultDescription,
        estimatedCost: input.estimatedCost,
        estimatedDelivery: input.estimatedDelivery ? new Date(input.estimatedDelivery) : undefined,
        status: "RECEIVED",
        statusLogs: {
          create: {
            status: "RECEIVED",
            note: "Cihaz servise kabul edildi",
            changedBy: userId,
          },
        },
      },
      include: {
        customer: { select: { id: true, fullName: true, phone: true } },
        device: {
          include: { template: { select: { id: true, name: true } } },
        },
      },
    });

    return record;
  }

  async updateStatus(id: string, input: UpdateStatusInput, userId: string) {
    const record = await prisma.serviceRecord.findUnique({
      where: { id },
      include: { customer: { select: { email: true } } },
    });
    if (!record) throw AppError.notFound("Servis kaydi bulunamadi");

    if (!isValidTransition(record.status, input.status)) {
      throw AppError.validation(
        `'${record.status}' durumundan '${input.status}' durumuna gecis yapilamaz`
      );
    }

    const updated = await prisma.serviceRecord.update({
      where: { id },
      data: {
        status: input.status,
        statusLogs: {
          create: {
            status: input.status,
            note: input.note,
            changedBy: userId,
          },
        },
      },
    });

    // Customer'a e-posta gonder
    if (record.customer?.email) {
      sendStatusEmail(record.customer.email, record.trackingNumber, input.status, input.note).catch(() => {});
    }

    return updated;
  }

  async sendQuote(id: string, input: QuoteInput) {
    const record = await prisma.serviceRecord.findUnique({
      where: { id },
      include: { customer: { select: { email: true } } },
    });
    if (!record) throw AppError.notFound("Servis kaydi bulunamadi");

    if (record.status !== "INSPECTING") {
      throw AppError.validation("Fiyat teklifi sadece inceleme asamasindaki kayitlar icin gonderilebilir");
    }

    const updated = await prisma.serviceRecord.update({
      where: { id },
      data: {
        estimatedCost: input.estimatedCost,
        estimatedDelivery: input.estimatedDelivery ? new Date(input.estimatedDelivery) : undefined,
        status: "PRICE_OFFER",
        statusLogs: {
          create: {
            status: "PRICE_OFFER",
            note: input.note || `Fiyat teklifi: ${input.estimatedCost} TL`,
          },
        },
      },
    });

    // Musteriye fiyat teklifi e-postasi gonder
    if (record.customer?.email) {
      sendQuoteEmail(record.customer.email, record.trackingNumber, input.estimatedCost, record.faultDescription || undefined).catch(() => {});
    }

    return updated;
  }

  async approveQuote(id: string) {
    const record = await prisma.serviceRecord.findUnique({
      where: { id },
      include: { customer: { select: { email: true } } },
    });
    if (!record) throw AppError.notFound("Servis kaydi bulunamadi");

    if (record.status !== "PRICE_OFFER") {
      throw AppError.validation("Sadece fiyat teklifi asamasindaki kayitlar onaylanabilir");
    }

    const updated = await prisma.serviceRecord.update({
      where: { id },
      data: {
        status: "APPROVED",
        customerApproved: true,
        statusLogs: {
          create: {
            status: "APPROVED",
            note: "Musteri onarimi onayladi",
          },
        },
      },
    });

    if (record.customer?.email) {
      sendStatusEmail(record.customer.email, record.trackingNumber, "APPROVED", "Musteri onarimi onayladi").catch(() => {});
    }

    return updated;
  }

  async rejectQuote(id: string) {
    const record = await prisma.serviceRecord.findUnique({
      where: { id },
      include: { customer: { select: { email: true } } },
    });
    if (!record) throw AppError.notFound("Servis kaydi bulunamadi");

    if (record.status !== "PRICE_OFFER") {
      throw AppError.validation("Sadece fiyat teklifi asamasindaki kayitlar reddedilebilir");
    }

    const updated = await prisma.serviceRecord.update({
      where: { id },
      data: {
        status: "CANCELLED",
        customerApproved: false,
        statusLogs: {
          create: {
            status: "CANCELLED",
            note: "Musteri fiyat teklifini reddetti",
          },
        },
      },
    });

    if (record.customer?.email) {
      sendStatusEmail(record.customer.email, record.trackingNumber, "CANCELLED", "Teklif reddedildi").catch(() => {});
    }

    return updated;
  }

  async addAction(id: string, input: AddActionInput, technicianId: string) {
    const record = await prisma.serviceRecord.findUnique({ where: { id } });
    if (!record) throw AppError.notFound("Servis kaydi bulunamadi");

    return prisma.serviceAction.create({
      data: {
        serviceRecordId: id,
        description: input.description,
        laborCost: input.laborCost,
        timeSpentMin: input.timeSpentMin,
        technicianId,
      },
    });
  }

  async addPart(id: string, input: AddPartInput) {
    const record = await prisma.serviceRecord.findUnique({ where: { id } });
    if (!record) throw AppError.notFound("Servis kaydi bulunamadi");

    const part = await prisma.part.findUnique({ where: { id: input.partId } });
    if (!part) throw AppError.notFound("Parca bulunamadi");

    if (part.stockQuantity < input.quantity) {
      throw AppError.validation(`Yetersiz stok. Mevcut: ${part.stockQuantity}`);
    }

    const [servicePart] = await Promise.all([
      prisma.servicePart.create({
        data: {
          serviceRecordId: id,
          partId: input.partId,
          quantity: input.quantity,
          unitPriceAtTime: part.unitPrice,
        },
        include: { part: { select: { id: true, name: true, sku: true } } },
      }),
      prisma.part.update({
        where: { id: input.partId },
        data: { stockQuantity: { decrement: input.quantity } },
      }),
    ]);

    return servicePart;
  }

  async addPhoto(id: string, url: string, type: string = "BEFORE", note?: string) {
    const record = await prisma.serviceRecord.findUnique({ where: { id } });
    if (!record) throw AppError.notFound("Servis kaydi bulunamadi");

    return prisma.servicePhoto.create({
      data: {
        serviceRecordId: id,
        url,
        type: type as any,
        note,
      },
    });
  }

  async addRating(id: string, score: number, comment?: string) {
    const record = await prisma.serviceRecord.findUnique({ where: { id } });
    if (!record) throw AppError.notFound("Servis kaydi bulunamadi");

    if (score < 1 || score > 5) {
      throw AppError.validation("Puan 1-5 arasinda olmalidir");
    }

    const existing = await prisma.customerRating.findUnique({
      where: { serviceRecordId: id },
    });
    if (existing) {
      throw AppError.validation("Bu servis kaydi zaten degerlendirilmis");
    }

    return prisma.customerRating.create({
      data: { serviceRecordId: id, score, comment },
    });
  }
}

export const serviceService = new ServiceService();
