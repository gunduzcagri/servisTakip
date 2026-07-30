import { Router, Request, Response } from "express";
import { reportService } from "./report.service";
import { asyncHandler } from "../../common/middleware/error-handler";
import { authenticate, authorize } from "../../common/guards/auth.guard";

const router = Router();

router.use(authenticate);
router.use(authorize("ADMIN"));

router.get(
  "/revenue",
  asyncHandler(async (req: Request, res: Response) => {
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;
    const month = req.query.month ? parseInt(req.query.month as string) : undefined;
    const result = await reportService.revenueMonthly(year, month);
    res.json(result);
  })
);

router.get(
  "/faults",
  asyncHandler(async (_req: Request, res: Response) => {
    const result = await reportService.faultDistribution();
    res.json(result);
  })
);

router.get(
  "/technicians",
  asyncHandler(async (_req: Request, res: Response) => {
    const result = await reportService.technicianPerformance();
    res.json(result);
  })
);

router.get(
  "/status",
  asyncHandler(async (_req: Request, res: Response) => {
    const result = await reportService.statusSummary();
    res.json(result);
  })
);

router.get(
  "/satisfaction",
  asyncHandler(async (_req: Request, res: Response) => {
    const result = await reportService.customerSatisfaction();
    res.json(result);
  })
);

export default router;
