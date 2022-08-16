import * as Sentry from '@sentry/node';
import { ApolloServerPlugin } from 'apollo-server-plugin-base';

/**
 * Plugin for handling errors.
 * Logs the original error to console (for cloudwatch)
 * and Sentry.
 * This is only invoked if the graphql execution actually
 * started, so it will not send errors that occurred while
 * before the query could start (e.g. syntax error in graphql
 * query sent by client)
 */
//Copied from https://blog.sentry.io/2020/07/22/handling-graphql-errors-using-sentry
export const sentryPlugin: ApolloServerPlugin = {
  async requestDidStart() {
    /* Within this returned object, define functions that respond
                 to request-specific lifecycle events. */
    return {
      async didEncounterErrors(ctx) {
        //for error codes:
        // https://www.apollographql.com/docs/apollo-server/data/errors/#bad_user_input
        const errorCodes = [
          'FORBIDDEN',
          'UNAUTHENTICATED',
          'BAD_USER_INPUT',
          'GRAPHQL_PARSE_FAILED',
          'GRAPHQL_VALIDATION_FAILED',
        ];

        // If we couldn't parse the operation, don't
        // do anything here
        if (!ctx.operation) {
          return;
        }

        for (const err of ctx.errors) {
          // Only report internal server errors,
          // all errors extending ApolloError should be user-facing
          if (
            errorCodes.includes(err.extensions?.code?.toString()) ||
            //the error-handler is called after sentryPlugin,
            //so we won't have `code` populated yet
            //so we are string matching with `NotFoundError` class message prefix
            err.message.includes('Error - Not Found')
          ) {
            continue;
          }

          // Add scoped report details and send to Sentry
          Sentry.withScope((scope) => {
            // Annotate whether failing operation was query/mutation/subscription
            scope.setTag('kind', ctx.operation.operation);

            // Log query and variables as extras (make sure to strip out sensitive data!)
            scope.setExtra('query', ctx.request.query);
            scope.setExtra('variables', JSON.stringify(ctx.request.variables));

            if (err.path) {
              // We can also add the path as breadcrumb
              scope.addBreadcrumb({
                category: 'query-path',
                message: err.path.join(' > '),
                level: 'debug',
              });
            }

            //logs error to cloudwatch and sentry
            console.log(err);
            Sentry.captureException(err);
          });
        }
      },
    };
  },
};
