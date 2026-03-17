import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async register(email: string, password: string) {
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    return this.usersService.createUser(email, hashedPassword);
  }
  async login(email: string, password: string) {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
        throw new UnauthorizedException('Invalid credentials');
        }


        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
        throw new UnauthorizedException('Invalid credentials');
        }


        const payload = { sub: user.id, email: user.email };
        const accessToken = await this.jwtService.signAsync(payload);


        return { accessToken };
        }
  
  async validateGoogleUser(profile: any) {
    const { email, sub: googleId } = profile._json;
    let user = await this.usersService.findByEmail(email);

    if (!user) {
      user = await this.usersService.createUser(email, undefined, 'google');
    }

    const payload = { sub: user.id, email: user.email };
    const accessToken = await this.jwtService.signAsync(payload);

    return { accessToken };
  }
}