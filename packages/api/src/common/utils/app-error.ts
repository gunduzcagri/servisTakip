export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, statusCode: number = 400, code: string = "BAD_REQUEST") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static notFound(message: string = "Kayit bulunamadi") {
    return new AppError(message, 404, "NOT_FOUND");
  }

  static unauthorized(message: string = "Yetkisiz erisim") {
    return new AppError(message, 401, "UNAUTHORIZED");
  }

  static forbidden(message: string = "Erisim engellendi") {
    return new AppError(message, 403, "FORBIDDEN");
  }

  static validation(message: string) {
    return new AppError(message, 422, "VALIDATION_ERROR");
  }
}
