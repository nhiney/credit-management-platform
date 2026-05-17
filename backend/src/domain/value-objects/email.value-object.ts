/**
 * Value Object representing a validated email address.
 * Normalises to lowercase on construction.
 */
export class Email {
  private readonly _value: string;

  private static readonly PATTERN = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

  private constructor(value: string) {
    this._value = value;
  }

  static of(raw: string): Email {
    const normalised = raw.trim().toLowerCase();
    if (!Email.PATTERN.test(normalised)) {
      throw new Error(`'${raw}' is not a valid email address`);
    }
    return new Email(normalised);
  }

  get value(): string {
    return this._value;
  }

  equals(other: Email): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
