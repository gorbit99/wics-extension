import { ConfigData } from "../configData";
import { sendMessage } from "../injectMessaging";
import { WKJsonItem, WKLessonItem } from "../wanikani/item/types";

declare global {
  interface Window {
    $: JQueryStatic | undefined;
  }
}

let patchedJquery: JQueryStatic | undefined;

if (window.$) {
  patchedJquery = patchJquery($);
}

Object.defineProperty(window, "$", {
  set: (value: JQueryStatic) => {
    patchedJquery = patchJquery(value);
  },
  get: () => {
    return patchedJquery;
  },
});

function patchJquery($: JQueryStatic) {
  const originalGetJSON = $.getJSON;
  Object.defineProperty($, "getJSON", {
    value: function (url: string, callback?: any) {
      if (url.startsWith("/review/queue")) {
        return originalGetJSON
          .call(this, url, { _: new Date().getTime() })
          .done((data) => {
            appendCustomReviewItems(data)
              .then((data) => {
                return data;
              })
              .then(callback);
          });
      }
      if (url.startsWith("/lesson/queue")) {
        return originalGetJSON
          .call(this, url, { _: new Date().getTime() })
          .done((data) => {
            appendCustomLessonItems(data).then(callback);
          });
      }
      if (url.startsWith("/json/")) {
        const item = parseInt(url.split("/").pop()!);
        if (item < 0) {
          fetchItemJson(parseInt(url.split("/").pop()!)).then(callback);
          return { fail: () => {} };
        } else {
          return originalGetJSON.call(this, url, callback);
        }
      }
      return originalGetJSON.call(this, url, callback);
    },
  });
  const originalAjax = $.ajax;
  Object.defineProperty($, "ajax", {
    value: function (
      url: string | JQueryAjaxSettings,
      options?: JQueryAjaxSettings
    ) {
      if (options === undefined) {
        options = {};
      }
      if (typeof url !== "string") {
        options = url;
        url = options.url!;
      }

      if (url.startsWith("/json/lesson/completed")) {
        const customItemIds = (options.data as { keys: number[] }).keys.filter(
          (item: number) => item < 0
        );
        handleLessonCompletion(customItemIds);
        (options.data as { keys: number[] }).keys = (
          options.data as { keys: number[] }
        ).keys.filter((item: number) => item >= 0);
      }

      // @ts-ignore
      return originalAjax.call(this, url, options);
    },
  });
  return $;
}

async function appendCustomReviewItems(
  originalItems: number[]
): Promise<number[]> {
  const customItems = await getCustomReviewItems();
  const config = await fetchConfig();
  switch (config.reviewPlacement) {
    case "front":
      return customItems.concat(originalItems);
    case "back":
      return originalItems.concat(customItems);
    case "random":
      customItems.forEach((item) => {
        originalItems.splice(
          Math.floor(Math.random() * originalItems.length),
          0,
          item
        );
      });
      return originalItems;
  }
}

function getCustomReviewItems() {
  return sendMessage<null, number[]>(null, "getReviewItems");
}

interface WKLessonResponse {
  count: {
    rad: number;
    kan: number;
    voc: number;
  };
  queue: WKLessonItem[];
}

async function appendCustomLessonItems(
  originalItems: WKLessonResponse
): Promise<WKLessonResponse> {
  const config = await fetchConfig();
  const customItems = await getCustomLessonItems();
  const radCount = customItems.filter((item) => item.type === "Radical").length;
  const kanCount = customItems.filter((item) => item.type === "Kanji").length;
  const vocCount = customItems.filter(
    (item) => item.type === "Vocabulary"
  ).length;
  switch (config.lessonPlacement) {
    case "front":
      originalItems.queue.unshift(...customItems);
      break;
    case "back":
      originalItems.queue.push(...customItems);
      break;
    case "random":
      customItems.forEach((item) => {
        originalItems.queue.splice(
          Math.floor(Math.random() * originalItems.queue.length),
          0,
          item
        );
      });
  }
  originalItems.count.rad += radCount;
  originalItems.count.kan += kanCount;
  originalItems.count.voc += vocCount;
  return originalItems;
}

function getCustomLessonItems() {
  return sendMessage<null, WKLessonItem[]>(null, "getLessonItems");
}

async function handleLessonCompletion(customItems: number[]) {
  sendMessage(customItems, "lessonCompletion");
}

async function fetchItemJson(item: number) {
  return sendMessage<number, WKJsonItem>(item, "fetchItemJson");
}

async function fetchConfig(): Promise<ConfigData> {
  return sendMessage<null, ConfigData>(null, "getConfig");
}
