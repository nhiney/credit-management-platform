import { UserEntity } from '../domain/entities/user.entity';
import { InsufficientCreditsException } from '../domain/exceptions/insufficient-credits.exception';

const BASE_PROPS = {
  id: 'user-001',
  email: 'test@example.com',
  passwordHash: 'hashed',
  currentCredits: 100,
  role: 'USER' as const,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

describe('UserEntity', () => {
  describe('fromPersistence()', () => {
    it('should reconstruct a user from persistence data', () => {
      const user = UserEntity.fromPersistence(BASE_PROPS);
      expect(user.id).toBe('user-001');
      expect(user.email).toBe('test@example.com');
      expect(user.currentCredits).toBe(100);
    });

    it('should normalize email to lowercase', () => {
      const user = UserEntity.fromPersistence({ ...BASE_PROPS, email: 'UPPER@EXAMPLE.COM' });
      expect(user.email).toBe('upper@example.com');
    });
  });

  describe('isAdmin()', () => {
    it('should return true for ADMIN role', () => {
      const user = UserEntity.fromPersistence({ ...BASE_PROPS, role: 'ADMIN' });
      expect(user.isAdmin()).toBe(true);
    });

    it('should return false for USER role', () => {
      const user = UserEntity.fromPersistence(BASE_PROPS);
      expect(user.isAdmin()).toBe(false);
    });
  });

  describe('canAfford()', () => {
    it('should return true when balance is sufficient', () => {
      const user = UserEntity.fromPersistence({ ...BASE_PROPS, currentCredits: 50 });
      expect(user.canAfford(50)).toBe(true);
    });

    it('should return true when balance exceeds cost', () => {
      const user = UserEntity.fromPersistence({ ...BASE_PROPS, currentCredits: 100 });
      expect(user.canAfford(50)).toBe(true);
    });

    it('should return false when balance is insufficient', () => {
      const user = UserEntity.fromPersistence({ ...BASE_PROPS, currentCredits: 10 });
      expect(user.canAfford(50)).toBe(false);
    });
  });

  describe('deductCredits()', () => {
    it('should decrease the credit balance', () => {
      const user = UserEntity.fromPersistence({ ...BASE_PROPS, currentCredits: 100 });
      user.deductCredits(30);
      expect(user.currentCredits).toBe(70);
    });

    it('should throw InsufficientCreditsException when credits are too low', () => {
      const user = UserEntity.fromPersistence({ ...BASE_PROPS, currentCredits: 10 });
      expect(() => user.deductCredits(50)).toThrow(InsufficientCreditsException);
    });

    it('should allow deducting the entire balance', () => {
      const user = UserEntity.fromPersistence({ ...BASE_PROPS, currentCredits: 50 });
      user.deductCredits(50);
      expect(user.currentCredits).toBe(0);
    });
  });

  describe('addCredits()', () => {
    it('should increase the credit balance', () => {
      const user = UserEntity.fromPersistence({ ...BASE_PROPS, currentCredits: 100 });
      user.addCredits(200);
      expect(user.currentCredits).toBe(300);
    });

    it('should update the updatedAt timestamp', () => {
      const before = new Date('2024-01-01');
      const user = UserEntity.fromPersistence({
        ...BASE_PROPS,
        currentCredits: 0,
        updatedAt: before,
      });
      user.addCredits(10);
      expect(user.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });
  });

  describe('toPlainObject()', () => {
    it('should return a plain object with all props including id and currentCredits', () => {
      const user = UserEntity.fromPersistence(BASE_PROPS);
      const plain = user.toPlainObject();
      expect(plain.id).toBe('user-001');
      expect(plain.currentCredits).toBe(100);
      expect(plain.email).toBe('test@example.com');
    });

    it('should reflect mutated credit balance after deduction', () => {
      const user = UserEntity.fromPersistence({ ...BASE_PROPS, currentCredits: 100 });
      user.deductCredits(40);
      expect(user.toPlainObject().currentCredits).toBe(60);
    });
  });
});
