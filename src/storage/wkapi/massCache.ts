import { fetchRawCollectionFromWK, WKResponseItem } from "../wkapi";
import browser from "webextension-polyfill";

const individualCacheSize = 500;

interface CacheInfo {
  itemCount: number;
  lastUpdated: number | undefined;
}

export abstract class MassCache<Type extends WKResponseItem> {
  protected abstract getCachePrefix(): string;
  protected abstract getEndpoint(): string;
  protected abstract getMinCacheTime(): number;

  protected constructor() {}

  private localCache: Map<number, Type[]> = new Map();

  public async fetchItems(ids?: number[]): Promise<Type[]> {
    if (ids && ids.length === 0) {
      return [];
    }

    const cacheInfoKey = `${this.getCachePrefix()}Info`;

    const cacheInfo = (await browser.storage.local.get(cacheInfoKey))[
      cacheInfoKey
    ] as CacheInfo | undefined;

    const lastUpdated = cacheInfo?.lastUpdated;

    let totalCount = cacheInfo?.itemCount ?? 0;

    if (!lastUpdated || Date.now() - lastUpdated >= this.getMinCacheTime()) {
      const updateRequestPromise = fetchRawCollectionFromWK<Type>(
        {
          endpoint: this.getEndpoint(),
          params: {},
        },
        lastUpdated
      );
      const updateRequest = await updateRequestPromise;

      const added = await this.updateItemCaches(updateRequest?.data ?? []);

      totalCount += added;
    }

    await browser.storage.local.set({
      [cacheInfoKey]: {
        lastUpdated: new Date().getTime(),
        itemCount: totalCount,
      },
    });

    if (ids) {
      return this.getItemsFromCaches(ids);
    }

    const items = await this.getAllCaches(totalCount);
    return items;
  }

  private async updateItemCaches(updateData: Type[]): Promise<number> {
    const requiredCaches = updateData
      .map((item) => Math.floor(item.id / individualCacheSize))
      .filter((item, index, array) => array.indexOf(item) === index);

    const updated = await Promise.all(
      requiredCaches.map((id) => this.updateItemCache(id, updateData))
    );

    return updated.reduce((a, b) => a + b, 0);
  }

  private async updateItemCache(
    id: number,
    updateData: Type[]
  ): Promise<number> {
    updateData = updateData.filter(
      (item) => Math.floor(item.id / individualCacheSize) == id
    );

    const existingData =
      ((await browser.storage.local.get(`${this.getCachePrefix()}-${id}`))[
        `${this.getCachePrefix()}-${id}`
      ] as Type[] | undefined) ?? [];

    const originalCount = existingData.length;

    const newData = existingData
      .filter((item) => !updateData.some((newItem) => newItem.id === item.id))
      .concat(updateData);

    await browser.storage.local.set({
      [`${this.getCachePrefix()}-${id}`]: newData,
    });

    return newData.length - originalCount;
  }

  private async getItemsFromCaches(ids: number[]): Promise<Type[]> {
    const requiredCaches = ids
      .filter((id) => id > 0)
      .map((item) => Math.floor(item / individualCacheSize))
      .filter((item, index, array) => array.indexOf(item) === index);

    const cacheData = await Promise.all(
      requiredCaches.map((id) => this.getCache(id))
    );

    return cacheData.flat().filter((item) => ids.includes(item.id));
  }

  private async getAllCaches(itemCount: number): Promise<Type[]> {
    const requiredCaches = Array.from(
      Array(Math.ceil(itemCount / individualCacheSize)),
      (_, index) => index
    );

    const cacheData = await Promise.all(
      requiredCaches.map((id) => this.getCache(id))
    );

    return cacheData.flat();
  }

  private async getCache(id: number): Promise<Type[]> {
    if (this.localCache.has(id)) {
      return this.localCache.get(id) ?? [];
    }

    const cache = (
      await browser.storage.local.get(`${this.getCachePrefix()}-${id}`)
    )[`${this.getCachePrefix()}-${id}`] as Type[];

    this.localCache.set(id, cache);
    return cache;
  }
}
