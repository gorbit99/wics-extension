import browser from "webextension-polyfill";
import { Config } from "./config";
import { Message } from "./injectMessaging";
import { StorageHandler } from "./storageHandler";

const jqueryMonkeyPatcher = document.createElement("script");
jqueryMonkeyPatcher.src = browser.runtime.getURL(
  "src/monkeyPatching/jquery.js"
);

document.documentElement.insertBefore(
  jqueryMonkeyPatcher,
  document.documentElement.firstChild
);

const fetchMonkeyPatcher = document.createElement("script");
fetchMonkeyPatcher.src = browser.runtime.getURL("src/monkeyPatching/fetch.js");

document.documentElement.insertBefore(
  fetchMonkeyPatcher,
  document.documentElement.firstChild
);

let itemsToGet = location.href.split("/").pop()?.startsWith("review/session")
  ? ["packs/js/review"]
  : ["packs/js/lesson"];

const mutationObserver = new MutationObserver((mutations) => {
  const addedNotes = mutations.flatMap((mutation) => [...mutation.addedNodes]);
  itemsToGet = itemsToGet.filter((item) => {
    const targetScript = addedNotes.find(
      (node) =>
        node.nodeName === "SCRIPT" &&
        (node as HTMLScriptElement).src.includes(item)
    );

    if (targetScript) {
      const targetScriptElem = targetScript as HTMLScriptElement;
      targetScriptElem.defer = true;
      targetScriptElem.src += "?v=" + Date.now();
      return false;
    }
    return true;
  });

  if (itemsToGet.length === 0) {
    mutationObserver.disconnect();
  }
});
mutationObserver.observe(document.documentElement, {
  childList: true,
  subtree: true,
});

if (location.pathname.startsWith("/lesson/session")) {
  window.addEventListener("load", () => {
    const bodyObserver = new MutationObserver((mutations) => {
      const addedNotes = mutations.flatMap((mutation) => [
        ...mutation.addedNodes,
      ]);

      const batchList = addedNotes.find((node) =>
        (node as HTMLElement).classList.contains("batch-list")
      ) as HTMLElement | undefined;
      if (!batchList) {
        return;
      }

      mutationObserver.disconnect();
      batchList.querySelector("button")?.click();
    });
    bodyObserver.observe(document.querySelector("#lesson")!, {
      childList: true,
      subtree: true,
    });
  });
}

interface InjectReviewItemsMessage extends Message<void> {
  type: "getReviewItems";
}

interface InjectLessonItemsMessage extends Message<void> {
  type: "getLessonItems";
}

interface InjectReviewItemDataMessage extends Message<string[]> {
  type: "getReviewItemData";
}

interface LessonCompletionMessage extends Message<string[]> {
  type: "lessonCompletion";
}

interface MakeProgressMessage
  extends Message<Record<number, [number, number]>> {
  type: "makeProgress";
}

interface FetchItemJsonMessage extends Message<number> {
  type: "fetchItemJson";
}

interface GetConfigMessage extends Message<void> {
  type: "getConfig";
}

type ReceivedMessage =
  | InjectReviewItemsMessage
  | InjectReviewItemDataMessage
  | InjectLessonItemsMessage
  | LessonCompletionMessage
  | MakeProgressMessage
  | FetchItemJsonMessage
  | GetConfigMessage;

window.addEventListener("message", async (event) => {
  if (event.source !== window) {
    return;
  }

  const message = event.data as ReceivedMessage;
  console.log("Received message", message);

  if (message.source !== "page-script") {
    return;
  }

  switch (message.type) {
    case "getReviewItems":
      respond(
        await StorageHandler.getInstance().getPendingReviewIds(),
        message.id
      );
      break;
    case "getReviewItemData":
      const itemIds = (message.data as string[]).map((id) => parseInt(id));
      respond(
        await StorageHandler.getInstance().getReviewItemData(itemIds),
        message.id
      );
      break;
    case "getLessonItems":
      respond(
        await StorageHandler.getInstance().getPendingLessons(),
        message.id
      );
      break;
    case "lessonCompletion":
      const lessonIds = (message.data as string[]).map((id) => parseInt(id));
      await StorageHandler.getInstance().handleLessonCompletion(lessonIds);
      respond(null, message.id);
      break;
    case "makeProgress":
      const progress = message.data as Record<number, [number, number]>;
      await StorageHandler.getInstance().handleProgressMade(progress);
      respond(null, message.id);
      break;
    case "fetchItemJson":
      const itemId = message.data as number;
      const itemJson = await StorageHandler.getInstance().getItemJson(itemId);
      respond(itemJson, message.id);
      break;
    case "getConfig":
      respond(await Config.getInstance().getConfig(), message.id);
      break;
  }
});

function respond<Response>(response: Response, id: number) {
  window.postMessage({
    source: "extension",
    response,
    id,
  });
}
