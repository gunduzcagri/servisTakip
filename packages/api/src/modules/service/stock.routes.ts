import { Router, Request, Response } from "express";
import { stockService } from "./stock.service";
import { createPartSchema, updatePartSchema, stockAdjustSchema, createSupplierSchema, updateSupplierSchema, createPurchaseOrderSchema } from "./stock.dto";
import { asyncHandler } from "../../common/middleware/error-handler";
import { authenticate, authorize } from "../../common/guards/auth.guard";
import { AppError } from "../../common/utils/app-error";
import { z } from "zod";

const router = Router();

router.use(authenticate);

/**
 * @route   GET /api/stock/parts
 * @desc    List all parts with stock info
 */
router.get(
  "/parts",
  authorize("ADMIN", "TECHNICIAN"),
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string | undefined;

    const result = await stockService.listParts(page, limit, search);
    res.json(result);
  })
);

/**
 * @route   GET /api/stock/parts/low
 * @desc    Get low stock parts
 */
router.get(
  "/parts/low",
  authorize("ADMIN", "TECHNICIAN"),
  asyncHandler(async (req: Request, res: Response) => {
    const parts = await stockService.getLowStockParts();
    res.json({ parts });
  })
);

/**
 * @route   GET /api/stock/parts/:id
 * @desc    Get part by ID with stock movements
 */
router.get(
  "/parts/:id",
  authorize("ADMIN", "TECHNICIAN"),
  asyncHandler(async (req: Request, res: Response) => {
    const part = await stockService.getPartById(req.params.id);
    res.json(part);
  })
);

/**
 * @route   POST /api/stock/parts
 * @desc    Create new part
 */
router.post(
  "/parts",
  authorize("ADMIN"),
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = createPartSchema.safeParse(req.body);
    if (!parsed.success) {
      throw AppError.validation(parsed.error.errors[0].message);
    }
    const userId = (req as any).user?.id;
    const part = await stockService.createPart(parsed.data, userId);
    res.status(201).json(part);
  })
);

/**
 * @route   PUT /api/stock/parts/:id
 * @desc    Update part
 */
router.put(
  "/parts/:id",
  authorize("ADMIN"),
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = updatePartSchema.safeParse(req.body);
    if (!parsed.success) {
      throw AppError.validation(parsed.error.errors[0].message);
    }
    const userId = (req as any).user?.id;
    const part = await stockService.updatePart(req.params.id, parsed.data, userId);
    res.json(part);
  })
);

/**
 * @route   POST /api/stock/parts/:id/adjust
 * @desc    Adjust stock (IN/OUT/ADJUSTMENT/RETURN)
 */
router.post(
  "/parts/:id/adjust",
  authorize("ADMIN", "TECHNICIAN"),
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = stockAdjustSchema.safeParse(req.body);
    if (!parsed.success) {
      throw AppError.validation(parsed.error.errors[0].message);
    }
    const userId = (req as any).user?.id;
    const result = await stockService.adjustStock(req.params.id, parsed.data, userId);
    res.json(result);
  })
);

/**
 * @route   GET /api/stock/parts/:id/movements
 * @desc    Get stock movements for a part
 */
router.get(
  "/parts/:id/movements",
  authorize("ADMIN", "TECHNICIAN"),
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await stockService.getStockMovements(req.params.id, page, limit);
    res.json(result);
  })
);

/**
 * @route   GET /api/stock/alerts
 * @desc    Get stock alerts
 */
router.get(
  "/alerts",
  authorize("ADMIN", "TECHNICIAN"),
  asyncHandler(async (req: Request, res: Response) => {
    const resolved = req.query.resolved ? req.query.resolved === "true" : undefined;
    const alerts = await stockService.getStockAlerts(resolved);
    res.json(alerts);
  })
);

/**
 * @route   POST /api/stock/alerts/:id/resolve
 * @desc    Resolve a stock alert
 */
router.post(
  "/alerts/:id/resolve",
  authorize("ADMIN"),
  asyncHandler(async (req: Request, res: Response) => {
    const alert = await stockService.resolveStockAlert(req.params.id);
    res.json(alert);
  })
);

/**
 * @route   GET /api/stock/suppliers
 * @desc    List suppliers
 */
router.get(
  "/suppliers",
  authorize("ADMIN"),
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string | undefined;

    const result = await stockService.listSuppliers(page, limit, search);
    res.json(result);
  })
);

/**
 * @route   POST /api/stock/suppliers
 * @desc    Create supplier
 */
router.post(
  "/suppliers",
  authorize("ADMIN"),
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = createSupplierSchema.safeParse(req.body);
    if (!parsed.success) {
      throw AppError.validation(parsed.error.errors[0].message);
    }
    const supplier = await stockService.createSupplier(parsed.data);
    res.status(201).json(supplier);
  })
);

/**
 * @route   PUT /api/stock/suppliers/:id
 * @desc    Update supplier
 */
router.put(
  "/suppliers/:id",
  authorize("ADMIN"),
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = updateSupplierSchema.safeParse(req.body);
    if (!parsed.success) {
      throw AppError.validation(parsed.error.errors[0].message);
    }
    const supplier = await stockService.updateSupplier(req.params.id, parsed.data);
    res.json(supplier);
  })
);

/**
 * @route   POST /api/stock/purchase-orders
 * @desc    Create purchase order
 */
router.post(
  "/purchase-orders",
  authorize("ADMIN"),
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = createPurchaseOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      throw AppError.validation(parsed.error.errors[0].message);
    }
    const userId = (req as any).user?.id;
    const order = await stockService.createPurchaseOrder(parsed.data, userId);
    res.status(201).json(order);
  })
);

/**
 * @route   GET /api/stock/purchase-orders
 * @desc    List purchase orders
 */
router.get(
  "/purchase-orders",
  authorize("ADMIN"),
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string | undefined;

    const result = await stockService.getPurchaseOrders(page, limit, status);
    res.json(result);
  })
);

/**
 * @route   POST /api/stock/purchase-orders/:id/receive
 * @desc    Receive purchase order (update stock)
 */
router.post(
  "/purchase-orders/:id/receive",
  authorize("ADMIN"),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const order = await stockService.receivePurchaseOrder(req.params.id, userId);
    res.json(order);
  })
);

/**
 * @route   PUT /api/stock/purchase-orders/:id/status
 * @desc    Update purchase order status
 */
router.put(
  "/purchase-orders/:id/status",
  authorize("ADMIN"),
  asyncHandler(async (req: Request, res: Response) => {
    const { status } = req.body;
    if (!["DRAFT", "SENT", "RECEIVED", "CANCELLED"].includes(status)) {
      throw AppError.validation("Invalid status");
    }
    const order = await stockService.updatePurchaseOrderStatus(req.params.id, status);
    res.json(order);
  })
);

export default router;
