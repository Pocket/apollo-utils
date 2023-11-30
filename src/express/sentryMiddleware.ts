import express from 'express';
import * as Sentry from '@sentry/node';

/**
 * Sets common variables for Sentry tracing
 * Usage:
 * ```ts
 * app.use(sentryPocketMiddleware)
 * ```
 * @param req Express request
 */
export const sentryPocketMiddleware: express.RequestHandler = (
  req: express.Request,
) => {
  // Set tracking data for Sentry
  Sentry.configureScope((scope) => {
    scope.setTag('pocket-api-id', (req.headers.apiid || '0') as string);
    scope.setUser({
      id: (req.headers.encodedid as string) || undefined,
      // Use the gateway ip address because this is behind a non-standard proxy
      ip_address: (req.headers.gatewayipaddress as string) || undefined,
    });
  });
};
