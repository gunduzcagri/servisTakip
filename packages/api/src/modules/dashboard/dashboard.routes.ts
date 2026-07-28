import { Router, Request, Response } from "express";
import prisma from "../../common/utils/prisma";
import { asyncHandler } from "../../common/middleware/error-handler";
import { authenticate } from "../../common/guards/auth.guard";

const router = Router();

router.use(authenticate);

router.get(
  "/summary",
  asyncHandler(async (req: Request, res: Response) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isAdmin = req.user!.role === "ADMIN";
    const technicianFilter = isAdmin ? {} : { technicianId: req.user!.userId };

    const where = { ...technicianFilter };

    const [totalToday, received, repairing, ready] = await Promise.all([
      prisma.serviceRecord.count({
        where: { ...where, createdAt: { gte: today } },
      }),
      prisma.serviceRecord.count({
        where: { ...where, status: "RECEIVED" },
      }),
      prisma.serviceRecord.count({
        where: {
          ...where,
          status: { in: ["INSPECTING", "REPAIRING", "QC", "PARTS_WAITING"] },
        },
      }),
      prisma.serviceRecord.count({
        where: { ...where, status: "READY" },
      }),
    ]);

    res.json({
      totalToday,
      received,
      repairing,
      ready,
    });
  })
);

export default router;
