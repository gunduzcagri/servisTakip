import { Router, Request, Response } from "express";
import { qrService } from "./qr.service";
import { asyncHandler } from "../../common/middleware/error-handler";
import { authenticate, authorize } from "../../common/guards/auth.guard";

const router = Router();

router.use(authenticate);

router.get(
  "/service/:id",
  authorize("ADMIN", "TECHNICIAN"),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await qrService.getQrForService(req.params.id);
    res.json(result);
  })
);

router.get(
  "/pending",
  authorize("ADMIN", "TECHNICIAN"),
  asyncHandler(async (req: Request, res: Response) => {
    const branchId = req.query.branch as string | undefined;
    const result = await qrService.getAllPendingQrs(branchId);
    res.json(result);
  })
);

router.post(
  "/scan",
  authorize("ADMIN", "TECHNICIAN"),
  asyncHandler(async (req: Request, res: Response) => {
    const { barcode } = req.body;
    if (!barcode) {
      throw new Error("Barkod gerekli");
    }
    const result = await qrService.lookupByBarcode(barcode);
    res.json(result);
  })
);

export default router;
