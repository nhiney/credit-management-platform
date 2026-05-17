import { CreditAmount } from '../value-objects/credit-amount.value-object';

export interface FeatureProps {
  id: string;
  codeName: string;
  description: string | null;
  creditCost: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * FeatureEntity — represents a named AI capability with a credit cost.
 *
 * Encapsulates the business rule: creditCost must always be >= 1.
 */
export class FeatureEntity {
  private readonly _id: string;
  private readonly _codeName: string;
  private readonly _description: string | null;
  private readonly _creditCost: CreditAmount;
  private readonly _createdAt: Date;
  private readonly _updatedAt: Date;

  private constructor(props: FeatureProps) {
    if (props.creditCost < 1) {
      throw new Error(`Feature '${props.codeName}' must cost at least 1 credit`);
    }
    this._id = props.id;
    this._codeName = props.codeName;
    this._description = props.description;
    this._creditCost = CreditAmount.of(props.creditCost);
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  static fromPersistence(props: FeatureProps): FeatureEntity {
    return new FeatureEntity(props);
  }

  get id(): string {
    return this._id;
  }
  get codeName(): string {
    return this._codeName;
  }
  get description(): string | null {
    return this._description;
  }
  get creditCost(): number {
    return this._creditCost.value;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }

  /** Returns a human-readable label for the feature. */
  get displayName(): string {
    return this._codeName.replace(/_/g, ' ');
  }

  equals(other: FeatureEntity): boolean {
    return this._id === other._id;
  }
}
