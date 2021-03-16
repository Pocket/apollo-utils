export interface MsetKeyValues {
  [key: string]: string;
}

export interface CacheInterface {
  getKey(key: string): string;

  set(key: string, value: string): Promise<void>;

  mset(keyValues: MsetKeyValues, ttl: number): Promise<void>;

  get(key: string): Promise<string | undefined>;

  mget(keys: string[]): Promise<string[]>;

  delete(key: string): Promise<boolean>;

  flush(): Promise<void>;

  close(): Promise<void>;

  clear(): Promise<void>;
}
