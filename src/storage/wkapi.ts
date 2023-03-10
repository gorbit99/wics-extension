import browser from "webextension-polyfill";
import { WKUserRequest } from "./wkapi/user";

export interface WKRequest {
  endpoint: string;
  params: Record<string, any>;
}

type ActualRequest = WKUserRequest;

export interface WKResponseItem {
  id: number;
  object: string;
}

export async function fetchEndpoint<Type extends WKResponseItem>(
  request: ActualRequest,
  useCache: boolean = true,
  apiKey?: string,
  lastUpdated?: number,
  saveCache: boolean = true
): Promise<Type | Type[] | null> {
  const cacheData = useCache ? await getFromCache<Type>(request) : null;
  const useLastUpdated = lastUpdated ?? cacheData?.lastUpdated;
  const liveData = await fetchFromWK<Type>(request, useLastUpdated, apiKey);

  if (isReport(request)) {
    const data = liveData ?? cacheData?.data ?? null;
    await updateCache(request, data);
    return data;
  }

  const original = (cacheData?.data as Type[]) ?? [];
  const newData = (liveData as Type[]) ?? [];
  const result = original
    .filter((item) => !newData.some((newItem) => newItem.id === item.id))
    .concat(newData);
  if (saveCache) {
    updateCache(request, result);
  }
  return result;
}

interface CacheEntry<Type extends WKResponseItem> {
  lastUpdated: number;
  data: Type | Type[];
}

async function updateCache<Type extends WKResponseItem>(
  request: WKRequest,
  data: Type | Type[] | null
): Promise<void> {
  const requestString = requestToString(request);
  await browser.storage.local.set({
    [requestString]: {
      lastUpdated: Date.now(),
      data,
    },
  });
}

async function getFromCache<Type extends WKResponseItem>(
  request: WKRequest
): Promise<CacheEntry<Type> | null> {
  const requestString = requestToString(request);
  const cacheData = (await browser.storage.local.get(requestString))[
    requestString
  ] as CacheEntry<Type>;

  return cacheData ?? null;
}

function requestToString(request: WKRequest): string {
  const params = Object.entries(request.params)
    .map(([id, entry]) => `${id}=${JSON.stringify(entry)}`)
    .join("&");
  return `${request.endpoint}?${params}`;
}

async function fetchFromWK<Type extends WKResponseItem>(
  request: ActualRequest,
  lastUpdated?: number,
  apiKey?: string
): Promise<Type | Type[] | null> {
  if (isReport(request)) {
    return fetchReportFromWK<Type>(request, lastUpdated, apiKey);
  }
  return fetchCollectionFromWK<Type>(request, lastUpdated, apiKey);
}

function isReport(request: WKRequest): boolean {
  const reportEndpoints = [
    "assignment",
    "kanji",
    "level_progression",
    "radical",
    "reset",
    "review_statistics",
    "review",
    "spaced_repetition_system",
    "study_material",
    "user",
    "vocabulary",
  ];

  return reportEndpoints.includes(request.endpoint);
}

interface WKResponse {
  object: string;
  url: string;
  data_updated_at: string;
}

interface WKReportResponse<Value extends WKResponseItem> extends WKResponse {
  id: number;
  object: string;
  data: Value;
}

export interface WKCollectionResponse<Value extends WKResponseItem>
  extends WKResponse {
  object: "collection";
  pages: {
    next_url: string | null;
    previous_url: string | null;
    per_page: number;
  };
  total_count: number;
  data: WKReportResponse<Value>[];
}

async function fetchCollectionFromWK<Type extends WKResponseItem>(
  request: WKRequest,
  lastUpdated?: number,
  apiKey?: string
): Promise<Type[]> {
  const rawResponse = await fetchRawCollectionFromWK<Type>(
    request,
    lastUpdated,
    apiKey
  );
  return rawResponse.data;
}

export async function fetchRawCollectionFromWK<Type extends WKResponseItem>(
  request: WKRequest,
  lastUpdated?: number,
  apiKey?: string
): Promise<{ data: Type[]; total: number }> {
  let currentUrl: URL | null = createRequestUrl(request, lastUpdated);

  const result = [];
  let totalResult = 0;

  while (currentUrl != null) {
    const json = (await makeWKRequest(
      currentUrl,
      lastUpdated,
      apiKey
    )) as WKCollectionResponse<Type> | null;
    if (json == null) {
      return { total: 0, data: [] };
    }
    result.push(...json.data);
    currentUrl = json.pages.next_url ? new URL(json.pages.next_url) : null;
    totalResult = json.total_count;
  }

  return {
    data: result.map((item) => ({
      ...item.data,
      id: item.id,
      object: item.object,
    })),
    total: totalResult,
  };
}

async function fetchReportFromWK<Type extends WKResponseItem>(
  request: WKRequest,
  lastUpdated?: number,
  apiKey?: string
): Promise<Type | null> {
  const url = createRequestUrl(request, lastUpdated);
  const json = (await makeWKRequest(
    url,
    lastUpdated,
    apiKey
  )) as WKReportResponse<Type> | null;
  if (json == null) {
    return null;
  }
  return { ...json.data, id: json.id, object: json.object };
}

export async function makeWKRequest(
  url: URL,
  updatedAfter?: number,
  apiKey?: string
): Promise<WKResponse | null> {
  const apiToken = apiKey ? apiKey : await getApiToken();
  const response = await fetch(url.toString(), {
    headers: {
      Authorization: "Bearer " + apiToken,
      "Wanikani-Revision": "20170710",
      ...(updatedAfter
        ? {
            "If-Modified-Since": new Date(updatedAfter).toUTCString(),
          }
        : {}),
    },
  });
  if (response.status === 304) {
    return null;
  }
  const json = await response.json();
  return json;
}

export function createRequestUrl(
  request: WKRequest,
  lastUpdated?: number
): URL {
  const url = new URL("https://api.wanikani.com/v2/" + request.endpoint);
  if (lastUpdated) {
    url.searchParams.set("updated_after", new Date(lastUpdated).toISOString());
  }
  Object.entries(request.params).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value.toString());
    }
  });
  return url;
}

export async function setApiToken(token: string | null): Promise<void> {
  await browser.storage.local.set({ wkApiToken: token });
}

export async function getApiToken() {
  const apiToken = await browser.storage.local.get("wkApiToken");
  return apiToken.wkApiToken;
}
