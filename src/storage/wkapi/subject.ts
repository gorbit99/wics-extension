import { fetchRawCollectionFromWK, WKRequest, WKResponseItem } from "../wkapi";
import browser from "webextension-polyfill";

interface SubjectsInfo {
  itemCount: number;
  lastUpdated: number | undefined;
}

const individualCacheSize = 500;

const localCache: Map<number, WKSubject[]> = new Map();

export async function fetchSubjects(ids?: number[]): Promise<WKSubject[]> {
  if (ids && ids.length === 0) {
    return [];
  }
  const subjectInfo = (await browser.storage.local.get("subjectsInfo"))
    .subjectsInfo as SubjectsInfo | undefined;

  const lastUpdated = subjectInfo?.lastUpdated;

  const minTimeDiff = 10 * 60 * 1000;

  let totalCount = subjectInfo?.itemCount ?? 0;

  if (!lastUpdated || Date.now() - lastUpdated >= minTimeDiff) {
    const updateRequestPromise = fetchRawCollectionFromWK<WKSubject>(
      {
        endpoint: "subjects",
        params: {},
      },
      lastUpdated
    );

    const updateRequest = await updateRequestPromise;

    const added = await updateItemCaches(updateRequest?.data ?? []);

    totalCount += added;
  }

  await browser.storage.local.set({
    subjectsInfo: { lastUpdated: new Date().getTime(), itemCount: totalCount },
  });

  if (ids) {
    return getItemsFromCaches(ids);
  }

  const items = await getAllCaches(totalCount);
  return items;
}

async function updateItemCaches(updateData: WKSubject[]): Promise<number> {
  const requiredCaches = updateData
    .map((item) => Math.floor(item.id / individualCacheSize))
    .filter((item, index, array) => array.indexOf(item) === index);

  const updated = await Promise.all(
    requiredCaches.map((id) => updateItemCache(id, updateData))
  );

  return updated.reduce((a, b) => a + b, 0);
}

async function updateItemCache(
  id: number,
  updateData: WKSubject[]
): Promise<number> {
  updateData = updateData.filter(
    (item) => Math.floor(item.id / individualCacheSize) == id
  );

  const existingData =
    ((await browser.storage.local.get(`subjects-${id}`))[`subjects-${id}`] as
      | WKSubject[]
      | undefined) ?? [];

  const originalCount = existingData.length;

  const newData = existingData
    .filter((item) => !updateData.some((newItem) => newItem.id === item.id))
    .concat(updateData);

  await browser.storage.local.set({ [`subjects-${id}`]: newData });

  return newData.length - originalCount;
}

async function getItemsFromCaches(ids: number[]): Promise<WKSubject[]> {
  ids = ids.filter((id) => !localCache.has(id));

  const requiredCaches = ids
    .filter((id) => id > 0)
    .map((item) => Math.floor(item / individualCacheSize))
    .filter((item, index, array) => array.indexOf(item) === index);

  const cacheData = await Promise.all(requiredCaches.map(getCache));

  return cacheData.flat().filter((item) => ids.includes(item.id));
}

async function getAllCaches(itemCount: number): Promise<WKSubject[]> {
  const requiredCaches = Array.from(
    Array(Math.ceil(itemCount / individualCacheSize)),
    (_, index) => index
  );

  const cacheData = await Promise.all(requiredCaches.map(getCache));

  return cacheData.flat();
}

async function getCache(id: number): Promise<WKSubject[]> {
  if (localCache.has(id)) {
    return localCache.get(id) ?? [];
  }

  const cache = (await browser.storage.local.get(`subjects-${id}`))[
    `subjects-${id}`
  ] as WKSubject[];

  localCache.set(id, cache);
  return cache;
}

export interface WKSubjectsRequest extends WKRequest {
  endpoint: "subjects";
  params: {
    ids?: number[];
    types?: string[];
    slugs?: string[];
    levels?: number[];
    hidden?: boolean;
  };
}

export interface WKSubject extends WKResponseItem {
  object: "radical" | "kanji" | "vocabulary";
  auxiliary_meanings: {
    meaning: string;
    type: "blacklist" | "whitelist";
  }[];
  characters: string | null;
  created_at: string;
  document_url: string;
  hidden_at: string | null;
  lesson_position: number;
  level: number;
  meaning_mnemonic: string;
  meanings: {
    meaning: string;
    primary: boolean;
    accepted_answer: boolean;
  }[];
  slug: string;
  spaced_repetition_system_id: number;
}

export interface WKRadicalSubject extends WKSubject {
  object: "radical";
  amalgamation_subject_ids: number[];
  character_images: (PngImage | SvgImage)[];
}

interface PngImage {
  url: string;
  content_type: "image/png";
  metadata: {
    color: string;
    dimensions: string;
    style_name: string;
  };
}

interface SvgImage {
  url: string;
  content_type: "image/svg+xml";
  metadata: {
    inline_styles: boolean;
  };
}

export interface WKKanjiSubject extends WKSubject {
  object: "kanji";
  amalgamation_subject_ids: number[];
  component_subject_ids: number[];
  meaning_hint: string | null;
  reading_hint: string | null;
  reading_mnemonic: string;
  readings: {
    reading: string;
    primary: boolean;
    accepted_answer: boolean;
    type: "onyomi" | "kunyomi" | "nanori";
  }[];
  visually_similar_subject_ids: number[];
}

export interface WKVocabularySubject extends WKSubject {
  object: "vocabulary";
  component_subject_ids: number[];
  context_sentences: {
    en: string;
    ja: string;
  }[];
  pronunciation_audios: {
    url: string;
    content_type: "audio/mpeg" | "audio/ogg";
    metadata: {
      gender: "male" | "female";
      source_id: number;
      pronunciation: string;
      voice_actor_id: number;
      voice_actor_name: string;
      voice_description: string;
    };
  }[];
  readings: {
    reading: string;
    primary: boolean;
    accepted_answer: boolean;
  }[];
  parts_of_speech: string[];
  reading_mnemonic: string;
}
