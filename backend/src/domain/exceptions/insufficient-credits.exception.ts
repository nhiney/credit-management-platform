/**
 * Thrown by UserEntity.deductCredits() when the requested deduction
 * exceeds the current balance. Caught at the guard/service layer
 * and mapped to an HTTP 422 response.
 */
export class InsufficientCreditsException extends Error {
  readonly required: number;
  readonly available: number;

  constructor(required: number, available: number) {
    super(
      `Insufficient credits: action requires ${required} credit(s), but only ${available} available.`,
    );
    this.name = 'InsufficientCreditsException';
    this.required = required;
    this.available = available;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
