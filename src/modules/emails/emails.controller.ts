import { Controller, Get, Post, Body, UseGuards, Req, Patch, Param } from '@nestjs/common';
import { EmailsService } from './emails.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SendEmailDto } from './dto/send-email.dto';
import { MoveEmailDto } from './dto/move-email.dto';
import type { Request } from 'express';

@Controller('emails')
export class EmailsController {
  constructor(private emailsService: EmailsService) {}

  // 🔹 GET /emails
  @UseGuards(JwtAuthGuard)
  @Get()
  async getMyEmails(@Req() req: Request) {
    return this.emailsService.findUserEmails(req.user!.userId);
  }

  // 🔹 POST /emails
  @UseGuards(JwtAuthGuard)
  @Post()
  async sendEmail(
    @Req() req: Request,
    @Body() dto: SendEmailDto,
  ) {
    return this.emailsService.sendEmail({
      fromUserId: req.user!.userId,
      toEmail: dto.to,
      subject: dto.subject,
      body: dto.body,
    });
  }

  // 🔹 PATCH /emails/:id/move
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
  });

}
}
