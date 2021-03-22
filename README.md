# Apollo Utilities

We use this repository as a place to keep code we use across our apollo implementing services' repositories.
These include plugins, dataloader functions, etc.

## Example Usage
#### batchCacheFn
```typescript
import {batchCacheFn} from "./dataloader";

const batchGetUsers = async (userInputs: UserInput[]): Promise<User[]> => {
  return batchCacheFn<UserParam, User>({
    values: userInputs,
    valueKeyFn: (userInput: UserInput) => userInput.id, // same return value as cacheKeyFn
    callback: (userInputs: UserInput[]) => batchFetchUsersFromDb(userInputs),
    cache: new ElasticacheRedis(new RedisCache({host, port}), new RedisCache({host, port})), // primary and reader
    cacheKeyPrefix: 'user-', // optional
    returnTypeKeyFn: (user: User) => user.id, // same return value as valueFn
    maxAge: 300
  });
}
```

## Development
1. `npm install`
2. `npm run test` run tests or `npm run test:watch` to watch files and run tests when the code changes.
3. Be sure to export any new modules in `src/index.ts`
