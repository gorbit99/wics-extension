import browser from "webextension-polyfill";
import { fetchSubjects, WKSubject } from "./storage/wkapi";

const wkItemState: { items?: WKSubject[]; promise?: Promise<WKSubject[]> } = {};

async function setupItems() {
  const apiKey = (await browser.storage.local.get("wkApiToken")).wkApiToken;

  if (!apiKey) {
    return;
  }

  const promise = fetchSubjects()
    .then((items) => (wkItemState.items = items))
    .finally(() => console.log(`Loaded ${wkItemState.items?.length} items!`));
  wkItemState.promise = promise;
}

setupItems();

browser.storage.local.onChanged.addListener((changes) => {
  Object.keys(changes).forEach((key) => {
    if (key === "wkApiToken") {
      console.log("Api Key Changed, loading up items!");
      setupItems();
    }
  });
});

interface ItemRequestMessage {
  type: "itemRequest";
  items?: number[];
}

browser.runtime.onMessage.addListener(async (message: ItemRequestMessage) => {
  switch (message.type) {
    case "itemRequest":
      if (
        wkItemState.items === undefined &&
        wkItemState.promise === undefined
      ) {
        return null;
      }
      return await getItems(message.items);
  }
});

async function getItems(ids?: number[]): Promise<WKSubject[]> {
  await wkItemState.promise;

  if (ids === undefined) {
    return wkItemState.items!;
  }

  return wkItemState.items!.filter((item) => ids.includes(item.id));
}
