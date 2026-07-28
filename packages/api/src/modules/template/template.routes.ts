import { Router, Request, Response } from "express";
import prisma from "../../common/utils/prisma";
import { asyncHandler } from "../../common/middleware/error-handler";
import { authenticate, authorize } from "../../common/guards/auth.guard";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  asyncHandler(async (_req: Request, res: Response) => {
    const templates = await prisma.sectorTemplate.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(templates);
  })
);

router.post(
  "/",
  authorize("ADMIN"),
  asyncHandler(async (req: Request, res: Response) => {
    const { name, fields } = req.body;
    const template = await prisma.sectorTemplate.create({
      data: { name, fields: fields || [], createdBy: req.user!.userId },
    });
    res.status(201).json(template);
  })
);

export default router;
