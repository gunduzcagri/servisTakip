import { Router, Request, Response } from "express";
import { smsService } from "./sms.service";
import { asyncHandler } from "../../common/middleware/error-handler";
import { authenticate, authorize } from "../../common/guards/auth.guard";
import { AppError } from "../../common/utils/app-error";
import { smsProviderSchema, sendSmsSchema, updateSmsConfigSchema } from "./sms.dto";

const router = Router();

router.use(authenticate);

/**
 * @route   GET /api/sms/providers
 * @desc    List all SMS providers
 */
router.get(
  "/providers",
  authorize("ADMIN"),
  asyncHandler(async (req: Request, res: Response) => {
    const providers = await smsService.getAllProviders();
    res.json({ providers });
  })
);

/**
 * @route   GET /api/sms/providers/:id
 * @desc    Get provider by ID
 */
router.get(
  "/providers/:id",
  authorize("ADMIN"),
  asyncHandler(async (req: Request, res: Response) => {
    const provider = await smsService.getProviderById(req.params.id);
    res.json(provider);
  })
);

/**
 * @route   POST /api/sms/providers
 * @desc    Create SMS provider
 */
router.post(
  "/providers",
  authorize("ADMIN"),
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = smsProviderSchema.safeParse(req.body);
    if (!parsed.success) {
      throw AppError.validation(parsed.error.errors[0].message);
    }
    const provider = await smsService.createProvider(parsed.data);
    res.status(201).json(provider);
  })
);

/**
 * @route   PUT /api/sms/providers/:id
 * @desc    Update SMS provider
 */
router.put(
  "/providers/:id",
  authorize("ADMIN"),
  asyncHandler(async (req: Request, res: Response) => {
    const provider = await smsService.updateProvider(req.params.id, req.body);
    res.json(provider);
  })
);

/**
 * @route   POST /api/sms/providers/:id/set-active
 * @desc    Set active provider
 */
router.post(
  "/providers/:id/set-active",
  authorize("ADMIN"),
  asyncHandler(async (req: Request, res: Response) => {
    const provider = await smsService.setActiveProvider(req.params.id);
    res.json(provider);
  })
);

/**
 * @route   DELETE /api/sms/providers/:id
 * @desc    Delete SMS provider
 */
router.delete(
  "/providers/:id",
  authorize("ADMIN"),
  asyncHandler(async (req: Request, res: Response) => {
    await smsService.deleteProvider(req.params.id);
    res.json({ success: true });
  })
);

/**
 * @route   POST /api/sms/send
 * @desc    Send SMS
 */
router.post(
  "/send",
  authorize("ADMIN", "TECHNICIAN"),
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = sendSmsSchema.safeParse(req.body);
    if (!parsed.success) {
      throw AppError.validation(parsed.error.errors[0].message);
    }
    const result = await smsService.sendSms(parsed.data);
    res.json(result);
  })
);

/**
 * @route   GET /api/sms/logs
 * @desc    Get SMS logs
 */
router.get(
  "/logs",
  authorize("ADMIN"),
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const status = req.query.status as string | undefined;
    const recipient = req.query.recipient as string | undefined;

    const result = await smsService.getSmsLogs(page, limit, status, recipient);
    res.json(result);
  })
);

/**
 * @route   GET /api/sms/stats
 * @desc    Get SMS statistics
 */
router.get(
  "/stats",
  authorize("ADMIN"),
  asyncHandler(async (req: Request, res: Response) => {
    const fromDate = req.query.fromDate ? new Date(req.query.fromDate as string) : undefined;
    const toDate = req.query.toDate ? new Date(req.query.toDate as string) : undefined;

    const stats = await smsService.getSmsStats(fromDate, toDate);
    res.json(stats);
  })
);

export default router;
