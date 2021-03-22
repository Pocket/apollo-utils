export interface MsetKeyValues {
  [key: string]: string;
}

export interface KeyValueCacheSetOptions {
  /**
   * Specified in **seconds**, the time-to-live (TTL) value limits the lifespan
   * of the data being stored in the cache.
   */
  ttl?: number | null;
}

export interface CacheInterface {
  /**
   * Generates a cache key from key input
   * @param key
   */
  getKey(key: string): string;

  /**
   * Sets a single value to cache
   * @param key
   * @param value
   * @param options
   */
  set(
    key: string,
    value: string,
    options?: KeyValueCacheSetOptions
  ): Promise<void>;

  /**
   * Sets multiple values to cache
   * @param keyValues
   * @param ttl
   */
  mset(keyValues: MsetKeyValues, ttl: number): Promise<void>;

  /**
   * Gets a single value from cache using the key
   * @param key
   */
  get(key: string): Promise<string | undefined>;

  /**
   * Gets multiple values from cache
   * @param keys
   */
  mget(keys: string[]): Promise<string[]>;

  /**
   * Deletes a value from cache using the key
   * @param key
   */
  delete(key: string): Promise<boolean>;

  /**
   * Flushes the cache, this removes all values from cache
   */
  flush(): Promise<void>;

  /**
   * Closes the connection to the cache
   */
  close(): Promise<void>;

  /**
   * Flushes the cache
   */
  clear(): Promise<void>;
}
