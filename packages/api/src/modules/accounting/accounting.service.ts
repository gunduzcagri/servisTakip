import prisma from "../../common/utils/prisma";
import { AppError } from "../../common/utils/app-error";

export class AccountingService {
  // ACCOUNTS
  async getAccounts(type?: string) {
    const where: any = { isActive: true };
    if (type) where.type = type;

    return prisma.account.findMany({
      where,
      include: {
        parent: { select: { id: true, name: true } },
        children: { select: { id: true, name: true } },
      },
      orderBy: { code: "asc" },
    });
  }

  async getAccountById(id: string) {
    const account = await prisma.account.findUnique({
      where: { id },
      include: {
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
    });

    if (!account) throw AppError.notFound("Hesap bulunamadi");
    return account;
  }

  async createAccount(data: {
    code: string;
    name: string;
    type: string;
    parentId?: string;
    description?: string;
  }) {
    const existing = await prisma.account.findUnique({
      where: { code: data.code },
    });

    if (existing) throw AppError.validation("Bu kodda hesap zaten var");

    const createData: any = {
      code: data.code,
      name: data.name,
      type: data.type as any,
      description: data.description,
    };

    if (data.parentId) {
      createData.parentId = data.parentId;
    }

    return prisma.account.create({ data: createData });
  }

  async updateAccount(id: string, data: Partial<{ name: string; description: string; isActive: boolean }>) {
    return prisma.account.update({ where: { id }, data });
  }

  // INVOICES
  async getInvoices(page: number = 1, limit: number = 20, status?: string, customerId?: string) {
    const where: any = {};
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          customer: { select: { id: true, fullName: true } },
          serviceRecord: { select: { trackingNumber: true } },
          payments: { select: { amount: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.invoice.count({ where }),
    ]);

    return { invoices, total, page, limit };
  }

  async getInvoiceById(id: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, fullName: true, email: true, phone: true } },
        serviceRecord: { select: { id: true, trackingNumber: true } },
        items: true,
        payments: { orderBy: { paymentDate: "desc" } },
      },
    });

    if (!invoice) throw AppError.notFound("Fatura bulunamadi");
    return invoice;
  }

  async createInvoice(data: {
    type: string;
    customerId?: string;
    serviceRecordId?: string;
    items: { description: string; quantity: number; unitPrice: number; taxRate?: number }[];
    notes?: string;
    dueDate?: string;
    taxRate?: number;
    discount?: number;
  }, userId?: string) {
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Calculate totals
    const subtotal = data.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const taxRate = data.taxRate || 18;
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount - (data.discount || 0);

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        type: data.type as any,
        status: "DRAFT",
        customerId: data.customerId,
        serviceRecordId: data.serviceRecordId,
        subtotal,
        taxRate,
        taxAmount,
        total,
        discount: data.discount || 0,
        notes: data.notes,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        items: {
          create: data.items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
            taxRate: item.taxRate || taxRate,
          })),
        },
      },
      include: { items: true },
    });

    // Create accounting transaction
    if (data.type === "SALES") {
      await this.createTransaction({
        accountId: await this.getRevenueAccountId(),
        type: "CREDIT",
        amount: subtotal,
        description: `Fatura: ${invoiceNumber}`,
        referenceType: "INVOICE",
        referenceId: invoice.id,
      });
    }

    return invoice;
  }

  async updateInvoiceStatus(id: string, status: string) {
    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) throw AppError.notFound("Fatura bulunamadi");

    const update: any = { status: status as any };

    if (status === "PAID") {
      update.paidDate = new Date();
    }

    return prisma.invoice.update({
      where: { id },
      data: update,
    });
  }

  async createPayment(data: {
    invoiceId: string;
    amount: number;
    method: string;
    reference?: string;
    notes?: string;
    paymentDate?: string;
  }) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: data.invoiceId },
      include: { payments: true, serviceRecord: true },
    });

    if (!invoice) throw AppError.notFound("Fatura bulunamadi");

    const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
    if (totalPaid + data.amount > invoice.total) {
      throw AppError.validation("Odenen tutar fatura tutarindan buyuk olamaz");
    }

    const payment = await prisma.payment.create({
      data: {
        invoiceId: data.invoiceId,
        amount: data.amount,
        method: data.method as any,
        reference: data.reference,
        notes: data.notes,
        paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
      },
    });

    // Update invoice status if fully paid
    const newTotalPaid = totalPaid + data.amount;
    if (newTotalPaid >= invoice.total) {
      await prisma.invoice.update({
        where: { id: data.invoiceId },
        data: { status: "PAID", paidDate: new Date() },
      });
    }

    // Create accounting transaction
    await this.createTransaction({
      accountId: await this.getCashAccountId(),
      type: "DEBIT",
      amount: data.amount,
      description: `Fatura odemesi: ${invoice.invoiceNumber}`,
      referenceType: "PAYMENT",
      referenceId: payment.id,
    });

    // Update service status if applicable
    if (invoice.serviceRecord && newTotalPaid >= invoice.total && invoice.serviceRecord.status === "READY") {
      await prisma.serviceRecord.update({
        where: { id: invoice.serviceRecord.id },
        data: { status: "DELIVERED", deliveredAt: new Date() },
      });
    }

    return payment;
  }

  // EXPENSES
  async getExpenses(page: number = 1, limit: number = 20, category?: string, fromDate?: Date, toDate?: Date) {
    const where: any = {};
    if (category) where.category = category;
    if (fromDate || toDate) {
      where.date = {};
      if (fromDate) where.date.gte = fromDate;
      if (toDate) where.date.lte = toDate;
    }

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { date: "desc" },
      }),
      prisma.expense.count({ where }),
    ]);

    return { expenses, total, page, limit };
  }

  async createExpense(data: {
    category: string;
    description: string;
    amount: number;
    vendor?: string;
    invoiceNo?: string;
    paymentMethod?: string;
    notes?: string;
    date?: string;
  }) {
    const expense = await prisma.expense.create({
      data: {
        ...data,
        paymentMethod: (data.paymentMethod as any) || "CASH",
        date: data.date ? new Date(data.date) : new Date(),
      },
    });

    // Create accounting transaction
    await this.createTransaction({
      accountId: await this.getExpenseAccountId(data.category),
      type: "DEBIT",
      amount: data.amount,
      description: `Gider: ${data.description}`,
      referenceType: "EXPENSE",
      referenceId: expense.id,
    });

    return expense;
  }

  async deleteExpense(id: string) {
    return prisma.expense.delete({ where: { id } });
  }

  // TRANSACTIONS
  private async createTransaction(data: {
    accountId: string;
    type: string;
    amount: number;
    description: string;
    referenceType?: string;
    referenceId?: string;
  }) {
    return prisma.accountTransaction.create({
      data,
    });
  }

  private async getRevenueAccountId(): Promise<string> {
    let account = await prisma.account.findFirst({ where: { type: "REVENUE" } });
    if (!account) {
      account = await prisma.account.create({
        data: { code: "600", name: "Yurtici Satislar", type: "REVENUE" },
      });
    }
    return account.id;
  }

  private async getCashAccountId(): Promise<string> {
    let account = await prisma.account.findFirst({ where: { type: "ASSET", code: { startsWith: "10" } } });
    if (!account) {
      account = await prisma.account.create({
        data: { code: "100", name: "Kasa", type: "ASSET" },
      });
    }
    return account.id;
  }

  private async getExpenseAccountId(category: string): Promise<string> {
    let account = await prisma.account.findFirst({
      where: { type: "EXPENSE", name: { contains: category } },
    });
    if (!account) {
      account = await prisma.account.create({
        data: { code: `7${Date.now() % 100}`, name: category, type: "EXPENSE" },
      });
    }
    return account.id;
  }

  // REPORTS
  async getFinancialSummary(fromDate?: Date, toDate?: Date) {
    const where: any = {};
    if (fromDate || toDate) {
      where.where = {};
      if (fromDate) where.where.createdAt = { gte: fromDate };
      if (toDate) where.where.createdAt = { lte: toDate };
    }

    const [totalRevenue, totalExpenses, totalInvoices, paidInvoices, outstandingInvoices] = await Promise.all([
      prisma.invoice.aggregate({
        where: { type: "SALES", status: { in: ["PAID", "SENT", "OVERDUE"] } },
        _sum: { total: true },
      }),
      prisma.expense.aggregate({
        where: where.where || {},
        _sum: { amount: true },
      }),
      prisma.invoice.count({ where: { type: "SALES" } }),
      prisma.invoice.count({ where: { type: "SALES", status: "PAID" } }),
      prisma.invoice.aggregate({
        where: { type: "SALES", status: { in: ["SENT", "OVERDUE"] } },
        _sum: { total: true },
      }),
    ]);

    return {
      revenue: totalRevenue._sum.total || 0,
      expenses: totalExpenses._sum.amount || 0,
      profit: (totalRevenue._sum.total || 0) - (totalExpenses._sum.amount || 0),
      totalInvoices,
      paidInvoices,
      outstandingInvoices: outstandingInvoices._sum.total || 0,
    };
  }
}

export const accountingService = new AccountingService();
