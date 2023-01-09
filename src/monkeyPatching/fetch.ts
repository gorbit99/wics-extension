import { sendMessage } from "../injectMessaging";
import { WKReviewItem } from "../wanikani/item/types";

const originalFetch = window.fetch;

Object.defineProperty(window, "fetch", {
  value: function (url: string, options?: RequestInit) {
    if (url.startsWith("/review/items")) {
      return handleItemsEndpoint(getIdsFromUrl(url), options);
    }
    if (url.startsWith("/json/progress")) {
      handleProgressEndpoint(JSON.parse(options!.body!.toString()));
    }
    return originalFetch(url, options);
  },
});

function getIdsFromUrl(url: string) {
  const urlParams = new URL(location.origin + url).searchParams;
  const ids = urlParams.get("ids");
  if (ids) {
    return ids.split(",").map((id) => parseInt(id));
  }
  return [];
}

async function handleItemsEndpoint(ids: number[], options?: RequestInit) {
  const customItems = await getCustomItemData(ids.filter((id) => id < 0));
  const remainingIds = ids.filter((id) => id >= 0);
  const response = await originalFetch(
    `/review/items?ids=${remainingIds.join(",")}`,
    options
  );
  const originalJson = response.json;
  Object.defineProperty(response, "json", {
    value: async function () {
      const originalItems = await originalJson.call(this);
      return [...originalItems, ...customItems];
    },
  });
  return response;
}

function getCustomItemData(ids: number[]): Promise<WKReviewItem[]> {
  return sendMessage(ids, "getReviewItemData");
}

function handleProgressEndpoint(
  result: Record<number, [number, number | string]>
) {
  const mappedResult = Object.fromEntries(
    Object.entries(result).map(([key, value]) => {
      value[1] = typeof value[1] === "string" ? 0 : value[1];
      return [key, value];
    })
  );
  sendMessage(mappedResult, "updateProgress");
}
