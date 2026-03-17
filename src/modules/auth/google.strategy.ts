import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from './auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private authService: AuthService) {
    const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:3000';
    const callbackURL =
      process.env.GOOGLE_CALLBACK_URL ?? `${backendUrl.replace(/\/$/, '')}/auth/google/callback`;

    super({
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL,
      scope: ['email', 'profile'],
    } as any);
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback): Promise<any> {
    const { accessToken: token } = await this.authService.validateGoogleUser(profile);
    done(null, { access_token: token });
  }
}
