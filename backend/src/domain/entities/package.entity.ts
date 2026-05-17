import { Decimal } from '@prisma/client/runtime/library';
import { CreditAmount } from '../value-objects/credit-amount.value-object';
import { FeatureEntity } from './feature.entity';
import { InvalidPackageException } from '../exceptions/invalid-package.exception';

export interface PackageProps {
  id: string;
  name: string;
  description: string | null;
  price: Decimal;
  creditAmount: number;
  isActive: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  features?: FeatureEntity[];
}

/**
 * PackageEntity — represents a purchasable credit package.
 *
 * OOP principles:
 *   Encapsulation — price and credits are always valid (enforced at construction)
 *   Composition   — aggregates FeatureEntity objects
 *   Behaviour     — provides domain queries (hasFeature, canBePurchased, canBeDeleted)
 */
export class PackageEntity {
  private readonly _id: string;
  private readonly _name: string;
  private readonly _description: string | null;
  private readonly _price: Decimal;
  private readonly _creditAmount: CreditAmount;
  private _isActive: boolean;
  private _deletedAt: Date | null;
  private readonly _features: FeatureEntity[];
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: PackageProps) {
    if (Number(props.price) <= 0) {
      throw new InvalidPackageException('Package price must be greater than zero');
    }
    if (props.creditAmount < 1) {
      throw new InvalidPackageException('Package must grant at least 1 credit');
    }
    this._id = props.id;
    this._name = props.name;
    this._description = props.description;
    this._price = props.price;
    this._creditAmount = CreditAmount.of(props.creditAmount);
    this._isActive = props.isActive;
    this._deletedAt = props.deletedAt;
    this._features = props.features ?? [];
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  static fromPersistence(props: PackageProps): PackageEntity {
    return new PackageEntity(props);
  }

  // ── Getters ────────────────────────────────────────────────────────────────

  get id(): string {
    return this._id;
  }
  get name(): string {
    return this._name;
  }
  get description(): string | null {
    return this._description;
  }
  get price(): Decimal {
    return this._price;
  }
  get creditAmount(): number {
    return this._creditAmount.value;
  }
  get isActive(): boolean {
    return this._isActive;
  }
  get deletedAt(): Date | null {
    return this._deletedAt;
  }
  get features(): FeatureEntity[] {
    return [...this._features];
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }

  // ── Business behaviour ─────────────────────────────────────────────────────

  /** Returns true if this package grants access to the given feature code. */
  hasFeature(featureCode: string): boolean {
    return this._features.some((f) => f.codeName === featureCode);
  }

  /** A package can only be purchased if it is active and not soft-deleted. */
  canBePurchased(): boolean {
    return this._isActive && this._deletedAt === null;
  }

  /**
   * A package can only be soft-deleted if there are no active subscribers.
   * The actual subscriber count check is done at the service/repo layer.
   */
  canBeDeleted(activeSubscriberCount: number): boolean {
    return activeSubscriberCount === 0 && !this._deletedAt;
  }

  softDelete(): void {
    this._isActive = false;
    this._deletedAt = new Date();
    this._updatedAt = new Date();
  }
}
