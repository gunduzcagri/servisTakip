import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import { v4 as uuid } from "uuid";
import { serviceService } from "./service.service";
import {
  createServiceSchema,
  updateStatusSchema,
  addActionSchema,
  addPartSchema,
  quoteSchema,
} from "./service.dto";
import { asyncHandler } from "../../common/middleware/error-handler";
import { authenticate, authorize } from "../../common/guards/auth.guard";
import { AppError } from "../../common/utils/app-error";
import { config } from "../../common/utils/config";

const router = Router();

// Public: track by number (no auth required)
router.get(
  "/track/:trackingNumber",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await serviceService.getByTrackingNumber(req.params.trackingNumber);
    res.json(result);
  })
);

// All authenticated routes below
router.use(authenticate);

// List service records
router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await serviceService.list({
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      status: req.query.status as string,
      technicianId: req.query.technicianId as string,
      role: req.user!.role,
      userId: req.user!.userId,
    });
    res.json(result);
  })
);

// Get single record
router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await serviceService.getById(req.params.id);
    res.json(result);
  })
);

// Admin/Tech: Create service record
router.post(
  "/",
  authorize("ADMIN", "TECHNICIAN"),
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = createServiceSchema.safeParse(req.body);
    if (!parsed.success) {
      throw AppError.validation(parsed.error.errors[0].message);
    }
    const result = await serviceService.create(parsed.data, req.user!.userId);
    res.status(201).json(result);
  })
);

// Admin/Tech: Update status
router.patch(
  "/:id/status",
  authorize("ADMIN", "TECHNICIAN"),
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = updateStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      throw AppError.validation(parsed.error.errors[0].message);
    }
    const result = await serviceService.updateStatus(
      req.params.id,
      parsed.data,
      req.user!.userId
    );
    res.json(result);
  })
);

// Admin/Tech: Send price quote
router.post(
  "/:id/quote",
  authorize("ADMIN", "TECHNICIAN"),
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = quoteSchema.safeParse(req.body);
    if (!parsed.success) {
      throw AppError.validation(parsed.error.errors[0].message);
    }
    const result = await serviceService.sendQuote(req.params.id, parsed.data);
    res.json(result);
  })
);

// Customer: Approve quote
router.post(
  "/:id/approve",
  authorize("CUSTOMER"),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await serviceService.approveQuote(req.params.id);
    res.json(result);
  })
);

// Admin/Tech: Add action (work done)
router.post(
  "/:id/actions",
  authorize("ADMIN", "TECHNICIAN"),
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = addActionSchema.safeParse(req.body);
    if (!parsed.success) {
      throw AppError.validation(parsed.error.errors[0].message);
    }
    const result = await serviceService.addAction(
      req.params.id,
      parsed.data,
      req.user!.userId
    );
    res.status(201).json(result);
  })
);

// Admin/Tech: Add part usage
router.post(
  "/:id/parts",
  authorize("ADMIN", "TECHNICIAN"),
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = addPartSchema.safeParse(req.body);
    if (!parsed.success) {
      throw AppError.validation(parsed.error.errors[0].message);
    }
    const result = await serviceService.addPart(req.params.id, parsed.data);
    res.status(201).json(result);
  })
);

// Photo upload with multer
const storage = multer.diskStorage({
  destination: config.upload.dir,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuid()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: config.upload.maxSize },
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|mp4|webm/;
    const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimeOk = allowed.test(file.mimetype.split("/")[1] || "");
    if (extOk || mimeOk) {
      cb(null, true);
    } else {
      cb(new AppError("Sadece resim ve video dosyalari yuklenebilir", 422) as any);
    }
  },
});

router.post(
  "/:id/photos",
  authorize("ADMIN", "TECHNICIAN"),
  upload.single("file"),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      throw AppError.validation("Dosya yuklenemedi");
    }
    const url = `/uploads/${req.file.filename}`;
    const result = await serviceService.addPhoto(
      req.params.id,
      url,
      req.body.type || "BEFORE",
      req.body.note
    );
    res.status(201).json(result);
  })
);

// Customer: Add rating
router.post(
  "/:id/ratings",
  authorize("CUSTOMER"),
  asyncHandler(async (req: Request, res: Response) => {
    const { score, comment } = req.body;
    const result = await serviceService.addRating(req.params.id, score, comment);
    res.status(201).json(result);
  })
);

export default router;
