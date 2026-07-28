import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/app-error";

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: { code: err.code, message: err.message },
    });
    return;
  }

  console.error("Beklenmeyen hata:", err);

  res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "Sunucu hatasi olustu" },
  });
}

export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
