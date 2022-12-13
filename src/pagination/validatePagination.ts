import { ApolloServerErrorCode } from '@apollo/server/errors';
import { GraphQLError } from 'graphql';
import { UserInputError } from '../errorHandler/errorHandler';
import { PaginationInput } from './types';

export function validatePagination(
  pagination: PaginationInput,
  defaultPageSize = 30,
  maxPageSize = 100
): PaginationInput {
  if (pagination == null) {
    return { first: defaultPageSize };
  }

  if (
    (pagination.before && pagination.after) ||
    (pagination.before && pagination.first) ||
    (pagination.last && pagination.after) ||
    (pagination.first && pagination.last)
  ) {
    throw new UserInputError(
      'Please set either {after and first} or {before and last}'
    );
    throw new GraphQLError(
      'Please set either {after and first} or {before and last}',
      {
        extensions: {
          code: ApolloServerErrorCode.BAD_USER_INPUT,
        },
      }
    );
  }

  if (pagination.before) {
    const before = parseInt(
      Buffer.from(pagination.before, 'base64').toString()
    );
    if (before < 0) {
      throw new GraphQLError('Invalid before cursor', {
        extensions: {
          code: ApolloServerErrorCode.BAD_USER_INPUT,
        },
      });
    }

    if (!pagination.last) {
      pagination.last = defaultPageSize;
    }
  }

  if (pagination.after) {
    const after = parseInt(Buffer.from(pagination.after, 'base64').toString());
    if (after < 0) {
      throw new GraphQLError('Invalid after cursor', {
        extensions: {
          code: ApolloServerErrorCode.BAD_USER_INPUT,
        },
      });
    }

    if (!pagination.first) {
      pagination.first = defaultPageSize;
    }
  }

  if (pagination.first <= 0) {
    pagination.first = defaultPageSize;
  }

  if (pagination.last <= 0) {
    pagination.last = defaultPageSize;
  }

  if (pagination.first > maxPageSize) {
    pagination.first = maxPageSize;
  }

  if (pagination.last > maxPageSize) {
    pagination.last = maxPageSize;
  }

  return pagination;
}
