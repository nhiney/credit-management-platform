/**
 * Value Object representing a credit amount.
 *
 * Guarantees immutability and validity at construction time.
 * All arithmetic returns new instances — no mutation.
 *
 * OOP Principles demonstrated:
 *   - Encapsulation: internal value is private, accessed only via getter
 *   - Immutability: every operation returns a NEW CreditAmount
 *   - Polymorphism-ready: implements equals() for value comparison
 */
export class CreditAmount {
  private readonly _value: number;

  private constructor(value: number) {
    this._value = value;
  }

  /**
   * Factory method — the only valid way to construct a CreditAmount.
   * Enforces domain invariants upfront.
   */
  static of(value: number): CreditAmount {
    if (!Number.isInteger(value)) {
      throw new Error(`CreditAmount must be an integer, received: ${value}`);
    }
    if (value < 0) {
      throw new Error(`CreditAmount cannot be negative, received: ${value}`);
    }
    return new CreditAmount(value);
  }

  static zero(): CreditAmount {
    return new CreditAmount(0);
  }

  get value(): number {
    return this._value;
  }

  add(other: CreditAmount): CreditAmount {
    return new CreditAmount(this._value + other._value);
  }

  subtract(other: CreditAmount): CreditAmount {
    const result = this._value - other._value;
    if (result < 0) {
      throw new Error(
        `Cannot subtract ${other.value} from ${this._value}: result would be negative`,
      );
    }
    return new CreditAmount(result);
  }

  isGreaterThanOrEqualTo(other: CreditAmount): boolean {
    return this._value >= other._value;
  }

  isZero(): boolean {
    return this._value === 0;
  }

  equals(other: CreditAmount): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return `${this._value} credit(s)`;
  }
}
