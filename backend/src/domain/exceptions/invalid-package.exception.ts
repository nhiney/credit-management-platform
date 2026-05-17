export class InvalidPackageException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPackageException';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
