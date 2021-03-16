import { RedisCache } from 'apollo-server-cache-redis';
import { KeyValueCacheSetOptions } from 'apollo-server-caching';
import md5 from 'md5';
import { CacheInterface } from './interface';

/**
 * Wrapper class for RedisCache
 * This class allows us to use Redis's primary and reader endpoints for caching
 */
export class Redis implements CacheInterface {
  private primaryClient: RedisCache;
  private readerClient: RedisCache;
  private static PORT = 6379;

  /**
   * Constructs a RedisCache instance for the primary and reader endpoints
   * @param primaryEndpoint
   * @param readerEndpoint
   */
  constructor(primaryEndpoint: string, readerEndpoint: string) {
    this.primaryClient = new RedisCache({
      host: primaryEndpoint.split(':')[0],
      port: Redis.PORT,
    });

    this.readerClient = new RedisCache({
      host: readerEndpoint.split(':')[0],
      port: Redis.PORT,
    });
  }

  /**
   * Generates an md5 hashed cache key from key input
   * @param key
   */
  getKey(key: string): string {
    return md5(key);
  }

  /**
   * Sets a single value to cache
   * @param key
   * @param data
   * @param options
   */
  async set(
    key: string,
    data: string,
    options?: KeyValueCacheSetOptions
  ): Promise<void> {
    await this.primaryClient.set(key, data, options);
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
   * @param key
   */
  async mget(key: string[]): Promise<string[]> {
    // noinspection TypeScriptValidateJSTypes
    return this.readerClient.client.mget(...key);
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
