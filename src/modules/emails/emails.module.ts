import { Module } from '@nestjs/common';
import { EmailsService } from './emails.service';
import { EmailsController } from './emails.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [EmailsController],
  providers: [EmailsService, PrismaService],
})
export class EmailsModule {}
