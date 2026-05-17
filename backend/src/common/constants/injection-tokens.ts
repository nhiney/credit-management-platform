/**
 * Dependency injection tokens for interface-based bindings.
 * Services depend on these tokens (not concrete classes),
 * enabling clean mocking in unit tests.
 */
export const INJECTION_TOKENS = {
  USER_REPOSITORY: Symbol('IUserRepository'),
  PACKAGE_REPOSITORY: Symbol('IPackageRepository'),
  TRANSACTION_REPOSITORY: Symbol('ITransactionRepository'),
  CREDIT_DEDUCTION_STRATEGY: Symbol('ICreditDeductionStrategy'),
  LOGGER: Symbol('ILogger'),
} as const;
