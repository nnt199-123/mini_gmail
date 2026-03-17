import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.email, dto.password);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req) {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleAuthRedirect(@Req() req, @Res() res: Response) {
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
    const accessToken = req.user?.access_token;

    if (!accessToken) {
      return res.redirect(`${frontendUrl}/?authError=google_callback_failed`);
    }

    const redirectUrl = new URL(frontendUrl);
    redirectUrl.searchParams.set('token', accessToken);
    redirectUrl.searchParams.set('provider', 'google');

    return res.redirect(redirectUrl.toString());
  }
}
