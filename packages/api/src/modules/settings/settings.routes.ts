import { Router, Request, Response } from "express";
import { settingsService } from "./settings.service";
import { asyncHandler } from "../../common/middleware/error-handler";
import { authenticate, authorize } from "../../common/guards/auth.guard";

const router = Router();

router.use(authenticate);
router.use(authorize("ADMIN"));

router.get(
  "/smtp",
  asyncHandler(async (_req: Request, res: Response) => {
    const result = await settingsService.getSmtp();
    res.json(result);
  })
);

router.put(
  "/smtp",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await settingsService.saveSmtp(req.body);
    res.json(result);
  })
);

router.post(
  "/smtp/test",
  asyncHandler(async (req: Request, res: Response) => {
    const { to } = req.body;
    const result = await settingsService.testSmtp({ to });
    res.json(result);
  })
);

export default router;
