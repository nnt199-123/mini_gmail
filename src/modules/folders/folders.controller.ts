import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FoldersService } from './folders.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import type { Request } from 'express';

@Controller('folders')
@UseGuards(JwtAuthGuard)
export class FoldersController {
  constructor(private foldersService: FoldersService) {}

  @Get()
  getMyFolders(@Req() req: Request) {
    return this.foldersService.getUserFolders(req.user!.userId);
  }

 @Post()
  create(
    @Req() req: Request,
    @Body() dto: CreateFolderDto,
  ) {
    return this.foldersService.createFolder(req.user!.userId, dto.name);
  }
}
