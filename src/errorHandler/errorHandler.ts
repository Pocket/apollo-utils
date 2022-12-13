import {
  GraphQLError,
  GraphQLFormattedError,
  GraphQLErrorOptions,
} from 'graphql';
import { unwrapResolverError } from '@apollo/server/errors';

/**
 * Internally managed error codes.  If a new error is added here,
 * it should be added to `NO_REPORT_ERRORS` in `sentryPlugin` if
 * we do not want to report it to sentry.
 */
export enum InternalErrorCode {
  BAD_USER_INPUT = 'BAD_USER_INPUT',
  FORBIDDEN = 'FORBIDDEN',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHENTICATED = 'UNAUTHENTICATED',
}

/**
 * Used for formatting errors returned to the client. Hide any
 * errors that might reveal server details. Handle special cases
 * that we want to use to provide more information to the client
 * (e.g. NotFoundError).
 */
export function errorHandler(
  formattedError: GraphQLFormattedError,
  error: unknown
): GraphQLFormattedError {
  if (unwrapResolverError(error) instanceof GraphQLError) {
    // Keep GraphQL errors intact
    // e.g. failed parsing, bad input
    return formattedError;
  } else {
    // Mask other kinds of errors
    return new InternalServerError('Internal server error', {
      originalError: error as Error,
      // preserve path and locations
      path: (error as GraphQLError)?.path,
      positions: (error as GraphQLError)?.positions,
      source: (error as GraphQLError)?.source,
    }).toJSON();
  }
}

/**
 * CustomGraphQLError exists for providing common extensions for all
 * custom internal errors. Otherwise, all implementation is just relying
 * on GraphQLError
 *
 * This really shouldn't be used directly.
 */
export class CustomGraphQLError extends GraphQLError implements Error {
  constructor(message: string, options?: GraphQLErrorOptions) {
    super(message, options);

    // this should be overwritten by extension, setting just in case
    Object.defineProperty(this, 'name', { value: 'CustomGraphQLError' });
  }
}

export class NotFoundError extends CustomGraphQLError {
  static errorPrefix = `Error - Not Found`;
  constructor(message: string, options?: GraphQLErrorOptions) {
    super(`${NotFoundError.errorPrefix}: ${message}`, {
      ...options,
      extensions: { ...options?.extensions, code: InternalErrorCode.NOT_FOUND },
    });

    Object.defineProperty(this, 'name', { value: 'NotFoundError' });
  }
}

export class InternalServerError extends CustomGraphQLError {
  constructor(message: string, options?: GraphQLErrorOptions) {
    super(message ?? 'Internal server error', {
      ...options,
      extensions: {
        ...options?.extensions,
        code: InternalErrorCode.INTERNAL_SERVER_ERROR,
      },
    });

    Object.defineProperty(this, 'name', { value: 'InternalServerError' });
  }
}

/**
 * @deprecated - use NotFoundError from this same package
 */
export class GraphQLNotFoundError extends CustomGraphQLError {
  constructor(message: string, options?: GraphQLErrorOptions) {
    super(message, {
      ...options,
      extensions: { ...options?.extensions, code: InternalErrorCode.NOT_FOUND },
    });

    Object.defineProperty(this, 'name', { value: 'NotFoundError' });
  }
}

export class UserInputError extends CustomGraphQLError {
  constructor(message: string, options?: GraphQLErrorOptions) {
    super(message, {
      ...options,
      extensions: {
        ...options?.extensions,
        code: InternalErrorCode.BAD_USER_INPUT,
      },
    });

    Object.defineProperty(this, 'name', { value: 'UserInputError' });
  }
}

export class AuthenticationError extends CustomGraphQLError {
  constructor(message: string, options?: GraphQLErrorOptions) {
    super(message, {
      ...options,
      extensions: {
        ...options?.extensions,
        code: InternalErrorCode.UNAUTHENTICATED,
      },
    });

    Object.defineProperty(this, 'name', { value: 'AuthenticationError' });
  }
}

export class ForbiddenError extends CustomGraphQLError {
  constructor(message: string, options?: GraphQLErrorOptions) {
    super(message, {
      ...options,
      extensions: {
        ...options?.extensions,
        code: InternalErrorCode.FORBIDDEN,
      },
    });

    Object.defineProperty(this, 'name', { value: 'ForbiddenError' });
  }
}
