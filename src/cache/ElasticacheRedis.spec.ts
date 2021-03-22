import { ElasticacheRedis, RedisClient } from './ElasticacheRedis';
import { KeyValueCacheSetOptions } from './interface';

class FakePrimaryClient implements RedisClient {
  client: { mget: any; mset: any; multi: any };

  clear(): Promise<void> {
    return Promise.resolve(undefined);
  }

  close(): Promise<void> {
    return Promise.resolve(undefined);
  }

  delete(key: string): Promise<boolean> {
    return Promise.resolve(false);
  }

  flush(): Promise<void> {
    return Promise.resolve(undefined);
  }

  get(key: string): Promise<string | undefined> {
    return Promise.resolve(undefined);
  }

  set(
    key: string,
    value: string,
    options: KeyValueCacheSetOptions | undefined
  ): Promise<void> {
    return Promise.resolve();
  }
}

class FakeReaderClient extends FakePrimaryClient {}

const redis = new ElasticacheRedis(
  new FakePrimaryClient(),
  new FakeReaderClient()
);

describe('ElasticacheRedis', () => {
  afterEach(() => jest.clearAllMocks());

  it('can get cache key', async () => {
    expect(redis.getKey('test')).toEqual('098f6bcd4621d373cade4e832627b4f6');
  });

  it('can get cache value', async () => {
    const readerGet = (FakeReaderClient.prototype.get = jest.fn());

    await redis.get('test');

    expect(readerGet).toHaveBeenCalledTimes(1);
    expect(readerGet).toHaveBeenCalledWith('test');
  });

  it('can multi get cache values', async () => {
    const readerClient = (FakeReaderClient.prototype.client = {
      mget: jest.fn(),
      mset: jest.fn(),
      multi: jest.fn(),
    });

    const keys = ['test1', 'test2'];

    await redis.mget(keys);

    expect(readerClient.mget).toHaveBeenCalledTimes(1);
    expect(readerClient.mget).toHaveBeenCalledWith(...keys);
  });

  it('can set cache value', async () => {
    const primarySet = (FakePrimaryClient.prototype.set = jest.fn());

    const ttl = 300;
    await redis.set('test', 'val', { ttl });

    expect(primarySet).toHaveBeenCalledTimes(1);
    expect(primarySet).toHaveBeenCalledWith('test', 'val', { ttl });
  });

  it('can multi set cache values', async () => {
    const primaryClient = (FakePrimaryClient.prototype.client = {
      mget: jest.fn(),
      mset: jest.fn(),
      multi: jest.fn().mockReturnValue({ exec: jest.fn() }),
    });

    const keyValues = { test1: 'val1', test2: 'val2' };
    const ttl = 300;

    await redis.mset(keyValues, ttl);

    const setCommands = Object.keys(keyValues).map((key) => {
      return ['set', key, keyValues[key], 'ex', ttl];
    });
    expect(primaryClient.multi).toHaveBeenCalledTimes(1);
    expect(primaryClient.multi).toHaveBeenCalledWith(setCommands);
    expect(primaryClient.multi().exec).toHaveBeenCalledTimes(1);
  });

  it('can delete a cache value', async () => {
    const primaryDelete = (FakePrimaryClient.prototype.delete = jest.fn());

    await redis.delete('test');

    expect(primaryDelete).toHaveBeenCalledTimes(1);
    expect(primaryDelete).toHaveBeenCalledWith('test');
  });

  it('can flush the cache', async () => {
    const primaryFlush = (FakePrimaryClient.prototype.flush = jest.fn());

    await redis.flush();

    expect(primaryFlush).toHaveBeenCalledTimes(1);
  });

  it('can flush/clear the cache', async () => {
    const primaryFlush = (FakePrimaryClient.prototype.flush = jest.fn());

    await redis.flush();

    expect(primaryFlush).toHaveBeenCalledTimes(1);

    await redis.clear();

    expect(primaryFlush).toHaveBeenCalledTimes(2);
  });

  it('can close the cache connection', async () => {
    const primaryClose = (FakePrimaryClient.prototype.close = jest.fn());
    const readerClose = (FakeReaderClient.prototype.close = jest.fn());

    await redis.close();

    expect(primaryClose).toHaveBeenCalledTimes(1);
    expect(readerClose).toHaveBeenCalledTimes(1);
  });
});
