import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuthService } from '../modules/auth/auth.service';
import { INJECTION_TOKENS } from '../common/constants/injection-tokens';
import { IUserRepository } from '../domain/interfaces/user.repository.interface';

const mockUser = {
  id: 'user-001',
  email: 'test@example.com',
  passwordHash: '$2b$12$hashedpassword',
  currentCredits: 0,
  role: 'USER' as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockUserRepo: jest.Mocked<IUserRepository> = {
  findById: jest.fn(),
  findByEmail: jest.fn(),
  create: jest.fn(),
  incrementCredits: jest.fn(),
  decrementCredits: jest.fn(),
  findWithActivePackages: jest.fn(),
  findAll: jest.fn(),
  count: jest.fn(),
};

const mockJwt = { sign: jest.fn().mockReturnValue('mock.jwt.token') };

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: INJECTION_TOKENS.USER_REPOSITORY, useValue: mockUserRepo },
        { provide: JwtService, useValue: mockJwt },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('register()', () => {
    it('should throw ConflictException when email already exists', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(mockUser);

      await expect(
        service.register({ email: mockUser.email, password: 'Test@1234' }),
      ).rejects.toThrow(ConflictException);

      expect(mockUserRepo.create).not.toHaveBeenCalled();
    });

    it('should create a new user and return accessToken', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null);
      mockUserRepo.create.mockResolvedValue(mockUser);

      const result = await service.register({ email: mockUser.email, password: 'Test@1234' });

      expect(mockUserRepo.create).toHaveBeenCalledTimes(1);
      expect(result.accessToken).toBe('mock.jwt.token');
    });

    it('should hash the password before storing', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null);
      mockUserRepo.create.mockResolvedValue(mockUser);

      await service.register({ email: mockUser.email, password: 'Test@1234' });

      const storedHash = (mockUserRepo.create.mock.calls[0][0] as { passwordHash: string })
        .passwordHash;
      const isHashed = await bcrypt.compare('Test@1234', storedHash);
      expect(isHashed).toBe(true);
    });
  });

  describe('login()', () => {
    it('should throw UnauthorizedException when user does not exist', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nobody@example.com', password: 'Test@1234' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password is wrong', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(
        service.login({ email: mockUser.email, password: 'WrongPass!' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return user and accessToken on valid credentials', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const result = await service.login({ email: mockUser.email, password: 'Test@1234' });

      expect(result.accessToken).toBe('mock.jwt.token');
      expect(result.user).not.toHaveProperty('passwordHash');
    });
  });
});
