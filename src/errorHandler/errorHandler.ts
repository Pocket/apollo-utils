import {
  GraphQLError,
  GraphQLFormattedError,
  GraphQLErrorOptions,
} from 'graphql';
import {
  unwrapResolverError,
  ApolloServerErrorCode,
} from '@apollo/server/errors';

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

const isGatewayError = (value: unknown): value is GraphQLError =>
  !!value &&
  typeof value == 'object' &&
  'extensions' in value &&
  typeof (value as GraphQLError).extensions === 'object' &&
  'code' in (value as GraphQLError).extensions &&
  typeof (value as GraphQLError).extensions.code === 'string';
const pocketErrorCodes = Object.values(InternalErrorCode);
const apolloErrorCodes = Object.values(ApolloServerErrorCode);
const gatewayUnmaskedErrors = new Set<string>([
  ...pocketErrorCodes,
  ...apolloErrorCodes,
]);

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
  } else if (
    isGatewayError(error) &&
    gatewayUnmaskedErrors.has(error.extensions.code as string)
  ) {
    return formattedError;
  } else {
    // Mask other kinds of errors
    return new InternalServerError('Internal server error', {
      originalError: error as Error,
      // preserve path and locations
      path: (error as GraphQLError)?.path,
      // The locations parameter cannot be specified from locations
      // (type mismatch), but will be built from positions and source
      // if provided. This is being explicitly tested for breaks.
      positions: (error as GraphQLError)?.positions,
      source: (error as GraphQLError)?.source,
    }).toJSON();
  }
}

/**
 * Used for formatting errors returned to the gateway from subgraphs specifically.
 * Errors sent from the subgraphs (when using the remote data sources over HTTP)
 * lose Javascript class context, which we rely on for errorHandler processing.
 * This approach re-instatiates the class contexts at a generic GraphQLError level
 * then passes back to the regular Errorhandler.
 * @param formattedError original formattedError from gateway processing
 * @param error original GraphQL Error, which errorHander wants to have class typing
 */
export function gatewayErrorHandler(
  formattedError: GraphQLFormattedError,
  error: unknown
): GraphQLFormattedError {
  if (
    isGatewayError(error) &&
    gatewayUnmaskedErrors.has(error.extensions.code as string)
  ) {
    // This isn't ideal, since in the subgraphs these error classes would be more specific,
    // but for the sake of using the subgraphs errorHandler to do checks via class type &&
    // having our subgraph error blobs be processed correctly by that apollo-utils errorHandler,
    // this just recreates the errors as a generic GraphQL Error w/all the original details.
    const reworkedError = new GraphQLError(error.message, {
      ...error,
    });
    return errorHandler(formattedError, reworkedError);
  }
  return errorHandler(formattedError, error);
}

/**
 * CustomGraphQLError exists for providing common extensions for all
 * custom internal errors. Otherwise, all implementation is just relying
 * on GraphQLError
 *
 * This really shouldn't be used directly, but is exported so that other
 * packages or consumers can extend this same interface (though they really
 * should implement here to prevent duplicate implementations!). Still, exported
 * because there could be a subgraph that we never intend to federate or
 * similar use cases in the future.
 *
 * To extend this, create a unique error code for your new error, and add
 * it to the InternalErrorCode enum above, add the error code to NO_REPORT_ERRORS
 * in `sentryPlugin.ts`, and implement an error extension class below.
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
