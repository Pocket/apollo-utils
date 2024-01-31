# Apollo Utilities

> [!IMPORTANT]  
> This repo has been moved to [Pocket's Monorepo](https://github.com/Pocket/pocket-monorepo/tree/main/packages/apollo-utils)

We use this repository as a place to keep code we use across our apollo implementing services' repositories.
These include plugins, dataloader functions, etc.

## Development

1. `npm install`
2. `npm run test` run tests or `npm run test:watch` to watch files and run tests when the code changes.
3. Be sure to export any new modules in `src/index.ts`

## Dependency

1. Update the apollo server version to 3 and node version to 16 to import this package.

## Example Usage

#### Sentry Plugin and Error Handler

- Setting up plugin and error handler with the apollo server

```typescript
const server = new ApolloServer({
  schema: buildFederatedSchema({ typeDefs, resolvers }),
  plugins: [sentryPlugin],
  formatError: errorHandler,
});
```

- Throwing custom error

```typescript
throw new NotFoundError('book id');
```

- Throwing Apollo errors

```typescript
import { UserInputError } from 'apollo-server-errors';

throw new UserInputError('Invalid User Input');
```

#### ISOString Scalar

This gives you a ISOString Scalar that expects a valid TypeScript Date object or null (to represent no date && cases like 0000-00-00) on the serverside, and an ISO-8601-compliant Datetime string or an empty string when interacting with clients.

The expectation of this custom scalar is that the database client layer will handle mapping valid Dates to a Typescript Date Object and invalid Dates to either null (e.g. should be considered a None type) or throw some internal error.

This custom scalar expects UTC, ISO-8601-compliant datetime string values as input only. Inputs must specify UTC and must follow ISO-8601.

In your graphql schema file:

```graphql
"""
ISOString scalar - all datetimes fields are Typescript Date objects on this server &
returned as ISO-8601 encoded date strings (e.g. ISOString scalars) to GraphQL clients.
See Section 5.6 of the RFC 3339 profile of the ISO 8601 standard: https://www.ietf.org/rfc/rfc3339.txt.
"""
scalar ISOString

type Something {
  """
  Timestamp that the Something entity was created.
  """
  createdAt: ISOString

  """
  Timestamp that the Something entity was deleted, null if not deleted.
  """
  deletedAt: ISOString
}
```

In your types file (if not autogenerated), anything that is an ISOString is either Date or Date | null (if the field is optional):

```typescript
export type Something = {
  createdAt: Date;
  deletedAt: Date | null;
```

In your resolvers file(s):

```typescript
import { PocketDefaultScalars } from '@pocket-tools/apollo-utils';

const resolvers = {
  ...PocketDefaultScalars,
  // ...other resolvers...
  // if another server needs a different internal representation
  // they can still override the defaults below:
  // ISOString: someNonDefaultScalar
};
```

& make sure the server typeDefs points back to the schema.graphql file already update (in order to know about the ISOString type).
