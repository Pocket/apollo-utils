import { GraphQLError } from 'graphql';
import { ApolloError } from 'apollo-server-errors';

/**
 * Used for formatting errors returned to the client. Hide any
 * errors that might reveal server details. Handle special cases
 * that we want to use to provide more information to the client
 * (e.g. NotFoundError).
 */
export function errorHandler(error: GraphQLError): GraphQLError {
  if (error.originalError instanceof NotFoundError) {
    return new GraphQLNotFoundError(error);
  } else if (
    error instanceof ApolloError ||
    error.originalError instanceof ApolloError
  ) {
    // Keep GraphQL errors intact
    // e.g. failed parsing, bad input
    return error;
  } else {
    // Mask other kinds of errors
    return new InternalServerError(error);
  }
}

export class NotFoundError extends Error {
  static errorPrefix = `Error - Not Found`;
  constructor(message?: string) {
    super(`${NotFoundError.errorPrefix}: ${message}`); // 'Error' breaks prototype chain here
    Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
  }
}

export class CustomGraphQLError extends ApolloError {
  constructor(
    error: GraphQLError,
    code: string,
    name: string,
    message?: string
  ) {
    // keep original message unless override
    super(message ?? error.message, code);

    Object.defineProperty(this, 'name', { value: name });
    // GraphQL only keeps these values (plus extensions and message)
    //   when re-throwing the error, so set them
    // They don't contain sensitive info
    Object.defineProperty(this, 'path', { value: error.path });
    Object.defineProperty(this, 'locations', { value: error.locations });
  }
}

export class InternalServerError extends CustomGraphQLError {
  constructor(error: GraphQLError) {
    super(
      error,
      'INTERNAL_SERVER_ERROR',
      'InternalServerError',
      'Internal server error'
    );
  }
}

export class GraphQLNotFoundError extends CustomGraphQLError {
  constructor(error: GraphQLError) {
    super(error, 'NOT_FOUND', 'NotFoundError');
  }
}
