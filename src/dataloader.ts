import {CacheInterface} from './cache/interface';

export const multiGetCachedValues = async <T>(
  cache: CacheInterface,
  values: string[]
): Promise<T[]> => {
  return (await cache.mget(values.map(cache.getKey))).map((value) =>
    JSON.parse(value)
  );
};

export const multiSetCacheValues = async <T>(
  props: {
    values: T[];
    cache: CacheInterface;
    cacheKeyFn: (value: T) => string;
    maxAge: number;
  }
): Promise<void> => {
  const cacheReadyValues = props.values.reduce((acc, value) => {
    if (value) {
      return {
        ...acc,
        [props.cache.getKey(props.cacheKeyFn(value))]: JSON.stringify(value),
      };
    }

    return acc;
  }, {});

  if (
    Object.keys(cacheReadyValues).length !== 0 &&
    cacheReadyValues.constructor === Object
  ) {
    await props.cache.mset(cacheReadyValues, props.maxAge);
  }
};

export type BatchFnProps<T, U> = {
  values: T[];
  valueFn: (value: T) => string;
  callback: (values: T[]) => U[];
  cache: CacheInterface;
  maxAge: number;
  cacheKeyFn: (value: U) => string;
};

const reorderResults = <T, U>(results: U[], props: BatchFnProps<T, U>) => {
  const resultsAsObject = results.reduce((acc, value) => {
    if (value) {
      return {
        ...acc,
        [props.cache.getKey(props.cacheKeyFn(value))]: value,
      };
    }
    return acc;
  }, {});

  return props.values.map((value) => {
    return resultsAsObject[props.cache.getKey(props.valueFn(value))];
  });
};

export const batchCacheFn = async <T, U>(props: BatchFnProps<T, U>): Promise<U[]> => {
  // get the cached values from the cache using the values
  const cachedValues = await multiGetCachedValues<U>(
    props.cache,
    props.values.map(props.valueFn)
  );

  // if the length of the values is the same as the cached values, return here
  // since this means all the values were found in the cache
  if (props.values.length === cachedValues.length) return cachedValues;

  // get all the item values that were not found in the cache
  const cachedKeys = cachedValues.map(props.cacheKeyFn);
  const missedKeys = props.values.filter((value) => {
    return !cachedKeys.includes(props.valueFn(value));
  });

  // call the callback
  const batchResult = props.callback(missedKeys);

  // cache all the callback values
  await multiSetCacheValues({
    values: batchResult,
    cache: props.cache,
    cacheKeyFn: props.cacheKeyFn,
    maxAge: props.maxAge,
  });

  // add the cached values to the callback values
  const allValues = batchResult.concat(cachedValues);

  return reorderResults<T, U>(allValues, props);
};
