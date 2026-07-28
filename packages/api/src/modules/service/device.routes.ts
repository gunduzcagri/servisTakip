import { Router, Request, Response } from "express";
import prisma from "../../common/utils/prisma";
import { asyncHandler } from "../../common/middleware/error-handler";
import { authenticate, authorize } from "../../common/guards/auth.guard";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  authorize("ADMIN", "TECHNICIAN"),
  asyncHandler(async (req: Request, res: Response) => {
    const { customerId, templateId, dynamicFields } = req.body;
    const device = await prisma.device.create({
      data: {
        customerId,
        templateId,
        dynamicFields: dynamicFields || {},
      },
      include: {
        template: { select: { id: true, name: true } },
      },
    });
    res.status(201).json(device);
  })
);

export default router;
