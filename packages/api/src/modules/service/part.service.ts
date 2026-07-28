import prisma from "../../common/utils/prisma";
import { AppError } from "../../common/utils/app-error";
import { CreatePartInput, UpdatePartInput, StockAdjustInput } from "./part.dto";

export class PartService {
  async list(page: number = 1, limit: number = 20, search?: string) {
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
      ];
    }

    const [parts, total] = await Promise.all([
      prisma.part.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.part.count({ where }),
    ]);

    const lowStock = parts.filter((p) => p.stockQuantity <= p.criticalThreshold);

    return { parts, total, page, limit, lowStockCount: lowStock.length };
  }

  async getById(id: string) {
    const part = await prisma.part.findUnique({
      where: { id },
      include: {
        serviceParts: {
          include: { serviceRecord: { select: { id: true, trackingNumber: true } } },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!part) throw AppError.notFound("Parca bulunamadi");
    return part;
  }

  async create(input: CreatePartInput) {
    const existing = await prisma.part.findUnique({ where: { sku: input.sku } });
    if (existing) throw AppError.validation("Bu SKU zaten kayitli");

    return prisma.part.create({ data: input });
  }

  async update(id: string, input: UpdatePartInput) {
    const part = await prisma.part.findUnique({ where: { id } });
    if (!part) throw AppError.notFound("Parca bulunamadi");

    if (input.sku && input.sku !== part.sku) {
      const dupe = await prisma.part.findUnique({ where: { sku: input.sku } });
      if (dupe) throw AppError.validation("Bu SKU baska bir parcada kullaniliyor");
    }

    return prisma.part.update({ where: { id }, data: input });
  }

  async adjustStock(id: string, input: StockAdjustInput) {
    const part = await prisma.part.findUnique({ where: { id } });
    if (!part) throw AppError.notFound("Parca bulunamadi");

    const newQty = part.stockQuantity + input.quantity;
    if (newQty < 0) {
      throw AppError.validation("Stok miktari sifirin altina dusemez");
    }

    return prisma.part.update({
      where: { id },
      data: { stockQuantity: newQty },
    });
  }
}

export const partService = new PartService();
