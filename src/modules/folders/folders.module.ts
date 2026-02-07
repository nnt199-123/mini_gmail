import { Module } from '@nestjs/common';
import { FoldersController } from './folders.controller';
import { FoldersService } from './folders.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [FoldersController],
  providers: [FoldersService, PrismaService],
})
export class FoldersModule {}
