import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        currentCredits: true,
        createdAt: true,
        userPackages: {
          where: { status: 'ACTIVE' },
          include: {
            package: {
              include: {
                packageFeatures: { include: { feature: true } },
              },
            },
          },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        currentCredits: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
