import { Injectable,ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EmailsService {
  constructor(private prisma: PrismaService) {}

  async findUserEmails(userId: string) {
    return this.prisma.email.findMany({
      where: {
        ownerId: userId,
        isDeleted: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
  async getOrCreateFolder(userId: string, name: string) {
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
            order: 0,
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

  // tìm người nhận
  const receiver = await this.prisma.user.findUnique({
    where: { email: toEmail },
  });

  if (!receiver) {
    throw new Error('Receiver not found');
  }

  // tạo email cho người gửi
  const sentEmail = await this.prisma.email.create({
    data: {
      subject,
      body,
      from: 'me',
      to: toEmail,
      ownerId: fromUserId,
    },
  });

  // tạo email cho người nhận
  const inboxEmail = await this.prisma.email.create({
    data: {
      subject,
      body,
      from: 'me',
      to: toEmail,
      ownerId: receiver.id,
    },
  });

  // folders
  const senderSent = await this.getOrCreateFolder(fromUserId, 'Sent');
  const receiverInbox = await this.getOrCreateFolder(receiver.id, 'Inbox');

  // gắn folder
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
}) {
  const { emailId, userId, folderId } = params;

  // 1️⃣ Check email ownership
  const email = await this.prisma.email.findFirst({
    where: { id: emailId, ownerId: userId },
  });
  if (!email) throw new NotFoundException('Email not found');

  // 2️⃣ Check folder ownership
  const folder = await this.prisma.folder.findFirst({
    where: { id: folderId, userId },
  });
  if (!folder) throw new ForbiddenException('Folder not accessible');

  // 3️⃣ Check đã tồn tại chưa
  const existing = await this.prisma.emailFolder.findUnique({
    where: {
      emailId_folderId: { emailId, folderId },
    },
  });

  if (existing) {
    // idempotent: đã tồn tại thì coi như OK
    return existing;
  }

  // 4️⃣ Create nếu chưa có
  return this.prisma.emailFolder.create({
    data: { emailId, folderId },
  });
}



}
