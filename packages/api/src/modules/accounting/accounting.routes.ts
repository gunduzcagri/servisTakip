import { Router, Request, Response } from "express";
import { accountingService } from "./accounting.service";
import { asyncHandler } from "../../common/middleware/error-handler";
import { authenticate, authorize } from "../../common/guards/auth.guard";
import { AppError } from "../../common/utils/app-error";
import { z } from "zod";

const router = Router();

router.use(authenticate);

/**
 * @route   GET /api/accounting/accounts
 * @desc    Get chart of accounts
 */
router.get(
  "/accounts",
  authorize("ADMIN"),
  asyncHandler(async (req: Request, res: Response) => {
    const type = req.query.type as string | undefined;
    const accounts = await accountingService.getAccounts(type);
    res.json({ accounts });
  })
);

/**
 * @route   POST /api/accounting/accounts
 * @desc    Create account
 */
router.post(
  "/accounts",
  authorize("ADMIN"),
  asyncHandler(async (req: Request, res: Response) => {
    const { code, name, type, parentId, description } = req.body;
    if (!code || !name || !type) {
      throw AppError.validation("code, name ve type gerekli");
    }
    const account = await accountingService.createAccount({ code, name, type, parentId, description });
    res.status(201).json(account);
  })
);

/**
 * @route   GET /api/accounting/invoices
 * @desc    List invoices
 */
router.get(
  "/invoices",
  authorize("ADMIN"),
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string | undefined;
    const customerId = req.query.customerId as string | undefined;

    const result = await accountingService.getInvoices(page, limit, status, customerId);
    res.json(result);
  })
);

/**
 * @route   GET /api/accounting/invoices/:id
 * @desc    Get invoice by ID
 */
router.get(
  "/invoices/:id",
  authorize("ADMIN"),
  asyncHandler(async (req: Request, res: Response) => {
    const invoice = await accountingService.getInvoiceById(req.params.id);
    res.json(invoice);
  })
);

/**
 * @route   POST /api/accounting/invoices
 * @desc    Create invoice
 */
router.post(
  "/invoices",
  authorize("ADMIN"),
  asyncHandler(async (req: Request, res: Response) => {
    const { type, customerId, serviceRecordId, items, notes, dueDate, taxRate, discount } = req.body;
    
    if (!type || !items || items.length === 0) {
      throw AppError.validation("Type ve items gerekli");
    }

    const invoiceSchema = z.object({
      type: z.enum(["SALES", "PURCHASE", "PROFORMA"]),
      customerId: z.string().optional(),
      serviceRecordId: z.string().optional(),
      items: z.array(z.object({
        description: z.string(),
        quantity: z.number().int().positive(),
        unitPrice: z.number().min(0),
        taxRate: z.number().optional(),
      })),
      notes: z.string().optional(),
      dueDate: z.string().optional(),
      taxRate: z.number().optional(),
      discount: z.number().min(0).optional(),
    });

    const validated = invoiceSchema.parse({ type, customerId, serviceRecordId, items, notes, dueDate, taxRate, discount });
    const userId = (req as any).user?.id;
    
    const invoice = await accountingService.createInvoice(validated, userId);
    res.status(201).json(invoice);
  })
);

/**
 * @route   PUT /api/accounting/invoices/:id/status
 * @desc    Update invoice status
 */
router.put(
  "/invoices/:id/status",
  authorize("ADMIN"),
  asyncHandler(async (req: Request, res: Response) => {
    const { status } = req.body;
    if (!["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"].includes(status)) {
      throw AppError.validation("Gecersiz durum");
    }
    const invoice = await accountingService.updateInvoiceStatus(req.params.id, status);
    res.json(invoice);
  })
);

/**
 * @route   POST /api/accounting/invoices/:id/payment
 * @desc    Record payment
 */
router.post(
  "/invoices/:id/payment",
  authorize("ADMIN"),
  asyncHandler(async (req: Request, res: Response) => {
    const { amount, method, reference, notes, paymentDate } = req.body;
    
    if (!amount || !method) {
      throw AppError.validation("amount ve method gerekli");
    }

    const payment = await accountingService.createPayment({
      invoiceId: req.params.id,
      amount,
      method,
      reference,
      notes,
      paymentDate,
    });
    res.status(201).json(payment);
  })
);

/**
 * @route   GET /api/accounting/expenses
 * @desc    List expenses
 */
router.get(
  "/expenses",
  authorize("ADMIN"),
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const category = req.query.category as string | undefined;
    const fromDate = req.query.fromDate ? new Date(req.query.fromDate as string) : undefined;
    const toDate = req.query.toDate ? new Date(req.query.toDate as string) : undefined;

    const result = await accountingService.getExpenses(page, limit, category, fromDate, toDate);
    res.json(result);
  })
);

/**
 * @route   POST /api/accounting/expenses
 * @desc    Create expense
 */
router.post(
  "/expenses",
  authorize("ADMIN"),
  asyncHandler(async (req: Request, res: Response) => {
    const { category, description, amount, vendor, invoiceNo, paymentMethod, notes, date } = req.body;
    
    if (!category || !description || !amount) {
      throw AppError.validation("category, description ve amount gerekli");
    }

    const expense = await accountingService.createExpense({
      category,
      description,
      amount,
      vendor,
      invoiceNo,
      paymentMethod,
      notes,
      date,
    });
    res.status(201).json(expense);
  })
);

/**
 * @route   DELETE /api/accounting/expenses/:id
 * @desc    Delete expense
 */
router.delete(
  "/expenses/:id",
  authorize("ADMIN"),
  asyncHandler(async (req: Request, res: Response) => {
    await accountingService.deleteExpense(req.params.id);
    res.json({ success: true });
  })
);

/**
 * @route   GET /api/accounting/reports/summary
 * @desc    Get financial summary
 */
router.get(
  "/reports/summary",
  authorize("ADMIN"),
  asyncHandler(async (req: Request, res: Response) => {
    const fromDate = req.query.fromDate ? new Date(req.query.fromDate as string) : undefined;
    const toDate = req.query.toDate ? new Date(req.query.toDate as string) : undefined;

    const summary = await accountingService.getFinancialSummary(fromDate, toDate);
    res.json(summary);
  })
);

export default router;
