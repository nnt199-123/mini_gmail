import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const LOCKED_FOLDERS = new Set(['inbox', 'sent']);

@Injectable()
export class FoldersService {
  constructor(private prisma: PrismaService) {}

  private normalizeName(name: string) {
    return name.trim();
  }

  private isLockedFolder(name: string) {
    return LOCKED_FOLDERS.has(name.trim().toLowerCase());
  }

  private async ensureNameAvailable(userId: string, name: string, excludeFolderId?: string) {
    const normalizedName = this.normalizeName(name);
    if (!normalizedName) {
      throw new BadRequestException('Folder name is required');
    }

    const folders = await this.prisma.folder.findMany({
      where: { userId },
      select: { id: true, name: true },
    });

    const duplicate = folders.find(
      (folder) =>
        folder.id !== excludeFolderId && folder.name.trim().toLowerCase() === normalizedName.toLowerCase(),
    );

    if (duplicate) {
      throw new BadRequestException('Folder name already exists');
    }

    return normalizedName;
  }

  getUserFolders(userId: string) {
    return this.prisma.folder.findMany({
      where: { userId },
      orderBy: { order: 'asc' },
    });
  }

  async createFolder(userId: string, name: string) {
    const normalizedName = await this.ensureNameAvailable(userId, name);
    const nextOrder = await this.prisma.folder.count({
      where: { userId },
    });

    return this.prisma.folder.create({
      data: { userId, name: normalizedName, order: nextOrder },
    });
  }

  async updateFolder(userId: string, folderId: string, name: string) {
    const folder = await this.prisma.folder.findFirst({
      where: { id: folderId, userId },
    });

    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    if (this.isLockedFolder(folder.name)) {
      throw new ForbiddenException('Inbox and Sent folders are locked');
    }

    const normalizedName = await this.ensureNameAvailable(userId, name, folderId);

    return this.prisma.folder.update({
      where: { id: folderId },
      data: { name: normalizedName },
    });
  }

  async deleteFolder(userId: string, folderId: string) {
    const folder = await this.prisma.folder.findFirst({
      where: { id: folderId, userId },
    });

    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    if (this.isLockedFolder(folder.name)) {
      throw new ForbiddenException('Inbox and Sent folders are locked');
    }

    const emailCount = await this.prisma.emailFolder.count({
      where: { folderId },
    });

    if (emailCount > 0) {
      throw new ForbiddenException('Cannot delete folder with emails. Move emails first.');
    }

    return this.prisma.folder.delete({
      where: { id: folderId },
    });
  }
}   
