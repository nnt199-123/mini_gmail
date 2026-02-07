import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FoldersService {
  constructor(private prisma: PrismaService) {}

  getUserFolders(userId: string) {
    return this.prisma.folder.findMany({
      where: { userId },
      orderBy: { order: 'asc' },
    });
  }

  createFolder(userId: string, name: string) {
    return this.prisma.folder.create({
      data: { userId, name, order: 0 },
    });
  }
}   

