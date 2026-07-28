import { Router, Request, Response } from "express";
import { userService } from "./user.service";
import { createUserSchema, updateUserSchema } from "./user.dto";
import { asyncHandler } from "../../common/middleware/error-handler";
import { authenticate, authorize } from "../../common/guards/auth.guard";
import { AppError } from "../../common/utils/app-error";

const router = Router();

router.use(authenticate);
router.use(authorize("ADMIN"));

router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const role = req.query.role as string | undefined;
    const result = await userService.list(page, limit, role);
    res.json(result);
  })
);

router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.getById(req.params.id);
    res.json(user);
  })
);

router.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) {
      throw AppError.validation(parsed.error.errors[0].message);
    }
    const user = await userService.create(parsed.data);
    res.status(201).json(user);
  })
);

router.patch(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      throw AppError.validation(parsed.error.errors[0].message);
    }
    const user = await userService.update(req.params.id, parsed.data);
    res.json(user);
  })
);

export default router;
