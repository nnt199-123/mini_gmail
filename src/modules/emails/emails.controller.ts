import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EmailsService } from './emails.service';
import { MoveEmailDto } from './dto/move-email.dto';
import { SendEmailDto } from './dto/send-email.dto';

@Controller('emails')
export class EmailsController {
  constructor(private emailsService: EmailsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getMyEmails(@Req() req: Request) {
    return this.emailsService.findUserEmails(req.user!.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async sendEmail(@Req() req: Request, @Body() dto: SendEmailDto) {
    return this.emailsService.sendEmail({
      fromUserId: req.user!.userId,
      toEmail: dto.to,
      subject: dto.subject,
      body: dto.body,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/move')
  async moveEmail(
    @Req() req: Request,
    @Param('id') emailId: string,
    @Body() dto: MoveEmailDto,
  ) {
    return this.emailsService.moveEmailToFolder({
      emailId,
      userId: req.user!.userId,
      folderId: dto.folderId,
      sourceFolderId: dto.sourceFolderId,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/folders/:folderId/remove')
  async removeEmailFromFolder(
    @Req() req: Request,
    @Param('id') emailId: string,
    @Param('folderId') folderId: string,
  ) {
    return this.emailsService.removeEmailFromFolder({
      emailId,
      folderId,
      userId: req.user!.userId,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/read')
  async markEmailAsRead(@Req() req: Request, @Param('id') emailId: string) {
    return this.emailsService.markAsRead({
      emailId,
      userId: req.user!.userId,
    });
  }
}
