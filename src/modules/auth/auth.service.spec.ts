import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  const mockUsersService = {
    findByEmail: jest.fn(),
    createUser: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(
      mockUsersService as any,
      mockJwtService as any,
    );
  });

  it('register should create user when email is new', async () => {
    mockUsersService.findByEmail.mockResolvedValue(null);
    mockUsersService.createUser.mockResolvedValue({
      id: 'u1',
      email: 'alice@example.com',
    });
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-pass');

    const result = await service.register('alice@example.com', 'secret123');

    expect(mockUsersService.createUser).toHaveBeenCalledWith(
      'alice@example.com',
      'hashed-pass',
    );
    expect(result).toEqual({ id: 'u1', email: 'alice@example.com' });
  });

  it('register should throw when email already exists', async () => {
    mockUsersService.findByEmail.mockResolvedValue({ id: 'u1' });

    await expect(
      service.register('alice@example.com', 'secret123'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('login should return access token for valid credentials', async () => {
    mockUsersService.findByEmail.mockResolvedValue({
      id: 'u1',
      email: 'alice@example.com',
      password: 'hashed-pass',
    });
    mockJwtService.signAsync.mockResolvedValue('jwt-token');
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const result = await service.login('alice@example.com', 'secret123');

    expect(mockJwtService.signAsync).toHaveBeenCalledWith({
      sub: 'u1',
      email: 'alice@example.com',
    });
    expect(result).toEqual({ accessToken: 'jwt-token' });
  });

  it('login should throw for invalid credentials', async () => {
    mockUsersService.findByEmail.mockResolvedValue({
      id: 'u1',
      email: 'alice@example.com',
      password: 'hashed-pass',
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      service.login('alice@example.com', 'wrong-pass'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
