import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async createUser(email: string, password: string) {
    return this.prisma.user.create({
      data: { email, password },
    });
  }

  async searchByEmail(query: string, excludeUserId?: string) {
    const trimmed = query.trim();
    if (!trimmed) {
      return [];
    }

    return this.prisma.user.findMany({
      where: {
        email: {
          contains: trimmed,
          mode: 'insensitive',
        },
        ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
      },
      select: {
        id: true,
        email: true,
      },
      orderBy: {
        email: 'asc',
      },
      take: 8,
    });
  }
}
