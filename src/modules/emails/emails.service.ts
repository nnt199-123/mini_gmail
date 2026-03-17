import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const PRIMARY_FOLDERS = new Set(['inbox', 'sent']);

@Injectable()
export class EmailsService {
  constructor(private prisma: PrismaService) {}

  private isPrimaryFolderName(name: string) {
    return PRIMARY_FOLDERS.has(name.trim().toLowerCase());
  }

  async findUserEmails(userId: string) {
    return this.prisma.email.findMany({
      where: {
        ownerId: userId,
        isDeleted: false,
      },
      include: {
        folders: {
          include: {
            folder: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getOrCreateFolder(userId: string, name: string) {
    const folderCount = await this.prisma.folder.count({
      where: { userId },
    });

    return this.prisma.folder.upsert({
      where: {
        userId_name: {
          userId,
          name,
        },
      },
      update: {},
      create: {
        userId,
        name,
        order: folderCount,
      },
    });
  }

  async sendEmail(params: {
    fromUserId: string;
    toEmail: string;
    subject: string;
    body: string;
  }) {
    const { fromUserId, toEmail, subject, body } = params;

    const sender = await this.prisma.user.findUnique({
      where: { id: fromUserId },
    });
    if (!sender) {
      throw new NotFoundException('Sender not found');
    }

    const receiver = await this.prisma.user.findUnique({
      where: { email: toEmail },
    });
    if (!receiver) {
      throw new NotFoundException('Receiver not found');
    }

    const sentEmail = await this.prisma.email.create({
      data: {
        subject,
        body,
        from: sender.email,
        to: toEmail,
        ownerId: fromUserId,
      },
    });

    const inboxEmail = await this.prisma.email.create({
      data: {
        subject,
        body,
        from: sender.email,
        to: toEmail,
        ownerId: receiver.id,
      },
    });

    const senderSent = await this.getOrCreateFolder(fromUserId, 'Sent');
    const receiverInbox = await this.getOrCreateFolder(receiver.id, 'Inbox');

    await this.prisma.emailFolder.createMany({
      data: [
        { emailId: sentEmail.id, folderId: senderSent.id },
        { emailId: inboxEmail.id, folderId: receiverInbox.id },
      ],
    });

    return { success: true };
  }

  async moveEmailToFolder(params: {
    emailId: string;
    userId: string;
    folderId: string;
    sourceFolderId?: string;
  }) {
    const { emailId, userId, folderId, sourceFolderId } = params;

    const email = await this.prisma.email.findFirst({
      where: { id: emailId, ownerId: userId },
    });
    if (!email) {
      throw new NotFoundException('Email not found');
    }

    const folder = await this.prisma.folder.findFirst({
      where: { id: folderId, userId },
    });
    if (!folder) {
      throw new ForbiddenException('Folder not accessible');
    }

    const currentRelations = await this.prisma.emailFolder.findMany({
      where: {
        emailId,
        folder: {
          userId,
        },
      },
      include: {
        folder: true,
      },
    });

    const sourceRelation =
      (sourceFolderId
        ? currentRelations.find((relation) => relation.folderId === sourceFolderId)
        : undefined) ?? currentRelations[0];

    if (!sourceRelation) {
      throw new NotFoundException('Email folder relation not found');
    }

    const existingTargetRelation = await this.prisma.emailFolder.findUnique({
      where: {
        emailId_folderId: { emailId, folderId },
      },
      include: {
        folder: true,
      },
    });

    if (sourceRelation.folderId === folderId && existingTargetRelation) {
      return existingTargetRelation;
    }

    const hasPrimaryFolder = currentRelations.some((relation) => this.isPrimaryFolderName(relation.folder.name));
    if (!hasPrimaryFolder && !this.isPrimaryFolderName(folder.name)) {
      throw new ForbiddenException('Custom folders must be copied from Inbox or Sent');
    }

    const sourceIsPrimary = this.isPrimaryFolderName(sourceRelation.folder.name);
    const targetIsPrimary = this.isPrimaryFolderName(folder.name);

    if (sourceIsPrimary && targetIsPrimary) {
      throw new ForbiddenException('Cannot move emails between Inbox and Sent');
    }

    if (sourceIsPrimary && !targetIsPrimary) {
      if (existingTargetRelation) {
        return existingTargetRelation;
      }

      return this.prisma.emailFolder.create({
        data: { emailId, folderId },
        include: {
          folder: true,
        },
      });
    }

    if (!sourceIsPrimary && targetIsPrimary) {
      if (!existingTargetRelation) {
        throw new ForbiddenException('Email does not belong to the selected source folder');
      }

      await this.prisma.emailFolder.delete({
        where: {
          emailId_folderId: {
            emailId,
            folderId: sourceRelation.folderId,
          },
        },
      });

      return existingTargetRelation;
    }

    return this.prisma.$transaction(async (tx) => {
      if (!existingTargetRelation) {
        await tx.emailFolder.create({
          data: { emailId, folderId },
        });
      }

      await tx.emailFolder.delete({
        where: {
          emailId_folderId: {
            emailId,
            folderId: sourceRelation.folderId,
          },
        },
      });

      return tx.emailFolder.findUniqueOrThrow({
        where: {
          emailId_folderId: { emailId, folderId },
        },
        include: {
          folder: true,
        },
      });
    });
  }

  async removeEmailFromFolder(params: { emailId: string; folderId: string; userId: string }) {
    const { emailId, folderId, userId } = params;

    const relation = await this.prisma.emailFolder.findFirst({
      where: {
        emailId,
        folderId,
        folder: {
          userId,
        },
      },
      include: {
        folder: true,
      },
    });

    if (!relation) {
      throw new NotFoundException('Email folder relation not found');
    }

    if (this.isPrimaryFolderName(relation.folder.name)) {
      throw new ForbiddenException('Inbox and Sent emails cannot be removed from their source folders');
    }

    return this.prisma.emailFolder.delete({
      where: {
        emailId_folderId: { emailId, folderId },
      },
    });
  }

  async markAsRead(params: { emailId: string; userId: string }) {
    const { emailId, userId } = params;

    const email = await this.prisma.email.findFirst({
      where: { id: emailId, ownerId: userId },
    });
    if (!email) {
      throw new NotFoundException('Email not found');
    }

    return this.prisma.email.update({
      where: { id: emailId },
      data: { isRead: true },
    });
  }
}
