import bcrypt from "bcryptjs";
import prisma from "../../common/utils/prisma";
import { AppError } from "../../common/utils/app-error";
import { CreateUserInput, UpdateUserInput } from "./user.dto";

export class UserService {
  async list(page: number = 1, limit: number = 20, role?: string) {
    const skip = (page - 1) * limit;
    const where = role ? { role: role as any } : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          role: true,
          branchId: true,
          isActive: true,
          branch: { select: { id: true, name: true } },
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total, page, limit };
  }

  async getById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        branchId: true,
        isActive: true,
        branch: { select: { id: true, name: true } },
        createdAt: true,
      },
    });

    if (!user) throw AppError.notFound("Kullanici bulunamadi");
    return user;
  }

  async create(input: CreateUserInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw AppError.validation("Bu e-posta zaten kayitli");

    const passwordHash = await bcrypt.hash(input.password, 10);

    return prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        fullName: input.fullName,
        phone: input.phone,
        role: input.role,
        branchId: input.branchId,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        branchId: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async update(id: string, input: UpdateUserInput) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw AppError.notFound("Kullanici bulunamadi");

    return prisma.user.update({
      where: { id },
      data: input,
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        branchId: true,
        isActive: true,
        createdAt: true,
      },
    });
  }
}

export const userService = new UserService();
