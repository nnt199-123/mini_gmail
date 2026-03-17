import { Controller, Get, Post, Put, Delete, Body, UseGuards, Req, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FoldersService } from './folders.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
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

  @Put(':id')
  update(
    @Req() req: Request,
    @Param('id') folderId: string,
    @Body() dto: UpdateFolderDto,
  ) {
    return this.foldersService.updateFolder(req.user!.userId, folderId, dto.name);
  }

  @Delete(':id')
  delete(
    @Req() req: Request,
    @Param('id') folderId: string,
  ) {
    return this.foldersService.deleteFolder(req.user!.userId, folderId);
  }
}
