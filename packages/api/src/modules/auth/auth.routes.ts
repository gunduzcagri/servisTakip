import { Router, Request, Response } from "express";
import { authService } from "./auth.service";
import { loginSchema, registerSchema } from "./auth.dto";
import { asyncHandler } from "../../common/middleware/error-handler";
import { authenticate } from "../../common/guards/auth.guard";
import { AppError } from "../../common/utils/app-error";

const router = Router();

router.post(
  "/login",
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw AppError.validation(parsed.error.errors[0].message);
    }
    const result = await authService.login(parsed.data);
    res.json(result);
  })
);

router.post(
  "/register",
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      throw AppError.validation(parsed.error.errors[0].message);
    }
    const result = await authService.register(parsed.data);
    res.status(201).json(result);
  })
);

router.post(
  "/refresh",
  asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw AppError.validation("Refresh token gerekli");
    }
    const result = await authService.refreshToken(refreshToken);
    res.json(result);
  })
);

router.get(
  "/me",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const profile = await authService.getProfile(req.user!.userId);
    res.json(profile);
  })
);

export default router;
