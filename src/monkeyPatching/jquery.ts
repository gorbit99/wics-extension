import { ConfigData, extensionId } from "../config";
import { WKLessonItem } from "../wanikani";

export { };

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
    value: function(url: string, callback?: any) {
      console.log("getJSON", url);
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
          return { fail: () => { } };
        } else {
          return originalGetJSON.call(this, url, callback);
        }
      }
      return originalGetJSON.call(this, url, callback);
    },
  });
  const originalAjax = $.ajax;
  Object.defineProperty($, "ajax", {
    value: function(
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

      console.log("ajax", url);
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
  return originalItems;
}

function getCustomReviewItems() {
  return new Promise<number[]>((resolve) => {
    return chrome.runtime.sendMessage(
      extensionId,
      {
        type: "getReviewItems",
      },
      (response) => {
        resolve(response);
      }
    );
  });
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
  return new Promise<WKLessonItem[]>((resolve) => {
    return chrome.runtime.sendMessage(
      extensionId,
      {
        type: "getLessonItems",
      },
      (response) => {
        resolve(response);
      }
    );
  });
}

chrome.runtime.sendMessage(extensionId, {
  type: "injectionReady",
});

async function handleLessonCompletion(customItems: number[]) {
  chrome.runtime.sendMessage(extensionId, {
    type: "lessonCompletion",
    customItems,
  });
}

async function fetchItemJson(item: number) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      extensionId,
      {
        type: "fetchItemJson",
        item,
      },
      (response) => {
        resolve(response);
      }
    );
  });
}

async function fetchConfig(): Promise<ConfigData> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      extensionId,
      {
        type: "getConfig",
      },
      (response) => {
        resolve(response);
      }
    );
  });
}
