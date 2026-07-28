import jwt, { SignOptions } from "jsonwebtoken";
import { config } from "./config";

export interface TokenPayload {
  userId: string;
  role: string;
  branchId?: string | null;
}

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.accessExpires,
  } as SignOptions);
}

export function signRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.refreshExpires,
  } as SignOptions);
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, config.jwt.secret) as TokenPayload;
}
