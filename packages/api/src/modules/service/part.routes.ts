import { Router, Request, Response } from "express";
import { partService } from "./part.service";
import { createPartSchema, updatePartSchema, stockAdjustSchema } from "./part.dto";
import { asyncHandler } from "../../common/middleware/error-handler";
import { authenticate, authorize } from "../../common/guards/auth.guard";
import { AppError } from "../../common/utils/app-error";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  authorize("ADMIN", "TECHNICIAN"),
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = req.query.search as string;
    const result = await partService.list(page, limit, search);
    res.json(result);
  })
);

router.get(
  "/:id",
  authorize("ADMIN", "TECHNICIAN"),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await partService.getById(req.params.id);
    res.json(result);
  })
);

router.post(
  "/",
  authorize("ADMIN"),
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = createPartSchema.safeParse(req.body);
    if (!parsed.success) {
      throw AppError.validation(parsed.error.errors[0].message);
    }
    const result = await partService.create(parsed.data);
    res.status(201).json(result);
  })
);

router.patch(
  "/:id",
  authorize("ADMIN"),
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = updatePartSchema.safeParse(req.body);
    if (!parsed.success) {
      throw AppError.validation(parsed.error.errors[0].message);
    }
    const result = await partService.update(req.params.id, parsed.data);
    res.json(result);
  })
);

router.post(
  "/:id/stock",
  authorize("ADMIN"),
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = stockAdjustSchema.safeParse(req.body);
    if (!parsed.success) {
      throw AppError.validation(parsed.error.errors[0].message);
    }
    const result = await partService.adjustStock(req.params.id, parsed.data);
    res.json(result);
  })
);

export default router;
