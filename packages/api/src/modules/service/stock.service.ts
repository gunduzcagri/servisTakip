import prisma from "../../common/utils/prisma";
import { AppError } from "../../common/utils/app-error";
import { CreatePartInput, UpdatePartInput, StockAdjustInput, CreateSupplierInput, UpdateSupplierInput, CreatePurchaseOrderInput } from "./stock.dto";
import { sendCriticalStockAlert } from "../notification/email.service";

export class StockService {
  async listParts(page: number = 1, limit: number = 20, search?: string) {
    const where: any = { isActive: true };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { location: { contains: search } },
      ];
    }

    const [parts, total] = await Promise.all([
      prisma.part.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          supplier: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.part.count({ where }),
    ]);

    const lowStock = parts.filter((p) => p.stockQuantity <= p.criticalThreshold);
    const criticalStock = parts.filter((p) => p.stockQuantity === 0);

    return {
      parts,
      total,
      page,
      limit,
      lowStockCount: lowStock.length,
      criticalStockCount: criticalStock.length,
    };
  }

  async getPartById(id: string) {
    const part = await prisma.part.findUnique({
      where: { id },
      include: {
        supplier: true,
        stockMovements: {
          orderBy: { createdAt: "desc" },
          take: 50,
        },
        stockAlerts: {
          where: { isResolved: false },
          orderBy: { createdAt: "desc" },
        },
        serviceParts: {
          include: {
            serviceRecord: {
              select: { id: true, trackingNumber: true, customer: { select: { fullName: true } } },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!part) throw AppError.notFound("Parca bulunamadi");
    return part;
  }

  async createPart(input: CreatePartInput, userId?: string) {
    const existing = await prisma.part.findUnique({ where: { sku: input.sku } });
    if (existing) throw AppError.validation("Bu SKU zaten kayitli");

    const part = await prisma.part.create({ data: input });

    if (input.stockQuantity > 0) {
      await this.createStockMovement({
        partId: part.id,
        type: "IN",
        quantity: input.stockQuantity,
        previousStock: 0,
        newStock: input.stockQuantity,
        reason: "Initial stock",
        userId,
      });
    }

    return part;
  }

  async updatePart(id: string, input: UpdatePartInput, userId?: string) {
    const part = await prisma.part.findUnique({ where: { id } });
    if (!part) throw AppError.notFound("Parca bulunamadi");

    if (input.sku && input.sku !== part.sku) {
      const dupe = await prisma.part.findUnique({ where: { sku: input.sku } });
      if (dupe) throw AppError.validation("Bu SKU baska bir parcada kullaniliyor");
    }

    if (input.stockQuantity !== undefined && input.stockQuantity !== part.stockQuantity) {
      await this.createStockMovement({
        partId: part.id,
        type: "ADJUSTMENT",
        quantity: input.stockQuantity - part.stockQuantity,
        previousStock: part.stockQuantity,
        newStock: input.stockQuantity,
        reason: input.description || "Manual adjustment",
        userId,
      });
    }

    return prisma.part.update({ where: { id }, data: input });
  }

  async adjustStock(id: string, input: StockAdjustInput, userId?: string) {
    const part = await prisma.part.findUnique({ 
      where: { id },
      select: { id: true, stockQuantity: true, criticalThreshold: true, minStockLevel: true }
    });
    
    if (!part) throw AppError.notFound("Parca bulunamadi");

    const newQty = part.stockQuantity + input.quantity;
    if (newQty < 0) {
      throw AppError.validation("Stok miktari sifirin altina dusemez");
    }

    await prisma.part.update({
      where: { id },
      data: { stockQuantity: newQty },
    });

    await this.createStockMovement({
      partId: part.id,
      type: input.type,
      quantity: input.quantity,
      previousStock: part.stockQuantity,
      newStock: newQty,
      reason: input.reason,
      userId,
    });

    if (newQty <= part.criticalThreshold) {
      await this.createStockAlert(part.id, newQty, part.criticalThreshold);
    }

    return { success: true, newStock: newQty };
  }

  async getLowStockParts() {
    const parts = await prisma.part.findMany({
      where: {
        isActive: true,
        stockQuantity: { lte: prisma.part.fields.criticalThreshold },
      },
      include: {
        supplier: { select: { name: true, phone: true, email: true } },
      },
      orderBy: { stockQuantity: "asc" },
    });
    return parts;
  }

  async createStockMovement(data: {
    partId: string;
    type: "IN" | "OUT" | "ADJUSTMENT" | "RETURN";
    quantity: number;
    previousStock: number;
    newStock: number;
    reason?: string;
    referenceType?: string;
    referenceId?: string;
    userId?: string;
  }) {
    return prisma.stockMovement.create({ data });
  }

  async getStockMovements(partId: string, page: number = 1, limit: number = 50) {
    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where: { partId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.stockMovement.count({ where: { partId } }),
    ]);

    return { movements, total, page, limit };
  }

  async createStockAlert(partId: string, currentStock: number, threshold: number) {
    const existingAlert = await prisma.stockAlert.findFirst({
      where: { partId, isResolved: false },
    });

    if (existingAlert) {
      return existingAlert;
    }

    const part = await prisma.part.findUnique({
      where: { id: partId },
      include: { supplier: true },
    });

    if (!part) return null;

    const alert = await prisma.stockAlert.create({
      data: {
        partId,
        currentStock,
        threshold,
      },
    });

    // Get admin users to notify
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN", isActive: true },
      select: { email: true },
    });

    if (process.env.NODE_ENV === "development" || process.env.SKIP_EMAIL === "true") {
      console.log(`Kritik stok alerti olusturuldu: ${part.name} (SKU: ${part.sku}) - Mevcut: ${currentStock}, Esik: ${threshold}`);
    } else {
      // Send email alerts to all admins
      for (const admin of admins) {
        await sendCriticalStockAlert(
          admin.email,
          part.name,
          part.sku,
          currentStock,
          threshold,
          part.supplier?.name || undefined
        );
      }
    }

    await prisma.stockAlert.update({
      where: { id: alert.id },
      data: { notifiedAt: new Date() },
    });

    return alert;
  }

  async getStockAlerts(resolved?: boolean) {
    const where: any = {};
    if (resolved !== undefined) {
      where.isResolved = resolved;
    }

    return prisma.stockAlert.findMany({
      where,
      include: {
        part: {
          select: {
            id: true,
            name: true,
            sku: true,
            stockQuantity: true,
            supplier: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async resolveStockAlert(id: string) {
    return prisma.stockAlert.update({
      where: { id },
      data: {
        isResolved: true,
        resolvedAt: new Date(),
      },
    });
  }

  async listSuppliers(page: number = 1, limit: number = 20, search?: string) {
    const where: any = { isActive: true };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { contactName: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.supplier.count({ where }),
    ]);

    return { suppliers, total, page, limit };
  }

  async createSupplier(input: CreateSupplierInput) {
    return prisma.supplier.create({ data: input });
  }

  async updateSupplier(id: string, input: UpdateSupplierInput) {
    const supplier = await prisma.supplier.findUnique({ where: { id } });
    if (!supplier) throw AppError.notFound("Tedarikci bulunamadi");

    return prisma.supplier.update({ where: { id }, data: input });
  }

  async createPurchaseOrder(input: CreatePurchaseOrderInput, userId?: string) {
    const orderNumber = `PO-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    const totalAmount = input.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

    const order = await prisma.purchaseOrder.create({
      data: {
        orderNumber,
        supplierId: input.supplierId,
        status: "DRAFT",
        items: input.items,
        totalAmount,
        notes: input.notes,
        expectedDate: input.expectedDate ? new Date(input.expectedDate) : undefined,
      },
    });

    return order;
  }

  async receivePurchaseOrder(orderId: string, userId?: string) {
    const order = await prisma.purchaseOrder.findUnique({
      where: { id: orderId },
      include: { supplier: true },
    });

    if (!order) throw AppError.notFound("Siparis bulunamadi");
    if (order.status !== "SENT") throw AppError.validation("Siparis 'Gonderildi' degil");

    const items = order.items as any[];

    for (const item of items) {
      const part = await prisma.part.findUnique({ where: { id: item.partId } });
      if (!part) continue;

      const prevStock = part.stockQuantity;
      const newStock = prevStock + item.quantity;

      await prisma.part.update({
        where: { id: item.partId },
        data: { stockQuantity: newStock },
      });

      await this.createStockMovement({
        partId: item.partId,
        type: "IN",
        quantity: item.quantity,
        previousStock: prevStock,
        newStock: newStock,
        reason: `Purchase Order: ${order.orderNumber}`,
        referenceType: "PURCHASE_ORDER",
        referenceId: orderId,
        userId,
      });

      if (newStock > part.criticalThreshold) {
        await this.resolveStockAlertsForPart(item.partId);
      }
    }

    return prisma.purchaseOrder.update({
      where: { id: orderId },
      data: {
        status: "RECEIVED",
        receivedDate: new Date(),
      },
    });
  }

  async resolveStockAlertsForPart(partId: string) {
    await prisma.stockAlert.updateMany({
      where: { partId, isResolved: false },
      data: {
        isResolved: true,
        resolvedAt: new Date(),
      },
    });
  }

  async getPurchaseOrders(page: number = 1, limit: number = 20, status?: string) {
    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          supplier: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.purchaseOrder.count({ where }),
    ]);

    return { orders, total, page, limit };
  }

  async updatePurchaseOrderStatus(orderId: string, status: string) {
    return prisma.purchaseOrder.update({
      where: { id: orderId },
      data: { status },
    });
  }
}

export const stockService = new StockService();
