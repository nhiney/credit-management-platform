import { CreditAmount } from '../value-objects/credit-amount.value-object';
import { Email } from '../value-objects/email.value-object';
import { InsufficientCreditsException } from '../exceptions/insufficient-credits.exception';

export type UserRole = 'USER' | 'ADMIN';

export interface UserProps {
  id: string;
  email: string;
  passwordHash: string;
  currentCredits: number;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * UserEntity — Rich domain object for the User aggregate root.
 *
 * OOP principles demonstrated:
 *   Encapsulation  — all fields are private; state changes only via methods
 *   Behaviour      — business rules live here, not in services
 *   Factory method — static create() / fromPersistence() control instantiation
 */
export class UserEntity {
  private readonly _id: string;
  private readonly _email: Email;
  private readonly _passwordHash: string;
  private _credits: CreditAmount;
  private readonly _role: UserRole;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: UserProps) {
    this._id = props.id;
    this._email = Email.of(props.email);
    this._passwordHash = props.passwordHash;
    this._credits = CreditAmount.of(props.currentCredits);
    this._role = props.role;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  /** Reconstruct from a Prisma record (no validation — DB is source of truth). */
  static fromPersistence(props: UserProps): UserEntity {
    return new UserEntity(props);
  }

  /** Construct a brand-new user (applies all domain invariants). */
  static create(props: Omit<UserProps, 'createdAt' | 'updatedAt'>): UserEntity {
    return new UserEntity({
      ...props,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // ── Getters ────────────────────────────────────────────────────────────────

  get id(): string {
    return this._id;
  }
  get email(): string {
    return this._email.value;
  }
  get passwordHash(): string {
    return this._passwordHash;
  }
  get currentCredits(): number {
    return this._credits.value;
  }
  get role(): UserRole {
    return this._role;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }

  // ── Business behaviour ─────────────────────────────────────────────────────

  isAdmin(): boolean {
    return this._role === 'ADMIN';
  }

  /**
   * Returns true if the user has enough credits for the given cost.
   * Never throws — use this for pre-checks.
   */
  canAfford(creditCost: number): boolean {
    return this._credits.isGreaterThanOrEqualTo(CreditAmount.of(creditCost));
  }

  /**
   * Deducts credits from the user balance.
   * Throws InsufficientCreditsException if balance is too low.
   * This enforces the invariant: credits must never go below zero.
   */
  deductCredits(amount: number): void {
    if (!this.canAfford(amount)) {
      throw new InsufficientCreditsException(amount, this._credits.value);
    }
    this._credits = this._credits.subtract(CreditAmount.of(amount));
    this._updatedAt = new Date();
  }

  /**
   * Adds credits to the user balance (e.g., after a package purchase).
   * Amount must be a positive integer.
   */
  addCredits(amount: number): void {
    this._credits = this._credits.add(CreditAmount.of(amount));
    this._updatedAt = new Date();
  }

  /** Expose as a plain object for serialization / Prisma writes. */
  toPlainObject(): UserProps {
    return {
      id: this._id,
      email: this._email.value,
      passwordHash: this._passwordHash,
      currentCredits: this._credits.value,
      role: this._role,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
