import bcrypt from "bcryptjs";
import prisma from "../../common/utils/prisma";
import { signAccessToken, signRefreshToken } from "../../common/utils/jwt";
import { AppError } from "../../common/utils/app-error";
import { LoginInput, RegisterInput } from "./auth.dto";

export class AuthService {
  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user || !user.isActive) {
      throw AppError.unauthorized("E-posta veya sifre hatali");
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      throw AppError.unauthorized("E-posta veya sifre hatali");
    }

    const payload = {
      userId: user.id,
      role: user.role,
      branchId: user.branchId,
    };

    return {
      accessToken: signAccessToken(payload),
      refreshToken: signRefreshToken(payload),
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        branchId: user.branchId,
      },
    };
  }

  async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw AppError.validation("Bu e-posta zaten kayitli");
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        fullName: input.fullName,
        phone: input.phone,
        role: "CUSTOMER",
      },
    });

    const payload = {
      userId: user.id,
      role: user.role,
      branchId: user.branchId,
    };

    return {
      accessToken: signAccessToken(payload),
      refreshToken: signRefreshToken(payload),
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        branchId: user.branchId,
      },
    };
  }

  async refreshToken(token: string) {
    try {
      const { verifyToken } = await import("../../common/utils/jwt");
      const payload = verifyToken(token);

      const user = await prisma.user.findUnique({ where: { id: payload.userId } });
      if (!user || !user.isActive) {
        throw AppError.unauthorized("Kullanici bulunamadi veya pasif");
      }

      const newPayload = {
        userId: user.id,
        role: user.role,
        branchId: user.branchId,
      };

      return {
        accessToken: signAccessToken(newPayload),
        refreshToken: signRefreshToken(newPayload),
      };
    } catch {
      throw AppError.unauthorized("Gecersiz refresh token");
    }
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        branchId: true,
        branch: { select: { id: true, name: true } },
        createdAt: true,
      },
    });

    if (!user) {
      throw AppError.notFound("Kullanici bulunamadi");
    }

    return user;
  }
}

export const authService = new AuthService();
