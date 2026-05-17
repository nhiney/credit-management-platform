import { TransactionType, TransactionStatus } from '@prisma/client';

export interface TransactionProps {
  id: string;
  userId: string;
  packageId: string | null;
  featureId: string | null;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  transactionType: TransactionType;
  status: TransactionStatus;
  description: string | null;
  referenceId: string | null;
  createdAt: Date;
}

export class TransactionEntity {
  private readonly _id: string;
  private readonly _userId: string;
  private readonly _packageId: string | null;
  private readonly _featureId: string | null;
  private readonly _amount: number;
  private readonly _balanceBefore: number;
  private readonly _balanceAfter: number;
  private readonly _transactionType: TransactionType;
  private readonly _status: TransactionStatus;
  private readonly _description: string | null;
  private readonly _referenceId: string | null;
  private readonly _createdAt: Date;

  private constructor(props: TransactionProps) {
    if (props.amount <= 0) {
      throw new Error('Transaction amount must be positive');
    }
    if (props.balanceAfter < 0) {
      throw new Error('Balance after transaction cannot be negative');
    }
    this._id = props.id;
    this._userId = props.userId;
    this._packageId = props.packageId;
    this._featureId = props.featureId;
    this._amount = props.amount;
    this._balanceBefore = props.balanceBefore;
    this._balanceAfter = props.balanceAfter;
    this._transactionType = props.transactionType;
    this._status = props.status;
    this._description = props.description;
    this._referenceId = props.referenceId;
    this._createdAt = props.createdAt;
  }

  static fromPersistence(props: TransactionProps): TransactionEntity {
    return new TransactionEntity(props);
  }

  // ── Getters ────────────────────────────────────────────────────────────────

  get id(): string {
    return this._id;
  }
  get userId(): string {
    return this._userId;
  }
  get packageId(): string | null {
    return this._packageId;
  }
  get featureId(): string | null {
    return this._featureId;
  }
  get amount(): number {
    return this._amount;
  }
  get balanceBefore(): number {
    return this._balanceBefore;
  }
  get balanceAfter(): number {
    return this._balanceAfter;
  }
  get transactionType(): TransactionType {
    return this._transactionType;
  }
  get status(): TransactionStatus {
    return this._status;
  }
  get description(): string | null {
    return this._description;
  }
  get referenceId(): string | null {
    return this._referenceId;
  }
  get createdAt(): Date {
    return this._createdAt;
  }

  // ── Business behaviour ─────────────────────────────────────────────────────

  isCreditIn(): boolean {
    return this._transactionType === TransactionType.CREDIT_IN;
  }

  isCreditOut(): boolean {
    return this._transactionType === TransactionType.CREDIT_OUT;
  }

  isCompleted(): boolean {
    return this._status === TransactionStatus.COMPLETED;
  }

  /** Net credit change: positive for CREDIT_IN, negative for CREDIT_OUT. */
  netChange(): number {
    return this._balanceAfter - this._balanceBefore;
  }
}
