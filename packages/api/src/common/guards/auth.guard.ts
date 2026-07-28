import { Request, Response, NextFunction } from "express";
import { verifyToken, TokenPayload } from "../utils/jwt";
import { AppError } from "../utils/app-error";

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    throw AppError.unauthorized("Token bulunamadi");
  }

  const token = header.split(" ")[1];
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    throw AppError.unauthorized("Gecersiz veya suresi dolmus token");
  }
}

export function authorize(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw AppError.unauthorized();
    }
    if (!roles.includes(req.user.role)) {
      throw AppError.forbidden("Bu islem icin yetkiniz yok");
    }
    next();
  };
}
