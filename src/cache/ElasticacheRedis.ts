import md5 from 'md5';
import { CacheInterface, KeyValueCacheSetOptions } from './interface';

export interface RedisClient
  extends Omit<CacheInterface, 'getKey' | 'mget' | 'mset'> {
  client: { mget: any; mset: any; multi: any };
}

/**
 * Wrapper class for apollo's RedisCache
 * This class allows us to use Elasticache Redis's primary and reader endpoints for caching
 */
export class ElasticacheRedis implements CacheInterface {
  /**
   * Constructs a RedisCache instance for the primary and reader endpoints
   * @param primaryClient
   * @param readerClient
   */
  constructor(
    private primaryClient: RedisClient,
    private readerClient: RedisClient
  ) {}

  /**
   * Generates an md5 hashed cache key from key input
   * @param key
   */
  getKey(key: string): string {
    return md5(key) as string;
  }

  /**
   * Sets a single value to cache
   * @param key
   * @param value
   * @param options
   */
  async set(
    key: string,
    value: string,
    options?: KeyValueCacheSetOptions
  ): Promise<void> {
    await this.primaryClient.set(key, value, options);
  }

  /**
   * Sets multiple values to cache
   * @param keyValues
   * @param ttl
   */
  async mset(keyValues: { [key: string]: string }, ttl: number): Promise<void> {
    // The underlying package (luin/ioredis) does not support setting a ttl with mset
    // See https://github.com/luin/ioredis/issues/1133.
    // So we map the key-values into an array of redis commands and execute it.
    const setCommands = Object.keys(keyValues).map((key) => {
      return ['set', key, keyValues[key], 'ex', ttl];
    });

    await this.primaryClient.client.multi(setCommands).exec();
  }

  /**
   * Gets a single value from cache using the key
   * @param key
   */
  async get(key: string): Promise<string | undefined> {
    return this.readerClient.get(key);
  }

  /**
   * Gets multiple values from cache
   * @param keys
   */
  async mget(keys: string[]): Promise<string[]> {
    // noinspection TypeScriptValidateJSTypes
    return this.readerClient.client.mget(...keys);
  }

  /**
   * Deletes a value from cache using the key
   * @param key
   */
  async delete(key: string): Promise<boolean> {
    return this.primaryClient.delete(key);
  }

  /**
   * Flushes the cache, this removes all values from cache
   */
  async flush(): Promise<void> {
    await this.primaryClient.flush();
  }

  /**
   * Closes the connection to the cache
   */
  async close(): Promise<void> {
    await Promise.all([this.primaryClient.close(), this.readerClient.close()]);
  }

  /**
   * Flushes the cache
   */
  async clear(): Promise<void> {
    await this.flush();
  }
}
